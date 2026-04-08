import { supabase } from "@/integrations/supabase/client";

export interface SystemAnnouncement {
  message: string;
  type: 'update' | 'info' | 'warning';
  timestamp: string;
}

const CHANNEL_NAME = 'system-announcements';

export const announcementService = {
  /**
   * Sends an announcement to all connected users
   */
  async broadcastAnnouncement(message: string, type: SystemAnnouncement['type'] = 'update') {
    const payload: SystemAnnouncement = {
      message,
      type,
      timestamp: new Date().toISOString()
    };

    return await supabase.channel(CHANNEL_NAME).send({
      type: 'broadcast',
      event: 'message',
      payload
    });
  },

  /**
   * Subscribes to the announcement channel
   */
  subscribe(callback: (announcement: SystemAnnouncement) => void) {
    const channel = supabase.channel(CHANNEL_NAME);
    
    channel
      .on('broadcast', { event: 'message' }, (payload) => {
        callback(payload.payload as SystemAnnouncement);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
