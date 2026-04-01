import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BitcoinWallet = Database["public"]["Tables"]["bitcoin_wallets"]["Row"];
type WalletInsert = Database["public"]["Tables"]["bitcoin_wallets"]["Insert"];

export const walletService = {
  async getWalletForUser(userId: string): Promise<BitcoinWallet | null> {
    const { data, error } = await supabase
      .from("bitcoin_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching wallet:", error);
      return null;
    }

    return data;
  },

  async getAllWallets(): Promise<BitcoinWallet[]> {
    const { data, error } = await supabase
      .from("bitcoin_wallets")
      .select("*")
      .order("assigned_at", { ascending: false });

    if (error) {
      console.error("Error fetching wallets:", error);
      return [];
    }

    return data || [];
  },

  async assignWallet(userId: string, walletAddress: string, assignedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from("bitcoin_wallets")
      .insert({
        user_id: userId,
        wallet_address: walletAddress,
        assigned_by: assignedBy
      });

    if (error) {
      console.error("Error assigning wallet:", error);
      return false;
    }

    return true;
  },

  async updateWallet(walletId: string, newAddress: string) {
    console.log("💾 Updating wallet:", walletId, "to address:", newAddress);
    
    const { data, error } = await supabase
      .from("bitcoin_wallets")
      .update({ wallet_address: newAddress })
      .eq("id", walletId)
      .select()
      .single();

    if (error) {
      console.error("❌ Error updating wallet:", error);
      throw error;
    }

    console.log("✅ Wallet updated:", data);
    return data;
  },

  async deleteWallet(walletId: string): Promise<boolean> {
    const { error } = await supabase
      .from("bitcoin_wallets")
      .delete()
      .eq("id", walletId);

    if (error) {
      console.error("Error deleting wallet:", error);
      return false;
    }

    return true;
  },

  async updateCountdownDays(walletId: string, days: number) {
    const { data, error } = await supabase
      .from("bitcoin_wallets")
      .update({ countdown_days: days })
      .eq("id", walletId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};