const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;

// Gunakan service_role key untuk backend (bypass RLS, akses storage penuh)
// Fallback ke anon key jika service_role belum di-set
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  || process.env.SUPABASE_ANON_KEY
  || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum di-set di .env");
}

const supabase = createClient(
  supabaseUrl || 'https://example.supabase.co',
  supabaseKey || 'public-anon-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    }
  }
);

module.exports = supabase;
