// logger.js
const { createLogger, transports, format } = require('winston');

const logger = createLogger({
  level: 'info', // podés cambiar a 'debug', 'warn', etc.
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.colorize(), // Colores para la consola
    format.printf(({ level, message, timestamp }) => {
      return `[${timestamp}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/errores.log', level: 'error' }),
    new transports.File({ filename: 'logs/todos.log' }),
  ],
});

module.exports = logger;
