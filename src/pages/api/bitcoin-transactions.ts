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
    // Verwende Blockstream.info - zuverlässiger für Bech32 (bc1q) Adressen
    const response = await fetch(
      `https://blockstream.info/api/address/${address}/txs`,
      {
        headers: {
          "User-Agent": "FinanzPortal/1.0"
        }
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return res.status(429).json({ 
          error: "Rate limit exceeded", 
          message: "Too many requests to Bitcoin API. Please try again later." 
        });
      }
      return res.status(response.status).json({ 
        error: "Bitcoin API error", 
        status: response.status 
      });
    }

    const data = await response.json();
    
    // Validiere das Antwortformat
    if (!Array.isArray(data)) {
      return res.status(500).json({ 
        error: "Invalid response format from Bitcoin API" 
      });
    }

    // Konvertiere Blockstream Format zu unserem internen Format
    const formattedData = {
      address: address,
      txs: data.map((tx: any) => ({
        hash: tx.txid,
        time: tx.status.block_time || Math.floor(Date.now() / 1000),
        block_height: tx.status.block_height,
        out: tx.vout.map((vout: any) => ({
          addr: vout.scriptpubkey_address,
          value: vout.value
        }))
      }))
    };

    return res.status(200).json(formattedData);
  } catch (error) {
    console.error("Bitcoin API proxy error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch Bitcoin transactions",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}