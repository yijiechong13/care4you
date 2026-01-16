const express = require('express');
const { getEvents, createEvent } = require('../controllers/eventController');

const router = express.Router();

router.get('/', getEvents);
router.post('/create', createEvent);

module.exports = router;