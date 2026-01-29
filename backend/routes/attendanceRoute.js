const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// This matches your frontend: ${API_URL}/check-in
router.post("/check-in", attendanceController.checkInParticipant);
router.get("/event/:eventId", attendanceController.getEventAttendance);

module.exports = router;
