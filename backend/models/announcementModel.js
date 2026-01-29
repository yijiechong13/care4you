const { supabase } = require('../config/supabase');

const AnnouncementModel = {
  findAll: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false }); // Then newest dates

    if (error) throw new Error(error.message);
    return data;
  },

  // Create a new announcement
  create: async (title, message, location) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert([{ title, message, location }])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = { AnnouncementModel };