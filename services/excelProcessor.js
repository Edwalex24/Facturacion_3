const path = require('path');
const fs = require('fs');
const os = require('os');
const xlsx = require('xlsx');
const { unmergeCells, fillEmptyCellsWithNA, removeEmptyColumns } = require('../utils/excelUtils');
<<<<<<< HEAD
=======
const { encode_cell, decode_range, encode_range } = xlsx.utils;
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
const ExcelJS = require('exceljs');

// Función para guardar el archivo procesado en la carpeta de descargas
function saveProcessedFile(workbook, filename) {
  const outputPath = path.join(os.homedir(), 'Downloads', filename);  // Ruta para guardar en la carpeta de descargas
  xlsx.writeFile(workbook, outputPath);
  return outputPath;
}
<<<<<<< HEAD


=======
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
function agregarHojaFacturacionExcelJS(workbook, processedData1, bingoBuffers = []) {
  if (!processedData1 || processedData1.length === 0) {
    console.log("❌ No hay datos para agregar a la hoja Facturación.");
    return;
  }

  // Verificar si la hoja ya existe
  const existingSheet = workbook.getWorksheet('Facturación');
  if (existingSheet) {
    console.log("📂 La hoja 'Facturación' ya existe. Eliminándola para reemplazarla...");
    workbook.removeWorksheet(existingSheet.id);
  }

<<<<<<< HEAD
  console.log("🔍 Creando la hoja 'Facturación' con los datos proporcionados...");
=======
  const tmpDir = path.join(__dirname, 'tmp');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
  }

  // Guardar los datos procesados para depuración
  const jsonPath = path.join(tmpDir, 'debug_processedData1.json');
  fs.writeFileSync(jsonPath, JSON.stringify(processedData1, null, 2), 'utf8');
  console.log(`✅ processedData1 guardado en: ${jsonPath}`);

  console.log("🔍 Ejemplo de row en processedData1:", processedData1[0]);
  console.log("🔑 Claves del primer row:", Object.keys(processedData1[0]));

  // Crear la hoja de facturación
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  const sheet = workbook.addWorksheet('Facturación');
  sheet.columns = [
    { header: "Serial", key: "Serial", width: 31 },
    { header: "Marca", key: "Marca", width: 42 },
    { header: "NUC", key: "NUC", width: 14 },
    { header: "Código de Apuesta", key: "Código de Apuesta", width: 17 },
    { header: "Establecimiento", key: "Establecimiento", width: 36 },
    { header: "Municipio", key: "Municipio", width: 29 },
    { header: "Departamento", key: "Departamento", width: 18 },
    { header: "Valor Ventas Netas", key: "Valor Ventas Netas", width: 20 },
    { header: "Tarifa 12%", key: "Tarifa 12%", width: 16 },
    { header: "Tarifa Fija", key: "Tarifa Fija", width: 10 },
    { header: "Derechos de explotación", key: "Derechos de explotación", width: 23 },
    { header: "Tipo tarifa", key: "Tipo tarifa", width: 10 },
    { header: "Codigo de establecimiento", key: "Codigo de establecimiento", width: 23 },
    { header: "Locales concatenados Anexo", key: "Locales concatenados Anexo", width: 35 }
  ];

  const headers = sheet.columns.map(col => col.header);

  // Estilo para los encabezados
  const headerRow = sheet.getRow(1);
  headerRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Insertar datos del archivo principal
  processedData1.forEach((row) => {
    const rowData = {};
    headers.forEach(header => {
<<<<<<< HEAD
      rowData[header] = row[header] || "N/A"; // Completar celdas vacías con "N/A"
    });
    rowData["Locales concatenados Anexo"] = `${row["Codigo de establecimiento"] || 'N/A'} ${row["Establecimiento"] || 'N/A'}`.trim();
=======
      rowData[header] = row[header] || '';
    });
    const concatenado = `${row["Codigo de establecimiento"] || ''} ${row["Establecimiento"] || ''}`.trim();
    rowData["Locales concatenados Anexo"] = concatenado;
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8

    const newRow = sheet.addRow(rowData);
    newRow.alignment = { horizontal: 'center', vertical: 'middle' };

    const valorVentasNetasCell = newRow.getCell("Valor Ventas Netas");
    const tarifa12Cell = newRow.getCell("Tarifa 12%");
    const derechosCell = newRow.getCell("Derechos de explotación");

    [valorVentasNetasCell, tarifa12Cell, derechosCell].forEach(cell => {
      if (typeof cell.value === 'number') {
        cell.numFmt = '"$"#,##0';
      }
    });
  });

