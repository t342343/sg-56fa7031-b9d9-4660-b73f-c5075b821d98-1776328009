import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
      {
        headers: {
          "Accept": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("CoinGecko API error:", response.status);
      
      if (response.status === 429) {
        return res.status(429).json({ 
          error: "Rate limit exceeded",
          message: "Too many requests to CoinGecko API. Please try again later."
        });
      }
      
      return res.status(response.status).json({ 
        error: "Failed to fetch Bitcoin price",
        status: response.status 
      });
    }

    const data = await response.json();
    
    if (!data.bitcoin?.eur) {
      return res.status(500).json({ 
        error: "Invalid response format",
        message: "CoinGecko API returned unexpected data format"
      });
    }

    return res.status(200).json({ 
      eur: data.bitcoin.eur,
      source: "coingecko",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Bitcoin price fetch error:", error);
    return res.status(500).json({ 
      error: "Failed to fetch Bitcoin price",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
}