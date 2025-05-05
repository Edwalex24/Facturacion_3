const xlsx = require('xlsx');

/**
 * Función para descombinar (unmerge) celdas en una hoja
 * Recorre la propiedad !merges y copia el valor de la celda superior izquierda
 * a todas las celdas del rango.function 
 */
function unmergeCells(sheet) {
  if (!sheet['!merges']) return;
  sheet['!merges'].forEach(range => {
    const startCell = xlsx.utils.encode_cell(range.s);
    const cellValue = sheet[startCell] ? sheet[startCell].v : '';

    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellRef = xlsx.utils.encode_cell({ r: R, c: C });
        if (!sheet[cellRef]) {
          sheet[cellRef] = { t: 's', v: cellValue }; // Propagar el valor
        }
      }
    }
  });
}
 function fillEmptyCellsWithNA(sheet, defaultValue = "N/A", referenceColumn = "M", maxRow = null) {
  // Obtener el rango completo de la hoja
  let range = xlsx.utils.decode_range(sheet['!ref']);
  console.log("Rango inicial detectado:", range);

  // Determinar la última fila con datos en la columna de referencia (por defecto, columna M)
  const columnIndex = referenceColumn.charCodeAt(0) - 65; // Convertir letra de columna a índice (A=0, B=1, ..., M=12)
  let lastRowWithData = range.s.r; // Inicializar con la primera fila del rango

  for (let row = range.s.r; row <= range.e.r; row++) {
    const cellAddress = xlsx.utils.encode_cell({ r: row, c: columnIndex }); // Dirección de la celda en la columna M
    const cell = sheet[cellAddress];

    if (cell && cell.v !== null && cell.v !== "") {
      lastRowWithData = row; // Actualizar la última fila con datos en la columna M
    }
  }

  console.log(`Última fila con datos en la columna ${referenceColumn}: ${lastRowWithData + 1}`);

  // Usar el menor valor entre la última fila con datos y maxRow (si se proporciona)
  const rowLimit = maxRow !== null ? Math.min(maxRow, lastRowWithData + 1) : lastRowWithData + 1;
  console.log(`Procesando filas desde ${range.s.r + 1} hasta ${rowLimit}`);

  // Iterar sobre las filas y columnas dentro del rango
  for (let row = range.s.r; row < rowLimit; row++) { // NOTA: Usar "< rowLimit" para evitar excederlo
    for (let col = range.s.c; col <= range.e.c; col++) {
      // Convertir el índice de columna a la letra correspondiente
      const columnLetter = String.fromCharCode(65 + col); // 65 es el código ASCII de 'A'

      // Ignorar las columnas E, K y M
      if (['E', 'K', 'M'].includes(columnLetter)) {
        continue;
      }

      // Verificar la celda actual
      const cellAddress = xlsx.utils.encode_cell({ r: row, c: col });
      const cell = sheet[cellAddress];

      // Detectar celdas vacías y rellenarlas
      if (!cell || cell.v === null || cell.v === "") {
        console.log(`Celda vacía detectada en ${cellAddress}. Rellenando con: ${defaultValue}`);
        sheet[cellAddress] = { t: typeof defaultValue === 'number' ? 'n' : 's', v: defaultValue };
      } else {
        console.log(`Celda ${cellAddress} ya tiene valor: ${cell.v}`);
      }
    }
  }

  // Actualizar el rango de la hoja para reflejar cambios
  range.e.r = rowLimit - 1; // Ajustar la fila final al límite procesado
  sheet['!ref'] = xlsx.utils.encode_range(range);
  console.log("Rango final procesado de la hoja:", sheet['!ref']);
}
 

