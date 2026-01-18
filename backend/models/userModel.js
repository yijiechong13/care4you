const db = require("../db"); // Use your existing db.js connection

const User = {
  // Logic for adding a new user
  create: async (name, email, password, user_type, phone) => {
    const queryText = `
      INSERT INTO users (name, email, password, user_type, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, user_type, phone
    `;
    const values = [name, email, password, user_type || "member", phone];
    const result = await db.query(queryText, values);
    return result.rows[0];
  },

  // Logic for finding an existing user
  findByEmail: async (email) => {
    const queryText =
      "SELECT id, name, email, password, user_type, phone FROM users WHERE email = $1"; // Added phone here
    const result = await db.query(queryText, [email]);
    return result.rows[0];
  },
};

module.exports = User;
