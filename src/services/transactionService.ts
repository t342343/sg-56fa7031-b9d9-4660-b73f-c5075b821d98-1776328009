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

  async addTransaction(transaction: TransactionInsert): Promise<boolean> {
    const { error } = await supabase
      .from("transactions")
      .insert(transaction);

    if (error) {
      console.error("Error adding transaction:", error);
      return false;
    }

    return true;
  },

  async getBitcoinPrice(): Promise<number> {
    try {
      const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur");
      const data = await response.json();
      return data.bitcoin.eur;
    } catch (error) {
      console.error("Error fetching Bitcoin price:", error);
      return 0;
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

          await this.addTransaction({
            wallet_id: walletId,
            txid: tx.hash,
            amount_btc: amountBtc,
            eur_rate: eurRate,
            amount_eur: amountEur,
            timestamp: new Date(tx.time * 1000).toISOString(),
            block_height: tx.block_height || null
          });

          newCount++;
        }
      }

      return newCount;
    } catch (error) {
      console.error("Error checking transactions:", error);
      return 0;
    }
  }
};