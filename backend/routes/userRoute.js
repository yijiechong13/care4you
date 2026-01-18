const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// This matches the path: /api/users/profile/:id
router.get("/profile/:id", userController.getProfile);

module.exports = router;
