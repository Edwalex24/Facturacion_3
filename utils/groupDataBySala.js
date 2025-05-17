const fs = require('fs');
const path = require('path');

/**
 * Lee el archivo facturacion.json y agrupa los datos por sala.
 * @returns {Array} - Array de objetos con los datos agrupados por sala.
 */
function agruparDatosPorSala() {
  const jsonPath = path.join(__dirname, '../output/facturacion.json');
  
  // Verificar si el archivo JSON existe
  if (!fs.existsSync(jsonPath)) {
    throw new Error(`El archivo ${jsonPath} no existe.`);
  }

  // Leer y parsear el archivo JSON
  const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const salasMap = {};

  // Agrupar los datos del JSON por sala
  jsonData.forEach((item) => {
    const nombreSala = item["Locales concatenados Anexo"] || "Sala Desconocida";
    const ciudad = item["Municipio"] || "Ciudad Desconocida";

    if (!salasMap[nombreSala]) {
      salasMap[nombreSala] = {
        nombreSala,
        ciudad,
        maquinas: [],
      };
    }

    // Agregar máquina a la sala
    salasMap[nombreSala].maquinas.push({
      serial: item["Serial"],
      nuc: item["NUC"],
      marca: item["Marca"],
      ventasNetas: item["Valor Ventas Netas"] || 0,
    });
  });

  // Convertir el mapa a un array
  return Object.values(salasMap);
}

module.exports = agruparDatosPorSala;