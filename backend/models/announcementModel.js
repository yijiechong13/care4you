const { supabase } = require('../config/supabase');

const AnnouncementModel = {
  findGlobalAnnouncement: async () => {
    const { data, error } = await supabase
      .from('announcements')
      .select("*")
      .eq('related_event_id', null)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);

    return data.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      createdAt: item.created_at,
    }));
  },

  findAnnouncementByRecipient: async (userId) => {
    const { data, error } = await supabase
      .from('announcements')
      .select(`
        id,
        title,
        message,
        related_event_id,
        created_at,
        announcement_recipients!inner (
          is_read,
          user_id
        )
      `)
      .eq('announcement_recipients.user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    // Flatten the structure for the frontend
    return data.map(item => ({
      id: item.id,
      title: item.title,
      message: item.message,
      relatedEventId: item.related_event_id,
      createdAt: item.created_at,
      isRead: item.announcement_recipients[0]?.is_read || false
    }));
  },
 
  // Handles announcement for global, event or single user 
  createAnnouncement: async (title, message, userIds, eventId = null) => {
    if (!userIds || userIds.length === 0) return null;

    // Create the base announcement
    const { data: announcement, error: msgError } = await supabase
      .from('announcements')
      .insert([{ 
        title, 
        message, 
        related_event_id: eventId 
      }])
      .select()
      .single();

    if (msgError) throw new Error(msgError.message);

    // Create a row in database for every recipient
    const recipientPayload = userIds.map(uid => ({
      announcement_id: announcement.id,
      user_id: uid,
      is_read: false
    }));

    const { error: linkError } = await supabase
      .from('announcement_recipients')
      .insert(recipientPayload);

    if (linkError) {
      console.error("❌ Error linking recipients:", linkError.message);
      
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcement.id);

      if (deleteError) {
        console.error("💀 CRITICAL: Failed to delete orphan announcement:", deleteError.message);
      } else {
        console.log("✅ Successfully rolled back (deleted) orphan announcement.");
      }

      throw new Error(`Failed to send to recipients: ${linkError.message}`);
    }

    return announcement;
  },

  markAsRead: async (announcementId, userId) => {
    const { error } = await supabase
      .from('announcement_recipients')
      .update({ is_read: true })
      .eq('announcement_id', announcementId)
      .eq('user_id', userId);

    if (error) throw new Error(error.message);
  }
};

module.exports = { AnnouncementModel };