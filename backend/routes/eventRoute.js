const express = require('express');
const { getEvents, createEvent, getEventQuestions, cancelEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.get('/:eventId/questions', getEventQuestions);
router.patch("/:eventId/cancel", cancelEvent);

module.exports = router;