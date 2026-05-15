import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
  console.log("Checking cidades...");
  const { data: cidades, error: cErr } = await supabase.from("cidades").select("*");
  console.log("Cidades:", cidades?.length, cErr);

  console.log("Checking bairros...");
  const { data: bairros, error: bErr } = await supabase.from("bairros").select("*");
  console.log("Bairros:", bairros?.length, bErr);
}
check();
