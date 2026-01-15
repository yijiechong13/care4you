const express = require("express");
const cors = require("cors");
const pool = require("./db"); // This pulls in your connection logic

const app = express();
app.use(cors());
app.use(express.json());

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Get the port from Google's environment variable (default to 8080)
const port = process.env.PORT || 8080;

// 2. IMPORTANT: Listen on '0.0.0.0' so Google can reach your app
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running live on port ${port}`);
});
