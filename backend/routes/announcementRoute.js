const express = require('express');
const { getAnnouncements, createAnnouncement } = require('../controllers/announcementController');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/create', createAnnouncement);

module.exports = router;