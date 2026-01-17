const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

// // Test the connection immediately on startup
// pool.query("SELECT NOW()", (err, res) => {
//   if (err) {
//     console.error("❌ Database connection error:", err.message);
//   } else {
//     console.log("✅ Successfully connected to Supabase!");
//   }
// });

module.exports = pool;
