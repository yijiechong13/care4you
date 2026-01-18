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

    if (!title || !message) {
      return res.status(400).json({ error: "Title and message are required" });
    }

    const newAnnouncement = await AnnouncementModel.create(title, message);
    
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