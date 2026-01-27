const { supabase } = require("../config/supabase");
const User = require("./userModel");

const RegistrationModel = {
  // Create a new registration with answers
  createWithAnswers: async (registrationData, answers) => {
    console.log("🔍 Model: Creating registration with answers...");
    const isGuest = registrationData.userId.toString().startsWith("guest_");

    // 1. Create the registration
    const { data: registration, error: regError } = await supabase
      .from("registrations")
      .insert([
        {
          event_id: registrationData.eventId,
          user_id: registrationData.userId,
          special_requirements: registrationData.specialRequirements,
          emergency_contact: registrationData.emergencyContact,
          guest_name: isGuest ? registrationData.guest_name : null,
          guest_contact: isGuest ? registrationData.guest_contact : null,
          guest_emergency_contact: isGuest
            ? registrationData.emergencyContact
            : null,
          status: registrationData.status,
        },
      ])
      .select()
      .single();

    if (regError) {
      console.error("❌ Model: Registration Error:", regError.message);
      throw new Error(regError.message);
    }

    const registrationId = registration.id;
    console.log("✅ Model: Registration created with ID:", registrationId);

    if (registrationData.status == "confirmed") {
      const { data: eventRow } = await supabase
        .from("events")
        .select("taken_slots, volunteer_taken_slots")
        .eq("id", registrationData.eventId)
        .single();

      if (!isGuest) {
        // ONLY check the users table for REAL members
        const { data: userRow } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", registrationData.userId)
          .single();

        const userType = (userRow?.user_type || "").toLowerCase();

        if (userType === "volunteer") {
          await supabase
            .from("events")
            .update({
              volunteer_taken_slots: (eventRow?.volunteer_taken_slots || 0) + 1,
            })
            .eq("id", registrationData.eventId);
        } else {
          await supabase
            .from("events")
            .update({ taken_slots: (eventRow?.taken_slots || 0) + 1 })
            .eq("id", registrationData.eventId);
        }
      } else {
        // For Guests, skip user lookup and just increment participant slots
        await supabase
          .from("events")
          .update({ taken_slots: (eventRow?.taken_slots || 0) + 1 })
          .eq("id", registrationData.eventId);
      }
    }

    // 2. Save answers to registration_answers table
    if (answers && answers.length > 0) {
      const answersPayload = answers.map((answer) => ({
        registration_id: registrationId,
        question_id: answer.questionId,
        selected_option_id: answer.selectedOptionId,
      }));

      const { error: answersError } = await supabase
        .from("registration_answers")
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
      .from("registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (which is fine)
      throw new Error(error.message);
    }

    return data; // Returns registration if exists, null if not
  },

  // Get all registrations for an event
  findByEventId: async (eventId) => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get all registrations for a user
  findByUserId: async (userId) => {
    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        *,
        events(*),
        registration_answers(
          question_id,
          selected_option_id,
          event_questions:question_id(question_text),
          question_options:selected_option_id(option_text)
        )
      `,
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  },

  // Get detailed registrations for export (CSV)
  getDetailedByEventId: async (eventId) => {
    const { data, error } = await supabase
      .from("registrations")
      .select(
        `
        id,
        user_id,
        created_at,
        special_requirements,
        emergency_contact,
        guest_name,
        guest_contact,
        guest_emergency_contact,
        registration_answers(
          question_id,
          selected_option_id,
          event_questions:question_id(question_text, display_order),
          question_options:selected_option_id(option_text, display_order)
        )
      `,
      )
      .eq("event_id", eventId)
      .filter("status", "eq", "confirmed")
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);

    // Get registered user IDs (non-guests)
    const userIds = data
      .filter((reg) => !reg.user_id.toString().startsWith("guest_"))
      .map((reg) => reg.user_id);

    // Fetch user details for registered users
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email, phone, user_type")
        .in("id", userIds);

      if (users) {
        usersMap = users.reduce((acc, user) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }
    }

    // Transform data for export
    return data.map((reg, index) => {
      const isGuest = reg.user_id.toString().startsWith("guest_");
      const user = usersMap[reg.user_id] || null;

      const responses = (reg.registration_answers || [])
        .slice()
        .sort((a, b) => {
          const aOrder = a.event_questions?.display_order ?? 0;
          const bOrder = b.event_questions?.display_order ?? 0;
          return aOrder - bOrder;
        })
        .map((answer) => {
          const question = answer.event_questions?.question_text || "Question";
          const option = answer.question_options?.option_text || "N/A";
          return `${question}: ${option}`;
        })
        .join(" | ");

      return {
        sn: index + 1,
        name: isGuest ? (reg.guest_name || "N/A") : (user?.name || "N/A"),
        email: isGuest ? "N/A" : (user?.email || "N/A"),
        contact: isGuest ? (reg.guest_contact || "N/A") : (user?.phone || "N/A"),
        emergencyContact:
          reg.emergency_contact || reg.guest_emergency_contact || "N/A",
        userType: isGuest ? "Guest" : (user?.user_type || "Participant"),
        specialRequirements: reg.special_requirements || "",
        responses,
        registeredAt: new Date(reg.created_at).toLocaleDateString(),
        attendance: "", // Empty for staff to fill in
      };
    });
  },

  // Get registration counts by user type for multiple events
  getCountsByEventIds: async (eventIds) => {
    if (!eventIds || eventIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from("registrations")
      .select("event_id, users:user_id(user_type)")
      .in("event_id", eventIds);

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

      const userType = (row.users?.user_type || "").toLowerCase();
      const status = row.status;
      if (userType === "volunteer" && status == "confirmed") {
        counts[eventId].volunteer += 1;
      } else if (userType === "participant" && status == "confirmed") {
        counts[eventId].participant += 1;
      }

      if (status == "confirmed") {
        counts[eventId].total += 1;
      }
    });

    return counts;
  },

  findRegistrationById: async (id) => {
    const { data, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateStatus: async (id, status) => {
    const { data, error } = await supabase
      .from("registrations")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  // Find the next person on the waitlist for a specific role
  findNextWaitlistCandidate: async (eventId, requiredType) => {
    const { data: registrations, error } = await supabase
      .from("registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("status", "waitlist")
      .order("created_at", { ascending: true }); // Oldest first

    if (error) throw new Error(error.message);
    if (!registrations || registrations.length === 0) return null;

    // Separate real users from guests
    const realUserIds = registrations
      .filter(reg => !reg.user_id.toString().startsWith("guest_"))
      .map(reg => reg.user_id);

    let userTypeMap = {};
    if (realUserIds.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, user_type")
        .in("id", realUserIds);
      
      // Create a lookup: { "user_123": "volunteer", "user_456": "participant" }
      if (users) {
        users.forEach(user => {
          userTypeMap[user.id] = (user.user_type || "participant").toLowerCase();
        });
      }
    }

    // Find the first match
    const candidate = registrations.find((reg) => {
      let regType = "participant"; // Default

      if (reg.user_id.toString().startsWith("guest_")) {
        // ✅ GUESTS are automatically Participants
        regType = "participant";
      } else {
        // ✅ USERS get looked up from our map
        regType = userTypeMap[reg.user_id] || "participant";
      }

      return regType === requiredType.toLowerCase();
    });

    return candidate || null;
  },
};

module.exports = { RegistrationModel };
