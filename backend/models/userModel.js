const db = require("../db"); // Use your existing db.js connection

const User = {
  // Logic for adding a new user
  create: async (name, email, password, user_type, phone) => {
    const queryText = `
      INSERT INTO users (name, email, password, user_type, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, user_type, phone
    `;
    const values = [name, email, password, user_type || "participant", phone];
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

  // Logic for finding user by ID
  findById: async (id) => {
    const queryText = `
      SELECT id, name, email, phone, user_type 
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(queryText, [id]);
    return result.rows[0]; // Returns the user object or undefined
  },

  updateProfile: async (id, name, phone) => {
    const queryText = `
    UPDATE users 
    SET name = $1, phone = $2 
    WHERE id = $3 
    RETURNING id, name, phone, email
  `;
    const result = await db.query(queryText, [name, phone, id]);
    return result.rows[0];
  },
};

module.exports = User;
