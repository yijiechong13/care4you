const express = require('express');
const {
  createRegistration,
  getEventRegistrations,
  getUserRegistrations
} = require('../controllers/registrationController');

const router = express.Router();

// POST /api/registrations - Create a new registration
router.post('/', createRegistration);

// GET /api/registrations/event/:eventId - Get all registrations for an event
router.get('/event/:eventId', getEventRegistrations);

// GET /api/registrations/user/:userId - Get all registrations for a user
router.get('/user/:userId', getUserRegistrations);

module.exports = router;
