const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const { empresasData } = require('../public/js/empresas');

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

/**
 * Carga y redimensiona el logo de una empresa
 * @param {PDFDocument} pdfDoc - Documento PDF
 * @param {string} empresaNombre - Nombre de la empresa
 * @returns {Promise<{image: PDFImage, dimensions: {width: number, height: number}} | null>}
 */
async function cargarLogo(pdfDoc, empresaNombre) {
  try {
    // Validación inicial del nombre de la empresa
    if (!empresaNombre || typeof empresaNombre !== 'string') {
      console.log(`[PDF] Nombre de empresa inválido: ${empresaNombre}`);
      return {
        isTextLogo: true,
        text: empresaNombre || 'Empresa',
        color: rgb(0.2, 0.4, 0.6)
      };
    }

    // Buscar la empresa en empresasData
    const empresa = empresasData.empresas.find(e => e.nombre === empresaNombre);
    if (!empresa) {
      console.log(`[PDF] No se encontró la empresa: ${empresaNombre}`);
      return {
        isTextLogo: true,
        text: empresaNombre,
        color: rgb(0.2, 0.4, 0.6)
      };
    }

    console.log(`[PDF] Procesando logo para empresa: ${empresaNombre}`);
    console.log(`[PDF] Logo definido: ${empresa.logo}`);

    // Solo intentar cargar el logo si la empresa tiene la propiedad logo definida
    if (empresa.logo) {
      try {
        const logoPath = path.join(__dirname, '../public/logos', empresa.logo);
        console.log(`[PDF] Intentando cargar logo desde: ${logoPath}`);
        
        if (fs.existsSync(logoPath)) {
          console.log(`[PDF] Archivo de logo encontrado`);
          const logoBytes = fs.readFileSync(logoPath);
          console.log(`[PDF] Logo leído correctamente, tamaño: ${logoBytes.length} bytes`);
          
          const logoImage = await pdfDoc.embedPng(logoBytes);
          console.log(`[PDF] Logo embebido en PDF, dimensiones originales: ${logoImage.width}x${logoImage.height}`);
          
          // Calcular dimensiones manteniendo la proporción
          const maxWidth = 200; // Ancho máximo del logo
          const maxHeight = 100; // Alto máximo del logo
          
          let width = logoImage.width;
          let height = logoImage.height;
          
          // Ajustar dimensiones si exceden los límites
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
          }
          
          console.log(`[PDF] Dimensiones finales del logo: ${width}x${height}`);
          
          return {
            isTextLogo: false,
            image: logoImage,
            dimensions: { width, height }
          };
        } else {
          console.log(`[PDF] Archivo de logo no encontrado en: ${logoPath}`);
        }
      } catch (error) {
        console.error(`[PDF ERROR] Error cargando logo de ${empresaNombre}:`, error);
      }
    } else {
      console.log(`[PDF] La empresa ${empresaNombre} no tiene logo definido`);
    }

    // Si no hay logo definido o hubo error al cargarlo, usar el nombre como logo
    console.log(`[PDF] Usando nombre de empresa como logo para: ${empresaNombre}`);
    return {
      isTextLogo: true,
      text: empresaNombre,
      color: rgb(0.2, 0.4, 0.6)
    };

  } catch (error) {
    console.error(`[PDF ERROR] Error cargando logo: ${error.message}`);
    return {
      isTextLogo: true,
      text: empresaNombre || 'Empresa',
      color: rgb(0.2, 0.4, 0.6)
    };
  }
}

