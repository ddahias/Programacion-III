const db = require('./db');

async function seedDatabase() {
  try {
    //  Crear la tabla si no existe
    await db.runAsync(`
      CREATE TABLE IF NOT EXISTS productos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        codigo TEXT UNIQUE NOT NULL,
        precio REAL NOT NULL,
        descripcion TEXT,
        stock INTEGER DEFAULT 0
      )
    `);
    console.log('✅ Tabla "productos" verificada/creada');

    //Insertar productos de prueba
    const productos = [
      ['Laptop Gaming', 'LP-001', 180.99, 'Laptop para gaming de alta gama', 10],
      ['Mouse Inalámbrico', 'MS-002', 15.50, 'Mouse ergonómico inalámbrico', 50],
      ['Teclado Mecánico', 'KB-003', 40.99, 'Teclado mecánico RGB', 30],
      ['Monitor 24"', 'MN-004', 80.00, 'Monitor Full HD 24 pulgadas', 20],
      ['Auriculares', 'AU-005', 27.00, 'Auriculares con cancelación de ruido', 40],
    ];

    for (const producto of productos) {
      await db.runAsync(
        `INSERT OR IGNORE INTO productos (nombre, codigo, precio, descripcion, stock) 
         VALUES (?, ?, ?, ?, ?)`,
        producto
      );
    }

    console.log('Datos de prueba insertados correctamente');
    
    // Mostrar productos insertados
    const productosInsertados = await db.allAsync('SELECT * FROM productos');
    console.log('📦 Productos en la base de datos:', productosInsertados.length);

  } catch (error) {
    console.error(' Error en el proceso:', error);
  }
}

if (require.main === module) {
  seedDatabase().then(() => {
    console.log('completado');
    process.exit(0);
  });
}

module.exports = seedDatabase;