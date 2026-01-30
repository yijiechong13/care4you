const { EventModel } = require("../models/eventModel");
const {
  translateFieldsWithCache,
  translateTextsWithCache,
} = require("../services/translationCacheService");

const getEvents = async (req, res) => {
  try {
    const events = await EventModel.findAll();
    const lang = (req.query.lang || "en").toLowerCase();

    const titles = events.map((event) => event.title || "");
    const reminders = events.map((event) => event.reminders || "");
    const tags = events.map((event) => event.tag || "");
    const locations = events.map((event) => event.location || "");

    const [
      translatedTitles,
      translatedReminders,
      translatedTags,
      translatedLocations,
    ] = await Promise.all([
      translateTextsWithCache(titles, lang),
      translateTextsWithCache(reminders, lang),
      translateTextsWithCache(tags, lang),
      translateTextsWithCache(locations, lang, {
        forceTranslate: lang === "zh",
      }),
    ]);

    const translatedEvents = events.map((event, index) => ({
      ...event,
      title: translatedTitles[index] || event.title,
      reminders: translatedReminders[index] || event.reminders,
      tag: translatedTags[index] || event.tag,
      location: translatedLocations[index] || event.location,
    }));

    res.status(200).json(translatedEvents);
  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const createEvent = async (req, res) => {
  try {
    const { questions, ...eventData } = req.body;

    if (eventData.images && eventData.images.length > 0) {
      const processedImages = await Promise.all(
        eventData.images.map(async (img) => {
          // If the frontend sent base64 data, upload it
          if (img.base64) {
            console.log("📸 Uploading image to Supabase...");
            const publicUrl = await EventModel.uploadBase64Image(img.base64);

            // Return the image object with the NEW cloud URL
            // The Model expects 'uri', so we overwrite 'uri' with the publicUrl
            return {
              ...img,
              uri: publicUrl,
              base64: undefined, // Clear huge string from memory
            };
          }
          return img;
        }),
      );

      // Update eventData with the new array containing Supabase URLs
      eventData.images = processedImages;
    }

    const eventId = await EventModel.createWithQuestions(eventData, questions);

    try {
      const baseFields = {
        title: eventData.title,
        reminders: eventData.reminders,
        tag: eventData.tag,
      };

      await translateFieldsWithCache(baseFields, "en");
      await translateFieldsWithCache(baseFields, "zh");
      await translateTextsWithCache([eventData.location || ""], "en");
      await translateTextsWithCache([eventData.location || ""], "zh", {
        forceTranslate: true,
      });

      const questionTexts = [];
      const optionTexts = [];
      (questions || []).forEach((question) => {
        if (question?.title) questionTexts.push(question.title);
        (question?.options || []).forEach((option) => {
          if (option) optionTexts.push(option);
        });
      });

      await translateTextsWithCache(questionTexts, "en");
      await translateTextsWithCache(questionTexts, "zh", {
        forceTranslate: true,
      });
      await translateTextsWithCache(optionTexts, "en");
      await translateTextsWithCache(optionTexts, "zh", {
        forceTranslate: true,
      });
    } catch (translationError) {
      console.error("❌ Translation Cache Error:", translationError.message);
    }

    res.status(201).json({
      message: "Event published successfully",
      eventId,
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
    const lang = (req.query.lang || "en").toLowerCase();

    const questionTexts = questions.map(
      (question) => question.questionText || "",
    );
    const optionTexts = questions.flatMap((question) =>
      (question.options || []).map((option) => option.optionText || ""),
    );

    const forceTranslate = lang === "zh";
    const [translatedQuestions, translatedOptions] = await Promise.all([
      translateTextsWithCache(questionTexts, lang, { forceTranslate }),
      translateTextsWithCache(optionTexts, lang, { forceTranslate }),
    ]);

    let optionIndex = 0;
    const hydrated = questions.map((question, qIndex) => {
      const options = (question.options || []).map((option) => {
        const translatedOption =
          translatedOptions[optionIndex] || option.optionText;
        optionIndex += 1;
        return { ...option, optionText: translatedOption };
      });

      return {
        ...question,
        questionText: translatedQuestions[qIndex] || question.questionText,
        options,
      };
    });

    res.status(200).json(hydrated);
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
      eventId,
      imageUrl,
      displayOrder,
      isPrimary,
      caption,
      userId,
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
    res.status(200).json({ message: "Image deleted" });
  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

const cancelEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    // We update the status to 'cancelled'
    const updatedEvent = await EventModel.updateStatus(eventId, "cancelled");

    res.status(200).json({
      message: "Event cancelled successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("❌ Cancel Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getEvents,
  createEvent,
  getEventQuestions,
  getEventImages,
  addEventImage,
  deleteEventImage,
  cancelEvent,
};