async function generarPDFPorSala(sala, empresaInfo) {
  try {
    // Validación mejorada de datos
    if (!sala) {
      throw new Error('No se proporcionaron datos de la sala');
    }

    if (!sala.establecimiento) {
      throw new Error('La sala no tiene nombre de establecimiento');
    }

    if (!Array.isArray(sala.maquinas) || sala.maquinas.length === 0) {
      throw new Error(`La sala ${sala.establecimiento} no tiene máquinas registradas`);
    }

    if (!empresaInfo) {
      throw new Error('No se proporcionó información de la empresa');
    }

    const requiredEmpresaFields = ['nombre', 'nit', 'contrato'];
    const missingFields = requiredEmpresaFields.filter(field => !empresaInfo[field]);
    if (missingFields.length > 0) {
      throw new Error(`Faltan campos requeridos en la información de empresa: ${missingFields.join(', ')}`);
    }

    console.log(`[PDF] Iniciando generación para sala: ${sala.establecimiento}`);
    console.log(`[PDF] Empresa: ${empresaInfo.nombre}, Contrato: ${empresaInfo.contrato}`);
    console.log(`[PDF] Total máquinas a procesar: ${sala.maquinas.length}`);

    // Crear documento PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // Cargar el logo
    const logo = await cargarLogo(pdfDoc, empresaInfo.nombre);

    // ========= CONFIGURACIÓN DE DISEÑO =========
    const pageWidth = 612;
    const pageHeight = 792;
    const rowHeight = 28; // Altura adecuada para las filas
    const headerHeight = 120; // Aumentado para acomodar la información de la empresa
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
    const totalVentasNetas = Math.round(sala.maquinas.reduce((sum, m) => {
      // Asegurarse de que ventasNetas sea un número, si es null, undefined o NaN, usar 0
      const ventasNetas = Number(m.ventasNetas);
      return sum + (isNaN(ventasNetas) ? 0 : ventasNetas);
    }, 0));
    const impuesto12 = Math.round(totalVentasNetas * 0.12);
    const gastosAdministrativos = Math.round(impuesto12 * 0.01);
    const totalAPagar = Math.round(impuesto12 + gastosAdministrativos);

    // ========= FUNCIONES AUXILIARES =========
    const drawHeader = (isFirstPage = false) => {
      const page = pdfDoc.getPage(pdfDoc.getPageCount() - 1);
      
      if (isFirstPage) {
        // Configuración de márgenes y espaciado
        const startY = pageHeight - margin;
        const lineHeight = 20;
        let currentY = startY;

        // Calcular el ancho disponible para el texto
        const textAreaWidth = pageWidth - (2 * margin);
        const logoWidth = logo ? (logo.isTextLogo ? 500 : logo.dimensions.width) : 0;
        const textWidth = textAreaWidth - logoWidth - 20;

        // Dibujar el logo o texto alternativo
        if (logo) {
          if (logo.isTextLogo) {
            // Dibujar nombre de empresa como logo
            const fontSize = 24;
            const font = fontBold;
            const text = logo.text.toUpperCase();
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            
            // Dibujar un rectángulo de fondo
            page.drawRectangle({
              x: margin,
              y: currentY - 5,
              width: textWidth + 120,
              height: 60,
              color: rgb(0.95, 0.95, 0.95),
              borderColor: logo.color,
              borderWidth: 2,
              opacity: 1
            });

            // Dibujar el texto
            page.drawText(text, {
              x: margin + 30,
              y: currentY + 5,
              size: fontSize,
              font: font,
              color: logo.color
            });
          } else {
            // Dibujar imagen de logo normal
            page.drawImage(logo.image, {
              x: margin,
              y: currentY - logo.dimensions.height - 5,
              width: logo.dimensions.width * 1.5,
              height: logo.dimensions.height,
            });
          }
        }

        // Ajustar la posición Y inicial según si hay logo o no
        currentY = startY - (logo ? (logo.isTextLogo ? 70 : logo.dimensions.height + 10) : 20);
        
        // Contenedor para la información
        const infoBoxHeight = 120;
        const infoBoxY = currentY - infoBoxHeight;
        
        // Dibujar fondo para la información
        page.drawRectangle({
          x: margin,
          y: infoBoxY,
          width: textAreaWidth,
          height: infoBoxHeight,
          color: rgb(0.98, 0.98, 0.98),
          borderColor: rgb(0.8, 0.8, 0.8),
          borderWidth: 1
        });

        // Sección de Datos de la Empresa (izquierda)
        const leftX = margin + 20;
        let leftY = currentY - 20;

        drawTextWithShadow(page, 'DATOS DE LA EMPRESA', leftX, leftY, {
          size: 12,
          font: fontBold,
          color: primaryColor
        });
        leftY -= lineHeight;

        drawText(page, empresaInfo.nombre, leftX, leftY, {
          size: 11,
          font: fontBold,
          color: textColor
        });
        leftY -= lineHeight;

        drawText(page, `NIT: ${empresaInfo.nit}`, leftX, leftY, {
          size: 11,
          font: font,
          color: textColor
        });
        leftY -= lineHeight;

        drawText(page, `Contrato: ${empresaInfo.contrato}`, leftX, leftY, {
          size: 11,
          font: font,
          color: textColor
        });
        leftY -= lineHeight;

        const periodo = obtenerPeriodoFacturacion();
        drawText(page, `Período: ${periodo}`, leftX, leftY, {
          size: 11,
          font: font,
          color: textColor
        });

        // Sección de Datos de la Sala (derecha)
        const rightX = margin + (textAreaWidth / 2) + 20;
        let rightY = currentY - 20;

        drawTextWithShadow(page, 'DATOS DE LA SALA', rightX, rightY, {
          size: 12,
          font: fontBold,
          color: primaryColor
        });
        rightY -= lineHeight;

        drawText(page, `Establecimiento: ${sala.establecimiento}`, rightX, rightY, {
          size: 11,
          font: font,
          color: textColor
        });
        rightY -= lineHeight;

        if (sala.municipio) {
          drawText(page, `Municipio: ${sala.municipio}`, rightX, rightY, {
            size: 11,
            font: font,
            color: textColor
          });
          rightY -= lineHeight;
        }

        if (sala.departamento) {
          drawText(page, `Departamento: ${sala.departamento}`, rightX, rightY, {
            size: 11,
            font: font,
            color: textColor
          });
        }

        // Línea separadora final
        currentY = infoBoxY - lineHeight;
        page.drawLine({
          start: { x: margin, y: currentY },
          end: { x: pageWidth - margin, y: currentY },
          thickness: 1,
          color: rgb(0.8, 0.8, 0.8)
        });

        // Devolver la posición Y final del encabezado
        return currentY - 40;

      } else {
        // Para páginas adicionales, mostrar un encabezado más pequeño
        const nombreSala = `Sala: ${sala.establecimiento}`;
        const titleWidth = font.widthOfTextAtSize(nombreSala, 9);
        drawText(page, nombreSala, pageWidth - margin - titleWidth, pageHeight - margin, {
          size: 9,
          font: fontItalic,
          color: rgb(0.5, 0.5, 0.5)
        });
        return pageHeight - margin - 40; // Posición Y para páginas adicionales
      }
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
    
    // 1. Encabezado y obtener la posición Y para la tabla
    cursorY = drawHeader(true);
    
    // 2. Tabla - usando la posición Y devuelta por drawHeader
    drawTableHeaders();
    
    let lastRowY = cursorY; // Guardamos la posición Y de la última fila

    // 3. Filas de máquinas con diseño mejorado
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
        formatterCOP.format(Number(maquina.ventasNetas) || 0)
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
    });

    // 4. Dibujar totales al final
    drawTotals();
    
    // 5. Dibujar el pie de página en la última página
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
    console.error(`[PDF ERROR] Error generando PDF para sala ${sala?.establecimiento || 'desconocida'}:`);
    console.error(`[PDF ERROR] Detalles: ${error.message}`);
    console.error(`[PDF ERROR] Stack: ${error.stack}`);
    throw new Error(`Error generando PDF: ${error.message}`);
  }
}

