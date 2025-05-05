const express = require('express');
const router = express.Router();
const facturacionController = require('../controllers/facturacioncontroller');

// Registrar la ruta para subir facturación
router.post('/uploadFacturacion', facturacionController.uploadFacturacion);

module.exports = router;