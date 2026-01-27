const { AnnouncementModel } = require('../models/announcementModel');

const getAnnouncements = async (req, res) => {
  try {
    const data = await AnnouncementModel.findAll();
    res.status(200).json(data);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Handle empty message - convert empty string to empty string or null based on DB schema
    const messageValue = message && message.trim() ? message.trim() : "";

    const newAnnouncement = await AnnouncementModel.create(title.trim(), messageValue);

    res.status(201).json({
      message: "Announcement posted successfully",
      data: newAnnouncement
    });

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnnouncements, createAnnouncement };