const express = require('express');
const router = express.Router();
const analisisInventarioController = require('../controllers/analisisInventarioController');

// Ruta para subir el inventario
router.post('/upload', analisisInventarioController.uploadInventario);

module.exports = router;

