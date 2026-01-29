const express = require('express');
const { translateTexts } = require('../controllers/translateController');

const router = express.Router();

router.post('/', translateTexts);

module.exports = router;
