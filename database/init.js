const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('./db'); // Usamos la misma instancia promisificada

const dbPath = path.resolve(__dirname, 'ecommerce.db');

// ADMINISTRADOR POR DEFECTO
const ADMIN_USER = {
    nombre: "Administrador Principal",
    email: "admin@ecommercegmail.com",
    password: "admin123",
    nivel: "admin"
};

// LIBROS INICIALES 
const librosIniciales = [
    // ROMANCE
    { nombre: "En agosto nos vemos", autor: "Gabriel García Márquez", precio: 25.00, stock: 10, categoria: "Romance", imagen: "https://circulocultural.com/wp-content/uploads/2024/03/EN-AGOSTO.jpg", codigo: "ROM01", desc: "Novela póstuma sobre el deseo femenino." },
    { nombre: "Baumgartner", autor: "Paul Auster", precio: 22.50, stock: 15, categoria: "Romance", imagen: "https://havela.me/wp-content/uploads/2024/04/img_9863.jpg?w=729", codigo: "ROM02", desc: "El amor de toda una vida." },
    { nombre: "Antes de Diciembre", autor: "Joana Marcus", precio: 19.99, stock: 20, categoria: "Romance", imagen: "https://i.pinimg.com/1200x/72/04/12/720412b9fe0fd47e50a22280cd47294f.jpg", codigo: "ROM03", desc: "Amor juvenil." },
    // COMEDIA
    { nombre: "La Guardaespalda", autor: "Katherine Center ", precio: 24.00, stock: 12, categoria: "Comedia", imagen: "https://www.penguinlibros.com/es/3064940-large_default/la-guardaespaldas.jpg", codigo: "COM01", desc: "Falsa relación, guardaespaldas protege actor a un famoso.." },
    { nombre: "Buenos Presagios", autor: "Terry Pratchett y Neil Gaiman", precio: 18.50, stock: 18, categoria: "Comedia", imagen: "https://images.cdn2.buscalibre.com/fit-in/360x360/af/bb/afbbb5749cc3e2b6eb097a1e7cb56b94.jpg", codigo: "COM02", desc: "el nacimiento del hijo de Satanás y la llegada del Fin de los Tiempos." },
    { nombre: "El Misterio del Tiempo", autor: "Kaliane Bradley", precio: 21.60, stock: 25, categoria: "Comedia", imagen: "https://i.pinimg.com/736x/58/32/8d/58328dab77cbb1178a37e112c76158d9.jpg", codigo: "COM03", desc: "Explorador victoriano descubre el mundo moderno." },
    // MISTERIO
    { nombre: "El Jardin de las Mariposas", autor: "Dot Hutchison", precio: 28.00, stock: 8, categoria: "Misterio", imagen: "https://i.pinimg.com/1200x/77/56/8e/77568e2d0bd2d6b392da500bf4db1324.jpg", codigo: "MIS01", desc: "Siniestro thriller sobre secuestro y belleza." },
    { nombre: "El hombre de tiza", autor: "C.J. Tudor", precio: 26.50, stock: 10, categoria: "Misterio", imagen: "https://i.pinimg.com/736x/38/62/f6/3862f6d05202187db667d80da29aeb7b.jpg", codigo: "MIS02", desc: "Pasado oscuro vuelve mediante dibujos macabros." },
    { nombre: "El abismo del olvido", autor: "Paco Roca", precio: 21.00, stock: 14, categoria: "Misterio", imagen: "https://i.pinimg.com/1200x/18/63/51/18635121a9f513b4d836744d7bd6ba54.jpg", codigo: "MIS03", desc: "Misterio histórico magistral." },
    // FICCION
    { nombre: "La distancia que nos separa", autor: "Renato Cisneros", precio: 23.00, stock: 11, categoria: "Ficcion", imagen: "https://www.planetadelibros.com/usuaris/libros/fotos/232/original/portada_la-distancia-que-nos-separa_renato-cisneros_201610261623.jpg", codigo: "FIC01", desc: "Ficción sobre secretos familiares." },
    { nombre: "Tres enigmas", autor: "Eduardo Mendoza", precio: 20.00, stock: 16, categoria: "Ficcion", imagen: "https://uepmallorca.app/wp-content/uploads/2024/01/tres-enigmas-1.webp", codigo: "FIC02", desc: "Agentes secretos ineptos resuelven crímenes absurdos." },
    { nombre: "El inestable mundo de Alroy", autor: "Pau de la Calle.", precio: 30.00, stock: 5, categoria: "Ficcion", imagen: "https://i.pinimg.com/736x/74/32/f3/7432f38234029d965103d0b15b049f16.jpg", codigo: "FIC03", desc: "Fantasía épica sobre miedos y superación." }
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

        // 3. Tabla de productos
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