import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function checkSchema() {
  console.log('--- STARTE DATENBANK-DIAGNOSE ---');
  
  // 1. Prüfe existierende Tabellen über einen einfachen Select (da information_schema oft durch RLS blockiert ist)
  const tables = [
    'profiles', 'site_settings', 'bitcoin_wallets', 'wallet_pool', 
    'transactions', 'chat_messages', 'gewinnberechnung_settings'
  ];
  
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`❌ Tabelle '${table}': Fehler beim Zugriff - ${error.message} (Code: ${error.code})`);
    } else {
      console.log(`✅ Tabelle '${table}' existiert und ist erreichbar.`);
    }
  }

  // 2. Prüfe RPC (Remote Procedure Calls / Funktionen), die wir für die App brauchen
  const rpcs = ['get_user_role', 'assign_wallet_from_pool'];
  for (const rpc of rpcs) {
    const { error } = await supabase.rpc(rpc);
    // Wir erwarten Fehler wegen fehlenden Parametern, aber NICHT "function doesn't exist"
    if (error && error.message.includes("could not find the function")) {
      console.log(`❌ Funktion '${rpc}' fehlt!`);
    } else {
      console.log(`✅ Funktion '${rpc}' existiert.`);
    }
  }
}

checkSchema();
