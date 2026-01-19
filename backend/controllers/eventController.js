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

const getEventImages = async (req, res) => {
  try {
    const { eventId } = req.params;
    const images = await EventModel.getEventImages(eventId);
    res.status(200).json(images);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const addEventImage = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { imageUrl, displayOrder, isPrimary, caption, userId } = req.body;
    const image = await EventModel.addEventImage(
      eventId, imageUrl, displayOrder, isPrimary, caption, userId
    );
    res.status(201).json(image);
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const deleteEventImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    await EventModel.deleteEventImage(imageId);
    res.status(200).json({ message: 'Image deleted' });
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { getEvents, createEvent, getEventQuestions, getEventImages, addEventImage, deleteEventImage };