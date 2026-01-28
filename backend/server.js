const express = require("express");
const cors = require("cors");
const db = require("./db"); // This pulls in your connection logic

const app = express();
app.use(cors());
app.use(express.json());

const authRoute = require("./routes/authRoute");
const eventRoute = require("./routes/eventRoute");
const registrationRoute = require("./routes/registrationRoute");
const userRoutes = require("./routes/userRoute");
const announcementRoute = require("./routes/announcementRoute");
const attendanceRoute = require("./routes/attendanceRoute");

app.use("/api/auth", authRoute);
app.use("/api/events", eventRoute);
app.use("/api/registrations", registrationRoute);
app.use("/api/users", userRoutes);
app.use("/api/announcements", announcementRoute);
app.use("/api/attendance", attendanceRoute);

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
