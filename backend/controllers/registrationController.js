const { RegistrationModel } = require('../models/registrationModel');

const createRegistration = async (req, res) => {
  try {
    const {
      eventId,
      userId,
      specialRequirements,
      isGuest,
      fullName,
      contactNumber,
      emergencyContact,
      answers,  // Array of { questionId, selectedOptionId }
    } = req.body;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Check if logged-in user already registered
    if (userId) {
      const existing = await RegistrationModel.checkExisting(eventId, userId);
      if (existing) {
        return res.status(400).json({ error: "You have already registered for this event" });
      }
    }

    // Prepare registration data
    // For logged-in users: userId is set, guest fields are null
    // For guests: userId is null, guest fields store their info
    const registrationData = {
      eventId,
      userId: isGuest ? null : userId,
      specialRequirements: specialRequirements || null,
      isGuest: isGuest || false,
      guestName: isGuest ? fullName : null,
      guestContact: isGuest ? contactNumber : null,
      guestEmergencyContact: isGuest ? emergencyContact : null,
    };

    const registration = await RegistrationModel.createWithAnswers(registrationData, answers || []);

    res.status(201).json({
      message: "Registration successful",
      registrationId: registration.id
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

module.exports = { createRegistration, getEventRegistrations, getUserRegistrations };
