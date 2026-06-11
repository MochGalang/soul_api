const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("SUPABASE_URL atau SUPABASE_ANON_KEY belum di-set di .env");
}

const supabase = createClient(supabaseUrl || 'https://example.supabase.co', supabaseKey || 'public-anon-key');

module.exports = supabase;
