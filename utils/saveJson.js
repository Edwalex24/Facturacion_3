// utils/saveJson.js
const fs = require('fs');
const path = require('path');

/**
 * Guarda cualquier objeto como archivo JSON en la carpeta /logs.
 * @param {string} baseName - Nombre base del archivo.
 * @param {object|array} data - Datos a guardar.
 */
function saveJsonToFile(baseName, data) {
  const folderPath = path.join(__dirname, '../logs');
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-MM-SS
  const fileName = `${baseName}-${timestamp}.json`;

  const filePath = path.join(folderPath, fileName);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✅ JSON guardado en: ${filePath}`);
}

module.exports = saveJsonToFile;
