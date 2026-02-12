// ============================================
//  ADMIN.JS – VERSIÓN OPTIMIZADA (SIN LAG)
// ============================================

let timeoutIdBusqueda;

document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
        if (AppState.usuario.nivel !== 'admin') {
            window.location.href = '../shared/login.html';
            return;
        }
        actualizarHeader();
        cargarProductos();
        
        // Agregar event listener con debounce para la búsqueda
        const inputBusqueda = document.getElementById('busquedaCodigo');
        if (inputBusqueda) {
            inputBusqueda.addEventListener('keyup', function(e) {
                clearTimeout(timeoutIdBusqueda);
                timeoutIdBusqueda = setTimeout(() => {
                    filtrarPorCodigo();
                }, 300); // Espera 300ms después de la última tecla
            });
        }
    } else {
        window.location.href = '../shared/login.html';
    }
});

// ============================================
//  MODAL
// ============================================
function abrirModalProducto() {
    const modal = document.getElementById('productoModal');
    if (modal) modal.style.display = 'flex';
}

function cerrarModalProducto() {
    const modal = document.getElementById('productoModal');
    if (modal) modal.style.display = 'none';
    const form = document.getElementById('productoForm');
    if (form) form.reset();
}

// ============================================
//  CRUD DE PRODUCTOS
// ============================================
async function guardarProducto(e) {
    e.preventDefault();

    const precio = parseFloat(document.getElementById('pPrecio').value);
    const stock = parseInt(document.getElementById('pStock').value);

    if (precio <= 0) return alert("El precio debe ser mayor a 0");

    const data = {
        nombre: document.getElementById('pNombre').value,
        autor: document.getElementById('pAutor').value,
        categoria: document.getElementById('pCategoria').value,
        imagen: document.getElementById('pImagen').value,
        codigo: document.getElementById('pCodigo').value,
        precio: precio,
        stock: isNaN(stock) ? 0 : stock,
        descripcion: document.getElementById('pDesc').value
    };

    try {
        const response = await apiFetch('/products', {
            method: 'POST',
            body: JSON.stringify(data)
        });

        if (response && response.ok) {
            Swal.fire('Guardado', 'Libro agregado correctamente', 'success');
            cerrarModalProducto();
            cargarProductos(); // Recarga la lista
        }
    } catch (error) {
        console.error("Error al guardar:", error);
        Swal.fire('Error', 'Error de conexión', 'error');
    }
}

async function eliminarProducto(id) {
    if (!confirm('¿Seguro que quieres eliminar este producto?')) return;
    try {
        const response = await apiFetch(`/products/${id}`, { method: 'DELETE' });
        if (response && response.ok) cargarProductos();
    } catch (error) { console.error(error); }
}

async function cambiarStock(id, stockActual) {
    const nuevoStock = prompt(`Stock actual: ${stockActual}. Nueva cantidad:`, stockActual);
    if (nuevoStock !== null && nuevoStock !== "") {
        await apiFetch(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify({ stock: parseInt(nuevoStock) })
        });
        cargarProductos();
    }
}

// ============================================
//  FILTRO DE BÚSQUEDA (OPTIMIZADO)
// ============================================
function filtrarPorCodigo() {
    const busqueda = document.getElementById('busquedaCodigo').value.toLowerCase();
    
    // Si la búsqueda está vacía, recargar todos los productos
    if (busqueda === '') {
        cargarProductos();
        return;
    }

    // Filtrar productos localmente (sin llamar a la API)
    const productosFiltrados = AppState.productos.filter(p => 
        p.codigo.toLowerCase().includes(busqueda) || 
        p.nombre.toLowerCase().includes(busqueda)
    );

    // Renderizar solo los filtrados
    const grid = document.getElementById('productsGrid');
    if (grid) {
        grid.innerHTML = productosFiltrados.map(p => `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${p.imagen || 'https://via.placeholder.com/300x200?text=Sin+Portada'}" 
                         alt="${p.nombre}" 
                         class="product-image"
                         loading="lazy"
                         width="300"
                         height="180">
                </div>
                <span class="product-category">${p.categoria}</span>
                <h3>${p.nombre}</h3>
                <p class="product-author">${p.autor}</p>
                <p class="product-price">$${p.precio.toFixed(2)}</p>
                <p class="product-stock">Stock: ${p.stock}</p>
                <p class="product-description">${p.descripcion || ''}</p>
                <span class="product-code">Código: ${p.codigo}</span>
                <div class="admin-actions">
                    <button class="btn-edit" onclick="cambiarStock(${p.id}, ${p.stock})">✏️ Editar Stock</button>
                    <button class="btn-delete" onclick="eliminarProducto(${p.id})">🗑️ Eliminar</button>
                </div>
            </div>
        `).join('');
    }
}

// Exponer funciones globales
window.abrirModalProducto = abrirModalProducto;
window.cerrarModalProducto = cerrarModalProducto;
window.guardarProducto = guardarProducto;
window.eliminarProducto = eliminarProducto;
window.cambiarStock = cambiarStock;
window.filtrarPorCodigo = filtrarPorCodigo; // Aún se puede llamar manualmente si es necesario