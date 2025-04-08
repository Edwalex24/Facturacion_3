const xlsx = require('xlsx');

// Variable para almacenar datos temporales. Considera alternativas si trabajas con múltiples usuarios.
let temporaryInventoryData = null;

exports.uploadInventario = (req, res) => {
  if (!req.files || !req.files.fileInventario) {
    return res.status(400).send('Por favor sube el archivo de inventario.');
  }

  const workbook = xlsx.read(req.files.fileInventario.data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);

  temporaryInventoryData = data.map(row => ({
    'Código Local': row['Código Local'],
    'Nombre Establecimiento': row['Nombre Establecimiento'],
    'Codlocal_NombreLocal': `${row['Código Local']} ${row['Nombre Establecimiento']}`,
    'Tipo Apuesta': row['Tipo Apuesta']
  }));

  const bingos = data.filter(row => row['Tipo Apuesta'] && row['Tipo Apuesta'].trim() === '<=250')
    .map(row => row['Nombre Establecimiento']);

  const hasBingo = bingos.length > 0;
  const bingoMessage = hasBingo 
    ? `Se encontraron ${bingos.length} contratos con bingos.` 
    : "No se encontraron contratos con bingos.";

  res.json({ message: bingoMessage, hasBingo, bingoCount: bingos.length });
};