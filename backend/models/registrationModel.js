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
        emergency_contact: registrationData.emergencyContact,
        guest_name: null,
        guest_contact: null,
        guest_emergency_contact: null,
      }])
      .select()
      .single();

    if (regError) {
      console.error("❌ Model: Registration Error:", regError.message);
      throw new Error(regError.message);
    }

    const registrationId = registration.id;
    console.log("✅ Model: Registration created with ID:", registrationId);

    if (registrationData.userId) {
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', registrationData.userId)
        .single();

      if (userError) throw new Error(userError.message);

      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .select('taken_slots, volunteer_taken_slots')
        .eq('id', registrationData.eventId)
        .single();

      if (eventError) throw new Error(eventError.message);

      const userType = (userRow?.user_type || '').toLowerCase();
      if (userType === 'volunteer') {
        const nextVolunteers = (eventRow?.volunteer_taken_slots || 0) + 1;
        const { error: updateError } = await supabase
          .from('events')
          .update({ volunteer_taken_slots: nextVolunteers })
          .eq('id', registrationData.eventId);
        if (updateError) throw new Error(updateError.message);
      } else {
        const nextParticipants = (eventRow?.taken_slots || 0) + 1;
        const { error: updateError } = await supabase
          .from('events')
          .update({ taken_slots: nextParticipants })
          .eq('id', registrationData.eventId);
        if (updateError) throw new Error(updateError.message);
      }
    }

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
      .select(`
        *,
        events(*),
        registration_answers(
          question_id,
          selected_option_id,
          event_questions:question_id(question_text),
          question_options:selected_option_id(option_text)
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get detailed registrations for export (CSV)
  getDetailedByEventId: async (eventId) => {
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        id,
        created_at,
        special_requirements,
        emergency_contact,
        guest_name,
        guest_contact,
        guest_emergency_contact,
        users:user_id(id, name, email, phone, user_type),
        registration_answers(
          question_id,
          selected_option_id,
          event_questions:question_id(question_text, display_order),
          question_options:selected_option_id(option_text, display_order)
        )
      `)
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    // Transform data for export
    return data.map((reg, index) => {
      const responses = (reg.registration_answers || [])
        .slice()
        .sort((a, b) => {
          const aOrder = a.event_questions?.display_order ?? 0;
          const bOrder = b.event_questions?.display_order ?? 0;
          return aOrder - bOrder;
        })
        .map((answer) => {
          const question = answer.event_questions?.question_text || 'Question';
          const option = answer.question_options?.option_text || 'N/A';
          return `${question}: ${option}`;
        })
        .join(' | ');

      return {
        sn: index + 1,
      name: reg.guest_name || reg.users?.name || 'N/A',
      email: reg.users?.email || 'N/A',
      contact: reg.guest_contact || reg.users?.phone || 'N/A',
      emergencyContact: reg.emergency_contact || reg.guest_emergency_contact || 'N/A',
        userType: reg.users?.user_type || 'Participant',
        specialRequirements: reg.special_requirements || '',
        responses,
        registeredAt: new Date(reg.created_at).toLocaleDateString(),
        attendance: '', // Empty for staff to fill in
      };
    });
  },

  // Get registration counts by user type for multiple events
  getCountsByEventIds: async (eventIds) => {
    if (!eventIds || eventIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('registrations')
      .select('event_id, users:user_id(user_type)')
      .in('event_id', eventIds);

    if (error) throw new Error(error.message);

    const counts = {};
    eventIds.forEach((id) => {
      counts[id] = { volunteer: 0, participant: 0, total: 0 };
    });

    data.forEach((row) => {
      const eventId = row.event_id;
      if (!counts[eventId]) {
        counts[eventId] = { volunteer: 0, participant: 0, total: 0 };
      }

      const userType = (row.users?.user_type || '').toLowerCase();
      if (userType === 'volunteer') {
        counts[eventId].volunteer += 1;
      } else if (userType === 'participant') {
        counts[eventId].participant += 1;
      } else {
        counts[eventId].participant += 1;
      }

      counts[eventId].total += 1;
    });

    return counts;
  },
};

module.exports = { RegistrationModel };
