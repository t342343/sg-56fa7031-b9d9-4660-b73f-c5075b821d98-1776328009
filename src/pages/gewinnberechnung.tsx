import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export default function Gewinnberechnung() {
  const router = useRouter();
  const [selectedTier, setSelectedTier] = useState("1");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Auth error:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Gewinnberechnung</h1>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Ihre Gewinnberechnung</CardTitle>
              <CardDescription>
                Übersicht über Ihre Rendite-Struktur basierend auf Ihrem Gesamtguthaben
              </CardDescription>
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

              <div>
                <Label htmlFor="balance-tier" className="text-base font-semibold mb-3 block">
                  Wählen Sie Ihre Guthaben-Stufe:
                </Label>
                <select
                  id="balance-tier"
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="1">Ab 1€ Guthaben</option>
                  <option value="10000">Ab 10.000€ Guthaben</option>
                  <option value="25000">Ab 25.000€ Guthaben</option>
                  <option value="35000">Ab 35.000€ Guthaben</option>
                  <option value="50000">Ab 50.000€ Guthaben</option>
                  <option value="75000">Ab 75.000€ Guthaben</option>
                  <option value="100000">Ab 100.000€ Guthaben</option>
                  <option value="130000">Ab 130.000€ Guthaben</option>
                </select>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200">
                <h3 className="font-semibold text-xl mb-4 text-green-900">Tägliche Rendite nach Gesamtguthaben</h3>
                <p className="text-sm text-green-700 mb-4">
                  Die tägliche Rendite richtet sich nach der Summe aller aktiven Transaktionen:
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 1€ Guthaben:</span>
                    <span className="font-bold text-green-900">1,4% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 10.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">1,6% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 25.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">1,8% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 35.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">2,0% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 50.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">2,1% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 75.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">2,2% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-green-200">
                    <span className="text-green-800">Ab 100.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">2,3% täglich</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-green-800">Ab 130.000€ Guthaben:</span>
                    <span className="font-bold text-green-900">2,4% täglich</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="font-semibold text-base mb-2">Wichtiger Hinweis:</h3>
                <p className="text-sm text-slate-700">
                  Das Gesamtguthaben wird aus allen aktiven Transaktionen zusammengerechnet. 
                  Je höher Ihr Gesamtguthaben, desto höher Ihre tägliche Rendite auf alle aktiven Positionen.
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