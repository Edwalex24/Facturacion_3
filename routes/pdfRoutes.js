
const express = require('express');
const router = express.Router();
const pdfController = require('../controllers/pdfController');


// Endpoint para generar PDFs y empaquetarlos en un ZIP
router.post('/generarInformesZIP', pdfController.generarInformesPDF);

module.exports = router