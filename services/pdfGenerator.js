const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

/**
 * Calcula el tamaño de fuente necesario para que el texto quepa en un ancho máximo
 * @param {string} text - Texto a medir
 * @param {number} maxWidth - Ancho máximo disponible (en puntos)
 * @param {PDFFont} font - Fuente PDF-lib
 * @param {number} initialFontSize - Tamaño inicial de fuente
 * @returns {number} - Tamaño ajustado de fuente
 */
function calculateFontSize(text, maxWidth, font, initialFontSize) {
  let fontSize = initialFontSize;
  let textWidth = font.widthOfTextAtSize(text, fontSize);
  
  while (textWidth > maxWidth && fontSize > 6) { // Mínimo 6pt
    fontSize -= 0.5;
    textWidth = font.widthOfTextAtSize(text, fontSize);
  }
  
  return fontSize;
}

/**
 * Dibuja un texto centrado horizontalmente
 * @param {PDFPage} page - Página PDF
 * @param {string} text - Texto a dibujar
 * @param {number} y - Posición vertical
 * @param {number} size - Tamaño de fuente
 * @param {PDFFont} font - Fuente PDF-lib
 * @param {Object} color - Color RGB
 * @param {number} pageWidth - Ancho de la página
 */
function drawCenteredText(page, text, y, size, font, color, pageWidth) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: (pageWidth - textWidth) / 2,
    y,
    size,
    font,
    color
  });
}

/**
 * Dibuja un texto con sombra suave
 * @param {PDFPage} page - Página PDF
 * @param {string} text - Texto a dibujar
 * @param {number} x - Posición horizontal
 * @param {number} y - Posición vertical
 * @param {Object} options - Opciones de formato
 */
function drawTextWithShadow(page, text, x, y, options) {
  // Primero dibuja la sombra (ligeramente desplazada y en gris claro)
  page.drawText(text, {
    x: x + 1,
    y: y - 1,
    size: options.size,
    font: options.font,
    color: rgb(0.7, 0.7, 0.7),
    opacity: 0.5
  });
  
  // Luego dibuja el texto principal
  page.drawText(text, {
    x,
    y,
    size: options.size,
    font: options.font,
    color: options.color || rgb(0, 0, 0)
  });
}

/**
 * Dibuja un rectángulo con bordes redondeados (simulado)
 * @param {PDFPage} page - Página PDF
 * @param {number} x - Posición horizontal
 * @param {number} y - Posición vertical
 * @param {number} width - Ancho
 * @param {number} height - Alto
 * @param {Object} options - Opciones de formato
 */
function drawRoundedRect(page, x, y, width, height, options) {
  // Rectángulo principal
  page.drawRectangle({
    x,
    y,
    width,
    height,
    color: options.color || rgb(1, 1, 1),
    borderColor: options.borderColor,
    borderWidth: options.borderWidth,
    opacity: options.opacity || 1
  });
  
  // Simulación de esquinas redondeadas con pequeños círculos en las esquinas
  const radius = options.radius || 5;
  if (options.borderColor) {
    // Esquina superior izquierda
    page.drawCircle({
      x: x + radius,
      y: y + height - radius,
      size: radius,
      color: options.color || rgb(1, 1, 1),
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      opacity: options.opacity || 1
    });
    
    // Esquina superior derecha
    page.drawCircle({
      x: x + width - radius,
      y: y + height - radius,
      size: radius,
      color: options.color || rgb(1, 1, 1),
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      opacity: options.opacity || 1
    });
    
    // Esquina inferior izquierda
    page.drawCircle({
      x: x + radius,
      y: y + radius,
      size: radius,
      color: options.color || rgb(1, 1, 1),
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      opacity: options.opacity || 1
    });
    
    // Esquina inferior derecha
    page.drawCircle({
      x: x + width - radius,
      y: y + radius,
      size: radius,
      color: options.color || rgb(1, 1, 1),
      borderColor: options.borderColor,
      borderWidth: options.borderWidth,
      opacity: options.opacity || 1
    });
  }
}

