const express = require('express');
const { getEvents, createEvent, getEventQuestions } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.get('/:eventId/questions', getEventQuestions);

module.exports = router;