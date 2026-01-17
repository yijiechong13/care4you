const express = require("express");
const cors = require("cors");
const db = require("./db"); // This pulls in your connection logic

const app = express();
app.use(cors());
app.use(express.json());

const eventRoute = require("./routes/eventRoute");
const registrationRoute = require("./routes/registrationRoute");

app.use("/api/events", eventRoute);
app.use("/api/registrations", registrationRoute);

app.get("/api/v1", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/v1/signup", async (req, res) => {
  // 2. Unpack the data sent from the React Native app
  const { name, email, password, user_type } = req.body;

  try {
    // 3. The SQL Command for your 'profiles' table
    // We use $1, $2, etc., to prevent SQL Injection attacks
    const queryText = `
      INSERT INTO users (name, email, password, user_type) 
      VALUES ($1, $2, $3, $4) 
      RETURNING id, name, email
    `;
    const values = [name, email, password, user_type || "member"];

    const result = await db.query(queryText, values);

    // 4. Send back the new User ID to the phone
    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: result.rows[0],
    });
  } catch (err) {
    console.error("❌ Registration Error:", err.message);

    // 5. Handle duplicate emails (Postgres error code 23505)
    if (err.code === "23505") {
      return res.status(400).json({
        success: false,
        error: "This email is already registered.",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error during registration.",
    });
  }
});

// backend/server.js

app.post("/api/v1/login", async (req, res) => {
  const { email, password } = req.body; //

  try {
    // Search for the user in the 'profiles' table
    const userQuery = await db.query(
      "SELECT id, name, email, password, user_type FROM users WHERE email = $1",
      [email],
    );

    // 1. Check if user exists
    if (userQuery.rows.length === 0) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    const user = userQuery.rows[0];

    // 2. Check if password matches
    // Note: For a real app, use bcrypt.compare() here!
    if (user.password !== password) {
      return res
        .status(401)
        .json({ success: false, error: "Invalid email or password" });
    }

    // 3. Success: Send back the user data (except password)
    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        user_type: user.user_type,
      },
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res
      .status(500)
      .json({ success: false, error: "Server error during login" });
  }
});

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running live on port ${port}`);
});
