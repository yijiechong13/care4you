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

  create: async (eventData) => {
    const { data, error } = await supabase
      .from('events')
      .insert([eventData])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = { EventModel };