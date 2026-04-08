const { Client } = require('pg');
const fs = require('fs');

const dbUrl = "postgresql://postgres:iDPnqx-gCKcBlZ2fllSRftY71UId-iGf@db.lnmfpacxdmfejnrhdxow.supabase.co:5432/postgres";

function escapeSqlValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'number') return val;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'object') {
    if (val instanceof Date) return `'${val.toISOString()}'`;
    // JSON to String and escape single quotes
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportTable(client, schema, table) {
  console.log(`Exportiere ${schema}.${table}...`);
  try {
    const res = await client.query(`SELECT * FROM ${schema}."${table}"`);
    if (res.rows.length === 0) return `-- Keine Daten in ${schema}.${table}\n`;
    
    const columns = Object.keys(res.rows[0]);
    let sql = `\n-- Daten fuer ${schema}.${table} (${res.rows.length} Zeilen)\n`;
    
    for (const row of res.rows) {
        const values = columns.map(col => escapeSqlValue(row[col]));
        sql += `INSERT INTO ${schema}."${table}" ("${columns.join('", "')}") VALUES (${values.join(', ')});\n`;
    }
    return sql;
  } catch (e) {
      console.error(`Fehler bei ${schema}.${table}: ${e.message}`);
      return `-- FEHLER bei ${schema}.${table}: ${e.message}\n`;
  }
}

async function main() {
  const client = new Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    let finalSql = "-- ==========================================\n";
    finalSql += "-- 1:1 MIGRATION BACKUP (Vollstaendig inkl. Auth & Passwoerter)\n";
    finalSql += "-- ==========================================\n\n";
    
    // EXTREM WICHTIG: Verhindert Trigger-Fehler/Verdopplungen beim Import auf den neuen Server!
    finalSql += "SET session_replication_role = 'replica';\n\n";

    // Reihenfolge ist extrem wichtig (erst Auth, dann Profile, dann Rest)
    const tables = [
      { schema: 'auth', name: 'users' },
      { schema: 'auth', name: 'identities' },
      { schema: 'public', name: 'profiles' },
      { schema: 'public', name: 'bitcoin_wallets' },
      { schema: 'public', name: 'transactions' },
      { schema: 'public', name: 'wallet_pool' },
      { schema: 'public', name: 'withdrawal_requests' },
      { schema: 'public', name: 'chat_messages' },
      { schema: 'public', name: 'site_settings' }
    ];

    for (const t of tables) {
      finalSql += await exportTable(client, t.schema, t.name);
    }

    // Trigger wieder normal aktivieren
    finalSql += "\nSET session_replication_role = 'origin';\n";
    
    fs.writeFileSync('migration_1_to_1_full.sql', finalSql);
    console.log("Erfolgreich gespeichert in: migration_1_to_1_full.sql");
  } catch (e) {
    console.error("Verbindungsfehler:", e);
  } finally {
    await client.end();
  }
}

main();