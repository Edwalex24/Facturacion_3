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
});
// Función para manejar la carga final y validación de archivos
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
    })
    .catch(error => {
      console.error('Error al procesar la solicitud:', error);
      showStatusMessage('Hubo un error al cargar los archivos. Intenta nuevamente.', 'error');
    });
}
// Función para mostrar mensajes de estado (exitoso o de error)
function showStatusMessage(message, type = 'error') {
  const statusMessage = document.getElementById('statusMessage');
  statusMessage.textContent = message;
  statusMessage.style.color = type === 'success' ? 'green' : 'red';
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
