import { supabase } from "@/integrations/supabase/client";

export interface SupportRequest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  status: 'new' | 'resolved';
  created_at: string;
}

export const supportService = {
  async createSupportRequest(data: { name: string; email: string; phone?: string; message: string }) {
    const { error } = await supabase
      .from('support_requests' as any)
      .insert([data as any]);

    if (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
    
    // Return success without data (RLS prevents reading for non-admins)
    return { success: true };
  },

  async getAllSupportRequests() {
    const { data, error } = await supabase
      .from('support_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support requests:', error);
      throw error;
    }
    return data as unknown as SupportRequest[];
  },

  async updateSupportRequestStatus(id: string, status: 'new' | 'resolved') {
    const { data, error } = await supabase
      .from('support_requests' as any)
      .update({ status } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating support request:', error);
      throw error;
    }
    return data;
  }
};