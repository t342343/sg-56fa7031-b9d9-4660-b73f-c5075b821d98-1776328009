import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileInsert = Database["public"]["Tables"]["profiles"]["Insert"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export const profileService = {
  async getCurrentProfile(): Promise<Profile | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return null;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }

    return data;
  },

  async getAllProfiles(): Promise<Profile[]> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching profiles:", error);
      return [];
    }

    return data || [];
  },

  async updateProfile(id: string, updates: ProfileUpdate): Promise<boolean> {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", id);

    if (error) {
      console.error("Error updating profile:", error);
      return false;
    }

    return true;
  },

  async createProfile(profile: ProfileInsert): Promise<Profile | null> {
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      console.error("Error creating profile:", error);
      return null;
    }

    return data;
  },

  async isAdmin(): Promise<boolean> {
    const profile = await this.getCurrentProfile();
    return profile?.role === "admin";
  }
};