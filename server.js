const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const saveJsonToFile = require('./utils/saveJson');
const logger = require('./utils/logger'); // Asegúrate de tener el logger configurado

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middlewares
app.use(fileUpload({ parseNested: true })); // Middleware para manejo de archivos
app.use(express.static('public')); // Servir archivos estáticos
app.use(express.json()); // Middleware para procesar JSON
app.use(express.urlencoded({ extended: true })); // Middleware para datos codificados en URL

// Configuración de rutas
const inventarioRoutes = require('./routes/inventarioRoutes');
const facturacionRoutes = require('./routes/facturacionRoutes');
const pdfRoutes = require('./routes/pdfRoutes');
const verificacionRoutes = require('./routes/verificacionRoutes'); // Nueva ruta de verificación

app.use('/inventario', inventarioRoutes);
app.use('/facturacion', facturacionRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api', verificacionRoutes); // Agregar las rutas de verificación

// WebSocket para monitoreo
io.on('connection', (socket) => {
  logger.info('Cliente conectado al visor.');

  socket.on('disconnect', () => {
    logger.info('Cliente desconectado del visor.');
  });
});

// Función para emitir logs por WebSocket
function sendLog(message) {
  const timestamp = new Date().toISOString();
  const fullMessage = `[${timestamp}] ${message}`;
  io.emit('log', fullMessage);
  logger.info(message); // También logueamos con Winston
}

module.exports = { sendLog };

// Iniciar servidor
server.listen(3000, () => {
  logger.info('Servidor iniciado en http://localhost:3000');
});