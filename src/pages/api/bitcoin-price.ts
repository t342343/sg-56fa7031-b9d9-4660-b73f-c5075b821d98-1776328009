import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // CoinGecko API - Aktueller Bitcoin-Preis in EUR
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      // WICHTIG: Status 500 werfen, damit Admin Panel localStorage-Fallback nutzt
      console.warn(`CoinGecko API error: ${response.status}`);
      return res.status(500).json({
        error: "CoinGecko API failed",
        status: response.status
      });
    }

    const data = await response.json();
    const price = data.bitcoin?.eur;

    if (!price) {
      // WICHTIG: Status 500 werfen, damit Admin Panel localStorage-Fallback nutzt
      console.warn("Bitcoin price not found in response");
      return res.status(500).json({
        error: "Bitcoin price not found in response"
      });
    }

    return res.status(200).json({
      price: price,
      timestamp: new Date().toISOString(),
      source: "CoinGecko"
    });
  } catch (error) {
    console.error("Bitcoin price API error:", error);
    return res.status(500).json({
      error: "Failed to fetch Bitcoin price",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
}