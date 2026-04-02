import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ShieldCheck, TrendingUp, Wallet, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    setLoading(false);
  };

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Laden...</div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wallet className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Finanzportal für abgesicherte Bitcoin Anlage

            </span>
          </div>
          <div className="flex gap-3">
            {isLoggedIn ?
            <Button onClick={() => router.push("/dashboard")} size="lg">
                Zum Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button> :

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
            }
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Investieren Sie in Ihre
            <span className="block bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              finanzielle Zukunft
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">Professionelle Bitcoin-Investmentplattform mit Versicherungsschutz gegen Verlust und Kursschwankungen


          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
              {isLoggedIn ? "Zum Dashboard" : "Jetzt starten"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {!isLoggedIn &&
            <Link href="/info">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                  Erfahren Sie mehr
                </Button>
              </Link>
            }
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-blue-500 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-blue-100 w-16 h-16 flex items-center justify-center mb-4">
                <Wallet className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Persönliche Wallet</h3>
              <p className="text-gray-600">Jeder Benutzer erhält eine individuelle gesicherte Bitcoin-Wallet auf die nur Sie Zugriff haben


              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-indigo-500 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mb-4">
                <TrendingUp className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Einzigartiger Versicherungsschutz inklusive </h3>
              <p className="text-gray-600">Alle Einzahlungen sind zu 100 Prozent abgesichert. Dies gewährleistet ein absolut risikofreies Investment


              </p>
            </CardContent>
          </Card>

          <Card className="border-2 hover:border-purple-500 transition-colors">
            <CardContent className="pt-6">
              <div className="rounded-full bg-purple-100 w-16 h-16 flex items-center justify-center mb-4">
                <ShieldCheck className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sicher & Transparent</h3>
              <p className="text-gray-600">Alle Transaktionen werden gegen Diebstahl und Verlust sowie Kurschwankungen gesichert 


              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="py-12">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-4xl font-bold mb-2">Echtzeit</div>
                <div className="text-blue-100">Renditeausschütung</div>
              </div>
              <div>
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-4xl font-bold mb-2">Schutz</div>
                <div className="text-blue-100">Vollversichert</div>
              </div>
              <div>
                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-90" />
                <div className="text-4xl font-bold mb-2">Hohe Renditen</div>
                <div className="text-blue-100">bis zu 1 Prozent täglich.</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-4xl font-bold">
            Bereit zum Investieren?
          </h2>
          <p className="text-xl text-gray-600">
            Erstellen Sie jetzt Ihr Konto und starten Sie mit Bitcoin-Investitionen.
          </p>
          <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
            {isLoggedIn ? "Zum Dashboard" : "Kostenlos registrieren"}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white/80 backdrop-blur-sm mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Finanzportal. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>);

}