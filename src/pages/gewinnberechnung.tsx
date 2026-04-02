import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

export default function Gewinnberechnung() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedBalance, setSelectedBalance] = useState("1");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push("/login");
      return;
    }
    setLoading(false);
  };

  const renditeData = [
    { minBalance: 1, rate: 1.4 },
    { minBalance: 10000, rate: 1.6 },
    { minBalance: 25000, rate: 1.8 },
    { minBalance: 35000, rate: 2.0 },
    { minBalance: 50000, rate: 2.1 },
    { minBalance: 75000, rate: 2.2 },
    { minBalance: 100000, rate: 2.3 },
    { minBalance: 130000, rate: 2.4 }
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">Laden...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Gewinnberechnung</h1>
            <p className="text-slate-600">
              Ihre Gewinnberechnung basiert auf dem Gesamtguthaben aller Einzahlungen
            </p>
          </div>

          {/* Dropdown für Guthabensauswahl */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Guthaben auswählen</CardTitle>
              <CardDescription>Wählen Sie Ihre Guthabenstufe</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedBalance} onValueChange={setSelectedBalance}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue placeholder="Guthabenstufe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Ab 1€ Guthaben</SelectItem>
                  <SelectItem value="10000">Ab 10.000€ Guthaben</SelectItem>
                  <SelectItem value="25000">Ab 25.000€ Guthaben</SelectItem>
                  <SelectItem value="35000">Ab 35.000€ Guthaben</SelectItem>
                  <SelectItem value="50000">Ab 50.000€ Guthaben</SelectItem>
                  <SelectItem value="75000">Ab 75.000€ Guthaben</SelectItem>
                  <SelectItem value="100000">Ab 100.000€ Guthaben</SelectItem>
                  <SelectItem value="130000">Ab 130.000€ Guthaben</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Rendite-Übersicht */}
          <Card>
            <CardHeader>
              <CardTitle>Rendite-Übersicht</CardTitle>
              <CardDescription>
                Tägliche Rendite basierend auf Ihrem Gesamtguthaben
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">
                        Gesamtguthaben
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900">
                        Tägliche Rendite
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {renditeData.map((item, index) => (
                      <tr 
                        key={index}
                        className={`border-b hover:bg-slate-50 transition-colors ${
                          selectedBalance === item.minBalance.toString() ? 'bg-blue-50' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-700">
                          Ab {item.minBalance.toLocaleString('de-DE')}€ Guthaben
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-green-600">
                          {item.rate}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bonus-Hinweis */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Verlängerungs-Bonus</h3>
                <p className="text-blue-800 text-sm">
                  Bei Verlängerung einer Position erhalten Sie zusätzlich einen einmaligen Bonus von <span className="font-bold">3%</span>.
                </p>
              </div>

              {/* Hinweis */}
              <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                  <strong>Hinweis:</strong> Alle Einzahlungen werden zusammengerechnet, um Ihr Gesamtguthaben zu ermitteln. 
                  Die tägliche Rendite richtet sich nach der jeweiligen Guthabenstufe.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>

      {/* Versicherungs-Hinweis */}
      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Alle eingezahlten Vermögenswerte sind "kreuzversichert". Das bedeutet ihre Bitcoin Einzahlungen sind gegen Kursschwankungen und Entwertung versichert. Außerdem sind alle eingezahlten Vermögenswerte vollständig gegen Verlust und Diebstahl bei Bitsurance versichert.
        </p>
      </div>

      {/* Geldwäsche-Hinweis */}
      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Als offizieller Anlageanbieter und Partner von Versicherungen und Banken sind wir verpflichtet bei Verdacht auf Verstoß gegen das Geldwäschegesetz (§ 261 StGB) auf Behördliche Anfragen Auskünfte zu erteilen.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-sm">
            © {new Date().getFullYear()} Finanzportal. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </>
  );
}