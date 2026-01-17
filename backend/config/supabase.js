const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment variables (.env file)
dotenv.config(); 

const supabaseUrl = process.env.SUPABASE_URL;
// This allows your backend to write data without permission issues.
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase URL or Key in .env file');
}

// Create and export the admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = { supabase };