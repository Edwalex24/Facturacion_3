const fs = require('fs');
const path = require('path');
const { generarPDFsYSalaZIP } = require('./services/pdfGenerator'); // Reutilizamos el generador de PDFs

// Ruta del archivo JSON original
const inputJsonPath = 'C:\\Users\\EDW\\OneDrive\\Codigo OK Github\\Proyecto_Casinos2\\logs\\1_dataFacturacion_crudo-2025-04-20T17-18-32-127Z.json';

// Ruta donde se guardará el archivo ZIP resultante
const outputZipPath = 'informes_ventas.zip';

/**
 * Transforma el JSON original en una estructura adecuada para la generación de PDFs
 * @param {Array} rawData - Datos originales del JSON
 * @returns {Object} - Datos transformados
 */
function transformarJson(rawData) {
  const headers = rawData[0];
  const dataRows = rawData.slice(1);

  const salasMap = new Map();

  dataRows.forEach(row => {
    const establecimiento = row[headers.indexOf("Establecimiento")];
    const ciudad = row[headers.indexOf("Municipio")];
    const departamento = row[headers.indexOf("Departamento")];
    const serial = row[headers.indexOf("Serial")];
    const nuc = row[headers.indexOf("NUC")];
    const marca = row[headers.indexOf("Marca")];
    const ventasNetas = row[headers.indexOf("Valor Ventas Netas")];
    const tarifa12 = row[headers.indexOf("Tarifa 12%")];
    const derechosExplotacion = row[headers.indexOf("Derechos de explotación")];
    const tipoTarifa = row[headers.indexOf("Tipo tarifa")];
    const codigoEstablecimiento = row[headers.indexOf("Codigo de establecimiento")];

    if (!salasMap.has(establecimiento)) {
      salasMap.set(establecimiento, {
        nombreSala: establecimiento,
        ciudad,
        departamento,
        maquinas: [],
      });
    }

    salasMap.get(establecimiento).maquinas.push({
      serial,
      nuc,
      marca,
      ventasNetas,
      tarifa12,
      derechosExplotacion,
      tipoTarifa,
      codigoEstablecimiento,
    });
  });

  return {
    salas: Array.from(salasMap.values()),
  };
}

/**
 * Función principal para transformar, generar PDFs y comprimirlos en un ZIP
 */
(async () => {
  try {
    console.log('Leyendo el archivo JSON original...');
    const rawData = JSON.parse(fs.readFileSync(inputJsonPath, 'utf8'));

    console.log('Transformando los datos...');
    const transformedData = transformarJson(rawData);

    console.log('Generando PDFs y creando el archivo ZIP...');
    await generarPDFsYSalaZIP(transformedData.salas, outputZipPath);

    console.log(`¡ZIP generado con éxito! Archivo: ${outputZipPath}`);
  } catch (error) {
    console.error('Error durante el proceso:', error.message);
  }
})();