function processVentasMaquinas(fileData) {
  // Leer el archivo Excel a partir del buffer
  console.log("📂 Procesando archivo de ventas máquinas...");
  const workbook = xlsx.read(fileData, { type: 'buffer' });
  const sheetName = "elementosConectadosDeclaracion";
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    console.error("❌ La hoja 'elementosConectadosDeclaracion' no existe en el archivo.");
    return [];
  }

  console.log("✅ Hoja 'elementosConectadosDeclaracion' encontrada. Descombinando celdas...");
  unmergeCells(sheet);

  // Descombinar celdas
  unmergeCells(sheet);

  // Ajustar el rango para ignorar las primeras 10 filas
  console.log("🔧 Ajustando rango para ignorar las primeras 10 filas...");
  const range = xlsx.utils.decode_range(sheet['!ref']);
  range.s.r = 9; // Comenzar en la fila 11 (0-indexado)
  sheet['!ref'] = xlsx.utils.encode_range(range);

  // Convertir la hoja a un array de arrays
  const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
  console.log(data); // Verificar el resultado

  // Definir los encabezados
  const headers = [
    "Serial", "Marca", "NUC", "Código de Apuesta",
    "Establecimiento", "Municipio", "Departamento",
    "Valor ventas netas", "Tarifa 12%", "Tarifa Fija",
    "Derechos de Explotación", "Tipo tarifa", "Código de establecimiento"
  ];

  // Mapeo de los datos a un objeto JSON
  const processedData = data.slice(1).map(row => {
    const obj = {};
    headers.forEach((key, index) => {
      obj[key] = row[index] || ''; // Si la celda está vacía, asigna una cadena vacía
    });
    return obj;
  });

  return processedData;
}/**
 * Función para procesar la hoja de Facturación.
 * Recibe como parámetros un objeto con el workbook y los datos procesados (processedData1)
 * a partir de otro archivo (por ejemplo, el Anexo Ventas Máquinas ya procesado o datos de facturación).
 * Esta función crea una nueva hoja "Facturacion" con formateos especificados.
 */
function processFacturacionSheet({ workbook, processedData1, derechosExplotacion, establecimientos, codEstablecimientos }) {
  console.log("📂 Procesando hoja de facturación...");

  // Verificar que los datos de entrada sean válidos
  if (!processedData1 || !Array.isArray(processedData1) || processedData1.length === 0) {
    console.error("❌ Error: Los datos de facturación están vacíos o no son válidos.");
    return;
  }
  if (!Array.isArray(derechosExplotacion) || !Array.isArray(establecimientos) || !Array.isArray(codEstablecimientos)) {
    console.error("❌ Error: Las columnas adicionales (derechosExplotacion, establecimientos, codEstablecimientos) no son válidas.");
    return;
  }

  console.log("✅ Datos de facturación recibidos:", processedData1.length, "filas procesadas.");

  // Convertir el JSON a un array de arrays
  const encabezados = [
    "Serial", "Marca", "NUC", "Código de Apuesta",
    "Establecimiento", "Municipio", "Departamento",
    "Valor ventas netas", "Tarifa 12%", "Tarifa Fija",
    "Derechos de explotación", "Tipo tarifa", "Codigo de establecimiento"
  ];
  const finalData = processedData1.map(row => encabezados.map(header => row[header] || ''));

  console.log("📋 Encabezados definidos. Procesando datos para la hoja...");

  // Crear una nueva hoja con los datos procesados
  const newSheetData = [encabezados, ...finalData];
  const newSheet = xlsx.utils.aoa_to_sheet(newSheetData);

  // Agregar valores adicionales a las columnas
  console.log("➕ Agregando valores adicionales a las columnas...");
  derechosExplotacion.forEach((valor, index) => {
    const cellAddress = xlsx.utils.encode_cell({ r: index + 1, c: 10 }); // Columna K
    newSheet[cellAddress] = { t: 'n', v: valor };
    console.log(`📝 Valor agregado en columna 'Derechos de explotación' (Fila ${index + 1}): ${valor}`);
  });

  establecimientos.forEach((valor, index) => {
    const cellAddress = xlsx.utils.encode_cell({ r: index + 1, c: 4 }); // Columna E
    newSheet[cellAddress] = { t: 's', v: valor };
    console.log(`📝 Valor agregado en columna 'Establecimientos' (Fila ${index + 1}): ${valor}`);
  });

  codEstablecimientos.forEach((valor, index) => {
    const cellAddress = xlsx.utils.encode_cell({ r: index + 1, c: 12 }); // Columna M
    newSheet[cellAddress] = { t: 's', v: valor };
    console.log(`📝 Valor agregado en columna 'Códigos de establecimiento' (Fila ${index + 1}): ${valor}`);
  });

  // Llenar celdas vacías con "N/A"
  console.log("🔧 Llenando celdas vacías con 'N/A'...");
  fillEmptyCellsWithNA(newSheet);

  // Adjuntar la nueva hoja al libro con el nombre "Facturación"
  workbook.Sheets["Facturación"] = newSheet;
  console.log("✅ Hoja de facturación creada y adjuntada al workbook.");
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
  unmergeCells,
  fillEmptyCellsWithNA,
};