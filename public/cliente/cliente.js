// cliente.js - Versión corregida con nivel 'cliente'
document.addEventListener('DOMContentLoaded', () => {
    if (verificarAutenticacion()) {
        actualizarHeader();
        // ✅ El nivel en la base de datos es 'cliente', no 'usuario'
        if (AppState.usuario.nivel !== 'cliente') {
            window.location.href = '../shared/login.html';
            return;
        }
        // Los productos y carrito ya se cargan desde app.js
        if (AppState.carrito.items) actualizarCarritoUI();
    } else {
        window.location.href = '../shared/login.html';
    }
});

// Exponer funciones globales para los onclick del HTML
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidadCarrito = cambiarCantidadCarrito;
window.eliminarDelCarrito = eliminarDelCarrito;
window.vaciarCarrito = vaciarCarrito;
window.finalizarPedido = finalizarPedido;