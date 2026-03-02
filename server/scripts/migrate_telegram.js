import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function migrate() {
    try {
        console.log('Starting migration...');

        // Add telegram_id to user_infm
        await pool.query(`
      ALTER TABLE user_infm 
      ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
    `);
        console.log('Added telegram_id to user_infm');

        // Add telegram_chat_id to grp_infm
        await pool.query(`
      ALTER TABLE grp_infm 
      ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT;
    `);
        console.log('Added telegram_chat_id to grp_infm');

        // Create telegram_links table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS telegram_links (
        code VARCHAR(255) PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
      );
    `);
        console.log('Created telegram_links table');

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
