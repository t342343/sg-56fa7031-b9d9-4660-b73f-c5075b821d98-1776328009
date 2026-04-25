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
    const { data: result, error } = await supabase
      .from('support_requests')
      .insert([data])
      .select()
      .single();

    if (error) {
      console.error('Error creating support request:', error);
      throw error;
    }
    return result;
  },

  async getAllSupportRequests() {
    const { data, error } = await supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching support requests:', error);
      throw error;
    }
    return data as SupportRequest[];
  },

  async updateSupportRequestStatus(id: string, status: 'new' | 'resolved') {
    const { data, error } = await supabase
      .from('support_requests')
      .update({ status })
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