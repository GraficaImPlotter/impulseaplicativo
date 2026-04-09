import { supabase } from "@/integrations/supabase/client";

export type UpdateType = 'feature' | 'fix' | 'improvement' | 'notice';

export interface SystemUpdate {
  id: string;
  title: string;
  description: string;
  type: UpdateType;
  created_at: string;
  created_by?: string;
  is_read?: boolean;
}

export const updateService = {
  /**
   * Fetches all system updates and marks which ones have been read by the current user
   */
  async getUpdates(): Promise<SystemUpdate[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Fetch all updates
    const { data: updates, error: updateError } = await supabase
      .from('system_updates')
      .select('*')
      .order('created_at', { ascending: false });

    if (updateError) throw updateError;

    // Fetch read status for this user
    const { data: readStatuses, error: readError } = await supabase
      .from('system_update_reads')
      .select('update_id')
      .eq('user_id', user.id);

    if (readError) throw readError;

    const readIds = new Set(readStatuses?.map(r => r.update_id) || []);

    return (updates || []).map(u => ({
      ...u,
      is_read: readIds.has(u.id)
    }));
  },

  /**
   * Returns the count of updates that the current user hasn't read yet
   */
  async getUnreadCount(): Promise<number> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const { data: updates, error: updateError } = await supabase
      .from('system_updates')
      .select('id');

    if (updateError) throw updateError;

    const { data: readStatuses, error: readError } = await supabase
      .from('system_update_reads')
      .select('update_id')
      .eq('user_id', user.id);

    if (readError) throw readError;

    const readIds = new Set(readStatuses?.map(r => r.update_id) || []);
    return (updates || []).filter(u => !readIds.has(u.id)).length;
  },

  /**
   * Marks a specific update as read for the current user
   */
  async markAsRead(updateId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('system_update_reads')
      .upsert({ 
        user_id: user.id, 
        update_id: updateId 
      }, { onConflict: 'user_id,update_id' });

    if (error) throw error;
  },

  /**
   * Marks ALL updates as read for the current user
   */
  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: updates } = await supabase.from('system_updates').select('id');
    if (!updates || updates.length === 0) return;

    const readEntries = updates.map(u => ({
      user_id: user.id,
      update_id: u.id
    }));

    const { error } = await supabase
      .from('system_update_reads')
      .upsert(readEntries, { onConflict: 'user_id,update_id' });

    if (error) throw error;
  },

  /**
   * Creates a new update entry (MASTER/DEV only)
   */
  async createUpdate(title: string, description: string, type: UpdateType): Promise<SystemUpdate> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('system_updates')
      .insert({
        title,
        description,
        type,
        created_by: user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Deletes an update entry (MASTER/DEV only)
   */
  async deleteUpdate(id: string): Promise<void> {
    const { error } = await supabase
      .from('system_updates')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
