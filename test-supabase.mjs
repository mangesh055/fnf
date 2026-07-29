import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log("Testing connection...");
  
  const { data: users, error: userError } = await supabase.auth.admin.listUsers().catch(() => ({ data: null, error: { message: "Admin API not accessible with anon key, which is expected." } }));
  
  const { data: profiles, error: profileError } = await supabase.from('profiles').select('id, email, full_name, role').limit(5);
  
  if (profileError) {
    console.error("Error fetching profiles:", profileError.message);
  } else {
    console.log("Profiles found:", profiles?.length);
    console.log(profiles);
  }
}

testConnection();
