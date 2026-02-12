const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const db = require('../../database/db');

// --- FUNCIONES AUXILIARES ---
async function obtenerCarritoUsuario(usuarioId) {
    let carrito = await db.getAsync(
        "SELECT * FROM carritos WHERE usuario_id = ? AND estado = 'activo'",
        [usuarioId]
    );

    if (!carrito) {
        const resultado = await db.runAsync('INSERT INTO carritos (usuario_id) VALUES (?)', [usuarioId]);
        carrito = { id: resultado.id, usuario_id: usuarioId, estado: 'activo' };
    }
    return carrito;
}

async function obtenerCarritoDetallado(carritoId) {
    const items = await db.allAsync(
        `SELECT ci.id, ci.producto_id, ci.cantidad, ci.precio_unitario, p.nombre,
                (ci.cantidad * ci.precio_unitario) as subtotal
         FROM carrito_items ci
         JOIN products p ON ci.producto_id = p.id
         WHERE ci.carrito_id = ?`,
        [carritoId]
    );
    const total = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
    return { items: items || [], total: total || 0 };
}

async function obtenerCarritoDetalladoPorUsuario(usuarioId) {
    const carrito = await obtenerCarritoUsuario(usuarioId);
    return await obtenerCarritoDetallado(carrito.id);
}

// --- RUTAS API ---
router.get('/', verificarToken, async (req, res) => {
    try {
        const carrito = await obtenerCarritoDetalladoPorUsuario(req.usuario.id);
        res.json(carrito);
    } catch (error) {
        console.error('❌ Error obteniendo carrito:', error);
        res.status(500).json({ error: 'Error interno' });
    }
});

router.post('/agregar', verificarToken, async (req, res) => {
    try {
        const { producto_id, cantidad } = req.body;
        const usuarioId = req.usuario.id;
        const limiteMaximo = 10;

        // Consulta a la tabla 'products' (CORREGIDO)
        const producto = await db.getAsync('SELECT precio FROM products WHERE id = ?', [producto_id]);
        if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

        const carrito = await obtenerCarritoUsuario(usuarioId);
        const itemExistente = await db.getAsync(
            'SELECT id, cantidad FROM carrito_items WHERE carrito_id = ? AND producto_id = ?',
            [carrito.id, producto_id]
        );

        const cantidadNueva = itemExistente ? (itemExistente.cantidad + parseInt(cantidad)) : parseInt(cantidad);

        if (cantidadNueva > limiteMaximo) {
            return res.status(400).json({ error: `Máximo ${limiteMaximo} unidades` });
        }

        if (itemExistente) {
            await db.runAsync('UPDATE carrito_items SET cantidad = ? WHERE id = ?', [cantidadNueva, itemExistente.id]);
        } else {
            await db.runAsync(
                'INSERT INTO carrito_items (carrito_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [carrito.id, producto_id, cantidad, producto.precio]
            );
        }

        const actualizado = await obtenerCarritoDetallado(carrito.id);
        res.json(actualizado);
    } catch (error) {
        console.error("❌ Error en agregar:", error);
        res.status(500).json({ error: 'Error al agregar' });
    }
});

router.put('/item/:item_id', verificarToken, async (req, res) => {
    try {
        const { cantidad } = req.body;
        if (cantidad > 10) return res.status(400).json({ error: 'Máximo 10' });

        const item = await db.getAsync(
            `SELECT ci.carrito_id 
             FROM carrito_items ci 
             JOIN carritos c ON ci.carrito_id = c.id 
             WHERE ci.id = ? AND c.usuario_id = ?`,
            [req.params.item_id, req.usuario.id]
        );

        if (!item) return res.status(404).json({ error: 'No encontrado' });

        if (cantidad <= 0) {
            await db.runAsync('DELETE FROM carrito_items WHERE id = ?', [req.params.item_id]);
        } else {
            await db.runAsync('UPDATE carrito_items SET cantidad = ? WHERE id = ?', [cantidad, req.params.item_id]);
        }

        const actualizado = await obtenerCarritoDetallado(item.carrito_id);
        res.json(actualizado);
    } catch (error) {
        console.error("❌ Error en PUT item:", error);
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

router.delete('/item/:item_id', verificarToken, async (req, res) => {
    try {
        const item = await db.getAsync(
            `SELECT ci.carrito_id 
             FROM carrito_items ci 
             JOIN carritos c ON ci.carrito_id = c.id 
             WHERE ci.id = ? AND c.usuario_id = ?`,
            [req.params.item_id, req.usuario.id]
        );
        if (!item) return res.status(404).json({ error: 'No encontrado' });

        await db.runAsync('DELETE FROM carrito_items WHERE id = ?', [req.params.item_id]);
        const actualizado = await obtenerCarritoDetallado(item.carrito_id);
        res.json(actualizado);
    } catch (error) {
        console.error("❌ Error en DELETE item:", error);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

router.delete('/', verificarToken, async (req, res) => {
    try {
        const carrito = await obtenerCarritoUsuario(req.usuario.id);
        await db.runAsync('DELETE FROM carrito_items WHERE carrito_id = ?', [carrito.id]);
        res.json({ items: [], total: 0 });
    } catch (error) {
        console.error("❌ Error al vaciar carrito:", error);
        res.status(500).json({ error: 'Error al vaciar' });
    }
});

module.exports = router;