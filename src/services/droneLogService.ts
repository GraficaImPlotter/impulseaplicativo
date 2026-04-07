import { supabase } from '@/integrations/supabase/client';

export interface DroneServiceLog {
  id: string;
  drone_service_id: string;
  message: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

export const droneLogService = {
  async getByServiceId(serviceId: string): Promise<DroneServiceLog[]> {
    const { data, error } = await (supabase
      .from('drone_service_logs' as any) as any)
      .select('*')
      .eq('drone_service_id', serviceId)
      .order('created_at', { ascending: true }); // Chat order

    if (error) throw error;
    return (data || []) as DroneServiceLog[];
  },

  async create(serviceId: string, message: string, userName: string): Promise<DroneServiceLog> {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await (supabase
      .from('drone_service_logs' as any) as any)
      .insert({
        drone_service_id: serviceId,
        message,
        created_by: user?.id,
        created_by_name: userName,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DroneServiceLog;
  }
};
