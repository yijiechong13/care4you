const db = require("../db"); // Use your existing db.js connection

const User = {
  // Logic for adding a new user
  create: async (name, email, password, user_type, phone, guestId) => {
    const queryText = `
      INSERT INTO users (name, email, password, user_type, phone) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, name, email, user_type, phone
    `;
    const values = [name, email, password, user_type || "participant", phone];
    const result = await db.query(queryText, values);
    const newUser = result.rows[0];

    // 2. The Conversion Deal: Update registrations from guestId to new userId
    if (guestId && guestId.toString().startsWith("guest_")) {
      const migrateQuery = `
        UPDATE registrations 
        SET user_id = $1 
        WHERE user_id = $2
      `;
      // Convert newUser.id to string to match the VARCHAR/TEXT column type
      await db.query(migrateQuery, [newUser.id.toString(), guestId.toString()]);
      console.log(`✅ Migrated registrations from ${guestId} to ${newUser.id}`);
    }
    return newUser;
  },

  // Logic for finding user by ID
  findByEmail: async (email, guestId) => {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await db.query(query, [email]);
    const user = result.rows[0];

    if (user && guestId && guestId.toString().startsWith("guest_")) {
      try {
        const migrateQuery = `
        UPDATE registrations 
        SET user_id = $1 
        WHERE user_id = $2
      `;
        // We force user.id to string because the column is now TEXT/VARCHAR
        await db.query(migrateQuery, [user.id.toString(), guestId.toString()]);
        console.log(`✅ Migrated login guest data for user ${user.id}`);
      } catch (updateErr) {
        console.error("❌ Migration Error:", updateErr.message); // This will tell you exactly what SQL error happened
      }
    }

    return user;
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

  findById: async (id) => {
    const queryText = `
      SELECT id, name, email, phone, user_type 
      FROM users 
      WHERE id = $1
    `;
    const result = await db.query(queryText, [id]);
    return result.rows[0];
  },
};

module.exports = User;