async function generarPDFPorSala(sala) {
  try {
    // Validación de datos
    if (!sala || !sala.establecimiento || !sala.maquinas || sala.maquinas.length === 0) {
      throw new Error(`Datos inválidos para la sala: ${JSON.stringify(sala)}`);
    }

    console.log(`Generando PDF para la sala: ${sala.establecimiento}`);

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // ========= CONFIGURACIÓN DE DISEÑO =========
    const pageWidth = 612;
    const pageHeight = 792;
    const rowHeight = 28; // Altura adecuada para las filas
    const headerHeight = 90; // Encabezado más alto para acomodar los dos títulos
    const margin = 40; // Margen general para la página
    const totalsHeight = 140; // Altura del área de totales
    const footerHeight = 50; // Altura reservada para el pie de página
    const footerSpace = 80; // Espacio reservado para el pie de página incluyendo la línea separadora
    
    // Calculamos el espacio disponible para filas en cada tipo de página
    const maxRowsFirstPage = Math.floor((pageHeight - headerHeight - footerSpace) / rowHeight);
    const maxRowsOtherPages = Math.floor((pageHeight - margin - footerSpace) / rowHeight);
    
    // Colores corporativos
    const primaryColor = rgb(0.05, 0.25, 0.55); // Azul corporativo más elegante
    const secondaryColor = rgb(0.95, 0.95, 0.98); // Gris muy claro para fondos
    const accentColor = rgb(0.8, 0.2, 0.2); // Rojo para destacados y valores negativos
    const textColor = rgb(0.1, 0.1, 0.1); // Negro suave para texto principal
    
    // Configuración de columnas
    let colWidths = [130, 120, 160, 120]; // Serial, NUC, Marca, Ventas Netas
    let tableTotalWidth = colWidths.reduce((a, b) => a + b, 0);
    let leftMargin = (pageWidth - tableTotalWidth) / 2;

    // Autoajuste para tablas anchas
    if (leftMargin < margin) {
      const scaleFactor = (pageWidth - 2 * margin) / tableTotalWidth;
      colWidths = colWidths.map(width => Math.floor(width * scaleFactor));
      tableTotalWidth = colWidths.reduce((a, b) => a + b, 0);
      leftMargin = (pageWidth - tableTotalWidth) / 2;
    }

    // Formateador COP
    const formatterCOP = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    // Cálculo de totales
    const totalVentasNetas = Math.round(sala.maquinas.reduce((sum, m) => sum + m.ventasNetas, 0));
    const impuesto12 = Math.round(totalVentasNetas * 0.12);
    const gastosAdministrativos = Math.round(impuesto12 * 0.01);
    const totalAPagar = Math.round(impuesto12 + gastosAdministrativos);

    // ========= FUNCIONES AUXILIARES =========
    const drawHeader = (isFirstPage = false) => {
      if (isFirstPage) {
        // Fondo de encabezado con gradiente simulado
        currentPage.drawRectangle({
          x: 0, 
          y: pageHeight - headerHeight,
          width: pageWidth, 
          height: headerHeight,
          color: primaryColor
        });
        
        // Línea decorativa inferior
        currentPage.drawRectangle({
          x: 0, 
          y: pageHeight - headerHeight - 3,
          width: pageWidth, 
          height: 3,
          color: accentColor
        });
        
        // Título principal con sombra
        const title = `Informe de Ventas`;
        
        drawTextWithShadow(currentPage, title, (pageWidth - fontBold.widthOfTextAtSize(title, 18)) / 2, 
                           pageHeight - 55, {
          size: 18,
          font: fontBold,
          color: rgb(1, 1, 1)
        });
        
        // Subtítulo con el nombre de la sala
        const subtitle = `Sala: ${sala.establecimiento}`;
        drawCenteredText(currentPage, subtitle, pageHeight - headerHeight + 10, 14, fontBold, rgb(1, 1, 1), pageWidth);
        
        // Fecha de emisión - alineada a la derecha
        const today = new Date();
        const dateStr = `Fecha: ${today.toLocaleDateString('es-CO')}`;
        currentPage.drawText(dateStr, {
          x: pageWidth - margin - fontItalic.widthOfTextAtSize(dateStr, 11),
          y: pageHeight - headerHeight + 10,
          size: 11,
          font: font,
          color: rgb(1, 1, 1)
        });
      }
    };

    const drawSalaInfo = () => {
      let y = pageHeight - headerHeight - 20;
      
      // Contenedor para información de la sala - alineado con la tabla
      currentPage.drawRectangle({
        x: leftMargin,
        y: y - 65,
        width: tableTotalWidth,
        height: 75,
        color: secondaryColor,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.5,
        opacity: 0.8
      });
      
      // Información de la sala con mejor espaciado
      const labelX = leftMargin + 15; // Padding izquierdo para las etiquetas
      const valueX = labelX + 110; // Posición fija para los valores
      
      // Establecimiento
      currentPage.drawText(`Establecimiento:`, {
        x: labelX,
        y: y,
        size: 12,
        font: fontBold,
        color: primaryColor
      });
      
      currentPage.drawText(`${sala.establecimiento}`, {
        x: valueX,
        y: y,
        size: 12,
        font: font,
        color: textColor
      });
      
      y -= 20; // Más espacio entre líneas
      
      // Municipio
      if (sala.municipio) {
        currentPage.drawText(`Municipio:`, {
          x: labelX,
          y: y,
          size: 12,
          font: fontBold,
          color: primaryColor
        });
        
        currentPage.drawText(`${sala.municipio}`, {
          x: valueX,
          y: y,
          size: 12,
          font: font,
          color: textColor
        });
        y -= 20;
      }
      
      // Departamento
      if (sala.departamento) {
        currentPage.drawText(`Departamento:`, {
          x: labelX,
          y: y,
          size: 12,
          font: fontBold,
          color: primaryColor
        });
        
        currentPage.drawText(`${sala.departamento}`, {
          x: valueX,
          y: y,
          size: 12,
          font: font,
          color: textColor
        });
      }
      
      // Devolvemos la nueva posición Y para controlar dónde iniciar la tabla
      return y - 45; // Ajustado el espacio entre el cuadro de info y la tabla
    };

    const drawTableHeaders = () => {
      // Fondo de encabezados de tabla 
      currentPage.drawRectangle({
        x: leftMargin,
        y: cursorY,
        width: tableTotalWidth,
        height: rowHeight,
        color: primaryColor
      });

      // Línea decorativa inferior
      currentPage.drawRectangle({
        x: leftMargin,
        y: cursorY,
        width: tableTotalWidth,
        height: 1,
        color: rgb(0.7, 0.7, 0.7)
      });

      // Texto de encabezados en una sola línea como en el ejemplo
      const headers = ['Serial', 'NUC', 'Marca', 'Ventas Netas'];
      // Aseguramos que todos los textos estén en una sola línea
      let headerX = leftMargin + 10;
      headers.forEach((header, i) => {
        // Ajusta el espaciado entre encabezados según el ancho de columna
        currentPage.drawText(header, {
          x: leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10,
          y: cursorY + rowHeight/2 - 5,
          size: 11,
          font: fontBold,
          color: rgb(1, 1, 1)
        });
      });
      
      cursorY -= rowHeight;
    };

    const drawTotals = () => {
      const totalsHeight = 140;
      cursorY -= 40; // Más espacio antes de totales
      
      // Rectángulo principal para totales
      currentPage.drawRectangle({
        x: leftMargin,
        y: cursorY - totalsHeight,
        width: tableTotalWidth,
        height: totalsHeight,
        color: secondaryColor,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.75,
        opacity: 0.8
      });
      
      // Línea decorativa superior
      currentPage.drawRectangle({
        x: leftMargin + 10,
        y: cursorY - 25,
        width: tableTotalWidth - 20,
        height: 1,
        color: primaryColor
      });
      
      // Título de resumen
      const titleY = cursorY - 15;
      drawTextWithShadow(currentPage, 'RESUMEN DE TOTALES', leftMargin + 20, titleY, {
        size: 14,
        font: fontBold,
        color: primaryColor
      });
      
      // Función para dibujar líneas de totales con mejor alineación
      const drawTotalLine = (label, value, y, isHighlighted = false) => {
        // Label alineado a la izquierda
        currentPage.drawText(label, {
          x: leftMargin + 20,
          y,
          size: isHighlighted ? 13 : 12,
          font: isHighlighted ? fontBold : font,
          color: isHighlighted ? primaryColor : textColor
        });
        
        // Valor alineado a la derecha
        const valueText = value;
        const valueWidth = fontBold.widthOfTextAtSize(valueText, isHighlighted ? 13 : 12);
        
        currentPage.drawText(valueText, {
          x: leftMargin + tableTotalWidth - 20 - valueWidth,
          y,
          size: isHighlighted ? 13 : 12,
          font: fontBold,
          color: isHighlighted ? accentColor : primaryColor
        });
      };
      
      // Posicionamiento de los totales
      let yPos = cursorY - 50;
      
      // Datos de totales con mejor espaciado
      drawTotalLine('Total Ventas Netas:', formatterCOP.format(totalVentasNetas), yPos);
      yPos -= 25;
      drawTotalLine('Impuesto 12%:', formatterCOP.format(impuesto12), yPos);
      yPos -= 25;
      drawTotalLine('Gastos Administrativos:', formatterCOP.format(gastosAdministrativos), yPos);
      
      // Línea separadora para el total final
      yPos -= 15;
      currentPage.drawRectangle({
        x: leftMargin + 20,
        y: yPos,
        width: tableTotalWidth - 40,
        height: 1,
        color: rgb(0.7, 0.7, 0.7)
      });
      
      // Total final
      yPos -= 20;
      drawTotalLine('TOTAL A PAGAR:', formatterCOP.format(totalAPagar), yPos, true);
    };

    const drawAlternatingRows = (index) => {
      // Filas alternadas para mejor legibilidad
      if (index % 2 === 0) {
        currentPage.drawRectangle({
          x: leftMargin,
          y: cursorY,
          width: tableTotalWidth,
          height: rowHeight,
          color: rgb(0.95, 0.95, 0.98)
        });
      }
    };

    const drawFooter = (pageNum, totalPages) => {
      const footerText = `Página ${pageNum} de ${totalPages}`;
      const footerWidth = font.widthOfTextAtSize(footerText, 9);
      
      // Línea decorativa - ajustada para dar más espacio
      currentPage.drawRectangle({
        x: 40,
        y: footerSpace - 20,
        width: pageWidth - 80,
        height: 0.5,
        color: rgb(0.7, 0.7, 0.7)
      });
      
      // Texto del pie de página
      currentPage.drawText(footerText, {
        x: (pageWidth - footerWidth) / 2,
        y: footerSpace - 35,
        size: 9,
        font: font,
        color: rgb(0.5, 0.5, 0.5)
      });
    };

    // ========= GENERACIÓN DEL PDF =========
    let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    let cursorY;
    let pageCount = 1;
    
    // Determinar el número total de páginas
    const totalItems = sala.maquinas.length;
    const totalPages = Math.ceil(totalItems / maxRowsOtherPages) || 1;
    
    // 1. Encabezado
    drawHeader(true);
    
    // 2. Información de la sala y obtenemos la nueva posición Y
    cursorY = drawSalaInfo();
    
    // 3. Tabla - usando la posición Y actualizada
    drawTableHeaders();
    
    let lastRowY = cursorY; // Guardamos la posición Y de la última fila

    // 4. Filas de máquinas con diseño mejorado
    let currentRowInPage = 0;
    
    sala.maquinas.forEach((maquina, index) => {
      // Verificar si la siguiente fila se superpondría con el pie de página
      if (cursorY < footerSpace) {
        currentRowInPage = 0;
        drawFooter(pageCount, totalPages);
        pageCount++;
        currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
        cursorY = pageHeight - 30;
        drawTableHeaders();
      }

      // Dibujar la fila actual
      drawAlternatingRows(index);
      currentRowInPage++;
      
      const values = [
        maquina.serial || 'N/A',
        maquina.nuc || 'N/A',
        maquina.marca || 'N/A',
        formatterCOP.format(Math.round(maquina.ventasNetas || 0))
      ];
      
      values.forEach((value, i) => {
        const maxWidth = colWidths[i] - 15;
        const fontSize = calculateFontSize(value, maxWidth, font, 10);
        const textWidth = font.widthOfTextAtSize(value, fontSize);
        
        let xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10;
        
        if (i === 0 || i === 1) {
          xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + (colWidths[i] / 2) - (textWidth / 2);
        } else if (i === 2) {
          xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + 10;
        } else if (i === 3) {
          xPos = leftMargin + colWidths.slice(0, i).reduce((a, b) => a + b, 0) + colWidths[i] - textWidth - 10;
        }
        
        const isNegative = i === 3 && maquina.ventasNetas < 0;
        const valueColor = isNegative ? accentColor : textColor;
        
        currentPage.drawText(value, {
          x: xPos,
          y: cursorY + rowHeight/2 - 5,
          size: fontSize,
          font: i === 3 ? fontBold : font,
          color: valueColor
        });
      });
      
      cursorY -= rowHeight;

      // Si es la última máquina, verificar si hay espacio para los totales
      if (index === sala.maquinas.length - 1) {
        if (cursorY < (footerSpace + totalsHeight)) {
          drawFooter(pageCount, totalPages);
          pageCount++;
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          cursorY = pageHeight - 30;
        }
      }
    });

    // Dibujar totales
    drawTotals();
    
    // Dibujar el pie de página en la última página
    drawFooter(pageCount, totalPages);
    
    // Firma/Sello
    const footerY = footerSpace - 20;
    currentPage.drawText('Documento generado automáticamente', {
      x: leftMargin,
      y: footerY,
      size: 9,
      font: fontItalic,
      color: rgb(0.5, 0.5, 0.5)
    });

    // Guardar PDF
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);

  } catch (error) {
    console.error(`Error generando PDF: ${error.message}`);
    throw error;
  }
}

