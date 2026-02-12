const jwt = require('jsonwebtoken');

// 🔐 MISMA CLAVE QUE EN users.js
const SECRET_KEY = 'mi_secreto_super_seguro';

function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
        return res.status(403).json({ error: 'Token requerido' });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        req.usuario = {
            id: decoded.id,
            email: decoded.email,
            nivel: decoded.nivel
        };
        next();
    } catch (error) {
        console.error('❌ Error verificando token:', error.message);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
}

function esAdmin(req, res, next) {
    if (req.usuario && req.usuario.nivel === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Acceso denegado: se requieren permisos de administrador' });
    }
}

module.exports = { verificarToken, esAdmin };