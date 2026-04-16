import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BitcoinWallet = Database["public"]["Tables"]["bitcoin_wallets"]["Row"];
type WalletInsert = Database["public"]["Tables"]["bitcoin_wallets"]["Insert"];

export const walletService = {
  async getWalletForUser(userId: string): Promise<BitcoinWallet | null> {
    // Timestamp für Cache-Busting (verhindert aggressives Caching von Coolify/Browser)
    const timestamp = new Date().getTime().toString();
    
    const { data, error } = await supabase
      .from("bitcoin_wallets")
      .select("*")
      .eq("user_id", userId)
      .neq("assigned_by", `cache_bust_${timestamp}`) // Fake-Filter zwingt zu frischem DB-Abruf
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

    // Pool-Status aktualisieren
    await supabase
      .from("wallet_pool")
      .update({ assigned_to_user_id: userId })
      .eq("wallet_address", walletAddress);

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
  },

  // ========================================
  // WALLET POOL FUNKTIONEN
  // ========================================
  async getWalletPool() {
    const { data, error } = await supabase
      .from("wallet_pool")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching wallet pool:", error);
      return [];
    }

    return data || [];
  },

  async addToWalletPool(walletAddress: string) {
    const { data, error } = await supabase
      .from("wallet_pool")
      .insert({ wallet_address: walletAddress })
      .select()
      .single();

    if (error) {
      console.error("Error adding to wallet pool:", error);
      throw error;
    }

    return data;
  },

  async removeFromWalletPool(poolId: string) {
    const { error } = await supabase
      .from("wallet_pool")
      .delete()
      .eq("id", poolId);

    if (error) {
      console.error("Error removing from wallet pool:", error);
      throw error;
    }

    return true;
  }
};