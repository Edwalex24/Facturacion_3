const express = require('express');
const router = express.Router();
const inventarioController = require('../controllers/inventarioController');

// Ruta para subir el inventario
router.post('/', inventarioController.uploadInventario);

module.exports = router;