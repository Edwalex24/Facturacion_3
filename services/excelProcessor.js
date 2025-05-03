const path = require('path');
const fs = require('fs');
const os = require('os');
const xlsx = require('xlsx');
const { unmergeCells, fillEmptyCellsWithNA, removeEmptyColumns } = require('../utils/excelUtils');
const { encode_cell, decode_range, encode_range } = xlsx.utils;
const ExcelJS = require('exceljs');

// Función para guardar el archivo procesado en la carpeta de descargas
function saveProcessedFile(workbook, filename) {
  const outputPath = path.join(os.homedir(), 'Downloads', filename);  // Ruta para guardar en la carpeta de descargas
  xlsx.writeFile(workbook, outputPath);
  return outputPath;
}
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
      rowData[header] = row[header] || '';
    });
    const concatenado = `${row["Codigo de establecimiento"] || ''} ${row["Establecimiento"] || ''}`.trim();
    rowData["Locales concatenados Anexo"] = concatenado;

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

    if (!resumenMap[local]) {
      resumenMap[local] = 0;
    }
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
  const ocurrencias = {};
  for (const item of inventarioData) {
    const local = item['Locales Concatenados Inventario'];
    if (local) {
      ocurrencias[local] = (ocurrencias[local] || 0) + 1;
    }
  }

  // 2. Ordenar alfabéticamente
  const localesOrdenados = Object.entries(ocurrencias).sort((a, b) => a[0].localeCompare(b[0]));

  // 3. Determinar la columna siguiente libre
  const existingCols = worksheet.columnCount;
  const startCol = existingCols + 1;

  // 4. Agregar encabezados con estilo
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
  });

  headerRow.commit();

  // 5. Insertar datos
  let rowIndex = 2;
  for (const [local, cantidad] of localesOrdenados) {
    const row = worksheet.getRow(rowIndex);
    row.getCell(startCol).value = local;
    row.getCell(startCol + 1).value = cantidad;
    row.commit();
    rowIndex++;
  }

  // 6. Total al final
  const totalRow = worksheet.getRow(rowIndex);
  totalRow.getCell(startCol).value = 'Total Inventario';
  totalRow.getCell(startCol + 1).value = localesOrdenados.reduce((sum, [, cantidad]) => sum + cantidad, 0);
  //totalRow.font = { bold: true };
  totalRow.eachCell({ includeEmpty: false }, (cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4F81BD' } // Mismo azul del encabezado
    };
    cell.alignment = { horizontal: 'center' };
  });
  
  totalRow.commit();

  // 7. Ajustar ancho columnas
  worksheet.getColumn(startCol).width = 40;
  worksheet.getColumn(startCol + 1).width = 20;
}



// Exportamos las funciones
module.exports = {
  // processFacturacionSheet,
  processInventario,
  saveProcessedFile,  // Exportamos la función saveProcessedFile
  generarResumenVentasPorLocalExcelJS,
  agregarResumenInventarioExcelJS,
  agregarHojaFacturacionExcelJS
};

