import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { chatService } from "./chatService";
import { walletService } from "./walletService";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/**
 * Helper function to get the current URL for auth redirects
 */
const getRedirectURL = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/confirm-email`;
  }
  return "http://localhost:3000/auth/confirm-email";
};

export const authService = {
  /**
   * Sign up a new user (ohne Email-Bestätigung)
   */
  async signUp(email: string, password: string) {
    try {
      console.log("🔍 [AUTH SERVICE] signUp called with email:", email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectURL(),
          data: {
            email_confirm: false // Keine Email-Bestätigung erforderlich
          }
        },
      });

      if (error) {
        console.error("❌ [AUTH SERVICE] SignUp error:", error);
        return { user: null, error };
      }

      console.log("✅ [AUTH SERVICE] SignUp successful, user created:", data.user?.id);
      return { user: data.user, error: null };
    } catch (err) {
      console.error("❌ [AUTH SERVICE] SignUp exception:", err);
      return { user: null, error: err as any };
    }
  },

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    try {
      console.log("🔐 [AUTH] Starting signIn attempt for:", email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔐 [AUTH] signInWithPassword response:", { 
        hasData: !!data, 
        hasError: !!error,
        errorDetails: error 
      });

      if (error) {
        console.error("❌ [AUTH] Login error:", error);
        throw error;
      }

      console.log("✅ [AUTH] Login successful for:", email);
      return data;
    } catch (error: any) {
      console.error("❌ [AUTH] Login exception:", error);
      throw error;
    }
  },

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("SignOut error:", error);
      }
      return { error };
    } catch (err) {
      console.error("SignOut exception:", err);
      return { error: err as any };
    }
  },

  /**
   * Get the current user session
   */
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("GetSession error:", error);
        return null;
      }

      if (session?.user) {
        // Hole Profil-Daten für Begrüßungsnachricht
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", session.user.id)
          .single();

        // Sende automatische Begrüßungsnachricht vom Kundenberater
        if (profile) {
          const userName = profile.full_name || session.user.email?.split("@")[0] || "User";
          await chatService.sendWelcomeMessage(session.user.id, userName);
        }
      }

      return session;
    } catch (err) {
      console.error("GetSession exception:", err);
      return null;
    }
  },

  /**
   * Get the current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("GetUser error:", error);
        return null;
      }
      return user;
    } catch (err) {
      console.error("GetUser exception:", err);
      return null;
    }
  },

  /**
   * Update user password
   */
  async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error("UpdatePassword error:", error);
        return { error };
      }

      return { error: null, data };
    } catch (err) {
      console.error("UpdatePassword exception:", err);
      return { error: err as any };
    }
  },

  /**
   * OAuth Sign In
   */
  async signInWithOAuth(provider: "google" | "github") {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error("OAuth error:", error);
        return { error };
      }

      return { error: null, data };
    } catch (err) {
      console.error("OAuth exception:", err);
      return { error: err as any };
    }
  },
};