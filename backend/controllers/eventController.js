const { EventModel } = require('../models/eventModel');

const getEvents = async (req, res) => {
  try {
    const events = await EventModel.findAll();
    res.status(200).json(events);
  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    if (!req.body.title) return res.status(400).send("Title required");

    const newEvent = await EventModel.create(req.body);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getEvents, createEvent };