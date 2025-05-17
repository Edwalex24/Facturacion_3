const xlsx = require('xlsx');

/**
 * Procesa el archivo Excel y construye un JSON con la estructura necesaria.
 * @param {string} filePath - Ruta del archivo Excel.
 * @returns {object} - JSON con la estructura necesaria para generar los PDFs.
 */
function construirJsonDesdeExcel(filePath) {
  // Leer el archivo Excel
  const workbook = xlsx.readFile(filePath);

  // Asegúrate de que la hoja "Facturación" existe
  const hojaFacturacion = workbook.Sheets['Facturación'];
  if (!hojaFacturacion) {
    throw new Error('La hoja "Facturación" no existe en el archivo Excel.');
  }

  // Convertir los datos de la hoja a JSON
  const datos = xlsx.utils.sheet_to_json(hojaFacturacion);

  // Agrupar los datos por sala
  const salas = {};
  datos.forEach((fila) => {
    const nombreSala = fila['Nombre Sala'];
    const ciudad = fila['Ciudad'];
    const serial = fila['Serial'];
    const nuc = fila['NUC'];
    const marca = fila['Marca'];
    const ventasNetas = fila['Ventas Netas'];

    if (!salas[nombreSala]) {
      salas[nombreSala] = {
        nombreSala,
        ciudad,
        maquinas: [],
      };
    }

    salas[nombreSala].maquinas.push({
      serial,
      nuc,
      marca,
      ventasNetas,
    });
  });

  // Convertir el objeto de salas a un arreglo
  const resultado = {
    salas: Object.values(salas),
  };

  return resultado;
}

module.exports = construirJsonDesdeExcel;