const inventarioFileInput = document.getElementById('inventarioFileInput');
const facturacionFileInput = document.getElementById('facturacionFileInput');
const bingoFileInputs = document.getElementById('bingoFileInputs');
const uploadInventarioButton = document.getElementById('uploadInventarioButton');
const uploadFinalButton = document.getElementById('uploadFinalButton');
const statusMessage = document.getElementById('statusMessage');
const resetButton = document.getElementById('resetButton');

// NUEVOS ELEMENTOS: pistas de ayuda
const facturacionHint = document.getElementById('facturacionHint');
const bingoHint = document.getElementById('bingoHint');

// Función para manejar la carga del archivo de inventario
let hasBingo = false; // Variable global para almacenar si el contrato tiene bingos

function uploadInventario() {
  const inventarioFile = document.getElementById('inventarioFileInput').files[0];
  const mensajeDiv = document.getElementById('statusMessage');
  const facturacionFileInput = document.getElementById('facturacionFileInput');
  const bingoFileInputs = document.getElementById('bingoFileInputs');

  // Validar que se haya seleccionado un archivo
  if (!inventarioFile) {
    mensajeDiv.textContent = 'Por favor selecciona un archivo de inventario.';
    mensajeDiv.style.color = 'red';
    return;
  }

  const formData = new FormData();
  formData.append('fileInventario', inventarioFile);

  fetch('/inventario/upload', {
    method: 'POST',
    body: formData,
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText);
      }
      return res.json();
    })
    .then((data) => {
      // Mostrar el mensaje del servidor
      mensajeDiv.textContent = data.message;
      mensajeDiv.style.color = 'green';

      // Almacenar si hay bingos en la variable global
      hasBingo = data.hasBingo;

      // Habilitar los campos según la respuesta
      bingoFileInputs.style.display = hasBingo ? 'block' : 'none'; // Mostrar solo si hay bingos
      facturacionFileInput.style.display = 'block';
      document.getElementById('uploadFinalButton').style.display = 'inline-block';
    })
    .catch((err) => {
      mensajeDiv.textContent = `Error: ${err.message}`;
      mensajeDiv.style.color = 'red';

      // Ocultar los campos si hay un error
      facturacionFileInput.style.display = 'none';
      bingoFileInputs.style.display = 'none';
      document.getElementById('uploadFinalButton').style.display = 'none';
    });
}

document.getElementById('facturacionFile').addEventListener('change', function () {
  const facturacionFile = document.getElementById('facturacionFile').files[0];
  const bingoFileInputs = document.getElementById('bingoFileInputs');

  // Solo mostrar el campo de bingo si el contrato tiene bingos
  if (hasBingo && facturacionFile) {
    bingoFileInputs.style.display = 'block';
  } else {
    bingoFileInputs.style.display = 'none';
  }
});// Función para manejar la carga final y validación de archivos
function uploadFinal() {
  const inventarioFile = document.getElementById('inventarioFileInput').files[0];
  const facturacionFile = document.getElementById('facturacionFile').files[0];
  const bingoFile = document.getElementById('fileInputBingo').files[0];

  if (!facturacionFile) {
    showStatusMessage('Por favor, carga el archivo de facturación.');
    return;
  }

  // Validación para el archivo de bingo
  if (bingoFile) {
    const allowedExtensions = ['.xlsx', '.xls'];
    const fileExtension = bingoFile.name.slice(bingoFile.name.lastIndexOf('.')).toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      showStatusMessage('El archivo de bingo debe ser en formato .xlsx o .xls.');
      return;
    }
  }

  // Preparar los datos para enviar al servidor
  const formData = new FormData();
  formData.append('fileInventario', inventarioFile);
  formData.append('file', facturacionFile);
  if (bingoFile) {
    formData.append('fileBingo', bingoFile);
  }

  // Enviar los archivos al servidor usando fetch
  fetch('/facturacion/uploadFacturacion', {
    method: 'POST',
    body: formData
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }
      // Convertir la respuesta en un blob (archivo descargable)
      return response.blob();
    })
    .then(blob => {
      // Crear un enlace temporal para descargar el archivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'Anexo_procesado.xlsx'; // Nombre del archivo a descargar
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showStatusMessage('✅ Archivo descargado con éxito.', 'success');

      // Preguntar al usuario si desea generar los PDFs
      askForPDFGeneration();
    })
    .catch(error => {
      console.error('Error al procesar la solicitud:', error);
      showStatusMessage('Hubo un error al cargar los archivos. Intenta nuevamente.', 'error');
    });
}

