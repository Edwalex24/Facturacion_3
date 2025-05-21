// Elementos del DOM
const empresaSelect = document.getElementById('empresa-select');
const nitDisplay = document.getElementById('nit-display');
const contratoSelect = document.getElementById('contrato-select');
const continuarBtn = document.getElementById('continuar-btn');

// Función para mostrar mensajes de estado
function showStatusMessage(message, type = 'info') {
    const statusDiv = document.getElementById('status-message');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;
        statusDiv.style.display = 'block';
        
        // Ocultar el mensaje después de 5 segundos
        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

// Verificar que todos los elementos del DOM existan
if (!empresaSelect || !nitDisplay || !contratoSelect || !continuarBtn) {
    console.error('Error: No se encontraron todos los elementos necesarios en el DOM');
    showStatusMessage('Error: Problema al cargar la página', 'error');
}

// Verificar que empresasData esté disponible
if (!empresasData || !empresasData.empresas) {
    console.error('Error: No se encontraron los datos de las empresas');
    showStatusMessage('Error cargando los datos de las empresas', 'error');
} else {
    console.log('Datos de empresas cargados:', empresasData.empresas.length, 'empresas encontradas');
    
    try {
        // Ordenar empresas alfabéticamente
        const empresasOrdenadas = [...empresasData.empresas].sort((a, b) => 
            a.nombre.localeCompare(b.nombre, 'es', {sensitivity: 'base'})
        );
        
        // Llenar el select con las empresas
        empresasOrdenadas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.nombre;
            option.textContent = empresa.nombre;
            empresaSelect.appendChild(option);
        });
        
        showStatusMessage('Empresas cargadas correctamente', 'success');
    } catch (error) {
        console.error('Error al cargar las empresas:', error);
        showStatusMessage('Error al cargar la lista de empresas', 'error');
    }
}

// Manejar cambio de empresa seleccionada
empresaSelect.addEventListener('change', function() {
    try {
        const empresaSeleccionada = empresasData.empresas.find(e => e.nombre === this.value);
        
        if (empresaSeleccionada) {
            console.log('Empresa seleccionada:', empresaSeleccionada);
            // Mostrar NIT
            nitDisplay.textContent = empresaSeleccionada.nit;
            
            // Habilitar y llenar el select de contratos
            contratoSelect.disabled = false;
            contratoSelect.innerHTML = '<option value="">Seleccione un contrato...</option>';
            
            // Ordenar contratos
            const contratosOrdenados = [...empresaSeleccionada.contratos].sort();
            
            // Agregar cada contrato como opción
            contratosOrdenados.forEach(contrato => {
                const option = document.createElement('option');
                option.value = contrato;
                option.textContent = contrato;
                contratoSelect.appendChild(option);
            });

            // Resetear el botón continuar
            continuarBtn.disabled = true;
            showStatusMessage(`Empresa "${empresaSeleccionada.nombre}" seleccionada`, 'info');
        } else {
            nitDisplay.textContent = '-';
            contratoSelect.innerHTML = '<option value="">Seleccione un contrato...</option>';
            contratoSelect.disabled = true;
            continuarBtn.disabled = true;
        }
    } catch (error) {
        console.error('Error al cambiar de empresa:', error);
        showStatusMessage('Error al seleccionar la empresa', 'error');
    }
});

// Manejar cambio de contrato seleccionado
contratoSelect.addEventListener('change', function() {
    continuarBtn.disabled = !this.value;
});

// Manejar click en botón continuar
continuarBtn.addEventListener('click', function() {
    const empresaSeleccionada = empresasData.empresas.find(e => e.nombre === empresaSelect.value);
    
    if (empresaSeleccionada) {
        // Guardar la selección en sessionStorage con la estructura correcta
        const seleccion = {
            nombre: empresaSeleccionada.nombre,
            nit: empresaSeleccionada.nit,
            contrato: contratoSelect.value
        };
        sessionStorage.setItem('empresaSeleccionada', JSON.stringify(seleccion));

        // Redirigir a la página principal
        window.location.href = 'index.html';
    }
}); 