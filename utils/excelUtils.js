const xlsx = require('xlsx');

function unmergeCells(sheet, deleteTopNRows = 10) {
  if (sheet['!merges']) {
    //console.log("🔄 Descombinar celdas...");
    sheet['!merges'].forEach(range => {
      const startCell = xlsx.utils.encode_cell(range.s);
      const value = sheet[startCell]?.v || '';
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cell = xlsx.utils.encode_cell({ r: R, c: C });
          if (R === range.s.r && C === range.s.c) {
            sheet[cell] = { t: 's', v: value };
          } else {
            delete sheet[cell];
          }
        }
      }
    });
    delete sheet['!merges'];
  }

  //console.log(`🧹 Eliminando las primeras ${deleteTopNRows} filas...`);
  const originalRange = xlsx.utils.decode_range(sheet['!ref']);
  const tempSheet = {};
  const numCols = originalRange.e.c - originalRange.s.c + 1;

  for (let R = deleteTopNRows; R <= originalRange.e.r; ++R) {
    for (let C = 0; C < numCols; ++C) {
      const oldCell = xlsx.utils.encode_cell({ r: R, c: C });
      const newCell = xlsx.utils.encode_cell({ r: R - deleteTopNRows, c: C });
      if (sheet[oldCell]) {
        tempSheet[newCell] = sheet[oldCell];
      }
    }
  }

  const newRange = {
    s: { r: 0, c: 0 },
    e: { r: originalRange.e.r - deleteTopNRows, c: originalRange.e.c }
  };

  const colHasData = {};
  for (let R = newRange.s.r; R <= newRange.e.r; ++R) {
    for (let C = 0; C <= newRange.e.c; ++C) {
      const cell = xlsx.utils.encode_cell({ r: R, c: C });
      if (tempSheet[cell] && tempSheet[cell].v !== '') {
        colHasData[C] = true;
      }
    }
  }

  //console.log("📊 Columnas con datos detectadas:", Object.keys(colHasData));

  const finalSheet = {};
  let newColIndex = 0;
  const colMap = {};

  for (let C = 0; C <= newRange.e.c; ++C) {
    if (colHasData[C]) {
      colMap[C] = newColIndex++;
    }
  }

  //console.log("🗺️ Mapeo de columnas:", colMap);

  for (let R = newRange.s.r; R <= newRange.e.r; ++R) {
    for (const [oldCStr, newC] of Object.entries(colMap)) {
      const oldC = parseInt(oldCStr);
      const oldCell = xlsx.utils.encode_cell({ r: R, c: oldC });
      const newCell = xlsx.utils.encode_cell({ r: R, c: newC });
      if (tempSheet[oldCell]) {
        finalSheet[newCell] = tempSheet[oldCell];
      }
    }
  }

  const currencyFormat = '"$"#,##0';
  const originalCurrencyCols = [7, 8, 10]; // H, I, K

  Object.entries(colMap).forEach(([origCStr, newC]) => {
    const origC = parseInt(origCStr);
    if (originalCurrencyCols.includes(origC)) {
      for (let R = 1; R <= newRange.e.r; ++R) {
        const cellRef = xlsx.utils.encode_cell({ r: R, c: newC });
        const cell = finalSheet[cellRef];
        if (cell && typeof cell.v === 'number') {
          cell.t = 'n';
          cell.z = currencyFormat;
        }
      }
      //console.log(`💰 Formato de moneda aplicado a columna ${newC} (original ${origC})`);
    }
  });

  // Concatenar columnas E (4) y M (12)
  const colE = colMap[4];
  const colM = colMap[12];
  const concatColIndex = newColIndex;

  finalSheet[xlsx.utils.encode_cell({ r: 0, c: concatColIndex })] = {
    t: 's',
    v: 'Locales concatenados Anexo'
  };

  if (colE !== undefined && colM !== undefined) {
    //console.log(`🔗 Concatenando columnas E (${colE}) y M (${colM}) en columna ${concatColIndex}...`);
    for (let R = 1; R <= newRange.e.r; ++R) {
      const estabCell = finalSheet[xlsx.utils.encode_cell({ r: R, c: colE })];
      const codCell = finalSheet[xlsx.utils.encode_cell({ r: R, c: colM })];

      const estab = estabCell?.v || '';
      const cod = codCell?.v || '';

      finalSheet[xlsx.utils.encode_cell({ r: R, c: concatColIndex })] = {
        t: 's',
        v: `${cod} ${estab}`.trim()
      };
    }
  } else {
    //console.warn("⚠️ No se puede concatenar: columna E o M no existe después del filtrado.");
  }

  const finalRange = {
    s: { r: newRange.s.r, c: 0 },
    e: { r: newRange.e.r, c: concatColIndex }
  };
  finalSheet['!ref'] = xlsx.utils.encode_range(finalRange);

  Object.keys(sheet).forEach(k => delete sheet[k]);
  Object.assign(sheet, finalSheet);

  //console.log("✅ Proceso de limpieza y formato finalizado.");
}

module.exports = {
  unmergeCells,
  //fillEmptyCellsWithNA,
};
