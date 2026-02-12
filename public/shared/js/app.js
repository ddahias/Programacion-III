// ============================================
//  ESTADO GLOBAL
// ============================================
const AppState = {
    usuario: null,
    token: null,
    productos: [],
    carrito: { items: [], total: 0 }
};

const API_URL = window.location.origin + '/api';

// ============================================
//  API FETCH (MANEJO DE TOKEN)
// ============================================
async function apiFetch(endpoint, options = {}) {
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (AppState.token) headers['Authorization'] = `Bearer ${AppState.token}`;

    try {
        const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

        if (response.status === 401) {
            const data = await response.json().catch(() => ({}));
            if (data.error && (
                data.error.includes('Token inválido') ||
                data.error.includes('expirado') ||
                data.error.includes('Token requerido')
            )) {
                sessionStorage.clear();
                AppState.token = null;
                AppState.usuario = null;
                if (!window.location.pathname.includes('login.html')) {
                    window.location.href = '../shared/login.html';
                }
                return null;
            }
        }
        return response;
    } catch (error) {
        console.error("❌ Error de conexión:", error);
        return null;
    }
}

// ============================================
//  AUTENTICACIÓN
// ============================================
function verificarAutenticacion() {
    const token = sessionStorage.getItem('token');
    const usuario = sessionStorage.getItem('usuario');
    if (token && usuario) {
        AppState.token = token;
        AppState.usuario = JSON.parse(usuario);
        actualizarHeader();
        return true;
    }
    return false;
}

function logout() {
    sessionStorage.clear();
    AppState.token = null;
    AppState.usuario = null;
    window.location.href = '../shared/login.html';
}

async function realizarLogin(idEmail, idPass) {
    const email = document.getElementById(idEmail).value;
    const password = document.getElementById(idPass).value;

    const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (response.ok) {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.user));
        if (data.user.nivel === 'admin') {
            window.location.href = '../admin/index.html';
        } else {
            window.location.href = '../cliente/index.html';
        }
    } else {
        Swal.fire('Error', data.error || 'Credenciales incorrectas', 'error');
    }
}

function configurarLogin() {
    const form = document.getElementById('loginForm');
    if (form) form.onsubmit = (e) => { e.preventDefault(); realizarLogin('loginEmail', 'loginPassword'); };
}

function configurarLoginAdmin() {
    const form = document.getElementById('loginAdminForm');
    if (form) form.onsubmit = (e) => { e.preventDefault(); realizarLogin('adminEmail', 'adminPass'); };
}

function configurarRegistro() {
    const form = document.getElementById('registerForm');
    if (form) form.onsubmit = async (e) => {
        e.preventDefault();
        const nombre = `${document.getElementById('regNombre').value} ${document.getElementById('regApellido').value}`;
        const email = document.getElementById('regEmail').value;
        const password = document.getElementById('regPassword').value;

        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, email, password })
        });
        if (response.ok) {
            Swal.fire('¡Éxito!', 'Cuenta creada correctamente', 'success');
            if (typeof mostrarRegistro === 'function') mostrarRegistro(false);
        } else {
            const data = await response.json();
            Swal.fire('Error', data.error, 'error');
        }
    };
}

// ============================================
//  PRODUCTOS (RENDERIZADO CON ESTILOS ELEGANTES)
// ============================================
async function cargarProductos() {
    const response = await apiFetch('/products');
    if (response && response.ok) {
        AppState.productos = await response.json();
        renderizarProductos();
    }
}

function renderizarProductos() {
    const esCliente = window.location.pathname.includes('cliente');
    if (esCliente) {
        renderizarProductosCliente();
    } else if (window.location.pathname.includes('admin')) {
        renderizarProductosAdmin();
    }
}

// 🎨 RENDERIZADO PARA CLIENTE (TARJETAS ELEGANTES)
function renderizarProductosCliente() {
    ['Romance', 'Comedia', 'Misterio', 'Ficcion'].forEach(cat => {
        const col = document.getElementById(`col-${cat}`);
        if (col) col.innerHTML = '';
    });

    AppState.productos.forEach(p => {
        const col = document.getElementById(`col-${p.categoria}`);
        if (col) {
            col.innerHTML += `
                <div class="book-card">
                    <img src="${p.imagen || 'https://via.placeholder.com/300x450?text=Sin+Portada'}" 
                         class="book-cover" 
                         alt="${p.nombre}"
                         loading="lazy"
                         width="300"
                         height="450">
                    <h4 class="book-title">${p.nombre}</h4>
                    <p class="book-author">${p.autor}</p>
                    <p class="book-desc">${p.descripcion || ''}</p>
                    <p class="book-price">$${p.precio.toFixed(2)}</p>
                    <small class="book-stock">Stock: ${p.stock}</small>
                    <button class="btn btn-primary btn-sm" onclick="agregarAlCarrito(${p.id})">
                        Añadir al carrito
                    </button>
                </div>
            `;
        }
    });
}

