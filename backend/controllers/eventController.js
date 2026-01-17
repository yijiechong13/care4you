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
    const { questions, ...eventData } = req.body;

    const eventId = await EventModel.createWithQuestions(eventData, questions);

    res.status(201).json({ 
      message: "Event published successfully", 
      eventId 
    });

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const getEventQuestions = async (req, res) => {
  try {
    const { eventId } = req.params;
    const questions = await EventModel.getQuestionsWithOptions(eventId);
    res.status(200).json(questions);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getEvents, createEvent, getEventQuestions };