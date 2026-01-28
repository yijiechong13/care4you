// Sample model using a similar pattern to your EventModel
const db = require("../db"); // Use your existing db.js connection

const AttendanceModel = {
  create: async (data) => {
    const query = `
      INSERT INTO attendance (user_id, event_id, registration_id, check_in_time, device_timestamp)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const values = [
      data.userId,
      data.eventId,
      data.registrationId,
      data.checkInTime,
      data.deviceTimestamp,
    ];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  findByRegistrationId: async (rID) => {
    const query = "SELECT * FROM attendance WHERE registration_id = $1";
    const result = await db.query(query, [rID]);
    return result.rows[0];
  },

  getAttendanceByEvent: async (eventId) => {
    const query = `
      SELECT a.*, u.full_name 
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.event_id = $1
    `;
    const result = await db.query(query, [eventId]);
    return result.rows;
  },
};

module.exports = { AttendanceModel };