// 🎨 RENDERIZADO PARA ADMIN (OPTIMIZADO CON DIMENSIONES DE IMAGEN)
function renderizarProductosAdmin() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = AppState.productos.map(p => `
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

// ============================================
//  CARRITO (COMPLETO)
// ============================================
async function cargarCarrito() {
    if (!AppState.token) return;
    const response = await apiFetch('/cart');
    if (response && response.ok) {
        AppState.carrito = await response.json();
        actualizarCarritoUI();
    }
}

function actualizarCarritoUI() {
    const container = document.getElementById('cartItems');
    const totalElement = document.getElementById('cartTotal');
    if (!container || !totalElement) return;

    if (!AppState.carrito.items || AppState.carrito.items.length === 0) {
        container.innerHTML = '<p class="text-center" style="color: var(--color-text-light); padding: 1rem;">🛒 Carrito vacío</p>';
        totalElement.innerText = '0.00';
        return;
    }

    container.innerHTML = AppState.carrito.items.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <strong>${item.nombre}</strong>
                <span>$${item.precio_unitario.toFixed(2)}</span>
            </div>
            <div class="cart-item-details">
                <div class="qty-controls">
                    <button class="btn-qty" onclick="cambiarCantidadCarrito(${item.producto_id}, ${item.cantidad - 1})">-</button>
                    <span>${item.cantidad}</span>
                    <button class="btn-qty" onclick="cambiarCantidadCarrito(${item.producto_id}, ${item.cantidad + 1})"
                        ${item.cantidad >= 10 ? 'disabled' : ''}>+</button>
                </div>
                <span class="cart-item-subtotal">$${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
                <button class="delete-btn" onclick="eliminarDelCarrito(${item.id})" title="Eliminar">🗑️</button>
            </div>
        </div>
    `).join('');
    
    totalElement.innerText = AppState.carrito.total.toFixed(2);
}

async function agregarAlCarrito(productoId) {
    const itemExistente = AppState.carrito.items.find(item => item.producto_id === productoId);
    const cantidadActual = itemExistente ? itemExistente.cantidad : 0;
    if (cantidadActual >= 10) {
        Swal.fire('Límite alcanzado', 'No puedes agregar más de 10 unidades de este producto', 'warning');
        return;
    }

    const response = await apiFetch('/cart/agregar', {
        method: 'POST',
        body: JSON.stringify({ producto_id: productoId, cantidad: 1 })
    });

    if (response && response.ok) {
        AppState.carrito = await response.json();
        actualizarCarritoUI();
    }
}

async function cambiarCantidadCarrito(productoId, nuevaCantidad) {
    if (nuevaCantidad < 1) {
        eliminarDelCarritoPorProducto(productoId);
        return;
    }
    if (nuevaCantidad > 10) return;

    const item = AppState.carrito.items.find(i => i.producto_id === productoId);
    if (!item) return;

    const response = await apiFetch(`/cart/item/${item.id}`, {
        method: 'PUT',
        body: JSON.stringify({ cantidad: nuevaCantidad })
    });

    if (response && response.ok) {
        AppState.carrito = await response.json();
        actualizarCarritoUI();
    }
}

async function eliminarDelCarrito(itemId) {
    const response = await apiFetch(`/cart/item/${itemId}`, { method: 'DELETE' });
    if (response && response.ok) {
        AppState.carrito = await response.json();
        actualizarCarritoUI();
    }
}

async function eliminarDelCarritoPorProducto(productoId) {
    const item = AppState.carrito.items.find(i => i.producto_id === productoId);
    if (item) await eliminarDelCarrito(item.id);
}

async function vaciarCarrito() {
    if (!AppState.carrito.items.length) return;
    const confirm = await Swal.fire({
        title: '¿Vaciar carrito?',
        text: 'Esta acción eliminará todos los productos',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
    });
    if (!confirm.isConfirmed) return;

    const response = await apiFetch('/cart', { method: 'DELETE' });
    if (response && response.ok) {
        AppState.carrito = { items: [], total: 0 };
        actualizarCarritoUI();
        Swal.fire('¡Listo!', 'Carrito vaciado', 'success');
    }
}

// ============================================
//  CHECKOUT
// ============================================
async function finalizarPedido() {
    if (AppState.carrito.items.length === 0) {
        return Swal.fire('Carrito vacío', 'Agrega productos antes de comprar', 'warning');
    }

    const result = await Swal.fire({
        title: 'Confirmar compra',
        html: `
            <p>Total a pagar: <strong>$${AppState.carrito.total.toFixed(2)}</strong></p>
            <p>¿Estás seguro de realizar la compra?</p>
        `,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, comprar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        const response = await apiFetch('/orders/checkout', {
            method: 'POST',
            body: JSON.stringify({ total: AppState.carrito.total })
        });

        if (response && response.ok) {
            Swal.fire('¡Compra exitosa!', 'Disfruta tus libros 📚', 'success');
            AppState.carrito = { items: [], total: 0 };
            actualizarCarritoUI();
        }
    }
}

// ============================================
//  HEADER
// ============================================
function actualizarHeader() {
    const authSection = document.getElementById('authSection');
    if (AppState.usuario && authSection) {
        authSection.innerHTML = `<span>👤 ${AppState.usuario.nombre}</span> <button onclick="logout()" class="btn btn-sm btn-danger">Salir</button>`;
    }
}

// ============================================
//  INICIALIZACIÓN
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacion();
    if (!window.location.pathname.includes('login.html')) {
        cargarProductos();
        if (AppState.token) cargarCarrito();
    }
});

// EXPONER FUNCIONES GLOBALES
window.logout = logout;
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidadCarrito = cambiarCantidadCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.finalizarPedido = finalizarPedido;
// Placeholders para admin (se sobrescriben en admin.js)
window.cambiarStock = window.cambiarStock || function() {};
window.eliminarProducto = window.eliminarProducto || function() {};
window.abrirModalProducto = window.abrirModalProducto || function() {};
window.cerrarModalProducto = window.cerrarModalProducto || function() {};
window.filtrarPorCodigo = window.filtrarPorCodigo || function() {};