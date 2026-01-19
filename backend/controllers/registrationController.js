const { RegistrationModel } = require('../models/registrationModel');

const createRegistration = async (req, res) => {
  try {
    const {
      eventId,
      userId,
      specialRequirements,
      emergencyContact,
      answers,  // Array of { questionId, selectedOptionId }
    } = req.body;

    // Validate required fields
    if (!eventId) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const existing = await RegistrationModel.checkExisting(eventId, userId);
    if (existing) {
      return res.status(400).json({ error: "You have already registered for this event" });
    }

    // Prepare registration data
    const registrationData = {
      eventId,
      userId,
      specialRequirements: specialRequirements || null,
      emergencyContact: emergencyContact || null,
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

module.exports = {
  createRegistration,
  getEventRegistrations,
  getUserRegistrations,
  getRegistrationCounts,
  getEventRegistrationsForExport,
};
