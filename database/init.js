const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Usamos la misma instancia promisificada

const dbPath = path.resolve(__dirname, 'ecommerce.db');

// ADMINISTRADOR POR DEFECTO
const ADMIN_USER = {
    nombre: "Administrador Principal",
    email: "admin@ecommercegmil.com",
    password: "admin123",
    nivel: "admin"
};

// LIBROS INICIALES (solo se insertan si la tabla está vacía)
const librosIniciales = [
    // ROMANCE
    { nombre: "En agosto nos vemos", autor: "Gabriel García Márquez", precio: 25.00, stock: 10, categoria: "Romance", imagen: "https://images.penguinrandomhouse.com/cover/9780593809618", codigo: "ROM01", desc: "Novela póstuma sobre el deseo femenino." },
    { nombre: "Baumgartner", autor: "Paul Auster", precio: 22.50, stock: 15, categoria: "Romance", imagen: "https://m.media-amazon.com/images/I/81lJgr7XNRL._AC_UF1000,1000_QL80_.jpg", codigo: "ROM02", desc: "El amor de toda una vida." },
    { nombre: "El chico de las musarañas", autor: "Aless Lequio", precio: 19.99, stock: 20, categoria: "Romance", imagen: "https://m.media-amazon.com/images/I/71wE-G7+VJL._AC_UF894,1000_QL80_.jpg", codigo: "ROM03", desc: "Amor familiar y juvenil." },
    // COMEDIA
    { nombre: "El problema de la paz", autor: "Arturo Pérez-Reverte", precio: 24.00, stock: 12, categoria: "Comedia", imagen: "https://imagessl9.casadellibro.com/a/l/t7/49/9788420476449.jpg", codigo: "COM01", desc: "Sátira y diálogos ácidos." },
    { nombre: "Maldito Hamor", autor: "Cruz de Yerba", precio: 18.50, stock: 18, categoria: "Comedia", imagen: "https://m.media-amazon.com/images/I/61k1T+X-CLL._AC_UF894,1000_QL80_.jpg", codigo: "COM02", desc: "Parodia divertida sobre redes sociales." },
    { nombre: "A ver qué pasa", autor: "Lucía Galán", precio: 16.00, stock: 25, categoria: "Comedia", imagen: "https://imagessl0.casadellibro.com/a/l/t7/90/9788408282790.jpg", codigo: "COM03", desc: "Humor cotidiano y optimismo." },
    // MISTERIO
    { nombre: "La ciudad y sus muros", autor: "Haruki Murakami", precio: 28.00, stock: 8, categoria: "Misterio", imagen: "https://imagessl1.casadellibro.com/a/l/t7/11/9788419803011.jpg", codigo: "MIS01", desc: "El misterio más vendido del 2024." },
    { nombre: "Las garras del águila", autor: "Karin Smirnoff", precio: 26.50, stock: 10, categoria: "Misterio", imagen: "https://imagessl6.casadellibro.com/a/l/t7/56/9788423363856.jpg", codigo: "MIS02", desc: "Continuación de la saga Millennium." },
    { nombre: "El abismo del olvido", autor: "Paco Roca", precio: 21.00, stock: 14, categoria: "Misterio", imagen: "https://imagessl6.casadellibro.com/a/l/t7/46/9788410023446.jpg", codigo: "MIS03", desc: "Misterio histórico magistral." },
    // FICCION
    { nombre: "La distancia que nos separa", autor: "Renato Cisneros", precio: 23.00, stock: 11, categoria: "Ficcion", imagen: "https://imagessl8.casadellibro.com/a/l/t7/28/9788408173428.jpg", codigo: "FIC01", desc: "Ficción sobre secretos familiares." },
    { nombre: "Tres enigmas", autor: "Eduardo Mendoza", precio: 20.00, stock: 16, categoria: "Ficcion", imagen: "https://imagessl5.casadellibro.com/a/l/t7/55/9788432243255.jpg", codigo: "FIC02", desc: "Detectives y calidad literaria." },
    { nombre: "Metamorfosis (Ed. 2024)", autor: "Franz Kafka", precio: 30.00, stock: 5, categoria: "Ficcion", imagen: "https://imagessl9.casadellibro.com/a/l/t7/59/9788411001859.jpg", codigo: "FIC03", desc: "Edición especial ilustrada de lujo." }
];

async function inicializarBaseDeDatos() {
    try {
        console.log('⏳ Verificando / creando tablas...');

        // 1. Activar claves foráneas (importante para integridad)
        await db.runAsync('PRAGMA foreign_keys = ON');

        // 2. Tabla de usuarios
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                nivel TEXT DEFAULT 'cliente'
            )
        `);

        // 3. Tabla de productos (libros)
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                autor TEXT NOT NULL,
                codigo TEXT UNIQUE NOT NULL,
                precio REAL NOT NULL,
                stock INTEGER NOT NULL DEFAULT 0,
                categoria TEXT NOT NULL,
                imagen TEXT,
                descripcion TEXT
            )
        `);

        // 4. Tabla de carritos (activos)
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS carritos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                estado TEXT DEFAULT 'activo',
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        // 5. Tabla de items del carrito
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS carrito_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                carrito_id INTEGER NOT NULL,
                producto_id INTEGER NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 1,
                precio_unitario REAL NOT NULL,
                FOREIGN KEY (carrito_id) REFERENCES carritos(id) ON DELETE CASCADE,
                FOREIGN KEY (producto_id) REFERENCES products(id) ON DELETE CASCADE
            )
        `);

        // 6. Tabla de órdenes (pedidos)
        await db.runAsync(`
            CREATE TABLE IF NOT EXISTS ordenes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER NOT NULL,
                total REAL NOT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('✅ Tablas verificadas/creadas correctamente.');

        // --- INSERTAR ADMIN SI NO EXISTE ---
        const adminExiste = await db.getAsync('SELECT id FROM users WHERE email = ?', [ADMIN_USER.email]);
        if (!adminExiste) {
            const salt = bcrypt.genSaltSync(10);
            const hash = bcrypt.hashSync(ADMIN_USER.password, salt);
            await db.runAsync(
                'INSERT INTO users (nombre, email, password, nivel) VALUES (?, ?, ?, ?)',
                [ADMIN_USER.nombre, ADMIN_USER.email, hash, ADMIN_USER.nivel]
            );
            console.log(`👤 Administrador creado: ${ADMIN_USER.email} / ${ADMIN_USER.password}`);
        } else {
            console.log('👤 Administrador ya existe, omitiendo creación.');
        }

        // --- INSERTAR LIBROS INICIALES SOLO SI LA TABLA ESTÁ VACÍA ---
        const totalProductos = await db.getAsync('SELECT COUNT(*) as count FROM products');
        if (totalProductos.count === 0) {
            for (const libro of librosIniciales) {
                await db.runAsync(
                    `INSERT INTO products (nombre, autor, codigo, precio, stock, categoria, imagen, descripcion)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [libro.nombre, libro.autor, libro.codigo, libro.precio, libro.stock, libro.categoria, libro.imagen, libro.desc]
                );
            }
            console.log(`📚 ${librosIniciales.length} libros insertados.`);
        } else {
            console.log(`📚 Ya hay ${totalProductos.count} productos en la base de datos, no se insertan los iniciales.`);
        }

        console.log('🎉 Base de datos lista.');
        return db;
    } catch (error) {
        console.error('❌ Error durante la inicialización de la base de datos:', error);
        throw error;
    }
}

module.exports = inicializarBaseDeDatos;