<<<<<<< HEAD
  // Procesar archivos de bingo, si existen
  if (bingoBuffers && bingoBuffers.length > 0) {
    console.log("🧩 Insertando datos desde archivos de bingo...");
    for (const buffer of bingoBuffers) {
      try {
        const workbookBingo = xlsx.read(buffer, { type: 'buffer' });
        const firstSheetName = workbookBingo.SheetNames[0];
        const worksheet = workbookBingo.Sheets[firstSheetName];
        if (!worksheet) continue;

        const raw = xlsx.utils.sheet_to_json(worksheet, { defval: "N/A" }); // Completar celdas vacías con "N/A"
        raw.forEach(item => {
          const newRow = sheet.addRow({
            "Establecimiento": item['Establecimiento'] || "N/A",
            "Codigo de establecimiento": item['Cod establecimiento'] || "N/A",
            "Derechos de explotación": item['Valor derechos de explotación'] || 0,
            "Locales concatenados Anexo": `${item['Cod establecimiento'] || 'N/A'} ${item['Establecimiento'] || 'N/A'}`.trim()
          });

          newRow.alignment = { horizontal: 'center', vertical: 'middle' };

          const derechosCell = newRow.getCell("Derechos de explotación");
          if (typeof derechosCell.value === 'number') {
            derechosCell.numFmt = '"$"#,##0';
          }
        });
      } catch (error) {
        console.error("❌ Error procesando archivo de bingo:", error.message);
      }
    }
  }

  console.log("✅ Hoja 'Facturación' creada con éxito.");
}
=======
  // Manejo del caso de archivos de bingo
  if (!bingoBuffers || bingoBuffers.length === 0) {
    console.log("📂 No se recibieron archivos de bingo. Finalizando sin procesar bingos.");
    return;
  }

  console.log("🧩 Insertando datos desde archivos de bingo:", bingoBuffers.length);

  // Procesar cada archivo de bingo
  for (const buffer of bingoBuffers) {
    try {
      const workbookBingo = xlsx.read(buffer, { type: 'buffer' });
      const firstSheetName = workbookBingo.SheetNames[0];
      const worksheet = workbookBingo.Sheets[firstSheetName];
      if (!worksheet) continue;

      const raw = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      console.log("🔍 Vista previa cruda del archivo de bingo:", raw.slice(0, 5)); // Ver primeras filas

      const bingoHeaders = raw[2]; // Fila 3
      const rows = raw.slice(3); // Desde fila 4

      const data = rows.map(row => {
        const obj = {};
        bingoHeaders.forEach((header, index) => {
          obj[header] = row[index];
        });
        return obj;
      });

      const bingoJsonPath = path.join(tmpDir, `debug_bingo_${Date.now()}.json`);
      fs.writeFileSync(bingoJsonPath, JSON.stringify(data, null, 2), 'utf8');
      console.log(`📝 JSON del bingo guardado en: ${bingoJsonPath}`);

      data.forEach(item => {
        const newRow = sheet.addRow({});
        const codigoEst = item['Cod establecimiento'] || '';
        const establecimiento = item['Establecimiento'] || '';
        const valorDerechos = item['Valor derechos de explotación'] || '';

        newRow.getCell('Establecimiento').value = establecimiento;
        newRow.getCell('Codigo de establecimiento').value = codigoEst;
        newRow.getCell('Derechos de explotación').value = valorDerechos;
        newRow.getCell('Locales concatenados Anexo').value = `${codigoEst} ${establecimiento}`.trim();

        newRow.alignment = { horizontal: 'center', vertical: 'middle' };

        const derechosCell = newRow.getCell("Derechos de explotación");
        if (typeof derechosCell.value === 'number') {
          derechosCell.numFmt = '"$"#,##0';
        }
      });
    } catch (error) {
      console.error("❌ Error procesando archivo de bingo:", error.message);
    }
  }

  console.log("✅ Hoja Facturación creada con exceljs.");
}

