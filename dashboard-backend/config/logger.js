const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Definisci i colori per i livelli di log
const logColors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue',
};

winston.addColors(logColors);

// Formato personalizzato per i log
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack, ...metadata }) => {
        let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        // Aggiungi metadata se presenti
        if (Object.keys(metadata).length > 0) {
            msg += ` ${JSON.stringify(metadata)}`;
        }
        
        // Aggiungi stack trace per errori
        if (stack) {
            msg += `\n${stack}`;
        }
        
        return msg;
    })
);

// Formato per la console con colori
const consoleFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        
        // Aggiungi metadata solo se rilevanti
        const relevantMetadata = { ...metadata };
        delete relevantMetadata.stack;
        
        if (Object.keys(relevantMetadata).length > 0) {
            msg += ` ${JSON.stringify(relevantMetadata)}`;
        }
        
        return msg;
    })
);

// Configurazione trasporti (output destinations)
const transports = [
    // Console output (solo in development)
    new winston.transports.Console({
        format: consoleFormat,
        level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    }),
    
    // File per tutti i log (con rotazione giornaliera)
    new DailyRotateFile({
        filename: path.join('logs', 'application-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        format: logFormat,
        level: 'info',
    }),
    
    // File separato per errori (con rotazione giornaliera)
    new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
        level: 'error',
    }),
    
    // File per le richieste HTTP (con rotazione giornaliera)
    new DailyRotateFile({
        filename: path.join('logs', 'http-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '7d',
        format: logFormat,
        level: 'http',
    }),
];

// Crea il logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'debug',
    format: logFormat,
    transports: transports,
    // Non uscire su eccezioni non gestite
    exitOnError: false,
});

// Gestione eccezioni non gestite
logger.exceptions.handle(
    new DailyRotateFile({
        filename: path.join('logs', 'exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
    })
);

// Gestione promise rejections non gestite
logger.rejections.handle(
    new DailyRotateFile({
        filename: path.join('logs', 'rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
    })
);

// Helper per loggare eventi specifici dell'applicazione
logger.logRequest = (req, res, responseTime) => {
    logger.http('HTTP Request', {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip || req.connection.remoteAddress,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('user-agent'),
    });
};

logger.logAuth = (action, username, success, details = {}) => {
    const level = success ? 'info' : 'warn';
    logger.log(level, `Auth: ${action}`, {
        username,
        success,
        ...details,
    });
};

logger.logDatabase = (action, success, details = {}) => {
    const level = success ? 'info' : 'error';
    logger.log(level, `Database: ${action}`, {
        success,
        ...details,
    });
};

// Stream per Morgan (se volessi integrarlo in futuro)
logger.stream = {
    write: (message) => {
        logger.http(message.trim());
    },
};

module.exports = logger;
