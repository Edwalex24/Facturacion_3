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
    // Obtener la información de la empresa del cuerpo de la solicitud
    const empresaInfo = req.body.empresaInfo;
    if (!empresaInfo) {
      return res.status(400).send('No se proporcionó la información de la empresa.');
    }

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

    // Crear nombre del archivo ZIP incluyendo información de la empresa
    const zipFileName = `Informes_${empresaInfo.nombre.replace(/\s+/g, '_')}_${empresaInfo.contrato}.zip`;
    const outputZipPath = path.join(__dirname, '../output', zipFileName);

    // Generar PDFs y archivo ZIP
    try {
      await generarPDFsYSalaZIP(salas, outputZipPath, empresaInfo);
      console.log(`ZIP generado correctamente en: ${outputZipPath}`);
    } catch (error) {
      console.error('Error generando el archivo ZIP:', error.message);
      return res.status(500).send('Hubo un error al generar el archivo ZIP.');
    }

    // Enviar el ZIP al cliente
    res.download(outputZipPath, zipFileName, (err) => {
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

// Función para sanitizar nombres de archivo
function sanitizeFileName(str) {
  if (!str || typeof str !== 'string') {
    console.warn('sanitizeFileName: valor inválido recibido:', str);
    return 'sin_nombre';
  }

  return str
    .toString()
    .normalize('NFD') // Normalizar caracteres Unicode
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/\s+/g, '_') // Espacios a guiones bajos
    .replace(/[^a-zA-Z0-9_-]/g, '') // Solo permitir letras, números y algunos símbolos
    .replace(/_+/g, '_') // Evitar guiones bajos múltiples
    .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
    .trim()
    .toLowerCase() // Convertir a minúsculas
    || 'sin_nombre'; // Si después de todo queda vacío, usar valor por defecto
}

exports.generarInformesZIP = async (req, res) => {
  try {
    console.log('Iniciando generarInformesZIP');
    console.log('Body recibido:', JSON.stringify(req.body, null, 2));

    const { empresaInfo } = req.body;

    // Validación mejorada de la información de empresa
    if (!empresaInfo) {
      console.error('Error: No se proporcionó información de empresa');
      return res.status(400).send('No se proporcionó la información de la empresa.');
    }

    // Validar que todos los campos requeridos estén presentes
    const camposRequeridos = ['nombre', 'nit', 'contrato'];
    const camposFaltantes = camposRequeridos.filter(campo => !empresaInfo[campo]);
    
    if (camposFaltantes.length > 0) {
      console.error(`Error: Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
      return res.status(400).send(`Faltan campos requeridos en la información de empresa: ${camposFaltantes.join(', ')}`);
    }

    // Logging para debug
    console.log('Información de empresa validada:', JSON.stringify(empresaInfo, null, 2));

    // Ruta del archivo JSON original
    const jsonPath = path.join(__dirname, '../output/facturacion.json');
    console.log('Ruta del archivo JSON:', jsonPath);

    // Verificar que el archivo JSON existe
    if (!fs.existsSync(jsonPath)) {
      console.error('Error: No se encontró el archivo facturacion.json');
      return res.status(400).send('No se encontraron datos procesados. Por favor, procese el Excel primero.');
    }

    console.log('Archivo JSON encontrado, procediendo a leer');

    // Leer el archivo JSON
    let facturacion;
    try {
      const rawData = fs.readFileSync(jsonPath, 'utf-8');
      console.log('Archivo JSON leído correctamente');
      facturacion = JSON.parse(rawData);
      console.log('JSON parseado correctamente. Número de registros:', facturacion.length);
    } catch (error) {
      console.error('Error al leer o parsear el archivo JSON:', error);
      return res.status(500).send('Error al leer los datos de facturación.');
    }

    // Validar que facturacion sea un array
    if (!Array.isArray(facturacion)) {
      console.error('Error: Los datos de facturación no tienen el formato esperado');
      return res.status(500).send('Los datos de facturación no tienen el formato esperado.');
    }

    console.log('Iniciando agrupación de datos por sala');

    // Agrupar los datos por "Establecimiento"
    const agrupadosPorSala = facturacion.reduce((result, item) => {
      if (!item || typeof item !== 'object') {
        console.error('Error: Elemento inválido en los datos de facturación');
        return result;
      }

      const establecimiento = item["Establecimiento"];
      if (!establecimiento) {
        console.error('Error: Elemento sin establecimiento:', item);
        return result;
      }

      if (!result[establecimiento]) {
        result[establecimiento] = {
          establecimiento: establecimiento,
          municipio: item["Municipio"] || 'No especificado',
          departamento: item["Departamento"] || 'No especificado',
          maquinas: [],
        };
      }

      result[establecimiento].maquinas.push({
        serial: item["Serial"] || 'No especificado',
        nuc: item["NUC"] || 'No especificado',
        marca: item["Marca"] || 'No especificada',
        ventasNetas: item["Valor Ventas Netas"] || 0,
        tarifa12: item["Tarifa 12%"] || 0,
        derechosExplotacion: item["Derechos de explotación"] || 0,
      });

      return result;
    }, {});

    // Convertir el resultado a un array de salas
    const salas = Object.values(agrupadosPorSala);

    // Validar que haya datos agrupados
    if (salas.length === 0) {
      console.error('Error: No se encontraron datos válidos para procesar');
      return res.status(400).send('No se encontraron datos válidos en el archivo JSON.');
    }

    console.log(`Procesando ${salas.length} salas con datos válidos`);
    console.log('Primera sala como ejemplo:', JSON.stringify(salas[0], null, 2));

    // Crear nombre del archivo ZIP
    const zipFileName = `Informes_${empresaInfo.nombre.replace(/\s+/g, '_')}_${empresaInfo.contrato}.zip`;
    const outputZipPath = path.join(__dirname, '../output', zipFileName);
    console.log('Ruta del archivo ZIP a generar:', outputZipPath);

    try {
      console.log('Iniciando generación de PDFs y ZIP');
      await generarPDFsYSalaZIP(salas, outputZipPath, empresaInfo);
      console.log('PDFs y ZIP generados correctamente');
    } catch (error) {
      console.error('Error en generarPDFsYSalaZIP:', error);
      console.error('Stack trace:', error.stack);
      return res.status(500).send(`Error generando PDFs: ${error.message}`);
    }

    // Verificar que el archivo ZIP existe antes de enviarlo
    if (!fs.existsSync(outputZipPath)) {
      console.error('Error: El archivo ZIP no se generó correctamente');
      return res.status(500).send('Error: El archivo ZIP no se generó correctamente');
    }

    console.log('Enviando archivo ZIP al cliente');
    
    // Enviar el archivo ZIP
    res.download(outputZipPath, zipFileName, (err) => {
      if (err) {
        console.error('Error al enviar el archivo ZIP:', err);
        // No podemos enviar otro status porque headers ya fueron enviados
        console.error('No se pudo enviar el archivo al cliente');
      }
      
      // Eliminar el archivo ZIP después de enviarlo
      fs.unlink(outputZipPath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error al eliminar el archivo ZIP:', unlinkErr);
        } else {
          console.log('Archivo ZIP eliminado correctamente');
        }
      });
    });

  } catch (error) {
    console.error('Error general en generarInformesZIP:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).send(`Error interno del servidor: ${error.message}`);
  }
};