/**
 * Sanitiza un string para usarlo como nombre de archivo
 * @param {string} str - String a sanitizar
 * @returns {string} - String sanitizado
 */
function sanitizeFileName(str) {
  try {
    if (!str || typeof str !== 'string') {
      console.warn(`sanitizeFileName: valor inválido recibido: ${typeof str}`);
      return 'sin_nombre';
    }

    return str.toString()
      .normalize('NFD') // Normalizar caracteres Unicode
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/\s+/g, '_') // Espacios a guiones bajos
      .replace(/[^a-zA-Z0-9_-]/g, '') // Solo permitir letras, números y algunos símbolos
      .replace(/_+/g, '_') // Evitar guiones bajos múltiples
      .replace(/^_+|_+$/g, '') // Remover guiones bajos al inicio y final
      .trim()
      .toLowerCase() // Convertir a minúsculas
      || 'sin_nombre'; // Si después de todo queda vacío, usar valor por defecto
  } catch (error) {
    console.error('Error en sanitizeFileName:', error);
    return 'sin_nombre';
  }
}

/**
 * Genera PDFs para todas las salas y las comprime en un archivo ZIP.
 * @param {Array} salas - Lista de salas.
 * @param {String} outputZipPath - Ruta donde se guardará el archivo ZIP.
 * @param {Object} empresaInfo - Información de la empresa.
 */
