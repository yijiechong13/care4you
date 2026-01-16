const express = require("express");
const cors = require("cors");
const db = require("./db"); // This pulls in your connection logic

const eventRoute = require("./routes/eventRoute");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/v1", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({ success: true, time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running live on port ${port}`);
});
