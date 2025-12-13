const mysql = require('mysql2/promise');
require('dotenv').config();

async function addGasColumns() {
  console.log('\n========================================');
  console.log('  Adding Gas Columns to Database');
  console.log('========================================\n');

  let connection;

  try {
    // Connect to database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'threadchain_db',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Connected to database:', process.env.DB_NAME);
    console.log('');

    // Check if columns already exist
    const [columns] = await connection.query(
      `SHOW COLUMNS FROM blockchain_transactions WHERE Field IN ('gas_price', 'gas_fee')`
    );

    if (columns.length === 2) {
      console.log('✅ Gas columns already exist!');
      console.log('');
      console.log('Existing columns:');
      columns.forEach(col => {
        console.log(`   - ${col.Field}: ${col.Type}`);
      });
      console.log('');
      console.log('No changes needed.');
      return;
    }

    console.log('Adding gas_price and gas_fee columns...');
    console.log('');

    // Add gas_price column
    try {
      await connection.query(`
        ALTER TABLE blockchain_transactions 
        ADD COLUMN gas_price DECIMAL(20,9) DEFAULT 0 AFTER gas_used
      `);
      console.log('✅ Added gas_price column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  gas_price column already exists');
      } else {
        throw error;
      }
    }

    // Add gas_fee column
    try {
      await connection.query(`
        ALTER TABLE blockchain_transactions 
        ADD COLUMN gas_fee DECIMAL(20,18) DEFAULT 0 AFTER gas_price
      `);
      console.log('✅ Added gas_fee column');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  gas_fee column already exists');
      } else {
        throw error;
      }
    }

    console.log('');
    console.log('========================================');
    console.log('  SUCCESS! Gas columns added');
    console.log('========================================');
    console.log('');

    // Show table structure
    const [tableStructure] = await connection.query(
      `DESCRIBE blockchain_transactions`
    );

    console.log('Current blockchain_transactions table structure:');
    console.log('');
    console.log('Field                | Type              | Null | Key | Default');
    console.log('---------------------|-------------------|------|-----|--------');
    tableStructure.forEach(col => {
      const field = col.Field.padEnd(20);
      const type = col.Type.padEnd(17);
      const nullable = col.Null.padEnd(4);
      const key = col.Key.padEnd(3);
      const def = (col.Default || 'NULL').toString().padEnd(7);
      console.log(`${field} | ${type} | ${nullable} | ${key} | ${def}`);
    });

    console.log('');
    console.log('✨ Gas tracking is now enabled!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Upload a STIX report to test gas tracking');
    console.log('3. Check metrics dashboard for gas data');
    console.log('');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nPlease check:');
    console.error('1. MySQL server is running');
    console.error('2. Database credentials in .env are correct');
    console.error('3. Database exists (run: npm run init-db first)');
    console.error('');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
addGasColumns();
