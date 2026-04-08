import { supabase } from "@/integrations/supabase/client";

export interface DirectMessage {
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  message: string;
  timestamp: string;
}

const DM_CHANNEL = 'direct-messages-v1';

export const directMessageService = {
  /**
   * Initializes a subscription to the global DM channel and listens for events directed to `myUserId`.
   */
  subscribe(myUserId: string, onMessageReceived: (msg: DirectMessage) => void) {
    const channel = supabase.channel(DM_CHANNEL);

    channel
      .on('broadcast', { event: 'dm' }, ({ payload }) => {
        // Only trigger the callback if the message is directed to me
        if (payload.toUserId === myUserId) {
          onMessageReceived(payload as DirectMessage);
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[DM] Subscribed successfully to DMs for user ${myUserId}`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Dispatches a broadcast event containing the message payload
   */
  async sendMessage(dm: DirectMessage) {
    const channel = supabase.channel(DM_CHANNEL);
    
    // We send via an active channel, so we do a quick subscribe if necessary, or just send
    // Supabase allows sending broadcasts on a channel if you just reference it.
    return await channel.send({
      type: 'broadcast',
      event: 'dm',
      payload: dm
    });
  }
};
