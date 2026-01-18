const express = require('express');
const {
  createRegistration,
  getEventRegistrations,
  getUserRegistrations,
  getRegistrationCounts,
} = require('../controllers/registrationController');

const router = express.Router();

// POST /api/registrations - Create a new registration
router.post('/', createRegistration);

// GET /api/registrations/event/:eventId - Get all registrations for an event
router.get('/event/:eventId', getEventRegistrations);

// GET /api/registrations/user/:userId - Get all registrations for a user
router.get('/user/:userId', getUserRegistrations);

// POST /api/registrations/counts - Get registration counts by user type for events
router.post('/counts', getRegistrationCounts);

module.exports = router;
