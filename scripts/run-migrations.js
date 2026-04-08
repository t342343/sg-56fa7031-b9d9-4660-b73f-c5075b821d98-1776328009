const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const MIGRATIONS_DIR = path.join(__dirname, "..", "supabase", "migrations");
const HISTORY_TABLE = "_migration_history";

async function ensureHistoryTable(client) {
  console.log("📋 Checking migration history table...");
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${HISTORY_TABLE} (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);
  console.log("✅ Migration history table ready");
}

async function getExecutedMigrations(client) {
  const result = await client.query(
    `SELECT filename FROM ${HISTORY_TABLE} ORDER BY filename`
  );
  return new Set(result.rows.map(row => row.filename));
}

async function getMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    console.log("⚠️  No migrations directory found");
    return [];
  }

  const files = fs.readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith(".sql"))
    .sort();

  return files;
}

async function executeMigration(client, filename) {
  const filePath = path.join(MIGRATIONS_DIR, filename);
  const sql = fs.readFileSync(filePath, "utf8");

  console.log(`🔄 Executing: ${filename}`);

  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query(
      `INSERT INTO ${HISTORY_TABLE} (filename) VALUES ($1)`,
      [filename]
    );
    await client.query("COMMIT");
    console.log(`✅ Success: ${filename}`);
    return true;
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`❌ Failed: ${filename}`);
    console.error(`   Error: ${error.message}`);
    throw error;
  }
}

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set!");
    console.error("   Please add it in Coolify's environment settings.");
    process.exit(1);
  }

  console.log("🚀 Starting migration process...");
  console.log(`📍 Database: ${databaseUrl.split("@")[1] || "***"}`);

  const client = new Client({
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log("✅ Database connected");

    await ensureHistoryTable(client);

    const allMigrations = await getMigrationFiles();
    const executedMigrations = await getExecutedMigrations(client);

    console.log(`\n📊 Migration Status:`);
    console.log(`   Total migrations: ${allMigrations.length}`);
    console.log(`   Already executed: ${executedMigrations.size}`);

    const pendingMigrations = allMigrations.filter(
      f => !executedMigrations.has(f)
    );

    if (pendingMigrations.length === 0) {
      console.log("\n✨ All migrations are up to date!");
      return;
    }

    console.log(`   Pending: ${pendingMigrations.length}\n`);

    for (const migration of pendingMigrations) {
      await executeMigration(client, migration);
    }

    console.log("\n🎉 All migrations completed successfully!");

  } catch (error) {
    console.error("\n💥 Migration failed!");
    console.error("Error details:", error.message);
    console.error("\n🔍 Troubleshooting:");
    console.error("   1. Check the SQL syntax in the failed migration file");
    console.error("   2. Verify DATABASE_URL is correct");
    console.error("   3. Check Coolify logs for full error details");
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

runMigrations();