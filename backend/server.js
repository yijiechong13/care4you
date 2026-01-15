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

app.listen(3000, () => console.log("Server running on port 3000"));
