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
      console.log("🔍 Checking transactions for wallet:", walletAddress);
      
      // Verwende Next.js API Route als Proxy (umgeht CORS)
      const response = await fetch(`/api/bitcoin-transactions?address=${walletAddress}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Bitcoin API proxy error:", response.status, errorData);
        
        if (response.status === 429) {
          console.warn("Rate limit exceeded. Will retry later.");
        }
        
        return 0;
      }
      
      const data = await response.json();
      console.log("📡 API Response:", data);
      
      // Defensive: Prüfe ob txs Array existiert
      if (!data || !Array.isArray(data.txs)) {
        console.warn("Unexpected Bitcoin API response format:", data);
        return 0;
      }
      
      console.log(`📊 Found ${data.txs.length} total transactions on blockchain`);
      
      // Hole Wallet-Daten für countdown_days
      const { data: walletData } = await supabase
        .from("bitcoin_wallets")
        .select("countdown_days")
        .eq("id", walletId)
        .single();

      const countdownDays = walletData?.countdown_days ?? 14;

      let newCount = 0;
      let updatedCount = 0;
      
      // Hole existierende Transaktionen um neue von Updates zu unterscheiden
      const { data: existingTxs } = await supabase
        .from("transactions")
        .select("txid")
        .eq("wallet_id", walletId);

      const existingTxIds = new Set(existingTxs?.map(tx => tx.txid) || []);

      for (const tx of data.txs) {
        console.log("🔎 Processing transaction:", tx.hash);
        
        const isNew = !existingTxIds.has(tx.hash);
        
        // Defensive: Prüfe ob out Array existiert
        if (!Array.isArray(tx.out)) {
          console.warn("Transaction has no outputs:", tx.hash);
          continue;
        }
        
        // Finde alle Outputs die an unsere Wallet-Adresse gehen
        const relevantOutputs = tx.out.filter((out: any) => out.addr === walletAddress);
        console.log(`  └─ Found ${relevantOutputs.length} outputs to our address`);
        
        const amountSatoshis = relevantOutputs.reduce((sum: number, out: any) => sum + (out.value || 0), 0);
        const amountBtc = amountSatoshis / 100000000;
        
        console.log(`  └─ Amount: ${amountSatoshis} satoshis = ${amountBtc} BTC`);

        if (amountBtc > 0) {
          const eurRate = await this.getBitcoinPrice();
          const amountEur = amountBtc * eurRate;
          const timestamp = new Date(tx.time * 1000);
          const expiresAt = new Date(timestamp);
          expiresAt.setDate(expiresAt.getDate() + countdownDays);

          console.log(`  └─ EUR Rate: ${eurRate}, Amount EUR: ${amountEur.toFixed(2)}`);
          console.log(`  └─ Timestamp: ${timestamp.toISOString()}`);
          console.log(`  └─ Expires at: ${expiresAt.toISOString()}`);

          await this.addTransaction({
            wallet_id: walletId,
            txid: tx.hash,
            amount_btc: amountBtc,
            eur_rate: eurRate,
            amount_eur: amountEur,
            timestamp: timestamp.toISOString(),
            block_height: tx.block_height || null,
            expires_at: expiresAt.toISOString(),
            status: "active"
          });

          if (isNew) {
            console.log(`  ✅ New transaction saved to database`);
            newCount++;
          } else {
            console.log(`  🔄 Transaction updated (e.g., confirmed)`);
            updatedCount++;
          }
        } else {
          console.log(`  ⏭️  Skipping (no relevant outputs)`);
        }
      }

      console.log(`🎉 Total new transactions added: ${newCount}, updated: ${updatedCount}`);
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

  async updateTransactionStatus(transactionId: string, status: string) {
    const { data, error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      console.error("Error updating transaction status:", error);
      return null;
    }

    return data;
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

    const { error } = await supabase
      .from("transactions")
      .update({
        maturity_date: maturityDate,
        maturity_days: maturityDays,
        is_extended: true,
        amount_eur: newAmount
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