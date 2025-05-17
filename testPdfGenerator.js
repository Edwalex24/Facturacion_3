const { generarPDFsYSalaZIP } = require('./services/pdfGenerator'); // Importar las funciones del archivo PDF Generator

// Simulación de datos de JSON
const jsonData = {
  salas: [
    {
      nombreSala: 'Casino Las Vegas',
      ciudad: 'Bogotá',
      maquinas: [
        { serial: 'S001', nuc: 'N001', marca: 'Marca A', ventasNetas: 1000 },
        { serial: 'S002', nuc: 'N002', marca: 'Marca B', ventasNetas: 2500 },
      ],
    },
    {
      nombreSala: 'Casino Monte Carlo',
      ciudad: 'Medellín',
      maquinas: [
        { serial: 'S101', nuc: 'N101', marca: 'Marca X', ventasNetas: 1800 },
        { serial: 'S102', nuc: 'N102', marca: 'Marca Y', ventasNetas: 2200 },
      ],
    },
  ],
};

// Ruta donde se guardará el archivo ZIP
const outputZipPath = 'informes_ventas.zip';

// Función principal de prueba
(async () => {
  try {
    console.log('Generando PDFs y comprimidos en un ZIP...');
    await generarPDFsYSalaZIP(jsonData.salas, outputZipPath);
    console.log(`¡ZIP generado con éxito! Archivo: ${outputZipPath}`);
  } catch (error) {
    console.error('Error durante la generación de los PDFs o el ZIP:', error);
  }
})();