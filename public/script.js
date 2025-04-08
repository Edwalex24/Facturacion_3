const inventarioFileInput = document.getElementById('inventarioFileInput');
const fileInputFacturacion = document.getElementById('fileInputFacturacion');
const bingoFileInputs = document.getElementById('bingoFileInputs');
const uploadInventarioButton = document.getElementById('uploadInventarioButton');
const uploadFinalButton = document.getElementById('uploadFinalButton');
const statusMessage = document.getElementById('statusMessage');
const facturacionFileInput = document.getElementById('facturacionFileInput');
const resetButton = document.getElementById('resetButton'); // Obtener referencia al botón de reinicio

function uploadInventario() {
    const fileInventario = inventarioFileInput.files[0];
    const formData = new FormData();
    formData.append('fileInventario', fileInventario);

    uploadInventarioButton.disabled = true;
    statusMessage.textContent = 'Procesando archivo de inventario, por favor espera...';

    fetch('/inventario', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        statusMessage.textContent = data.message;

        if (data.hasBingo) {
            bingoFileInputs.style.display = 'block';
            // Limpiar inputs anteriores
            while (bingoFileInputs.firstChild) {
                bingoFileInputs.removeChild(bingoFileInputs.firstChild);
            }

            const bingoInput = document.createElement('input');
            bingoInput.type = 'file';
            bingoInput.name = 'fileBingo';
            bingoInput.id = 'fileInputBingo';
            bingoFileInputs.appendChild(bingoInput);
        }
        
        facturacionFileInput.style.display = 'block';
        uploadFinalButton.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        statusMessage.textContent = 'Hubo un problema al procesar el archivo de inventario. Inténtalo de nuevo.';
    })
    .finally(() => {
        uploadInventarioButton.disabled = false;
    });
}

function uploadFinal() {
    const fileFacturacion = fileInputFacturacion.files[0];
    const formData = new FormData();
    formData.append('fileFacturacion', fileFacturacion);

    const bingoInput = document.getElementById('fileInputBingo');
    if (bingoInput && bingoInput.files.length > 0) {
        formData.append('fileBingo', bingoInput.files[0]);
    }

    uploadFinalButton.disabled = true;
    statusMessage.textContent = 'Procesando archivos, por favor espera...';

    fetch('/facturacion', {
        method: 'POST',
        body: formData,
    })
    .then(response => response.json())
    .then(data => {
        statusMessage.textContent = data.message;

        // Lógica para manejar el archivo procesado
        const buffer = Uint8Array.from(atob(data.file), c => c.charCodeAt(0));
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'Anexo_procesado.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);

        // Mostrar el botón de reinicio
        resetButton.style.display = 'block';
    })
    .catch(error => {
        console.error('Error:', error);
        statusMessage.textContent = 'Hubo un problema al procesar los archivos. Inténtalo de nuevo.';
    })
    .finally(() => {
        uploadFinalButton.disabled = false;
    });
}

function resetForm() {
    document.getElementById('uploadForm').reset();
    facturacionFileInput.style.display = 'none';
    bingoFileInputs.style.display = 'none';
    uploadFinalButton.style.display = 'none';
    statusMessage.textContent = '';
    resetButton.style.display = 'none';

    // Eliminar todos los inputs de bingo creados dinámicamente
    while (bingoFileInputs.firstChild) {
        bingoFileInputs.removeChild(bingoFileInputs.firstChild);
    }
}