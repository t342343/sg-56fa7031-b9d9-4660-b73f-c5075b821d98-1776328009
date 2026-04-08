const fs = require('fs');
const path = require('path');

try {
  const jsonPath = path.join(__dirname, '..', 'complete_database_backup.json');
  const sqlPath = path.join(__dirname, '..', 'complete_backup.sql');
  
  if (!fs.existsSync(jsonPath)) {
    console.error('Fehler: complete_database_backup.json nicht gefunden.');
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  let sql = '-- Supabase Database SQL Dump (Data Only)\n';
  sql += 'SET client_encoding = \'UTF8\';\n\n';

  for (const [table, rows] of Object.entries(backup)) {
    if (!Array.isArray(rows) || rows.length === 0) continue;

    sql += `\n-- Daten fuer Tabelle: ${table}\n`;
    const columns = Object.keys(rows[0]);

    rows.forEach(row => {
      const values = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'boolean') return val ? 'true' : 'false';
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });

      sql += `INSERT INTO public."${table}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});\n`;
    });
  }

  fs.writeFileSync(sqlPath, sql);
  console.log('✅ SQL-Datei erfolgreich erstellt: complete_backup.sql');
} catch (error) {
  console.error('Fehler:', error.message);
}