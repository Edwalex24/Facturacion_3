const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// Función para verificar si un contrato ya ha sido facturado en un período específico
router.get('/verificar-facturacion', async (req, res) => {
    try {
        const { contrato, periodo } = req.query;
        const año = new Date().getFullYear();
        
        // Directorio donde se guardan las facturas generadas
        const dirFacturas = path.join(__dirname, '..', 'output', 'facturas', año.toString());
        
        try {
            // Verificar si existe el directorio
            await fs.access(dirFacturas);
            
            // Leer el directorio
            const archivos = await fs.readdir(dirFacturas);
            
            // Buscar si existe alguna factura para este contrato y período
            const facturaExistente = archivos.some(archivo => 
                archivo.includes(contrato) && 
                archivo.includes(periodo.toLowerCase())
            );
            
            res.json({ yaFacturado: facturaExistente });
        } catch (error) {
            // Si el directorio no existe, significa que no hay facturas generadas
            if (error.code === 'ENOENT') {
                res.json({ yaFacturado: false });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error al verificar facturación:', error);
        res.status(500).json({ 
            error: 'Error al verificar facturación',
            detalles: error.message 
        });
    }
});

module.exports = router; 