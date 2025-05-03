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

app.use(fileUpload({ parseNested: true }));
app.use(express.static('public'));


// Configuración de rutas
const inventarioRoutes = require('./routes/inventarioRoutes');
const facturacionRoutes = require('./routes/facturacionRoutes');

app.use('/inventario', inventarioRoutes);
app.use('/facturacion', facturacionRoutes);

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
