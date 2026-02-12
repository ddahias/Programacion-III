// database/seed-products.js
const db = require('./db');

async function seedProducts() {
    try {
        console.log('🌱 Insertando productos de prueba...');
        
        const productos = [
            ['Laptop Gaming', 'LP-001', 1200.99, 'Laptop para gaming de alta gama con RTX 4070', 10],
            ['Mouse Inalámbrico', 'MS-002', 29.99, 'Mouse ergonómico inalámbrico 16000 DPI', 50],
            ['Teclado Mecánico', 'KB-003', 89.99, 'Teclado mecánico RGB switches azules', 30],
            ['Monitor 24"', 'MN-004', 199.99, 'Monitor Full HD 144Hz FreeSync', 20],
            ['Auriculares Bluetooth', 'AU-005', 59.99, 'Auriculares con cancelación de ruido activa', 40],
            ['Smartphone Android', 'SP-006', 399.99, 'Smartphone 128GB, 8GB RAM, cámara 108MP', 15],
            ['Tablet 10"', 'TB-007', 299.99, 'Tablet con stylus incluido y 256GB almacenamiento', 25],
            ['Smart Watch', 'SW-008', 199.99, 'Reloj inteligente con GPS y monitoreo cardiaco', 30],
            ['Cámara DSLR', 'CM-009', 699.99, 'Cámara profesional 24MP con lente 18-55mm', 8],
            ['Altavoz Bluetooth', 'AB-010', 79.99, 'Altavoz portátil resistente al agua IPX7', 35],
            ['Disco SSD 1TB', 'SSD-011', 89.99, 'Disco sólido NVMe M.2 velocidades 3500MB/s', 45],
            ['Router WiFi 6', 'RT-012', 129.99, 'Router dual band con cobertura para toda la casa', 18],
            ['Webcam 4K', 'WC-013', 79.99, 'Cámara web con micrófono integrado y autofocus', 22],
            ['Power Bank 20000mAh', 'PB-014', 39.99, 'Batería externa con carga rápida USB-C', 60],
            ['Kit Herramientas', 'KH-015', 49.99, 'Kit completo de herramientas para PC', 28]
        ];

        let insertados = 0;
        
        for (const producto of productos) {
            try {
                const resultado = await db.runAsync(
                    `INSERT OR IGNORE INTO productos 
                     (nombre, codigo, precio, descripcion, stock) 
                     VALUES (?, ?, ?, ?, ?)`,
                    producto
                );
                
                if (resultado.changes > 0) {
                    insertados++;
                }
            } catch (error) {
                console.error(`Error insertando ${producto[1]}:`, error.message);
            }
        }

        console.log(`✅ ${insertados} productos insertados exitosamente`);
        
        // Mostrar productos insertados
        const productosDB = await db.allAsync('SELECT * FROM productos ORDER BY id');
        console.log('📦 Total de productos en la base de datos:', productosDB.length);
        
        productosDB.forEach(p => {
            console.log(`  ${p.id}. ${p.nombre} - $${p.precio} (Stock: ${p.stock})`);
        });

    } catch (error) {
        console.error('❌ Error en seed:', error);
    } finally {
        // Cerrar conexión si es necesario
        db.close();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    seedProducts().then(() => {
        console.log('🎉 Seed completado');
        process.exit(0);
    });
}

module.exports = seedProducts;