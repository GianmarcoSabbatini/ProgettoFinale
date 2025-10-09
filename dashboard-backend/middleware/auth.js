const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

/**
 * Middleware per verificare il token JWT
 */
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        logger.warn('Richiesta senza token di autenticazione', {
            ip: req.ip,
            url: req.originalUrl
        });
        return res.status(401).json({ 
            success: false, 
            message: 'Token di autenticazione mancante' 
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Aggiungi i dati utente alla richiesta
        logger.debug('Token verificato con successo', { userId: decoded.userId });
        next();
    } catch (error) {
        logger.warn('Token non valido o scaduto', {
            error: error.message,
            ip: req.ip,
            url: req.originalUrl
        });
        
        return res.status(401).json({ 
            success: false, 
            message: 'Token non valido o scaduto' 
        });
    }
};

module.exports = { verifyToken };
