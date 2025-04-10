const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const excelService = require('../services/excelService');

exports.uploadFinal = (req, res) => {
  try {
    if (!req.files || !req.files.fileFacturacion) {
      return res.status(400).send('Por favor sube el archivo de facturación.');
    }

    const fileFacturacion = req.files.fileFacturacion;
    const fileBingo = req.files.fileBingo;

    // Leer el archivo de facturación
    const workbook1 = xlsx.read(fileFacturacion.data, { type: 'buffer' });
    const sheetName1 = workbook1.SheetNames[0];
    const sheet1 = workbook1.Sheets[sheetName1];

    // Ajustar para ignorar filas 1 a 10 (inicia desde la fila 11)
    const range1 = xlsx.utils.decode_range(sheet1['!ref']);
    range1.s.r = 10; // En cero-index, esto ignora filas 1 a 10
    sheet1['!ref'] = xlsx.utils.encode_range(range1);

    // Obtener los datos como array (cada fila es un array de celdas)
    const data1 = xlsx.utils.sheet_to_json(sheet1, { header: 1 });
    console.log("Datos ajustados:", data1);

    // Procesar datos según los encabezados definidos:
    // - Serial: combinación de Columna A y B (índices 0 y 1)
    // - Marca: Columna C (índice 2)
    // - NUC: Columna D (índice 3)
    // - Código de Apuesta: combinación de Columna E y F (índices 4 y 5)
    // - Establecimiento: Columna G (índice 6)
    // - Municipio: Columna H (índice 7)
    // - Departamento: combinación de Columna I y J (índices 8 y 9)
    // - Valor Ventas Netas: Columna K (índice 10)
    // - Tarifa 12%: Columna L (índice 11)
    // - Tarifa Fija: Columna M (índice 12)
    // - Derechos de explotación: Columna N (índice 13)
    // - Tipo tarifa: Columna O (índice 14)
    // - Codigo de establecimiento: Columna P (índice 15)
    const processedData1 = data1.map(row => {
      const serial = `${row[0] || ''} ${row[1] || ''}`.trim();
      const marca = row[2] || '';
      const nuc = row[3] || '';
      const codigoApuesta = `${row[4] || ''} ${row[5] || ''}`.trim();
      const establecimiento = row[6] || '';
      const municipio = row[7] || '';
      const departamento = `${row[8] || ''} ${row[9] || ''}`.trim();
      const ventasNetas = (typeof row[10] === 'undefined' ? '' : row[10]);
      const tarifa12 = (typeof row[11] === 'undefined' ? '' : row[11]);
      const tarifaFija = (typeof row[12] === 'undefined' ? '' : row[12]);
      const derechosExplotacion = (typeof row[13] === 'undefined' ? '' : row[13]);
      const tipoTarifa = row[14] || '';
      const codigoEstablecimiento = row[15] || '';

      return {
        'Serial': serial,
        'Marca': marca,
        'NUC': nuc,
        'Código de Apuesta': codigoApuesta,
        'Establecimiento': establecimiento,
        'Municipio': municipio,
        'Departamento': departamento,
        'Valor Ventas Netas': ventasNetas,
        'Tarifa 12%': tarifa12,
        'Tarifa Fija': tarifaFija,
        'Derechos de explotación': derechosExplotacion,
        'Tipo tarifa': tipoTarifa,
        'Codigo de establecimiento': codigoEstablecimiento
      };
    });

    // Procesar datos adicionales en el workbook a través de tu servicio (según lo necesites)
    excelService.processFacturacionSheet({ workbook: workbook1, processedData1 });

    // Eliminar la hoja original para mantener solo las hojas de datos procesados (si es el caso)
    delete workbook1.Sheets[sheetName1];
    workbook1.SheetNames = workbook1.SheetNames.filter(name => name !== sheetName1);

    // Guardar el archivo de facturación procesado como .json
    const tempDir = path.join(__dirname, '..', 'temp_data');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
    const facturacionFileName = `facturacion_${Date.now()}.json`;
    const facturacionFilePath = path.join(tempDir, facturacionFileName);
    fs.writeFileSync(facturacionFilePath, JSON.stringify(processedData1, null, 2));

    // Convertir el workbook actualizado a buffer para descarga (u otra operación)
    const buffer = xlsx.write(workbook1, { type: 'buffer', bookType: 'xlsx' });

    res.json({
      file: buffer.toString('base64'),
      message: 'Archivos procesados exitosamente.',
      hasBingo: !!fileBingo,
      facturacionFilePath: `/temp_data/${facturacionFileName}`
    });

  } catch (error) {
    console.error('Error en uploadFinal:', error);
    res.status(500).send('Ocurrió un error interno al procesar los archivos.');
  }
};