async function generarPDFsYSalaZIP(salas, outputZipPath, empresaInfo) {
  console.log('Iniciando generación de PDFs con empresaInfo:', JSON.stringify(empresaInfo, null, 2));

  // Validación mejorada de empresaInfo
  if (!empresaInfo || typeof empresaInfo !== 'object') {
    throw new Error('No se proporcionó la información de la empresa o el formato es inválido');
  }

  const camposRequeridos = ['nombre', 'nit', 'contrato'];
  const camposFaltantes = camposRequeridos.filter(campo => !empresaInfo[campo]);
  
  if (camposFaltantes.length > 0) {
    throw new Error(`Faltan campos requeridos en la información de empresa: ${camposFaltantes.join(', ')}`);
  }

  // Validar que el directorio de salida existe
  const outputDir = path.dirname(outputZipPath);
  if (!fs.existsSync(outputDir)) {
    console.log(`Creando directorio de salida: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

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

    // Validar que hay salas para procesar
    if (!Array.isArray(salas) || salas.length === 0) {
      throw new Error('No hay salas para procesar');
    }

    console.log(`Procesando ${salas.length} salas...`);

    // Procesar cada sala
    for (const sala of salas) {
      try {
        if (!sala || !sala.establecimiento) {
          console.error('Sala inválida o sin nombre de establecimiento');
          continue;
        }

        console.log(`Generando PDF para la sala: ${sala.establecimiento}`);
        
        // Generar el PDF pasando la información de la empresa
        const pdfBuffer = await generarPDFPorSala(sala, empresaInfo);

        // Validar que el PDF es un Buffer válido
        if (!Buffer.isBuffer(pdfBuffer)) {
          console.error(`El PDF generado para la sala ${sala.establecimiento} no es un Buffer válido.`);
          continue;
        }

        console.log(`Añadiendo PDF de ${sala.establecimiento} al ZIP...`);
        
        // Sanitizar nombres para el archivo PDF
        const empresaNombre = sanitizeFileName(empresaInfo.nombre || 'empresa');
        const establecimientoNombre = sanitizeFileName(sala.establecimiento || 'sala');
        const pdfName = `${empresaNombre}_${establecimientoNombre}.pdf`;
        
        zip.append(pdfBuffer, { name: pdfName });
      } catch (error) {
        console.error(`Error generando el PDF para la sala "${sala?.establecimiento || 'desconocida'}": ${error.message}`);
        console.error('Stack:', error.stack);
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

// Función para obtener el período de facturación
function obtenerPeriodoFacturacion() {
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const fecha = new Date();
  fecha.setMonth(fecha.getMonth() - 1);
  return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
}

// Función auxiliar para dibujar texto
function drawText(page, text, x, y, options) {
  page.drawText(text, {
    x,
    y,
    size: options.size,
    font: options.font,
    color: options.color
  });
}

module.exports = {
  generarPDFPorSala,
  generarPDFsYSalaZIP,
  calculateFontSize,
};