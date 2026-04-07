import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [key, ...val] = line.split('=');
  if (key && val.length) acc[key.trim()] = val.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {} as Record<string, string>);

const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function check() {
  const { data, error } = await supabase.from('drone_services').select('*').limit(1);
  console.log('Error:', error);
  console.log('Columns in DB:', Object.keys(data?.[0] || {}));
}
check();
