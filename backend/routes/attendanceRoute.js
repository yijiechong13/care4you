const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// This matches your frontend: ${API_URL}/check-in
router.post("/check-in", attendanceController.checkInParticipant);

module.exports = router;