>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
function processInventario(fileData) {
  // Leer el archivo Excel
  const workbook = xlsx.read(fileData, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convertir la hoja a JSON
  const data = xlsx.utils.sheet_to_json(sheet);

  // Generar la clave 'Locales Concatenados Inventario'
  const processedData = data.map(row => ({
    ...row,
    'Locales Concatenados Inventario': `${row['Código Local'] || ''}  ${row['Nombre Establecimiento'] || ''}`.trim()
  }));

  return processedData;
}

<<<<<<< HEAD
async function generarResumenVentasPorLocalExcelJS(workbook) {
  const facturacionSheet = workbook.getWorksheet('Facturación');
  if (!facturacionSheet) {
    console.error("❌ No se encontró la hoja 'Facturación'.");
    return;
  }

  const resumenSheet = workbook.addWorksheet('ResumenVentasPorLocal');
  resumenSheet.columns = [
    { header: 'Locales Anexo', key: 'local', width: 40 },
    { header: 'Total a Pagar', key: 'total', width: 20 }
  ];

  const resumenMap = {};

  // Recorrer la hoja de 'Facturación' para sumar totales por local
  facturacionSheet.eachRow({ includeEmpty: false }, (row, rowIndex) => {
    if (rowIndex === 1) return; // Saltar encabezado

    const local = row.getCell('Locales concatenados Anexo').value;
    const valor = parseFloat(row.getCell('Derechos de explotación').value) || 0;
=======
async function generarResumenVentasPorLocalExcelJS(workbook, data) {
  // 1. Crear nueva hoja
  const resumenSheet = workbook.addWorksheet('ResumenVentasPorLocal');

  // 2. Definir columnas (actualizar el nombre de la columna "Locales concatenados Anexo" a "Locales Anexo")
  resumenSheet.columns = [
    { header: 'Locales Anexo', key: 'local', width: 40 },  // Cambiar el nombre aquí
    { header: 'Total a Pagar', key: 'total', width: 20 }
  ];

  // 3. Estilo de encabezados
  const headerRow = resumenSheet.getRow(1);
headerRow.eachCell({ includeEmpty: false }, (cell) => {
  cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0070C0' }
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
});


  // 4. Procesar data
  const resumenMap = {};

  data.forEach(row => {
    //console.log(`Chequeando fila:`, row); // Ver qué contiene cada fila antes de usarla

    const local = row['Locales concatenados Anexo'];  // Asegúrate de que esta columna exista en los datos
    if (!local) {
      //console.log(`¡Error! No se encuentra "Locales concatenados Anexo" para esta fila.`);
    }

    const valor = parseFloat(row['Derechos de explotación']) || 0;
    const ajustado = valor * 1.01;
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8

    if (!resumenMap[local]) {
      resumenMap[local] = 0;
    }
<<<<<<< HEAD
    resumenMap[local] += valor * 1.01; // Ajuste del 1%
  });

  let totalGeneral = 0;
  const dataRows = [];
  for (const [local, total] of Object.entries(resumenMap)) {
    dataRows.push({ local, total: Math.round(total) });
    totalGeneral += total;
  }

  // Ordenar los datos por "Locales Anexo" alfabéticamente
  dataRows.sort((a, b) => a.local.localeCompare(b.local, 'es', { numeric: true }));

  // Agregar las filas ordenadas al resumen
  dataRows.forEach(data => {
    const row = resumenSheet.addRow(data);
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Calibri', size: 11 };
      cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'right' : 'left' };

      // Formato de moneda para la columna "Total a Pagar" (Columna B)
      if (colNumber === 2) {
        cell.numFmt = '"$"#,##0'; // Formato en pesos colombianos, sin decimales
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });
  });

  // Agregar la fila de "TOTAL GENERAL"
  const totalRow = resumenSheet.addRow({ local: 'TOTAL GENERAL', total: Math.round(totalGeneral) });
  totalRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' }
    };
    cell.alignment = { vertical: 'middle', horizontal: colNumber === 2 ? 'right' : 'center' };

    // Aplicar formato de moneda a la columna "Total a Pagar"
    if (colNumber === 2) {
      cell.numFmt = '"$"#,##0';
    }
  });

  // Aplicar estilo al encabezado
  resumenSheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' } // Fondo azul para el encabezado
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Aplicar bordes a todas las celdas
  resumenSheet.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  console.log("✅ Hoja 'ResumenVentasPorLocal' creada con éxito.");
}
function agregarResumenInventarioExcelJS(worksheet, inventarioData) {
=======
    resumenMap[local] += ajustado;
  });

  // 5. Insertar filas
  let totalGeneral = 0;
  for (const local of Object.keys(resumenMap).sort()) { // Ordenar ASC
    const total = resumenMap[local];
    resumenSheet.addRow({
      local: local,
      total: Math.round(total)
    });
    totalGeneral += total;
  }
    
  // 6. Insertar total general
  const totalRow = resumenSheet.addRow({
    local: 'TOTAL GENERAL',
    total: Math.round(totalGeneral)
  });
  
  // Aplicar estilo similar a encabezado
  totalRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0070C0' } // Mismo azul oscuro que encabezado
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  

  // 7. Formato moneda columna B
  resumenSheet.getColumn('total').numFmt = '"$"#,##0;[Red]\-"$"#,##0';

 //console.log('✅ ResumenVentasPorLocal generado.');
}


