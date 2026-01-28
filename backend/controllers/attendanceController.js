const { AttendanceModel } = require("../models/attendanceModel");
const { RegistrationModel } = require("../models/registrationModel"); // To update status

const checkInParticipant = async (req, res) => {
  try {
    const { uID, eID, rID, ts } = req.body;

    // 1. Security: Check if QR code is expired (e.g., older than 10 minutes)
    // $CurrentTime - ts > 600,000ms$
    const isExpired = Date.now() - ts > 10 * 60 * 1000;
    if (isExpired) {
      return res
        .status(400)
        .json({ error: "QR code expired. Please refresh." });
    }

    // 2. Prevent Duplicates: Check if already checked in
    const existing = await AttendanceModel.findByRegistrationId(rID);
    if (existing) {
      return res.status(400).json({ error: "Participant already checked in" });
    }

    // 3. Record Attendance
    const attendanceRecord = await AttendanceModel.create({
      userId: uID,
      eventId: eID,
      registrationId: rID,
      checkInTime: new Date(),
      deviceTimestamp: new Date(ts),
    });

    // 4. Update Registration status to 'attended'
    // This makes sure your 'My Events' page reflects the check-in
    await RegistrationModel.updateStatus(rID, "attended");

    res.status(201).json({
      message: "Check-in successful",
      attendanceRecord,
    });
  } catch (error) {
    console.error("❌ Attendance Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const records = await AttendanceModel.getAttendanceByEvent(eventId);
    res.status(200).json(records);
  } catch (error) {
    console.error("❌ Attendance Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { checkInParticipant, getEventAttendance };
