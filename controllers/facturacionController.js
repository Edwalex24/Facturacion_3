const xlsx = require('xlsx');
const excelService = require('../services/excelService');

exports.uploadFinal = (req, res) => {
  try {
    if (!req.files || !req.files.fileFacturacion) {
      return res.status(400).send('Por favor sube el archivo de facturación.');
    }

    const fileFacturacion = req.files.fileFacturacion;
    const fileBingo = req.files.fileBingo;

    const workbook1 = xlsx.read(fileFacturacion.data, { type: 'buffer' });
    const sheetName1 = workbook1.SheetNames[0];
    const sheet1 = workbook1.Sheets[sheetName1];

    // Ajustar para ignorar filas de encabezado y luego convertir a JSON
    const range1 = xlsx.utils.decode_range(sheet1['!ref']);
    range1.s.r = 10;
    sheet1['!ref'] = xlsx.utils.encode_range(range1);
    const headers = [
      "Serial",
      "Marca",
      "NUC",
      "Código de Apuesta",
      "Establecimiento",
      "Departamento",
      "Valor Ventas Netas",
      "Tarifa 12%",
      "Tarifa Fija",
      "Derechos de explotación",
      "Tipo tarifa",
      "Codigo de establecimiento"
    ];
    
    const data1 = xlsx.utils.sheet_to_json(sheet1, { header: headers, range: 2 });
    console.log("Datos leídos de la hoja:", data1);

    // Procesar datos según tu lógica
    const processedData1 = data1.map(row => {
      // Si deseas incluir siempre ciertos campos y omitir otros si están vacíos,
      // se puede construir el objeto de forma condicional
      let newRow = {
        'Serial': row['Serial'],
        'NUC': row['NUC'],
        'Código de Apuesta': row['Código de Apuesta'],
        'Establecimiento': row['Establecimiento'],
        'Valor Ventas Netas': row['Valor Ventas Netas'],
        'Tarifa 12%': row['Tarifa 12%'],
        'Tarifa Fija': row['Tarifa Fija'],
        'Tipo tarifa': row['Tipo tarifa'],
        'Codigo de establecimiento': row['Codigo de establecimiento']
      };
    
      // Solo agregar 'Marca' si tiene valor
      if (row['Marca'] && row['Marca'].trim() !== '') {
        newRow['Marca'] = row['Marca'];
      }
    
      // Solo agregar 'Departamento' si tiene valor
      if (row['Departamento'] && row['Departamento'].trim() !== '') {
        newRow['Departamento'] = row['Departamento'];
      }
      
      // Solo agregar 'Derechos de explotación' si tiene valor
      if (row['Derechos de explotación'] && row['Derechos de explotación'].toString().trim() !== '') {
        newRow['Derechos de explotación'] = row['Derechos de explotación'];
      }
    
      return newRow;
    });

    // Utiliza funciones del excelService para agregar hojas, procesar datos adicionales, etc.
    excelService.processFacturacionSheet({ workbook: workbook1, processedData1 });
    // Puedes llamar a otras funciones, p.ej., excelService.createContabilizadosSheet({...});
    // excelService.createAnexoImprimirSheet(workbook1);
// Eliminamos la hoja original para que solo quede la hoja "Facturacion"
  delete workbook1.Sheets[sheetName1];
  workbook1.SheetNames = workbook1.SheetNames.filter(name => name !== sheetName1);


    const buffer = xlsx.write(workbook1, { type: 'buffer', bookType: 'xlsx' });
    res.json({ file: buffer.toString('base64'), message: 'Archivos procesados exitosamente.', hasBingo: !!fileBingo });
  } catch (error) {
    console.error('Error en uploadFinal:', error);
    res.status(500).send('Ocurrió un error interno al procesar los archivos.');
  }
};