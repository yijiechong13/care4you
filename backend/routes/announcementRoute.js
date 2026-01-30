const express = require('express');
const {
    getAnnouncements, 
    createGlobalAnnouncement, 
    createEventAnnouncement,
    markRead
} = require('../controllers/announcementController');

const router = express.Router();

router.get('/', getAnnouncements);
router.post('/global', createGlobalAnnouncement);
router.post('/event', createEventAnnouncement);
router.patch('/read', markRead);

module.exports = router;