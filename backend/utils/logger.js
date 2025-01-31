const { createLogger, format, transports } = require('winston');
const path = require('path');

// Define custom log format
const logFormat = format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
);

// Create the logger
const logger = createLogger({
    level: 'info', // Set default log level
    format: logFormat,
    transports: [
        new transports.Console(), // Log to console
        new transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }), // Log errors to file
        new transports.File({ filename: path.join(__dirname, '../logs/combined.log') }) // Log all messages
    ]
});

module.exports = { logger };
