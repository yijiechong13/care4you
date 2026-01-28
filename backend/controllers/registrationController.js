const { EventModel } = require("../models/eventModel");
const { RegistrationModel } = require("../models/registrationModel");
const User = require("../models/userModel");
const { supabase } = require("../config/supabase");

const createRegistration = async (req, res) => {
  try {
    const {
      eventId,
      userId,
      specialRequirements,
      fullName,
      contactNumber,
      emergencyContact,
      answers, // Array of { questionId, selectedOptionId }
    } = req.body;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ error: "eventRegistration.eventIdRequired" });
    }

    if (!userId) {
      return res.status(400).json({ error: "eventRegistration.userIdRequired" });
    }

    const existing = await RegistrationModel.checkExisting(eventId, userId);
    if (existing) {
      return res
        .status(400)
        .json({ error: "eventRegistration.alreadyRegisteredMessage" });
    }

    // Check for time clash with confirmed events
    const clashResult = await RegistrationModel.checkTimeClash(userId, eventId);
    if (clashResult.hasClash) {
      return res.status(409).json({
        error: "eventRegistration.timeClash",
        clashingEvent: clashResult.clashingEvent?.title
      });
    }

    const event = await EventModel.findByEventId(eventId);
    const isGuest = userId.toString().startsWith("guest_");
    const user = isGuest ? null : await User.findById(userId);
    const user_type = user?.user_type?.toLowerCase() || "participant";

    let isFull = false;
    if (!isGuest && user_type === "volunteer") {
      // Volunteers: check volunteer slots
      isFull = event.volunteer_slots && event.volunteer_taken_slots >= event.volunteer_slots;
    } else {
      // Participants and guests: check participant slots
      isFull = event.participant_slots && event.taken_slots >= event.participant_slots;
    }
    const status = isFull ? "waitlist" : "confirmed";

    // Prepare registration data
    const registrationData = {
      eventId,
      userId,
      specialRequirements: specialRequirements || null,
      emergencyContact: emergencyContact || null,
      guest_name: fullName || null,
      guest_contact: contactNumber || null,
      guest_emergency_contact: emergencyContact || null,
      status: status
    };

    const registration = await RegistrationModel.createWithAnswers(
      registrationData,
      answers || [],
    );

    res.status(201).json({
      message: "Registration successful",
      registrationId: registration.id,
    });
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await RegistrationModel.findByEventId(eventId);
    res.status(200).json(registrations);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getUserRegistrations = async (req, res) => {
  try {
    const { userId } = req.params;
    const registrations = await RegistrationModel.findByUserId(userId);
    res.status(200).json(registrations);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getEventRegistrationsForExport = async (req, res) => {
  try {
    const { eventId } = req.params;
    const registrations = await RegistrationModel.getDetailedByEventId(eventId);
    res.status(200).json(registrations);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getRegistrationCounts = async (req, res) => {
  try {
    const { eventIds } = req.body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return res.status(400).json({ error: "eventIds array is required" });
    }

    const counts = await RegistrationModel.getCountsByEventIds(eventIds);
    res.status(200).json(counts);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const cancelRegistration = async (req, res) => {
  const { registrationId } = req.params;

  try {
    const registration = await RegistrationModel.findRegistrationById(registrationId);
    if (!registration || registration.status === 'cancelled') {
      return res.status(400).json({ error: "Registration not found or already cancelled" });
    }

    const event = await EventModel.findByEventId(registration.event_id);

    // CHECK 48-HOUR RULE
    const eventDate = new Date(event.start_time);
    const now = new Date();
    // Calculate hours difference
    const hoursDiff = (eventDate - now) / (1000 * 60 * 60);

    if (hoursDiff < 48) {
      return res.status(403).json({ error: "Cannot cancel less than 48 hours before the event." });
    }

    const isGuest = registration.user_id.toString().startsWith("guest_");
    const cancelledUser = isGuest ? null : await User.findById(registration.user_id);
    const cancelledUserType = (cancelledUser?.user_type || "participant").toLowerCase();

    await RegistrationModel.updateStatus(registrationId, 'cancelled');

    if (registration.status === 'confirmed') {
      console.log(`User ${registration.user_id} (${cancelledUserType}) cancelled. Checking waitlist...`);

      // Try to find a replacement of the SAME TYPE (Volunteer for Volunteer, etc)
      const nextInLine = await RegistrationModel.findNextWaitlistCandidate(registration.event_id, cancelledUserType);

      if (nextInLine) {
        // --- SCENARIO A: Replacement Found ---
        // Promote them to confirmed
        await RegistrationModel.updateStatus(nextInLine.id, 'confirmed');
        console.log(`🚀 Auto-promoted user ${nextInLine.user_id} from waitlist`);
      } else {
        // --- SCENARIO B: No Waitlist ---
        // We must decrement the taken_slots count in the events table
        console.log(`No waitlist for ${cancelledUserType}. Freeing up slot.`);
        
        const { data: eventRow } = await supabase
          .from("events")
          .select("taken_slots, volunteer_taken_slots")
          .eq("id", registration.event_id)
          .single();

        if (cancelledUserType === "volunteer") {
          await supabase
            .from("events")
            .update({ volunteer_taken_slots: Math.max(0, (eventRow.volunteer_taken_slots || 0) - 1) })
            .eq("id", registration.event_id);
        } else {
          await supabase
            .from("events")
            .update({ taken_slots: Math.max(0, (eventRow.taken_slots || 0) - 1) })
            .eq("id", registration.event_id);
        }
      }
    }

    res.status(200).json({ message: "Cancellation successful" });

  } catch (error) {
    console.error("❌ Cancel Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createRegistration,
  getEventRegistrations,
  getUserRegistrations,
  getRegistrationCounts,
  getEventRegistrationsForExport,
  cancelRegistration
};
