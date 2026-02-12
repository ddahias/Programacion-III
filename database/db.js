const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Conexión a la base de datos
const db = new sqlite3.Database(
  path.join(__dirname, 'ecommerce.db'),
  (err) => {
    if (err) {
      console.error('Error conectando a SQLite:', err);
    } else {
      console.log('Conectado a SQLite correctamente');
    }
  }
);

// Función para ejecutar consultas con async
db.runAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

db.getAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

db.allAsync = function (sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = db;