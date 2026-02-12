const express = require('express');
const router = express.Router();
const db = require('../../database/db'); // 👈 Importación directa

// OBTENER TODOS LOS PRODUCTOS
router.get('/', async (req, res) => {
    try {
        const products = await db.allAsync('SELECT * FROM products');
        res.json(products);
    } catch (err) {
        console.error('❌ Error al obtener productos:', err);
        res.status(500).json({ error: 'Error al obtener productos' });
    }
});

// CREAR PRODUCTO (actualizado para libros)
router.post('/', async (req, res) => {
    const { nombre, autor, codigo, precio, stock, categoria, imagen, descripcion } = req.body;
    const imgFinal = imagen || 'https://via.placeholder.com/300x450?text=Sin+Portada';

    try {
        await db.runAsync(
            `INSERT INTO products (nombre, autor, codigo, precio, stock, categoria, imagen, descripcion)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre, autor, codigo, precio, stock, categoria, imgFinal, descripcion]
        );
        res.json({ message: 'Libro creado correctamente' });
    } catch (err) {
        console.error('❌ Error al crear producto:', err);
        res.status(500).json({ error: 'Error al guardar el libro' });
    }
});

// EDITAR STOCK (solo stock por ahora)
router.put('/:id', async (req, res) => {
    const { stock } = req.body;
    try {
        await db.runAsync('UPDATE products SET stock = ? WHERE id = ?', [stock, req.params.id]);
        res.json({ message: 'Stock actualizado' });
    } catch (err) {
        console.error('❌ Error al actualizar stock:', err);
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

// ELIMINAR PRODUCTO
router.delete('/:id', async (req, res) => {
    try {
        await db.runAsync('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Libro eliminado' });
    } catch (err) {
        console.error('❌ Error al eliminar:', err);
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

module.exports = router;