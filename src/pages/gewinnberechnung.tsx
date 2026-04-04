import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function Gewinnberechnung() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentRate, setCurrentRate] = useState("1,4%");
  const [totalBalance, setTotalBalance] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      setIsAuthenticated(true);
      await fetchUserBalance(session.user.id);
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async (userId: string) => {
    try {
      const { data: transactions } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active");

      if (transactions) {
        const total = transactions.reduce((sum, tx) => sum + tx.amount_eur, 0);
        setTotalBalance(total);
        
        // Rendite-Stufe basierend auf Gesamtguthaben ermitteln
        let rate = "1,4%";
        if (total >= 130000) rate = "2,4%";
        else if (total >= 100000) rate = "2,3%";
        else if (total >= 75000) rate = "2,2%";
        else if (total >= 50000) rate = "2,1%";
        else if (total >= 35000) rate = "2,0%";
        else if (total >= 25000) rate = "1,8%";
        else if (total >= 10000) rate = "1,6%";
        
        setCurrentRate(rate);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  const renderRateRow = (minBalance: string, rate: string) => {
    const isActive = currentRate === rate;
    return (
      <div 
        key={rate}
        className={`flex justify-between items-center py-2 border-b border-green-200 ${
          isActive ? "bg-green-100 -mx-2 px-2 rounded-md border-2 border-green-500" : ""
        }`}
      >
        <span className={isActive ? "text-green-900 font-semibold" : "text-green-800"}>
          Ab {minBalance} Guthaben:
        </span>
        <span className={isActive ? "font-bold text-green-900 text-lg" : "font-bold text-green-900"}>
          {rate} täglich
        </span>
      </div>
    );
  };

  return (
    <>
      <SEO 
        title="Gewinnberechnung - Finanzportal"
        description="Erfahren Sie, wie Ihre Rendite berechnet wird und welche Boni Sie erhalten"
      />
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Zurück-Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück zum Dashboard
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Ihre Gewinnberechnung</CardTitle>
              <CardDescription>Übersicht über die Rendite-Struktur</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-lg mb-2 text-blue-900">Sofortiger Einzahlungsbonus</h3>
                <p className="text-blue-800">
                  Bei jeder Einzahlung erhalten Sie <span className="font-bold">1% sofort</span> als einmaligen Bonus gutgeschrieben.
                </p>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-lg mb-2 text-purple-900">Verlängerungsbonus</h3>
                <p className="text-purple-800">
                  Bei Verlängerung einer Position erhalten Sie zusätzlich <span className="font-bold">einmalig 3%</span>. 
                  Danach läuft die Position weiter nach der Gesamtguthaben-Regel.
                </p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-xl text-green-900">Tägliche Rendite nach Gesamtguthaben</h3>
                  <div className="bg-green-600 text-white px-3 py-1 rounded-md text-sm font-semibold">
                    Ihre aktuelle Rendite: {currentRate} täglich
                  </div>
                </div>
                <p className="text-sm text-green-700 mb-4">
                  Die tägliche Rendite richtet sich nach der Summe aller aktiven Positionen
                </p>
                
                <div className="space-y-2">
                  {renderRateRow("1€", "1,4%")}
                  {renderRateRow("10.000€", "1,6%")}
                  {renderRateRow("25.000€", "1,8%")}
                  {renderRateRow("35.000€", "2,0%")}
                  {renderRateRow("50.000€", "2,1%")}
                  {renderRateRow("75.000€", "2,2%")}
                  {renderRateRow("100.000€", "2,3%")}
                  {renderRateRow("130.000€", "2,4%")}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-base mb-2">Wichtiger Hinweis:</h3>
                <p className="text-sm text-slate-700">
                  Das Gesamtguthaben wird aus allen aktiven Transaktionen zusammengerechnet. Je höher Ihr Gesamtguthaben, desto höher Ihre tägliche Rendite auf alle aktiven Positionen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Alle eingezahlten Vermögenswerte sind "kreuzversichert". Das bedeutet ihre Bitcoin Einzahlungen sind gegen Kursschwankungen und Entwertung versichert. Außerdem sind alle eingezahlten Vermögenswerte vollständig gegen Verlust und Diebstahl bei Bitsurance versichert.
        </p>
      </div>

      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Als offizieller Anlageanbieter und Partner von Versicherungen und Banken sind wir verpflichtet bei Verdacht auf Verstoß gegen das Geldwäschegesetz (§ 261 StGB) auf Behördliche Anfragen Auskünfte zu erteilen.
        </p>
      </div>

      <footer className="bg-slate-900 text-white py-12 mt-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Finanzportal. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </>
  );
}