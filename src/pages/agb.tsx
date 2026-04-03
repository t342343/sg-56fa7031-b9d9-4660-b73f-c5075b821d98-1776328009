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
        description="Allgemeine Geschäftsbedingungen" />
      

      <div className="container max-w-4xl mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6">
          
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold mb-8 text-center">Allgemeine Geschäftsbedingungen (AGB) des Finanzportals</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich und Vertragsgegenstand</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Diese AGB gelten für die Nutzung der Finanz Plattform (nachfolgend „Plattform"). Die Plattform ermöglicht Nutzern die risikofreie Anlage in Kryptowerten kursunabhängig fixiert in Euro im Sinne von § 1 Abs. 1a S. 2 Nr. 6 Kreditwesengesetz (KWG).</li>
                <li>Gegenstand ist die Bereitstellung einer garantierten Rendite (Siehe Gewinnberechnung) und vollständiger Versicherung der Vermögenswerte.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 2 Registrierung und Nutzerkonto</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Die Nutzung erfordert eine Registrierung. Nur voll geschäftsfähige Personen sind zugelassen.</li>
                <li>Der Nutzer verpflichtet sich, wahrheitsgemäße Angaben zu machen.</li>
                <li>Bei Verdacht gegen Missbrauch wird eine umfassende Identitätsprüfung (KYC - Know Your Customer) nach dem Geldwäschegesetz (GwG) angefordert.</li>
                <li>Das Konto ist nicht übertragbar.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 3 Krypto-Verwahrung (Wallet)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Die Verwahrung der Kryptowerte erfolgt auf hervorragend gesicherten Wallets nach aktuellem Versicherungsstandard. Der Nutzer erhält alleinig einen direkten Zugang zu seiner Wallet.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 4 Transaktionen</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Betreiber kann Transaktionen kurzzeitig aussetzen, wenn technische Probleme (z.B. Blockchain-Überlastung) vorliegen.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 5 Gebühren und Entgelte</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Für die Anlage fallen Gebühren von 0,4 Prozent aller Auszahlungen an.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 7 Haftungsbeschränkung</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Betreiber haftet anteilig bei Vorsatz oder grober Fahrlässigkeit.</li>
                <li>Bei leichter Fahrlässigkeit haftet die Plattform und Versicherung.</li>
                <li>Haftung ausgeschlossen für: Nachgewiesene vorsätzliche Preisgabe der Zugangsdaten an Dritte.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 8 Pflichten des Nutzers (Sicherheit)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Nutzer ist verpflichtet, seine Zugangsdaten (Passwort) geheim zu halten.</li>
                <li>Bei Verdacht auf Missbrauch ist der Betreiber unverzüglich zu informieren.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 9 Geldwäscheprävention (AML)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Betreiber ist zur Einhaltung der KryptoWTransferV verpflichtet.</li>
                <li>Verdächtig hohe Einzahlungen von über 200.000 Euro werden an die Finanzbehörden gemeldet.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 10 Laufzeit und Kündigung</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Die Laufzeit der Rendite Berechnung liegt standardmäßig bei 14 Tagen und kann jederzeit gekündigt werden.</li>
                <li>Beide Parteien können den Vertrag jederzeit kündigen.</li>
                <li>Bei Kündigung werden die Krypto-Bestände auf eine Wallet des Nutzers übertragen oder in Fiatgeld ausgezahlt, sofern keine gesetzlichen Sperrgründe vorliegen.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 11 Datenschutz</h2>
              <p>Es gilt die Datenschutzerklärung des Betreibers, welche den Anforderungen der DSGVO entspricht.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 12 Änderung der AGB</h2>
              <p>Der Betreiber kann diese AGB ändern. Änderungen werden dem Nutzer mitgeteilt. Widerspricht der Nutzer nicht innerhalb von 4 Wochen, gelten die Änderungen als angenommen.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 13 Anwendbares Recht und Gerichtsstand</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Es gilt das Recht der Bundesrepublik Deutschland.</li>
                <li>Gerichtsstand für Kaufleute ist München.</li>
              </ul>
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
    </div>);

}