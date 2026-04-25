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
      .neq("message", `cb-${Date.now()}`) // Cache-Buster auf Text-Spalte (UUID-Spalte 'id' wirft 400 Error)
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
    const channelName = `chat:${userId}`;
    
    // Entferne existierenden Channel falls vorhanden
    supabase.removeChannel(supabase.channel(channelName));
    
    // Erstelle neuen Channel mit korrekter Reihenfolge
    const channel = supabase
      .channel(channelName)
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
    
    return channel;
  },

  async sendWelcomeMessage(userId: string, userName: string): Promise<boolean> {
    try {
      // Prüfe ob User bereits eine Begrüßungsnachricht bekommen hat
      const { data: existingMessages } = await supabase
        .from("chat_messages")
        .select("id")
        .eq("user_id", userId)
        .eq("is_admin", true)
        .limit(1);

      // Wenn bereits eine Nachricht vom Admin existiert, keine neue senden
      if (existingMessages && existingMessages.length > 0) {
        return false;
      }

      // Erstelle Begrüßungsnachricht vom Kundenberater
      const welcomeText = `Willkommen ${userName}! Schreiben Sie uns gerne hier falls Sie Fragen haben.`;

      const { error } = await supabase
        .from("chat_messages")
        .insert({
          user_id: userId,
          message: welcomeText,
          is_admin: true
        });

      if (error) {
        console.error("Error sending welcome message:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in sendWelcomeMessage:", error);
      return false;
    }
  }
};