const { AnnouncementModel } = require('../models/announcementModel');
const { RegistrationModel } = require('../models/registrationModel');
const User = require('../models/userModel');
const { translateFields } = require('../services/translationService');

const getAnnouncements = async (req, res) => {
  try {
    const { userId, lang } = req.query;
    var data = await AnnouncementModel.findGlobalAnnouncement();

    if (userId) {
      const userAnnouncement = await AnnouncementModel.findAnnouncementByRecipient(userId);
      const combined = data.concat(userAnnouncement);
      data = Array.from(new Map(combined.map(item => [item.id, item])).values());
      data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

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

const createGlobalAnnouncement = async (req, res) => {
  try {
    const { title, message, location } = req.body;

    const users = await User.fetchIds();
    
    if (error) throw error;
    if (!users || users.length === 0) {
      return res.status(200).json({ message: "No users found to notify." });
    }

    const allUserIds = users.map(u => u.id);

    await AnnouncementModel.createAnnouncement(title, message, allUserIds, null);

    res.status(201).json({ 
      message: `Global announcement sent to ${allUserIds.length} users.` 
    });
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createEventAnnouncement = async (req, res) => {
  const { eventId, title, message } = req.body;

  if (!eventId || !title || !message) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const registrations = await RegistrationModel.findByEventId(eventId);
    
    // Confirmed status AND Real Users (exclude 'guest_')
    const validUserIds = registrations
      .filter(reg => 
        reg.status === 'confirmed' && 
        !reg.user_id.toString().startsWith("guest_")
      )
      .map(reg => reg.user_id);

    if (validUserIds.length === 0) {
      return res.status(200).json({ message: "No confirmed app users found for this event." });
    }

    await AnnouncementModel.createAnnouncement(title, message, validUserIds, eventId);

    res.status(201).json({ 
      message: `Event announcement sent to ${validUserIds.length} participants.` 
    });
  } catch (error) {
    console.error("❌ Event Blast Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const createSpecificUserAnnouncement = async (req, res) => {
  const { userId, title, message, eventId } = req.body;

  try {
    await AnnouncementModel.createAnnouncement(title, message, [userId], eventId);
    
    res.status(201).json({ message: "Notification sent to user." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const markRead = async (req, res) => {
  const { announcementId, userId } = req.body;
  try {
    await AnnouncementModel.markAsRead(announcementId, userId);
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getAnnouncements, createGlobalAnnouncement, createEventAnnouncement, createSpecificUserAnnouncement, markRead };
