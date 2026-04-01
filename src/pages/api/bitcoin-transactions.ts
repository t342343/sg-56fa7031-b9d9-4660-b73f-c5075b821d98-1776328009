import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { address } = req.query;

  if (!address || typeof address !== "string") {
    return res.status(400).json({ error: "Invalid address parameter" });
  }

  try {
    // Verwende Blockstream API - bessere bc1 Unterstützung, weniger Rate Limiting
    const response = await fetch(
      `https://blockstream.info/api/address/${address}/txs`
    );

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const txs = await response.json();

    // Filtere nur eingehende Transaktionen (wo unsere Adresse ein Output ist)
    const transactions = txs
      .filter((tx: any) => {
        return tx.vout.some((output: any) => output.scriptpubkey_address === address);
      })
      .map((tx: any) => {
        // Finde den Output für diese Adresse
        const output = tx.vout.find((o: any) => o.scriptpubkey_address === address);
        
        return {
          txid: tx.txid,
          value: output.value / 100000000, // Satoshi zu BTC
          time: tx.status.block_time || Math.floor(Date.now() / 1000), // Falls unbestätigt: aktuelle Zeit
          confirmations: tx.status.confirmed ? 1 : 0,
          block_height: tx.status.block_height || null
        };
      });

    res.status(200).json(transactions);

  } catch (error: any) {
    console.error("Bitcoin API Error:", error);
    res.status(500).json({ 
      error: "Failed to fetch Bitcoin transactions", 
      message: error.message
    });
  }
}