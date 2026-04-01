import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];

export const transactionService = {
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
    // Speichere die Transaktion MIT dem Blockchain broadcast timestamp
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        ...transaction,
        status: transaction.status || "active"
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding transaction:", error);
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
      
      // Defensive: Prüfe ob txs Array existiert
      if (!data || !Array.isArray(data.txs)) {
        console.warn("Unexpected Bitcoin API response format:", data);
        return 0;
      }
      
      // Hole Wallet-Daten für countdown_days
      const { data: walletData } = await supabase
        .from("bitcoin_wallets")
        .select("countdown_days")
        .eq("id", walletId)
        .single();

      const countdownDays = walletData?.countdown_days || 14;
      
      const { data: existingTxs } = await supabase
        .from("transactions")
        .select("txid")
        .eq("wallet_id", walletId);

      const existingTxIds = new Set(existingTxs?.map(tx => tx.txid) || []);
      const newTransactions = data.txs.filter((tx: any) => !existingTxIds.has(tx.hash));

      let newCount = 0;
      for (const tx of newTransactions) {
        // Defensive: Prüfe ob out Array existiert
        if (!Array.isArray(tx.out)) {
          continue;
        }
        
        const amountBtc = tx.out
          .filter((out: any) => out.addr === walletAddress)
          .reduce((sum: number, out: any) => sum + (out.value || 0), 0) / 100000000;

        if (amountBtc > 0) {
          const eurRate = await this.getBitcoinPrice();
          const amountEur = amountBtc * eurRate;
          const timestamp = new Date(tx.time * 1000);
          const expiresAt = new Date(timestamp);
          expiresAt.setDate(expiresAt.getDate() + countdownDays);

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

          newCount++;
        }
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

  async updateTransactionStatus(transactionId: string, status: string) {
    const { data, error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};