function agregarResumenInventarioExcelJS(worksheet, inventarioData) {
  // 1. Agrupar ocurrencias por local
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  const ocurrencias = {};
  for (const item of inventarioData) {
    const local = item['Locales Concatenados Inventario'];
    if (local) {
      ocurrencias[local] = (ocurrencias[local] || 0) + 1;
    }
  }

<<<<<<< HEAD
  const localesOrdenados = Object.entries(ocurrencias).sort((a, b) => a[0].localeCompare(b[0]));
  const existingCols = worksheet.columnCount;
  const startCol = existingCols + 1;

=======
  // 2. Ordenar alfabéticamente
  const localesOrdenados = Object.entries(ocurrencias).sort((a, b) => a[0].localeCompare(b[0]));

  // 3. Determinar la columna siguiente libre
  const existingCols = worksheet.columnCount;
  const startCol = existingCols + 1;

  // 4. Agregar encabezados con estilo
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  const encabezados = ['Locales Concatenados Inventario', 'Cantidad Inventario'];
  const headerRow = worksheet.getRow(1);

  encabezados.forEach((text, idx) => {
    const cell = headerRow.getCell(startCol + idx);
    cell.value = text;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' }
    };
    cell.alignment = { horizontal: 'center' };
<<<<<<< HEAD
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
=======
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  });

  headerRow.commit();

<<<<<<< HEAD
=======
  // 5. Insertar datos
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  let rowIndex = 2;
  for (const [local, cantidad] of localesOrdenados) {
    const row = worksheet.getRow(rowIndex);
    row.getCell(startCol).value = local;
    row.getCell(startCol + 1).value = cantidad;
<<<<<<< HEAD

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // Centrar y alinear al medio los datos de la columna "Cantidad Inventario" (D)
      if (colNumber === startCol + 1) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }
    });

=======
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
    row.commit();
    rowIndex++;
  }

<<<<<<< HEAD
  const totalRow = worksheet.getRow(rowIndex);
  totalRow.getCell(startCol).value = 'Total Inventario';
  totalRow.getCell(startCol + 1).value = localesOrdenados.reduce((sum, [, cantidad]) => sum + cantidad, 0);
  totalRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
=======
  // 6. Total al final
  const totalRow = worksheet.getRow(rowIndex);
  totalRow.getCell(startCol).value = 'Total Inventario';
  totalRow.getCell(startCol + 1).value = localesOrdenados.reduce((sum, [, cantidad]) => sum + cantidad, 0);
  //totalRow.font = { bold: true };
  totalRow.eachCell({ includeEmpty: false }, (cell) => {
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
<<<<<<< HEAD
      fgColor: { argb: 'FF4F81BD' }
    };
    cell.alignment = { horizontal: 'center' };

    // Centrar y alinear al medio también en la fila "Total Inventario"
    if (colNumber === startCol + 1) {
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    }

    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  totalRow.commit();
=======
      fgColor: { argb: 'FF4F81BD' } // Mismo azul del encabezado
    };
    cell.alignment = { horizontal: 'center' };
  });
  
  totalRow.commit();

  // 7. Ajustar ancho columnas
>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
  worksheet.getColumn(startCol).width = 40;
  worksheet.getColumn(startCol + 1).width = 20;
}

<<<<<<< HEAD
/**
 * Procesa el archivo de anexo bingo y devuelve un JSON con los datos relevantes.
 * Filtra filas vacías y guarda un log JSON temporal para inspección.
 * @param {Buffer} fileData - Los datos del archivo de anexo bingo.
 * @returns {Array} - JSON con los datos procesados de anexo bingo.
 */
function processAnexoBingo(fileData) {
  // Leer el archivo Excel
  const workbook = xlsx.read(fileData, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];

  // Convertir la hoja en JSON, ignorando las primeras dos filas
  let data = xlsx.utils.sheet_to_json(sheet, { range: 2 });

  // Filtrar filas vacías (todas las celdas son nulas o están vacías)
  data = data.filter(row => {
    return Object.values(row).some(value => value !== null && value !== undefined && value !== "");
  });

  // Guardar un log temporal
  const tmpDir = path.join(os.tmpdir(), 'bingo_logs');
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const timestamp = Date.now();
  const logFilePath = path.join(tmpDir, `bingo_log_${timestamp}.json`);
  fs.writeFileSync(logFilePath, JSON.stringify(data, null, 2), 'utf8');
  console.log(`✅ Log de datos de Bingo guardado en: ${logFilePath}`);

  // Retornar el JSON completo
  return data;
}

