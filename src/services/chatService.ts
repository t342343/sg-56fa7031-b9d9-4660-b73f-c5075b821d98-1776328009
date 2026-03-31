import { supabase } from "@/integrations/supabase/client";

export const chatService = {
  async sendMessage(userId: string, message: string, isAdmin: boolean = false) {
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        message,
        is_admin: isAdmin
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMessages(userId: string) {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getAllChats() {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(`
        *,
        profiles!chat_messages_user_id_fkey(full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async markAsRead(messageId: string) {
    const { error } = await supabase
      .from("chat_messages")
      .update({ read: true })
      .eq("id", messageId);

    if (error) throw error;
  },

  subscribeToMessages(userId: string, callback: (message: any) => void) {
    return supabase
      .channel(`chat:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `user_id=eq.${userId}`
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  }
};