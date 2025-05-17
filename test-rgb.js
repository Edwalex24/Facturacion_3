const fs = require('fs');
const path = require('path');
const { PDFDocument, rgb } = require('pdf-lib'); // Importar rgb para definir colores

exports.generarFacturaPDF = async (req, res) => {
  try {
    // Ruta a la plantilla PDF
    const templatePath = path.resolve(__dirname, '../templates/template.pdf');

    // Leer la plantilla PDF
    const templateBytes = fs.readFileSync(templatePath);

    // Cargar el documento PDF con pdf-lib
    const pdfDoc = await PDFDocument.load(templateBytes);

    // Obtener la primera página de la plantilla
    const page = pdfDoc.getPages()[0];

    // Obtener dimensiones de la página
    const { width, height } = page.getSize();

    // Agregar texto dinámico utilizando rgb
    page.drawText('Factura #12345', {
      x: 50,
      y: height - 100,
      size: 14,
      color: rgb(0, 0, 0), // Negro
    });

    page.drawText('Cliente: Juan Pérez', {
      x: 50,
      y: height - 130,
      size: 12,
      color: rgb(0, 0, 0), // Negro
    });

    page.drawText('Producto A: 10 unidades - $100', {
      x: 50,
      y: height - 160,
      size: 12,
      color: rgb(0, 0, 0), // Negro
    });

    page.drawText('Producto B: 5 unidades - $50', {
      x: 50,
      y: height - 180,
      size: 12,
      color: rgb(0, 0, 0), // Negro
    });

    page.drawText('Total: $150', {
      x: 50,
      y: height - 220,
      size: 12,
      color: rgb(0, 0, 0), // Negro
    });

    // Guardar el PDF modificado
    const pdfBytes = await pdfDoc.save();

    // Configurar encabezados HTTP y enviar el PDF al navegador
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="factura.pdf"');
    res.end(pdfBytes);
  } catch (error) {
    console.error('Error generando el PDF:', error);
    res.status(500).send('Error interno generando el PDF.');
  }
};