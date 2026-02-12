const fs = require('fs');
const path = require('path');

function hacerBackup() {
  const dbPath = path.join(__dirname, 'ecommerce.db');
  const backupPath = path.join(__dirname, `backup_${Date.now()}.db`);
  
  try {
    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup creado: ${backupPath}`);
    return backupPath;
  } catch (error) {
    console.error('❌ Error creando backup:', error);
    return null;
  }
}

module.exports = hacerBackup;