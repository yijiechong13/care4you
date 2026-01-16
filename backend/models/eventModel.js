const { supabase } = require('../config/supabase');

const EventModel = {
  findAll: async () => {
    console.log("🔍 Backend: Attempting to fetch events from Supabase...");

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_time', { ascending: true });
      
    if (error) {
      console.error("❌ Backend: Supabase Error:", error.message);
      throw new Error(error.message);
    }

    console.log("✅ Backend: Supabase returned:", data.length, "rows");
    return data;
  },

  createWithQuestions: async (eventData, questions) => {
    console.log("🔍 Model: Creating event with questions...");

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert([{
        title: eventData.title,
        location: eventData.location,
        start_time: eventData.startTime,
        end_time: eventData.endTime,
        total_slots: eventData.totalSlots,
        taken_slots: 0,
        tag: eventData.tag,
        reminders: eventData.reminders,
        image_url: eventData.imageUrl
      }])
      .select()
      .single();

    if (eventError) throw new Error(eventError.message);
    const eventId = event.id;

    if (questions && questions.length > 0) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const { data: questionData, error: qError } = await supabase
          .from('event_questions')
          .insert([{
            event_id: eventId,
            question_text: q.title,
            display_order: i
          }])
          .select()
          .single();

        if (qError) throw new Error(qError.message);

        if (q.options && q.options.length > 0) {
          const optionsPayload = q.options.map((optText, index) => ({
            question_id: questionData.id,
            option_text: optText,
            display_order: index
          }));

          const { error: oError } = await supabase
            .from('question_options')
            .insert(optionsPayload);

          if (oError) throw new Error(oError.message);
        }
      }
    }

    return eventId; // Return the ID to the controller
  }
};

module.exports = { EventModel };