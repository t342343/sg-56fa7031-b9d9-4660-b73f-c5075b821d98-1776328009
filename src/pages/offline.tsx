import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WifiOff } from "lucide-react";
import { useRouter } from "next/router";

export default function OfflinePage() {
  const router = useRouter();

  return (
    <>
      <SEO
        title="Offline - Bitcoin Investment Portal"
        description="Sie sind derzeit offline. Bitte prüfen Sie Ihre Internetverbindung."
      />
      
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
        <Card className="w-full max-w-md border-gray-700 bg-gray-800/50 backdrop-blur">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-orange-500" />
            </div>
            <CardTitle className="text-2xl text-white">
              Keine Verbindung
            </CardTitle>
            <CardDescription className="text-gray-400">
              Sie sind derzeit offline. Einige Funktionen sind möglicherweise nicht verfügbar.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-700/30 border border-gray-600">
              <p className="text-sm text-gray-300">
                <strong className="text-white">Hinweis:</strong> Bitcoin-Transaktionen und
                Echtzeit-Kurse erfordern eine aktive Internetverbindung.
              </p>
            </div>
            
            <Button
              onClick={() => router.reload()}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              Erneut versuchen
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}