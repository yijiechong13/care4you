// Sample model using a similar pattern to your EventModel
const db = require("../db"); // Use your existing db.js connection

const AttendanceModel = {
  create: async (data) => {
    // 1. Start a transaction (optional but recommended)
    await db.query("BEGIN");

    try {
      let attendeeType = "participant"; // Default for guests

      // 2. Determine if user is a guest or a registered user
      if (!data.userId.startsWith("guest_")) {
        const userResult = await db.query(
          "SELECT user_type FROM users WHERE id = $1",
          [data.userId],
        );

        if (userResult.rows.length > 0) {
          attendeeType = userResult.rows[0].user_type; // 'participant' or 'volunteer'
        }
      }

      // 3. Insert into attendance table
      const attendanceQuery = `
      INSERT INTO attendance (user_id, event_id, registration_id, check_in_time)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
      const attendanceValues = [
        data.userId,
        data.eventId,
        data.registrationId,
        data.checkInTime,
      ];
      const attendanceRecord = await db.query(
        attendanceQuery,
        attendanceValues,
      );

      // 4. Update the event table count
      // We dynamically choose the column based on attendeeType
      const columnToUpdate =
        attendeeType === "volunteer" ? "volunteer_att" : "participant_att";

      const updateEventQuery = `
      UPDATE events 
      SET ${columnToUpdate} = ${columnToUpdate} + 1 
      WHERE id = $1;
    `;
      await db.query(updateEventQuery, [data.eventId]);

      // Commit the transaction
      await db.query("COMMIT");

      return attendanceRecord.rows[0];
    } catch (error) {
      // If anything goes wrong, undo all changes
      await db.query("ROLLBACK");
      throw error;
    }
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
