import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { chatService } from "./chatService";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export const transactionService = {
  async getAllTransactions() {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        bitcoin_wallets!transactions_wallet_id_fkey (
          wallet_address,
          profiles!bitcoin_wallets_user_id_fkey (
            email,
            full_name
          )
        )
      `)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching all transactions:", error);
      return [];
    }

    return data || [];
  },

  async getTransactionsForWallet(walletId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }

    return data || [];
  },

  // Hole nur AKTIVE Transaktionen für eine Wallet ID
  async getActiveTransactionsByWallet(walletId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .in("status", ["active", "withdrawal_pending"])
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching active transactions:", error);
      return [];
    }

    return data || [];
  },

  async getWithdrawnTransactionsByWallet(walletId: string) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", walletId)
      .eq("status", "withdrawn")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching withdrawn transactions:", error);
      return [];
    }

    return data || [];
  },

  // Hole Transaktionen nach Wallet-Adresse (nicht nach wallet_id!)
  async getTransactionsByWalletAddress(walletAddress: string) {
    // Erst hole die Wallet ID für die Adresse
    const { data: wallet, error: walletError } = await supabase
      .from("bitcoin_wallets")
      .select("id")
      .eq("wallet_address", walletAddress)
      .single();

    if (walletError || !wallet) {
      console.error("Error finding wallet:", walletError);
      return [];
    }

    // Dann hole die Transaktionen für diese Wallet ID
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .eq("status", "active")
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching transactions by wallet:", error);
      throw error;
    }

    return data || [];
  },

  // Lösche alle Transaktionen einer Wallet (beim Wallet-Wechsel)
  async deleteWalletTransactions(walletId: string) {
    console.log("🗑️ Deleting all transactions for wallet:", walletId);
    
    const { data, error } = await supabase
      .from("transactions")
      .delete()
      .eq("wallet_id", walletId)
      .select();

    if (error) {
      console.error("❌ Error deleting transactions:", error);
      throw error;
    }

    console.log("✅ Deleted transactions:", data?.length || 0);
    return data;
  },

  async addTransaction(transaction: {
    wallet_id: string;
    txid: string;
    amount_btc: number;
    eur_rate: number;
    amount_eur: number;
    timestamp: string;
    block_height: number | null;
    expires_at: string;
    status?: string;
    maturity_date?: string;
    maturity_days?: number;
    is_extended?: boolean;
  }) {
    // Prüfe ob Transaktion bereits existiert
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("txid", transaction.txid)
      .single();

    // Wenn Transaktion bereits existiert -> SKIP, nichts tun
    if (existing) {
      console.log(`  ⏭️  Transaction already exists, skipping`);
      return existing;
    }

    // Nur neue Transaktionen einfügen
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...transaction,
        status: transaction.status || "active"
      })
      .select()
      .single();

    if (error) {
      console.error("Error inserting transaction:", error);
      throw error;
    }

    return data;
  },

  async getBitcoinPrice(): Promise<number> {
    try {
      // Verwende Next.js API Route als Proxy (umgeht CORS)
      const response = await fetch("/api/bitcoin-price");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Bitcoin price API error:", response.status, errorData);
        
        // Fallback Preis bei Fehler (ungefährer aktueller BTC Preis)
        return 85000;
      }
      
      const data = await response.json();
      return data.eur || 85000;
    } catch (error) {
      console.error("Error fetching Bitcoin price:", error);
      // Fallback Preis bei Fehler
      return 85000;
    }
  },

  async checkNewTransactions(walletAddress: string, walletId: string): Promise<number> {
    try {
      // Hole aktuelle Transaktionen für diese Wallet
      const { data: existingTxs } = await supabase
        .from("transactions")
        .select("txid")
        .eq("wallet_id", walletId);

      const existingTxIds = new Set(existingTxs?.map((tx) => tx.txid) || []);

      // Hole neue Transaktionen von API
      const response = await fetch(`/api/bitcoin-transactions?address=${walletAddress}`);
      const apiTxs = await response.json();

      let newCount = 0;

      for (const tx of apiTxs) {
        if (existingTxIds.has(tx.txid)) continue;

        // Zähle bisherige Transaktionen für diese Wallet
        const { count } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("wallet_id", walletId);

        // Erste 2 Transaktionen: 7 Tage, ab 3. Transaktion: 14 Tage
        const maturityDays = (count || 0) < 2 ? 7 : 14;

        // Hole aktuellen EUR-Kurs
        const priceResponse = await fetch("/api/bitcoin-price");
        const { price } = await priceResponse.json();
        const amountEur = tx.value * price;

        // 1% Sofort-Bonus
        const bonusEur = amountEur * 0.01;
        const totalEur = amountEur + bonusEur;

        // Berechne expires_at (maturityDays ab jetzt)
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + maturityDays);

        const { error } = await supabase.from("transactions").insert({
          wallet_id: walletId,
          txid: tx.txid,
          amount_btc: tx.value,
          amount_eur: totalEur,
          btc_price_eur: price,
          timestamp: new Date(tx.time * 1000).toISOString(),
          status: "active",
          maturity_days: maturityDays,
          expires_at: expiresAt.toISOString()
        });

        if (!error) newCount++;
      }

      return newCount;
    } catch (error) {
      console.error("Error checking transactions:", error);
      return 0;
    }
  },

  async extendTransaction(transactionId: string, days: number) {
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError) throw fetchError;

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + days);

    const { data, error } = await supabase
      .from("transactions")
      .update({ 
        expires_at: newExpiresAt.toISOString(),
        is_extended: true,
        status: "active"
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateTransactionStatus(
    transactionId: string, 
    status: string, 
    withdrawalAddress?: string,
    withdrawalAmountEur?: number,
    withdrawalAmountBtc?: number
  ) {
    const updateData: any = { status };
    if (withdrawalAddress) {
      updateData.withdrawal_address = withdrawalAddress;
    }
    if (withdrawalAmountEur !== undefined) {
      updateData.withdrawn_amount_eur = withdrawalAmountEur;
    }
    if (withdrawalAmountBtc !== undefined) {
      updateData.withdrawn_amount_btc = withdrawalAmountBtc;
    }

    const { error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId);

    if (error) {
      console.error("Error updating transaction status:", error);
      return false;
    }
    return true;
  },

  async updateMaturityDate(transactionId: string, maturityDate: string, maturityDays?: number) {
    const updateData: any = {
      maturity_date: maturityDate,
    };

    if (maturityDays !== undefined) {
      updateData.maturity_days = maturityDays;
    }

    const { error } = await supabase
      .from("transactions")
      .update(updateData)
      .eq("id", transactionId);

    if (error) {
      console.error("Error updating maturity date:", error);
      return false;
    }
    return true;
  },

  async extendMaturity(transactionId: string, maturityDate: string, maturityDays: number, instantBonusEur: number) {
    // Hole aktuelle Transaktion für den Amount
    const { data: tx } = await supabase.from("transactions").select("amount_eur").eq("id", transactionId).single();
    if (!tx) return false;

    const newAmount = tx.amount_eur + instantBonusEur;
    
    // Berechne neues expires_at Datum (14 Tage ab jetzt)
    const now = new Date();
    const newExpiresAt = new Date(now);
    newExpiresAt.setDate(newExpiresAt.getDate() + 14);

    const { error } = await supabase
      .from("transactions")
      .update({
        maturity_date: maturityDate,
        maturity_days: maturityDays,
        is_extended: true,
        amount_eur: newAmount,
        expires_at: newExpiresAt.toISOString(),
        timestamp: now.toISOString()
      })
      .eq("id", transactionId);

    if (error) {
      console.error("Error extending maturity:", error);
      return false;
    }
    return true;
  },

  async requestWithdrawal(transactionId: string, walletAddress: string, amount: number): Promise<boolean> {
    try {
      console.log("🔵 Starting withdrawal request for transaction:", transactionId);

      // Setze Status auf withdrawal_pending UND speichere withdrawal_address
      const { data: updatedTx, error } = await supabase
        .from("transactions")
        .update({ 
          status: "withdrawal_pending",
          withdrawal_address: walletAddress
        })
        .eq("id", transactionId)
        .select()
        .single();

      if (error) {
        console.error("❌ Error updating transaction status:", error);
        return false;
      }

      console.log("✅ Transaction status updated:", updatedTx);
      return true;
    } catch (error) {
      console.error("❌ Error in requestWithdrawal:", error);
      return false;
    }
  },

  async approveWithdrawal(transactionId: string): Promise<boolean> {
    const { error } = await supabase
      .from("transactions")
      .update({ status: "withdrawn" })
      .eq("id", transactionId);

    if (error) {
      console.error("Error approving withdrawal:", error);
      return false;
    }

    return true;
  },

  async getPendingWithdrawals() {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        bitcoin_wallets!transactions_wallet_id_fkey (
          wallet_address,
          profiles!bitcoin_wallets_user_id_fkey (
            email,
            full_name
          )
        )
      `)
      .eq("status", "withdrawal_pending")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching pending withdrawals:", error);
      return [];
    }

    return data || [];
  },

  async getCompletedWithdrawals() {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        bitcoin_wallets!transactions_wallet_id_fkey (
          wallet_address,
          profiles!bitcoin_wallets_user_id_fkey (
            email,
            full_name
          )
        )
      `)
      .eq("status", "withdrawn")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching completed withdrawals:", error);
      return [];
    }

    return data || [];
  }
};