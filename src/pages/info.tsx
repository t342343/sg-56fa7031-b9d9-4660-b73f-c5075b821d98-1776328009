import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowRight, 
  Shield, 
  Building2, 
  BadgeCheck, 
  Lock, 
  TrendingUp,
  Wallet,
  Clock,
  Users,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function InfoPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Finanzportal
            </span>
          </Link>
          <div className="flex gap-3">
            {isLoggedIn ? (
              <Button onClick={() => router.push("/dashboard")} size="lg">
                Zum Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="lg">
                    Anmelden
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg">
                    Registrieren
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Sicher in Bitcoin investieren
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              mit vollständigem Versicherungsschutz
            </span>
          </h1>
          <p className="text-xl text-gray-600">
            Unser Finanzportal bietet Ihnen die einzigartige Möglichkeit, risikolos in Bitcoin zu investieren
          </p>
        </div>
      </section>

      {/* Trust Indicators - Bank & Insurance Icons */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-white/80 backdrop-blur-sm border-2">
          <CardContent className="py-8">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <Building2 className="h-12 w-12 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Bankensicherheit</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <Shield className="h-12 w-12 text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">Versicherungsschutz</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <BadgeCheck className="h-12 w-12 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Zertifiziert</span>
              </div>
              <div className="flex flex-col items-center gap-2 opacity-70 hover:opacity-100 transition-opacity">
                <Lock className="h-12 w-12 text-blue-700" />
                <span className="text-sm font-medium text-gray-600">Verschlüsselt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Info Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Was wir bieten */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                Was wir bieten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Wallet className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Persönliche Bitcoin-Wallet</h3>
                  <p className="text-gray-600 text-sm">
                    Jeder Benutzer erhält eine individuelle, gesicherte Bitcoin-Wallet, auf die nur Sie Zugriff haben
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Shield className="h-6 w-6 text-indigo-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">100% Versicherungsschutz</h3>
                  <p className="text-gray-600 text-sm">
                    Alle Einzahlungen sind vollständig gegen Verlust und Kursschwankungen abgesichert
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <TrendingUp className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Hohe Renditen</h3>
                  <p className="text-gray-600 text-sm">
                    Profitieren Sie von attraktiven Renditen bis zu 1% täglich bei vollständiger Absicherung
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Echtzeit-Tracking</h3>
                  <p className="text-gray-600 text-sm">
                    Verfolgen Sie alle Transaktionen und Renditen in Echtzeit mit historischen EUR-Kursen
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Wie es funktioniert */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-6 w-6 text-blue-600" />
                Wie es funktioniert
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Registrierung</h3>
                  <p className="text-gray-600 text-sm">
                    Erstellen Sie Ihr Konto mit wenigen Klicks - sicher und unkompliziert
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Wallet-Zuweisung</h3>
                  <p className="text-gray-600 text-sm">
                    Sie erhalten automatisch Ihre persönliche Bitcoin-Wallet zugewiesen
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Einzahlung</h3>
                  <p className="text-gray-600 text-sm">
                    Tätigen Sie Ihre erste Einzahlung - alle Transaktionen werden in Echtzeit erfasst
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Rendite erzielen</h3>
                  <p className="text-gray-600 text-sm">
                    Profitieren Sie von täglichen Renditen und verfolgen Sie Ihre Gewinne im Dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Security Features */}
      <section className="container mx-auto px-4 py-12">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-3xl text-center">
              Ihre Sicherheit ist unsere Priorität
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center space-y-3">
                <Lock className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">Verschlüsselte Daten</h3>
                <p className="text-blue-100">
                  Alle persönlichen Daten und Transaktionen werden mit höchsten Sicherheitsstandards verschlüsselt
                </p>
              </div>
              <div className="text-center space-y-3">
                <Shield className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">Versicherungspartner</h3>
                <p className="text-blue-100">
                  Zusammenarbeit mit führenden Versicherungsgesellschaften für vollständigen Schutz Ihrer Investition
                </p>
              </div>
              <div className="text-center space-y-3">
                <Building2 className="h-12 w-12 mx-auto opacity-90" />
                <h3 className="text-xl font-semibold">Banken-Standard</h3>
                <p className="text-blue-100">
                  Sicherheitsmaßnahmen auf Bankenniveau garantieren den Schutz Ihrer Vermögenswerte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Häufig gestellte Fragen</h2>
        <div className="max-w-3xl mx-auto space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ist meine Investition wirklich zu 100% abgesichert?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ja, alle Einzahlungen sind vollständig versichert. Sowohl gegen Diebstahl und Verlust als auch gegen Kursschwankungen. Ihre Investition ist jederzeit geschützt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wie hoch sind die Renditen?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Unsere Kunden profitieren von attraktiven täglichen Renditen von bis zu 1%. Die genaue Rendite wird in Ihrem Dashboard in Echtzeit angezeigt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kann ich jederzeit auf meine Wallet zugreifen?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ja, Sie haben jederzeit vollen Einblick in Ihre persönliche Bitcoin-Wallet über Ihr Dashboard. Alle Transaktionen werden in Echtzeit erfasst und angezeigt.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Wie lange dauert die Registrierung?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Die Registrierung dauert nur wenige Minuten. Nach erfolgreicher Anmeldung erhalten Sie sofort Zugang zu Ihrer persönlichen Wallet und können mit dem Investieren beginnen.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">
            Bereit für risikofreies Bitcoin-Investment?
          </h2>
          <p className="text-xl text-gray-600">
            Starten Sie noch heute und profitieren Sie von unserem einzigartigen Versicherungsschutz
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
              {isLoggedIn ? "Zum Dashboard" : "Jetzt kostenlos registrieren"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link href="/">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                Zurück zur Startseite
              </Button>
            </Link>
          </div>
        </div>
      </section>

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
      <footer className="bg-slate-900 text-white py-12 mt-20">
      </footer>
    </div>
  );
}