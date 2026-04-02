import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { chatService } from "./chatService";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

// Neue Rendite-Berechnung basierend on Gesamtguthaben
function calculateDailyRate(totalBalance: number): number {
  if (totalBalance >= 130000) return 0.024;
  if (totalBalance >= 100000) return 0.023;
  if (totalBalance >= 75000) return 0.022;
  if (totalBalance >= 50000) return 0.021;
  if (totalBalance >= 35000) return 0.020;
  if (totalBalance >= 25000) return 0.018;
  if (totalBalance >= 10000) return 0.016;
  return 0.014;
}

export function calculateTransactionProfit(
  transaction: any,
  allActiveTransactions: any[]
): number {
  if (!transaction || transaction.status === "withdrawn") {
    return 0;
  }

  const now = new Date();
  const startDate = new Date(transaction.timestamp);
  const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60);
  
  if (hoursSinceStart < 0) return 0;

  const totalActiveBalance = allActiveTransactions
    .filter(tx => tx.status === "active")
    .reduce((sum, tx) => sum + tx.eur_value, 0);

  const immediateBonus = transaction.eur_value * 0.01;
  const dailyRate = calculateDailyRate(totalActiveBalance);
  const daysSinceStart = hoursSinceStart / 24;
  const dailyProfit = transaction.eur_value * dailyRate * daysSinceStart;

  return immediateBonus + dailyProfit;
}

function calculateProfit(transaction: any, isExtension: boolean = false): number {
  // TODO: Implementieren Sie die Gewinnberechnung hier
  return 0;
}

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
    expires_at?: string;
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

    // Wenn maturity_days nicht übergeben wurde, berechne es basierend auf bisherigen Transaktionen
    let finalMaturityDays = transaction.maturity_days;
    let finalExpiresAt = transaction.expires_at;

    if (!finalMaturityDays) {
      const { count } = await supabase
        .from("transactions")
        .select("*", { count: "exact", head: true })
        .eq("wallet_id", transaction.wallet_id);

      finalMaturityDays = (count || 0) < 2 ? 7 : 14;
    }

    if (!finalExpiresAt) {
      const now = new Date();
      const expires = new Date(now);
      expires.setDate(expires.getDate() + (finalMaturityDays || 14));
      finalExpiresAt = expires.toISOString();
    }

    // Nur neue Transaktionen einfügen
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...transaction,
        status: transaction.status || "active",
        maturity_days: finalMaturityDays,
        expires_at: finalExpiresAt
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

      console.log("🔍 API Response:", apiTxs);
      console.log("🔍 Is Array?", Array.isArray(apiTxs));

      // Validiere dass apiTxs ein Array ist
      if (!Array.isArray(apiTxs)) {
        console.error("❌ API response is not an array:", apiTxs);
        return 0;
      }

      console.log("✅ API returned", apiTxs.length, "transactions");

      let newCount = 0;

      for (const tx of apiTxs) {
        console.log(`🔄 Processing transaction ${tx.txid.substring(0, 8)}...`);
        
        if (existingTxIds.has(tx.txid)) {
          console.log(`  ⏭️  Already exists, skipping`);
          continue;
        }

        console.log(`  ✨ New transaction found!`);

        // Zähle bisherige Transaktionen für diese Wallet
        const { count } = await supabase
          .from("transactions")
          .select("*", { count: "exact", head: true })
          .eq("wallet_id", walletId);

        console.log(`  📊 Current transaction count: ${count}`);

        // Erste 2 Transaktionen: 7 Tage, ab 3. Transaktion: 14 Tage
        const maturityDays = (count || 0) < 2 ? 7 : 14;
        console.log(`  ⏱️  Maturity days: ${maturityDays}`);

        // Hole aktuellen EUR-Kurs
        const priceResponse = await fetch("/api/bitcoin-price");
        const { price } = await priceResponse.json();
        const amountEur = tx.value * price;
        console.log(`  💰 BTC: ${tx.value}, EUR rate: ${price}, EUR amount: ${amountEur}`);

        // 1% Sofort-Bonus
        const bonusEur = amountEur * 0.01;
        const totalEur = amountEur + bonusEur;
        console.log(`  🎁 Bonus (1%): ${bonusEur}, Total: ${totalEur}`);

        // Berechne expires_at (maturityDays ab jetzt)
        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + maturityDays);

        const insertData = {
          wallet_id: walletId,
          txid: tx.txid,
          amount_btc: tx.value,
          amount_eur: totalEur,
          eur_rate: price,
          timestamp: new Date(tx.time * 1000).toISOString(),
          status: "active",
          maturity_days: maturityDays,
          expires_at: expiresAt.toISOString()
        };

        console.log(`  💾 Inserting transaction:`, insertData);

        const { error } = await supabase.from("transactions").insert(insertData);

        if (error) {
          console.error(`  ❌ Error inserting transaction:`, error);
        } else {
          console.log(`  ✅ Transaction inserted successfully!`);
          newCount++;
        }
      }

      console.log(`🎉 Finished processing. New transactions added: ${newCount}`);
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

export async function updateTransactionProfits(userId: string) {
  try {
    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) throw error;
    if (!transactions || transactions.length === 0) return;

    const activeTransactions = transactions.filter(tx => tx.status === "active");

    const updates = activeTransactions.map(async (transaction) => {
      const currentProfit = calculateTransactionProfit(transaction, activeTransactions);
      
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ 
          current_profit: currentProfit,
          updated_at: new Date().toISOString()
        })
        .eq("id", transaction.id);

      if (updateError) {
        console.error(`Error updating transaction ${transaction.id}:`, updateError);
      }
    });

    await Promise.all(updates);
  } catch (error) {
    console.error("Error updating transaction profits:", error);
    throw error;
  }
}

export async function extendTransaction(transactionId: string, userId: string) {
  try {
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .eq("user_id", userId)
      .single();

    if (fetchError) throw fetchError;
    if (!transaction) throw new Error("Transaktion nicht gefunden");
    if (transaction.status !== "active") {
      throw new Error("Nur aktive Transaktionen können verlängert werden");
    }

    const extensionBonus = transaction.eur_value * 0.03;
    const newProfit = (transaction.current_profit || 0) + extensionBonus;

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        current_profit: newProfit,
        is_extended: true,
        extended_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId);

    if (updateError) throw updateError;

    return { success: true, bonus: extensionBonus };
  } catch (error) {
    console.error("Error extending transaction:", error);
    throw error;
  }
}