const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../database/db');

// 🔐 MISMA CLAVE QUE EN auth.js
const SECRET_KEY = 'mi_secreto_super_seguro';

router.post('/register', async (req, res) => {
    const { nombre, email, password } = req.body;
    try {
        const usuarioExistente = await db.getAsync('SELECT id FROM users WHERE email = ?', [email]);
        if (usuarioExistente) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(password, salt);
        await db.runAsync(
            'INSERT INTO users (nombre, email, password, nivel) VALUES (?, ?, ?, ?)',
            [nombre, email, hash, 'cliente']
        );
        res.json({ message: 'Usuario registrado exitosamente' });
    } catch (err) {
        console.error('❌ Error en registro:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db.getAsync('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        const passwordValida = bcrypt.compareSync(password, user.password);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales incorrectas' });
        }
        const token = jwt.sign(
            { id: user.id, email: user.email, nivel: user.nivel },
            SECRET_KEY,
            { expiresIn: '2h' }
        );
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                email: user.email,
                nivel: user.nivel
            }
        });
    } catch (err) {
        console.error('❌ Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;