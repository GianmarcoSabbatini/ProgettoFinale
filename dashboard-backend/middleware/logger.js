const logger = require('../config/logger');

/**
 * Middleware per il logging delle richieste HTTP
 * Traccia tutte le richieste in entrata con metodo, URL, IP, tempo di risposta e status code
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Logga la richiesta in entrata
  logger.debug('Incoming request', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Intercetta la fine della risposta
  const originalSend = res.send;

  res.send = function (data) {
    res.send = originalSend;

    const responseTime = Date.now() - startTime;

    // Logga la risposta
    logger.logRequest(req, res, responseTime);

    return res.send(data);
  };

  next();
};

/**
 * Middleware per la gestione degli errori
 * Cattura tutti gli errori non gestiti e li logga con stack trace completo
 */
const errorLogger = (err, req, res, _next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    body: req.body,
    params: req.params,
    query: req.query,
  });

  // Invia risposta di errore al client
  res.status(err.status || 500).json({
    success: false,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Si è verificato un errore interno del server'
        : err.message,
  });
};

module.exports = {
  requestLogger,
  errorLogger,
};
