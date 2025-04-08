const express = require('express');
const router = express.Router();
const facturacionController = require('../controllers/facturacionController');

// Ruta para subir la facturación
router.post('/', facturacionController.uploadFinal);

module.exports = router;