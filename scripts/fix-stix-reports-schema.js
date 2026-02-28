const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixSchema() {
    let connection;

    try {
        console.log('🔧 Fixing stix_reports table schema...\n');

        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'threadchain_db',
            port: process.env.DB_PORT || 3306
        });

        console.log('✅ Connected to database');

        // Add missing columns
        console.log('⌛ Adding organization_id and user_id columns...');

        // Check if columns exist first to avoid errors if partially applied
        const [columns] = await connection.query('SHOW COLUMNS FROM stix_reports');
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes('organization_id')) {
            await connection.query('ALTER TABLE stix_reports ADD COLUMN organization_id VARCHAR(36) AFTER indicators_count');
            console.log('   ✅ Added organization_id');
        } else {
            console.log('   ℹ organization_id already exists');
        }

        if (!columnNames.includes('user_id')) {
            await connection.query('ALTER TABLE stix_reports ADD COLUMN user_id VARCHAR(36) AFTER organization_id');
            console.log('   ✅ Added user_id');
        } else {
            console.log('   ℹ user_id already exists');
        }

        console.log('\n🎉 Schema fix completed successfully!');

    } catch (error) {
        console.error('\n❌ Error fixing schema:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixSchema();
