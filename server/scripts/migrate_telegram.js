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

    // 1. User Table (user_infm)
    await pool.query(`
            ALTER TABLE user_infm 
            ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE;
        `);
    console.log('Checked user_infm: telegram_id added');

    // 2. Group Table (grp_infm)
    await pool.query(`
            ALTER TABLE grp_infm 
            ADD COLUMN IF NOT EXISTS telegram_chat_id BIGINT,
            ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '$',
            ADD COLUMN IF NOT EXISTS visibility VARCHAR(20) DEFAULT 'public';
        `);
    console.log('Checked grp_infm: telegram_chat_id, currency, visibility added');

    // 3. Trip Table (trp_infm)
    await pool.query(`
            ALTER TABLE trp_infm 
            ADD COLUMN IF NOT EXISTS update_dttm VARCHAR(20),
            ADD COLUMN IF NOT EXISTS payer_id INTEGER;
        `);
    console.log('Checked trp_infm: update_dttm, payer_id added');

    // 4. Telegram Links (Internal)
    await pool.query(`
            CREATE TABLE IF NOT EXISTS telegram_links (
                code VARCHAR(255) PRIMARY KEY,
                user_id INTEGER NOT NULL,
                expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL '1 hour')
            );
        `);
    console.log('Checked telegram_links: table verified');

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

migrate();
