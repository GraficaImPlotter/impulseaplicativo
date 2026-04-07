import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

export type CostCenter = Database['public']['Tables']['cost_centers']['Row'];

export const costCenterService = {
  async getAll(): Promise<CostCenter[]> {
    const { data, error } = await supabase
      .from('cost_centers')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  },

  async create(name: string): Promise<CostCenter> {
    const { data, error } = await supabase
      .from('cost_centers')
      .insert({ name })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
