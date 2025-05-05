const ExcelJS = require('exceljs');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const { unmergeCells } = require('../utils/excelUtils');
const {
  generarResumenVentasPorLocalExcelJS,
  agregarResumenInventarioExcelJS,
  agregarHojaFacturacionExcelJS,
  processInventario,
  processAnexoBingo,
  insertarDatosBingoEnFacturacion
} = require('../services/excelProcessor');

exports.uploadFacturacion = async (req, res) => {
  try {
    // Verificar si el archivo de facturación está presente
    if (!req.files || !req.files.file) {
      return res.status(400).send('Por favor sube el archivo de facturación.');
    }

    console.log("📂 Archivo de facturación recibido:", req.files.file ? req.files.file.name : "Ninguno");

    const fileData = req.files.file.data;

    // Leer archivo original con xlsx y obtener la hoja "elementosConectadosDeclaracion"
    const originalWorkbook = xlsx.read(fileData, { type: 'buffer' });
    const originalSheet = originalWorkbook.Sheets["elementosConectadosDeclaracion"];
    if (!originalSheet) {
      console.warn('⚠️ La hoja "elementosConectadosDeclaracion" no fue encontrada en el archivo de facturación.');
      return res.status(400).send('La hoja "elementosConectadosDeclaracion" no fue encontrada.');
    }

    console.log("✅ Hoja 'elementosConectadosDeclaracion' encontrada en el archivo de facturación.");

    // Procesar archivo de inventario
    const inventarioFile = req.files.fileInventario;
    if (!inventarioFile) {
      console.warn('⚠️ No se recibió el archivo de inventario.');
      return res.status(400).send('No se recibió el archivo de inventario.');
    }
    console.log("📂 Archivo de inventario recibido:", inventarioFile ? inventarioFile.name : "Ninguno");

    const inventarioData = processInventario(inventarioFile.data);
    if (!inventarioData || inventarioData.length === 0) {
      console.warn("⚠️ El archivo de inventario no contiene datos válidos.");
      return res.status(400).send("El archivo de inventario no contiene datos válidos.");
    }
    console.log(`✅ Datos del archivo de inventario procesados: ${inventarioData.length} filas procesadas.`);

    // Procesar datos de facturación
    unmergeCells(originalSheet);
    let processedData1 = xlsx.utils.sheet_to_json(originalSheet);
    console.log("✅ Datos del archivo de facturación procesados:", processedData1.length, "filas procesadas.");

    processedData1 = processedData1.map(row => {
      delete row["Locales concatenados Anexo"];
      row["Locales concatenados Anexo"] = `${row["Codigo de establecimiento"] || ''} ${row["Establecimiento"] || ''}`.trim();

      // Llenar las columnas vacías con 'N/A'
      Object.keys(row).forEach(key => {
        if (!row[key]) {
          row[key] = "N/A";
        }
      });

      return row;
    });

    const workbook = new ExcelJS.Workbook();

    let bingoBuffers = null;
    let bingoData = [];
    if (req.files.fileBingo) {
      const file = req.files.fileBingo;
      const ext = path.extname(file.name).toLowerCase();

      if (['.xlsx', '.xls'].includes(ext)) {
        bingoBuffers = file.data;
        console.log("📂 Archivo de bingo recibido:", file.name);

        // Procesar datos del anexo bingo
        bingoData = processAnexoBingo(bingoBuffers);
        console.log(`✅ Datos del anexo bingo procesados: ${bingoData.length} filas procesadas.`);
      } else {
        console.warn(`⚠️ Archivo de bingo ignorado por extensión no válida: ${file.name}`);
        return res.status(400).send("El archivo de bingo debe ser en formato Excel (.xlsx o .xls).");
      }
    } else {
      console.log("📂 No se recibió ningún archivo de bingo.");
    }

    // Agregar hoja principal de facturación
    console.log("➕ Agregando hoja de facturación al workbook...");
    if (!processedData1 || processedData1.length === 0) {
      console.error("❌ Error: processedData1 está vacío o no es válido.");
      return res.status(400).send("Los datos procesados de facturación no son válidos.");
    }
    agregarHojaFacturacionExcelJS(workbook, processedData1, [bingoBuffers]);

    // Insertar los datos del bingo en la hoja de facturación
    const facturacionSheet = workbook.getWorksheet('Facturación');
    if (facturacionSheet && bingoData.length > 0) {
      insertarDatosBingoEnFacturacion(facturacionSheet, bingoData);
      console.log("✅ Datos de bingo agregados a la hoja 'Facturación'.");
    }

    console.log("✅ Hoja de facturación agregada exitosamente.");

    // Generar hoja de resumen de ventas por local
    console.log("➕ Generando resumen de ventas por local...");
    await generarResumenVentasPorLocalExcelJS(workbook);
    console.log("✅ Resumen de ventas generado exitosamente.");

    // Agregar resumen de inventario a hoja de resumen
    const resumenSheet = workbook.getWorksheet('ResumenVentasPorLocal');
    if (!resumenSheet) {
      console.error('❌ No se encontró la hoja "ResumenVentasPorLocal".');
      return res.status(500).send('No se encontró la hoja "ResumenVentasPorLocal".');
    }
    console.log("➕ Agregando resumen de inventario...");
    agregarResumenInventarioExcelJS(resumenSheet, inventarioData);
    console.log("✅ Resumen de inventario agregado exitosamente.");

    // Enviar archivo final como descarga
    const buffer = await workbook.xlsx.writeBuffer();
    console.log("📄 Buffer del archivo generado exitosamente. Enviando al cliente...");
    res.setHeader('Content-Disposition', 'attachment; filename=Anexo_procesado.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);

  } catch (error) {
    console.error('❌ Error procesando el archivo de facturación:', error);
    res.status(500).send('Error interno al procesar el archivo.');
  }
};