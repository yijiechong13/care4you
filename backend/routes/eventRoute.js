const express = require('express');
const { getEvents, createEvent, getEventQuestions, getEventImages, addEventImage, deleteEventImage, cancelEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);
router.get('/:eventId/questions', getEventQuestions);
router.get('/:eventId/images', getEventImages);
router.post('/:eventId/images', addEventImage);
router.delete('/images/:imageId', deleteEventImage);
router.patch("/:eventId/cancel", cancelEvent);

module.exports = router;