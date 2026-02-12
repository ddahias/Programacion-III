const express = require('express');
const path = require('path');
const cors = require('cors');
const inicializarBaseDeDatos = require('./database/init');

const app = express();

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.redirect('/shared/login.html');
});

// Importar rutas
const usersRoutes = require('./src/routes/users');
const productsRoutes = require('./src/routes/products');
const cartRoutes = require('./src/routes/cart');
const ordersRoutes = require('./src/routes/orders');

app.use('/api/users', usersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', ordersRoutes);

app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
    });
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Ruta de API no encontrada' });
});

app.use((req, res) => {
    res.status(404).send('<h1>404 - Página no encontrada</h1><a href="/shared/login.html">Volver al Login</a>');
});

app.use((err, req, res, next) => {
    console.error('🔥 ERROR CRÍTICO:', err.stack);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: err.message
    });
});

async function iniciarServidor() {
    try {
        console.log('⏳ Inicializando base de datos...');
        await inicializarBaseDeDatos();
        
        app.listen(PORT, () => {
            console.log(`🏠 URL Local: http://localhost:${PORT}`);
            console.log(`📁 Base de datos lista en: database/ecommerce.db`);
            console.log('---------------------------------------------------');
        });
    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('👋 Servidor apagado. ¡Hasta pronto!');
    process.exit(0);
});

iniciarServidor();