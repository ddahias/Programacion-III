const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/auth');
const db = require('../../database/db'); // 👈 Ya incluye allAsync, runAsync

/**
 * 1. OBTENER HISTORIAL DE COMPRAS
 */
router.get('/history', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const ordenes = await db.allAsync(
            "SELECT id, total, fecha FROM ordenes WHERE usuario_id = ? ORDER BY fecha DESC",
            [usuarioId]
        );
        res.json(ordenes);
    } catch (error) {
        console.error('❌ Error al obtener historial:', error);
        res.status(500).json({ error: 'No se pudo cargar el historial de compras' });
    }
});

/**
 * 2. GUARDAR ORDEN TRAS PAGO (CHECKOUT)
 */
router.post('/checkout', verificarToken, async (req, res) => {
    try {
        const usuarioId = req.usuario.id;
        const { total } = req.body;

        if (!total || total <= 0) {
            return res.status(400).json({ error: 'El total de la orden no es válido' });
        }

        // Insertar la nueva orden
        const resultado = await db.runAsync(
            "INSERT INTO ordenes (usuario_id, total) VALUES (?, ?)",
            [usuarioId, total]
        );

        // Vaciar el carrito del usuario
        await db.runAsync(
            "DELETE FROM carrito_items WHERE carrito_id = (SELECT id FROM carritos WHERE usuario_id = ?)",
            [usuarioId]
        );

        res.status(201).json({
            message: "¡Orden guardada con éxito!",
            ordenId: resultado.id,
            total: total
        });
    } catch (error) {
        console.error('❌ Error al procesar checkout:', error);
        res.status(500).json({ error: 'Error interno al registrar la compra' });
    }
});

module.exports = router;