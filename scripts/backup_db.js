const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Hole die Credentials aus den Umgebungsvariablen (werden beim Ausführen übergeben)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Fehler: Supabase Credentials fehlen.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function backupDatabase() {
  console.log("Starte Datenbank-Backup...");
  const backup = {};
  
  // Liste aller Tabellen, die wir sichern wollen
  const tables = [
    'profiles',
    'bitcoin_wallets',
    'transactions',
    'wallet_pool',
    'withdrawal_requests',
    'chat_messages',
    'site_settings'
  ];

  for (const table of tables) {
    console.log(`Exportiere Tabelle: ${table}...`);
    try {
      const { data, error } = await supabase.from(table).select('*');
      
      if (error) {
        console.error(`Fehler bei Tabelle ${table}:`, error.message);
        backup[table] = { error: error.message };
      } else {
        console.log(`- ${data.length} Einträge in ${table} gefunden.`);
        backup[table] = data;
      }
    } catch (e) {
      console.error(`Unerwarteter Fehler bei ${table}:`, e.message);
    }
  }

  // Speichere das Ergebnis als JSON-Datei im Projekt-Root
  const backupPath = path.join(__dirname, '..', 'complete_database_backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2));
  
  console.log("\n✅ BACKUP ERFOLGREICH ERSTELLT!");
  console.log(`Die Datei liegt jetzt hier: ${backupPath}`);
  console.log("Du kannst sie nun links im Datei-Baum sehen und herunterladen.");
}

backupDatabase();