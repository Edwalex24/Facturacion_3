const fs = require('fs');
const path = require('path');
const { generarPDFsYSalaZIP } = require('../services/pdfGenerator');

/**
 * Controlador para generar informes PDF y comprimirlos en un ZIP.
 * @param {Object} req - Objeto de solicitud.
 * @param {Object} res - Objeto de respuesta.
 */
exports.generarInformesPDF = async (req, res) => {
  try {
    // Ruta del archivo JSON original
    const jsonPath = path.join(__dirname, '../output/facturacion.json');

    // Verificar que el archivo JSON existe
    if (!fs.existsSync(jsonPath)) {
      return res.status(400).send('No se encontraron datos procesados. Por favor, procese el Excel primero.');
    }

    // Leer el archivo JSON
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const facturacion = JSON.parse(rawData);

    // Agrupar los datos por "Establecimiento"
    const agrupadosPorSala = facturacion.reduce((result, item) => {
      const establecimiento = item["Establecimiento"];

      if (!result[establecimiento]) {
        result[establecimiento] = {
          establecimiento: establecimiento,
          municipio: item["Municipio"],
          departamento: item["Departamento"],
          maquinas: [],
        };
      }

      result[establecimiento].maquinas.push({
        serial: item["Serial"],
        nuc: item["NUC"],
        marca: item["Marca"],
        ventasNetas: item["Valor Ventas Netas"],
        tarifa12: item["Tarifa 12%"],
        derechosExplotacion: item["Derechos de explotación"],
      });

      return result;
    }, {});

    // Convertir el resultado a un array de salas
    const salas = Object.values(agrupadosPorSala);

    // Validar que haya datos agrupados
    if (salas.length === 0) {
      return res.status(400).send('No se encontraron datos válidos en el archivo JSON.');
    }

    console.log('Datos agrupados por sala:', JSON.stringify(salas, null, 2));

    // Ruta para el archivo ZIP
    const outputZipPath = path.join(__dirname, '../output/Informes_salas.zip');

    // Generar PDFs y archivo ZIP
    try {
      await generarPDFsYSalaZIP(salas, outputZipPath);
      console.log(`ZIP generado correctamente en: ${outputZipPath}`);
    } catch (error) {
      console.error('Error generando el archivo ZIP:', error.message);
      return res.status(500).send('Hubo un error al generar el archivo ZIP.');
    }

    // Enviar el ZIP al cliente
    res.download(outputZipPath, 'Informes_salas.zip', (err) => {
      if (err) {
        console.error('Error enviando el archivo ZIP:', err);
      }
      // Eliminar el archivo ZIP después de enviarlo
      fs.unlink(outputZipPath, (err) => {
        if (err) {
          console.error('Error eliminando el archivo ZIP:', err);
        } else {
          console.log('Archivo ZIP eliminado correctamente.');
        }
      });
    });
  } catch (error) {
    console.error('Error generando los informes PDF:', error.message);
    res.status(500).send('Hubo un error al generar los informes PDF.');
  }
};