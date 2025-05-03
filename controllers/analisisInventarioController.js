const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const tempDir = path.join(__dirname, '..', 'temp_data');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}
exports.uploadInventario = (req, res) => {
  if (!req.files || !req.files.fileInventario) {
    return res.status(400).send('Por favor sube el archivo de inventario.');
  }

  const workbook = xlsx.read(req.files.fileInventario.data, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  
  if (
    !data[0] ||
    !('Código Local' in data[0]) ||
    !('Nombre Establecimiento' in data[0]) ||
    !('Tipo Apuesta' in data[0])
  ) {
    return res.status(400).send('El archivo no contiene las columnas requeridas.');
  }

  const processedData = data.map(row => ({
    ...row,
    'Locales Concatenados Inventario': `${row['Código Local']} ${row['Nombre Establecimiento']}`
  }));
  
  
  // Crear nombre único para el archivo
  const fileId = Date.now();
  const filename = `inventario_${fileId}.json`;
  const filePath = path.join(tempDir, filename);
  // Guardar archivo
  fs.writeFileSync(filePath, JSON.stringify(processedData, null, 2));
  

  const bingos = data.filter(row => row['Tipo Apuesta'] && row['Tipo Apuesta'].trim() === '<=250')
    .map(row => row['Nombre Establecimiento']);

  const hasBingo = bingos.length > 0;
  const bingoMessage = hasBingo 
    ? `Se encontraron ${bingos.length} Bingos en el Contrato.` 
    : "No se encontraron Bingos en el Contrato.";

    res.json({
      message: bingoMessage,
      hasBingo,
      bingoCount: bingos.length,
      filePath: `/temp_data/${filename}`
    });
    
};