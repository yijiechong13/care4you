const { AnnouncementModel } = require('../models/announcementModel');
const { translateFields } = require('../services/translationService');

const getAnnouncements = async (req, res) => {
  try {
    const data = await AnnouncementModel.findAll();
    const lang = (req.query.lang || "en").toLowerCase();

    if (lang === "en") {
      return res.status(200).json(data);
    }

    const translated = await Promise.all(
      data.map(async (item) => {
        const translatedFields = await translateFields(
          { title: item.title, message: item.message || "" },
          lang,
        );

        return {
          ...item,
          title: translatedFields.title ?? item.title,
          message: translatedFields.message ?? item.message,
        };
      }),
    );

    res.status(200).json(translated);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message, location } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: "Title is required" });
    }

    // Handle empty message - convert empty string to empty string or null based on DB schema
    const messageValue = message && message.trim() ? message.trim() : "";

    const newAnnouncement = await AnnouncementModel.create(title.trim(), messageValue, location || null);

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
