const fs = require('fs');
const path = require('path');

/**
 * Guarda un JSON en un archivo dentro de una carpeta del proyecto.
 * @param {Object} jsonData - Objeto JSON a guardar.
 * @param {string} fileName - Nombre del archivo JSON (e.g., "data.json").
 */
function guardarJsonEnProyecto(jsonData, fileName) {
  try {
    // Carpeta donde se guardará el JSON
    const folderPath = path.join(__dirname, '../output');
    
    // Verificar si la carpeta existe; si no, crearla
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Carpeta creada: ${folderPath}`);
    }

    // Ruta completa del archivo
    const filePath = path.join(folderPath, fileName);

    // Guardar el JSON en el archivo
    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf-8');
    console.log(`✅ JSON guardado exitosamente en: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error al guardar el JSON: ${error.message}`);
  }
}

module.exports = guardarJsonEnProyecto;