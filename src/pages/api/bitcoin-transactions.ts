import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Bitcoin address required" });
  }

  try {
    // Hole Transaktionen von blockchain.info API
    const response = await fetch(
      `https://blockchain.info/rawaddr/${address}?limit=50`
    );
    const data = await response.json();

    // Extrahiere relevante Transaktionsdaten (inklusive unbestätigter Transaktionen)
    const transactions = data.txs
      .filter((tx: any) => {
        // Prüfe ob diese Wallet Empfänger war (Output)
        return tx.out.some((output: any) => output.addr === address);
      })
      .map((tx: any) => {
        // Finde den Output für diese Adresse
        const output = tx.out.find((o: any) => o.addr === address);
        
        return {
          txid: tx.hash,
          value: output.value / 100000000, // Satoshi zu BTC
          time: tx.time,
          confirmations: tx.block_height ? 1 : 0, // 0 = unbestätigt, 1+ = bestätigt
          block_height: tx.block_height || null
        };
      });

    res.status(200).json(transactions);
  } catch (error) {
    console.error("Bitcoin API proxy error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch Bitcoin transactions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}