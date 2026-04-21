import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const envContent = fs.readFileSync('.env', 'utf8');
const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
const connectionString = dbUrlMatch ? dbUrlMatch[1] : null;

async function checkTables() {
    if (!connectionString) {
        console.error("DATABASE_URL not found in .env");
        return;
    }
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
        console.log("Tables in public schema:");
        res.rows.forEach(row => console.log("- " + row.table_name));
    } catch (err) {
        console.error("Connection error:", err);
    } finally {
        await client.end();
    }
}

checkTables();
