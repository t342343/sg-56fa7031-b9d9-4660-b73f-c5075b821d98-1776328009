import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Retry-Logik
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur",
          {
            headers: {
              'Accept': 'application/json'
            }
          }
        );

        if (!response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

        const data = await response.json();
        const price = data.bitcoin?.eur;

        if (!price) {
          throw new Error("Price not found in response");
        }

        console.log("✅ Bitcoin price fetched:", price);
        
        // WICHTIG: Gib { price: ... } zurück, nicht { eur: ... }
        return res.status(200).json({ price });

      } catch (err) {
        retries++;
        if (retries < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retries));
        } else {
          throw err;
        }
      }
    }
  } catch (error: any) {
    console.error("Bitcoin Price API Error:", error);
    
    // Fallback-Preis
    const fallbackPrice = 85000;
    console.log("⚠️ Using fallback price:", fallbackPrice);
    
    res.status(200).json({ price: fallbackPrice });
  }
}