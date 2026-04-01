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
    // Retry-Logik mit exponentieller Wartezeit
    let retries = 0;
    const maxRetries = 3;
    let lastError: any = null;

    while (retries < maxRetries) {
      try {
        // Hole Transaktionen von blockchain.info API
        const response = await fetch(
          `https://blockchain.info/rawaddr/${address}?limit=50`,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0'
            }
          }
        );

        // Prüfe ob Rate-Limit erreicht
        if (response.status === 429 || !response.ok) {
          throw new Error(`API returned status ${response.status}`);
        }

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
              confirmations: tx.block_height ? 1 : 0,
              block_height: tx.block_height || null
            };
          });

        return res.status(200).json(transactions);

      } catch (err: any) {
        lastError = err;
        retries++;
        
        if (retries < maxRetries) {
          // Warte exponentiell länger bei jedem Retry (2s, 4s, 8s)
          const delay = Math.pow(2, retries) * 1000;
          console.log(`⏳ Rate limited, retrying in ${delay}ms... (${retries}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Alle Retries fehlgeschlagen
    throw lastError;

  } catch (error: any) {
    console.error("Bitcoin API Error:", error);
    res.status(500).json({ 
      error: "Failed to fetch Bitcoin transactions", 
      message: error.message,
      hint: "Die Blockchain-API ist vorübergehend nicht erreichbar. Bitte warte 10-20 Sekunden und versuche es erneut."
    });
  }
}