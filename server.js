// server.js
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');

const app = express();

// Middlewares
app.use(fileUpload());
app.use(express.static('public'));

// Página de inicio
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Importar rutas modulares
const inventarioRoutes = require('./routes/inventarioRoutes');
const facturacionRoutes = require('./routes/facturacionRoutes');

// Asociar rutas
app.use('/inventario', inventarioRoutes);
app.use('/facturacion', facturacionRoutes);

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor iniciado en http://localhost:3000');
});