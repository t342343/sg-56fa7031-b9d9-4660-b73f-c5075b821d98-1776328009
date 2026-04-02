import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, TrendingUp, ShieldCheck, ArrowRight, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="container max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-4 mt-3">
            <div className="rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 p-2">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Finanzportal
            </span>
          </div>
          <Button variant="outline" onClick={() => router.push("/login")} className="mt-1">
            <User className="mr-2 h-4 w-4" />
            Anmelden
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Professionelle Bitcoin-Investmentplattform mit Versicherungsschutz gegen Verlust und Kursschwankungen
          </h1>
          <Button 
            size="lg" 
            className="text-lg px-10 py-6 bg-green-600 hover:bg-green-700 mb-6"
            onClick={() => router.push("/login")}
          >
            Jetzt Registrieren
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xl text-gray-600 mb-12">
            Investieren Sie sicher in Bitcoin mit vollständigem Versicherungsschutz und professioneller Verwaltung
          </p>

          <div className="flex gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6" onClick={handleGetStarted}>
              {isLoggedIn ? "Zum Dashboard" : "Jetzt starten"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
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
        
        {/* Erfahren Sie mehr Button */}
        <div className="flex justify-center mt-12">
          <Link href="/info">
            <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
              Erfahren Sie mehr
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} Finanzportal. Alle Rechte vorbehalten.</p>
        </div>
      </footer>
    </div>
  );
}