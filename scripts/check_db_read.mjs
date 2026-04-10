import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1]] = match[2].trim();
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('Fehler: Supabase URL oder Key fehlt in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runChecks() {
  console.log(`Prüfe Verbindung zu: ${supabaseUrl}`);
  
  const { data: settings, error: settingsErr } = await supabase.from('site_settings').select('*');
  console.log('\n--- SITE SETTINGS ---');
  if (settingsErr) console.log('Fehler:', settingsErr.message);
  else console.log('Gefunden:', settings?.length, 'Einträge');
  
  const { data: profiles, error: profErr } = await supabase.from('profiles').select('*').limit(3);
  console.log('\n--- PROFILES (Limit 3) ---');
  if (profErr) console.log('Fehler:', profErr.message);
  else console.log('Gefunden:', profiles?.length, 'Einträge');
}

runChecks();
