const { supabase } = require('../config/supabase');

const RegistrationModel = {
  // Create a new registration with answers
  createWithAnswers: async (registrationData, answers) => {
    console.log("🔍 Model: Creating registration with answers...");

    // 1. Create the registration
    const { data: registration, error: regError } = await supabase
      .from('registrations')
      .insert([{
        event_id: registrationData.eventId,
        user_id: registrationData.userId,
        special_requirements: registrationData.specialRequirements,
        is_guest: registrationData.isGuest,
        guest_name: registrationData.guestName,
        guest_contact: registrationData.guestContact,
        guest_emergency_contact: registrationData.guestEmergencyContact,
      }])
      .select()
      .single();

    if (regError) {
      console.error("❌ Model: Registration Error:", regError.message);
      throw new Error(regError.message);
    }

    const registrationId = registration.id;
    console.log("✅ Model: Registration created with ID:", registrationId);

    // 2. Save answers to registration_answers table
    if (answers && answers.length > 0) {
      const answersPayload = answers.map(answer => ({
        registration_id: registrationId,
        question_id: answer.questionId,
        selected_option_id: answer.selectedOptionId,
      }));

      const { error: answersError } = await supabase
        .from('registration_answers')
        .insert(answersPayload);

      if (answersError) {
        console.error("❌ Model: Answers Error:", answersError.message);
        throw new Error(answersError.message);
      }

      console.log("✅ Model: Saved", answers.length, "answers");
    }

    return registration;
  },

  // Check if user already registered for an event
  checkExisting: async (eventId, userId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is fine)
      throw new Error(error.message);
    }

    return data; // Returns registration if exists, null if not
  },

  // Get all registrations for an event
  findByEventId: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get all registrations for a user
  findByUserId: async (userId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select('*, events(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }
};

module.exports = { RegistrationModel };