/**
 * Genera PDFs para todas las salas y las comprime en un archivo ZIP.
 * @param {Array} salas - Lista de salas.
 * @param {String} outputZipPath - Ruta donde se guardará el archivo ZIP.
 */
async function generarPDFsYSalaZIP(salas, outputZipPath) {
  const zip = archiver('zip', { zlib: { level: 9 } }); // Nivel de compresión alto
  const output = fs.createWriteStream(outputZipPath);

  return new Promise(async (resolve, reject) => {
    zip.on('error', (err) => {
      console.error('Error en Archiver:', err);
      reject(err);
    });

    output.on('close', () => {
      console.log('Archivo ZIP generado correctamente.');
      resolve();
    });

    zip.pipe(output);

    // Procesar cada sala
    for (const sala of salas) {
      try {
        console.log(`Generando PDF para la sala: ${sala.establecimiento}`);
        
        // Generar el PDF
        const pdfBuffer = await generarPDFPorSala(sala);

        // Validar que el PDF es un Buffer válido
        if (!Buffer.isBuffer(pdfBuffer)) {
          console.error(`El PDF generado para la sala ${sala.establecimiento} no es un Buffer válido.`);
          continue; // Saltar a la siguiente sala
        }

        console.log(`Añadiendo PDF de ${sala.establecimiento} al ZIP...`);
        zip.append(pdfBuffer, { name: `${sala.establecimiento.replace(/ /g, '_')}.pdf` });
      } catch (error) {
        console.error(`Error generando el PDF para la sala "${sala.establecimiento}": ${error.message}`);
        continue; // Saltar a la siguiente sala
      }
    }

    // Finalizar el archivo ZIP
    try {
      await zip.finalize();
    } catch (err) {
      console.error('Error al finalizar el archivo ZIP:', err);
      reject(err);
    }
  });
}

module.exports = {
  generarPDFPorSala,
  generarPDFsYSalaZIP,
  calculateFontSize,
};