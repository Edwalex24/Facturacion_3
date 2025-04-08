// services/excelService.js

const xlsx = require('xlsx');

/**
 * Función para descombinar (unmerge) celdas en una hoja
 * Recorre la propiedad !merges y copia el valor de la celda superior izquierda
 * a todas las celdas del rango.
 */
function unmergeCells(sheet) {
  if (!sheet['!merges']) return;
  sheet['!merges'].forEach(range => {
    const startCell = xlsx.utils.encode_cell(range.s);
    const cellValue = sheet[startCell] ? sheet[startCell].v : '';
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
        sheet[cellRef] = { t: 's', v: cellValue };
      }
    }
  });
}

/**
 * Función para procesar el archivo "Anexo Ventas Máquinas".
 * Se ignoran las primeras 10 filas, descombina las celdas combinadas y luego
 * mapea los datos a un objeto JSON usando encabezados definidos.
 *
 * Se asume que el libro tiene un único sheet llamado "elementosConectadosDeclaracion".
 */
function processVentasMaquinas(fileData) {
  // Leer el archivo Excel a partir del buffer
  const workbook = xlsx.read(fileData, { type: 'buffer' });
  const sheetName = "elementosConectadosDeclaracion";
  const sheet = workbook.Sheets[sheetName];
  
  // Descombinar celdas para que cada columna tenga su valor individual
  unmergeCells(sheet);
  
  // Ajustar el rango para ignorar las primeras 10 filas
  const range = xlsx.utils.decode_range(sheet['!ref']);
  range.s.r = 10; // Comenzar en la fila 11 (0-indexed)
  sheet['!ref'] = xlsx.utils.encode_range(range);
  
  // Convertir la hoja a un array de arrays (header:1)
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1, range: 10 });

  // Definir los nuevos encabezados
  const headers = [
    "Serial",                 // A y B combinadas (tomamos el valor de A)
    "Marca",                  // Columna C
    "NUC",                    // Columna D
    "Código de Apuesta",      // E y F combinadas (tomamos el valor de E)
    "Establecimiento",        // Columna G
    "Municipio",              // Columna H
    "Departamento",           // I y J combinadas (tomamos el valor de I)
    "Valor ventas netas",     // Columna K
    "Tarifa 12%",             // Columna L
    "Tarifa Fija",            // Columna M
    "Derechos de Explotación",// Columna N
    "Tipo tarifa",            // Columna O
    "Código de establecimiento" // Columna P
  ];
  
  // Convertir las filas de datos en objetos usando los encabezados definidos.
  // Se asume que la primera fila (data[0]) contiene encabezados antiguos que se ignoran.
  const processedData = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((key, index) => {
      obj[key] = row[index] || ''; // Si la celda está vacía, asigna una cadena vacía
    });
    return obj;
  });
  
  return processedData;
}

/**
 * Función para procesar la hoja de Facturación.
 * Recibe como parámetros un objeto con el workbook y los datos procesados (processedData1)
 * a partir de otro archivo (por ejemplo, el Anexo Ventas Máquinas ya procesado o datos de facturación).
 * Esta función crea una nueva hoja "Facturacion" con formateos especificados.
 */
function processFacturacionSheet({ workbook, processedData1 }) {
  // Convertir el JSON a una hoja (sheet) de Excel
 

  const newSheet1 = xlsx.utils.json_to_sheet(processedData1);
  
  // Ejemplo: formatear la columna H (por ejemplo, para que se muestre como fecha en formato dd/mm/yyyy)
  for (let i = 2; i <= processedData1.length + 1; i++) {
    if (newSheet1[`H${i}`]) {
      newSheet1[`H${i}`].z = 'dd/mm/yyyy';
    }
    // Puedes añadir más formatos para otras columnas según lo necesites
  }
  
  // Adjuntar la nueva hoja al libro con el nombre "Facturacion"
  xlsx.utils.book_append_sheet(workbook, newSheet1, 'Facturacion');
}

/**
 * (Opcional) Función para procesar el Inventario.
 * Esta función puede leerse de forma similar: convierte la hoja a JSON
 * y prepara un objeto de inventario.
 */
function processInventario(fileData) {
  const workbook = xlsx.read(fileData, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data;
}

module.exports = {
  processVentasMaquinas,
  processFacturacionSheet,
  processInventario,
  // Agrega aquí otras funciones que necesites...
};