/**
 * Inserta los datos de bingo en la hoja de Facturación.
 * También concatena las columnas C (Establecimiento) y B (Cod establecimiento) en la columna N (Locales concatenados Anexo).
 * @param {Object} worksheet - La hoja de Facturación.
 * @param {Array} bingoData - JSON con los datos procesados de anexo bingo.
 */
function insertarDatosBingoEnFacturacion(worksheet, bingoData) {
  // Determinar manualmente la última fila con datos válidos
  let lastRowFacturacion = 1; // Inicializamos con 1 (encabezados)

  worksheet.eachRow((row, rowIndex) => {
    // Ignorar filas que contienen solo valores predeterminados ('N/A', 0, 'N/A N/A')
    const hasRelevantData = row.values.some(cell => {
      if (cell === null || cell === undefined || cell.toString().trim() === "") {
        return false; // Celda vacía
      }
      if (cell === "N/A" || cell === 0 || cell === "N/A N/A") {
        return false; // Valor predeterminado irrelevante
      }
      return true; // Valor relevante encontrado
    });

    if (hasRelevantData) {
      lastRowFacturacion = rowIndex; // Actualizamos a la última fila con datos relevantes
    }
  });

  console.log(`🔍 Última fila ocupada en 'Facturación' después de validación adicional: ${lastRowFacturacion}`);

  // Filtrar datos de bingo para evitar filas vacías o irrelevantes
  const filteredBingoData = bingoData.filter(row => {
    return row["Cod establecimiento"] || row["Establecimiento"] || row["Valor derechos de explotación"];
  });

  if (filteredBingoData.length === 0) {
    console.warn("⚠️ No se encontraron datos relevantes en el archivo de Bingo.");
    return;
  }

  // Insertar los datos al final de las columnas específicas
  filteredBingoData.forEach((row, index) => {
    const nuevaFila = lastRowFacturacion + index + 1;

    // Log para depurar
    console.log(`🔍 Insertando datos en la fila: ${nuevaFila}`);
    console.log("🔍 Datos a insertar:", JSON.stringify(row, null, 2));

    // Definir las columnas relevantes (ajustar según el formato de la hoja)
    const columnas = {
      A: "N/A", // Ejemplo: Columna A
      B: "N/A", // Ejemplo: Columna B
      C: row["Establecimiento"] || "N/A", // Columna C
      D: "N/A", // Ejemplo: Columna D
      E: "N/A", // Ejemplo: Columna E
      F: "N/A", // Ejemplo: Columna F
      G: "N/A", // Ejemplo: Columna G
      H: "N/A", // Ejemplo: Columna H
      I: "N/A", // Ejemplo: Columna I
      J: "N/A", // Ejemplo: Columna J
      K: row["Valor derechos de explotación"] || "N/A", // Columna K
      L: "N/A", // Ejemplo: Columna L
      M: row["Cod establecimiento"] || "N/A", // Columna M
      N: `${row["Cod establecimiento"] || "N/A"} ${row["Establecimiento"] || "N/A"}`.trim() // Columna N
    };

    // Rellenar las celdas de la fila con los valores
    Object.keys(columnas).forEach(columna => {
      worksheet.getCell(`${columna}${nuevaFila}`).value = columnas[columna];
    });

    // Actualizar la última fila ocupada por la inserción
    lastRowFacturacion = nuevaFila;
  });

  console.log(`✅ Datos de Bingo procesados e insertados en la hoja 'Facturación'. Total de filas insertadas: ${filteredBingoData.length}`);

  // Eliminar filas residuales por debajo de la última fila ocupada
  const totalRows = worksheet.rowCount;
  for (let rowIndex = lastRowFacturacion + 1; rowIndex <= totalRows; rowIndex++) {
    const row = worksheet.getRow(rowIndex);
    row.values = []; // Eliminar contenido de la fila
    row.commit(); // Aplicar cambios
  }

  console.log(`✅ Filas residuales eliminadas al final de la hoja 'Facturación'.`);
}
module.exports = {
  processInventario,
  saveProcessedFile,
  generarResumenVentasPorLocalExcelJS,
  agregarResumenInventarioExcelJS,
  agregarHojaFacturacionExcelJS,
  processAnexoBingo,
  insertarDatosBingoEnFacturacion,
};
=======


// Exportamos las funciones
module.exports = {
  // processFacturacionSheet,
  processInventario,
  saveProcessedFile,  // Exportamos la función saveProcessedFile
  generarResumenVentasPorLocalExcelJS,
  agregarResumenInventarioExcelJS,
  agregarHojaFacturacionExcelJS
};

>>>>>>> b9d380a3d48620688e1c7c4f26974395eab07ee8
