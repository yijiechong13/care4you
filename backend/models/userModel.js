const db = require("../db"); // Use your existing db.js connection

const User = {
  // Logic for adding a new user
  create: async (name, email, password, user_type) => {
    const queryText = `
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email, user_type
    `;
    const values = [name, email, password, user_type || "member"];
    const result = await db.query(queryText, values);
    return result.rows[0];
  },

  // Logic for finding an existing user
  findByEmail: async (email) => {
    const queryText =
      "SELECT id, name, email, password, user_type FROM users WHERE email = $1";
    const result = await db.query(queryText, [email]);
    return result.rows[0];
  },
};

module.exports = User;
