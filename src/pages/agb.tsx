import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEO } from "@/components/SEO";

export default function AGB() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <SEO 
        title="AGB - Finanzportal"
        description="Allgemeine Geschäftsbedingungen"
      />

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Allgemeine Geschäftsbedingungen</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Risikofreies Investment</h2>
              <p>
                Bei Finanzportal handelt es sich um ein risikofreies Investment. Alle Vermögenswerte 
                sind gegen Diebstahl und Kursschwankungen bei unseren Partner-Versicherungen vollständig versichert.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Versicherungsschutz</h2>
              <p>
                Ihre Bitcoin-Investitionen und die daraus resultierenden Renditen sind zu 100% versichert. 
                Diese Versicherung deckt:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Diebstahl und Verlust</li>
                <li>Kursschwankungen</li>
                <li>Technische Ausfälle</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Ausschlüsse vom Versicherungsschutz</h2>
              <p>
                Der Versicherungsschutz schließt grob fahrlässiges Verhalten nicht ein. Dazu gehören unter anderem:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Weitergabe von Zugangsdaten an Dritte</li>
                <li>Nutzung unsicherer Netzwerke</li>
                <li>Ignorieren von Sicherheitshinweisen</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Zusammenarbeit mit Behörden</h2>
              <p>
                Als Partner von Versicherungen und Banken sind wir gesetzlich verpflichtet, bei Verdacht 
                auf Geldwäsche Auskünfte an die zuständigen Behörden zu erteilen. Dies dient der Einhaltung 
                gesetzlicher Vorschriften und dem Schutz aller Nutzer.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Registrierung</h2>
              <p>
                Mit der Registrierung bestätigen Sie, dass Sie diese AGB gelesen und verstanden haben 
                und akzeptieren diese vollständig.
              </p>
            </section>
          </div>

          <div className="mt-8 pt-6 border-t text-xs text-gray-500 text-center">
            Als Partner der Versicherungen und Banken sind wir verpflichtet beim Verdacht der Geldwäsche 
            Auskünfte an Behörden zu erteilen.
          </div>
        </div>
      </div>

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