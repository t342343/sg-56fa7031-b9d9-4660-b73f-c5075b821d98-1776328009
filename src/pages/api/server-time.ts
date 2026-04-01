import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Server Time API - Liefert die aktuelle Server-Zeit (UTC)
 * Wird vom Dashboard genutzt um zeitzonenunabhängig zu rechnen
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Liefere die aktuelle UTC Server-Zeit
    const now = new Date();
    
    res.status(200).json({
      timestamp: now.toISOString(),
      unix: Math.floor(now.getTime() / 1000)
    });
  } catch (error) {
    console.error("Server time error:", error);
    res.status(500).json({ error: "Failed to get server time" });
  }
}