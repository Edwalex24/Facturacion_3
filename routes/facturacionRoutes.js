const express = require('express');
const router = express.Router();
const facturacionController = require('../controllers/facturacionController');

// Registrar la ruta para subir facturación
router.post('/uploadFacturacion', facturacionController.uploadFacturacion);

module.exports = router;