// NUEVA FUNCIÓN: Preguntar al usuario si desea generar PDFs
function askForPDFGeneration() {
  const userResponse = confirm('¿Deseas también generar los PDFs de este procesamiento?');
  
  if (userResponse) {
    generatePDFs();
  } else {
    showStatusMessage('Decidiste no generar los PDFs.', 'info');
  }
}
function generatePDFs() {
  try {
    // Obtener la información de la empresa del sessionStorage
    const empresaSeleccionada = sessionStorage.getItem('empresaSeleccionada');
    console.log('Datos en sessionStorage:', empresaSeleccionada);
    
    if (!empresaSeleccionada) {
      showStatusMessage('No se encontró la información de la empresa en sessionStorage. Por favor, selecciona una empresa primero.', 'error');
      return;
    }

    const empresaData = JSON.parse(empresaSeleccionada);
    console.log('Datos de empresa parseados:', empresaData);
    
    if (!empresaData || !empresaData.nombre || !empresaData.nit || !empresaData.contrato) {
      showStatusMessage('La información de la empresa está incompleta. Asegúrate de seleccionar una empresa válida.', 'error');
      return;
    }

    // Transformar la estructura de datos para que coincida con lo esperado en el backend
    const empresaInfo = {
      nombre: empresaData.nombre,
      nit: empresaData.nit,
      contrato: empresaData.contrato
    };

    console.log('Enviando datos al servidor:', empresaInfo);

    // Mostrar mensaje de progreso
    showStatusMessage('Generando PDFs, por favor espere...', 'info');
    
    // Deshabilitar botones durante la generación
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = true);

    fetch('/api/pdf/generarInformesZIP', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        empresaInfo: empresaInfo
      })
    })
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error del servidor: ${errorText}`);
      }
      return response.blob();
    })
    .then(blob => {
      // Habilitar botones
      buttons.forEach(button => button.disabled = false);
      
      // Crear URL del blob y descargar
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informes_${empresaInfo.nombre.replace(/\s+/g, '_')}_${empresaInfo.contrato}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showStatusMessage('✅ PDFs generados y descargados con éxito.', 'success');
    })
    .catch(error => {
      console.error('Error al generar PDFs:', error);
      buttons.forEach(button => button.disabled = false);
      showStatusMessage(`Error al generar PDFs: ${error.message}`, 'error');
    });
  } catch (error) {
    console.error('Error en generatePDFs:', error);
    showStatusMessage(`Error inesperado: ${error.message}`, 'error');
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => button.disabled = false);
  }
}

// Función mejorada para mostrar mensajes de estado
function showStatusMessage(message, type = 'info') {
  const statusDiv = document.getElementById('statusMessage') || createStatusMessageDiv();
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  statusDiv.style.display = 'block';
}

// Crear div para mensajes si no existe
function createStatusMessageDiv() {
  const div = document.createElement('div');
  div.id = 'statusMessage';
  div.className = 'status-message';
  document.body.appendChild(div);
  return div;
}

// Función para reiniciar el formulario
function resetForm() {
  document.getElementById('uploadForm').reset();
  document.getElementById('facturacionFileInput').style.display = 'none';
  document.getElementById('bingoFileInputs').style.display = 'none';
  document.getElementById('uploadFinalButton').style.display = 'none';
  document.getElementById('statusMessage').textContent = '';
  document.getElementById('resetButton').style.display = 'none';
  showStatusMessage('');
}