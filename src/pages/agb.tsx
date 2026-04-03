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
          <h1 className="text-3xl font-bold mb-8 text-center">Allgemeine Geschäftsbedingungen (AGB) für Krypto-Investment-Dienste</h1>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold mb-3">§ 1 Geltungsbereich und Vertragsgegenstand</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Diese AGB gelten für die Nutzung der Plattform [Name der Plattform] (nachfolgend „Plattform"), betrieben von der [Name der GmbH/AG], [Adresse], (nachfolgend „Betreiber").</li>
                <li>Die Plattform ermöglicht Nutzern den Kauf, Verkauf, Tausch und die Verwahrung von Kryptowerten im Sinne von § 1 Abs. 1a S. 2 Nr. 6 Kreditwesengesetz (KWG).</li>
                <li>Gegenstand ist die Bereitstellung einer Handelsplattform und einer digitalen Wallet zur Verwahrung.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 2 Registrierung und Nutzerkonto</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Die Nutzung erfordert eine Registrierung. Nur voll geschäftsfähige Personen sind zugelassen.</li>
                <li>Der Nutzer verpflichtet sich, wahrheitsgemäße Angaben zu machen.</li>
                <li>Die Registrierung beinhaltet eine umfassende Identitätsprüfung (KYC - Know Your Customer) nach dem Geldwäschegesetz (GwG). Der Betreiber ist berechtigt, den Handel vor vollständiger Legitimation zu verweigern.</li>
                <li>Das Konto ist nicht übertragbar.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 3 Krypto-Verwahrung (Wallet)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Die Verwahrung der Kryptowerte erfolgt auf sogenannten "Custodial Wallets" (verwahrten Wallets) des Betreibers oder eines beauftragten regulierten Kryptoverwahrers. Der Nutzer erhält keinen direkten "Private Key".</li>
                <li>Der Betreiber verpflichtet sich, die Kryptowerte getrennt von eigenem Vermögen zu verwalten, um diese im Insolvenzfall zu schützen.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 4 Handel und Transaktionen</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Kauf-/Verkaufsaufträge sind verbindlich, sobald der Nutzer den Button „Kostenpflichtig Kaufen/Verkaufen" betätigt.</li>
                <li>Die Ausführung erfolgt zum aktuellen Marktpreis (zzgl. Gebühren).</li>
                <li>Krypto-Transaktionen auf der Blockchain sind irreversibel. Der Betreiber haftet nicht für fehlerhafte Überweisungen durch den Nutzer (z.B. falsche Ziel-Adresse).</li>
                <li>Der Betreiber kann Transaktionen aussetzen, wenn technische Probleme (z.B. Blockchain-Überlastung) vorliegen.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 5 Gebühren und Entgelte</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Für Handel, Ein- und Auszahlungen fallen Gebühren gemäß der aktuellen Preisliste auf der Website an.</li>
                <li>Die Gebühren werden vor Abschluss des Handels angezeigt.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 6 Besondere Risikohinweise (Volatilität)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Nutzer bestätigt, dass er die erheblichen Risiken des Krypto-Investments verstanden hat.</li>
                <li>Kryptowährungen sind hochvolatil. Ein Totalverlust des eingesetzten Kapitals ist möglich.</li>
                <li>Der Betreiber ist keine Anlageberatung. Alle Investitionen erfolgen eigenverantwortlich.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 7 Haftungsbeschränkung</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Betreiber haftet unbeschränkt bei Vorsatz oder grober Fahrlässigkeit.</li>
                <li>Bei leichter Fahrlässigkeit haftet der Betreiber nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten).</li>
                <li>Haftung ausgeschlossen für:
                  <ul className="list-circle ml-6 mt-1 space-y-1">
                    <li>Kursverluste durch Marktvolatilität.</li>
                    <li>Hacks der Blockchain selbst.</li>
                    <li>Schäden durch vom Nutzer falsch eingegebene Daten.</li>
                    <li>Ausfälle durch höhere Gewalt.</li>
                  </ul>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 8 Pflichten des Nutzers (Sicherheit)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Nutzer ist verpflichtet, seine Zugangsdaten (Passwort, 2FA) geheim zu halten.</li>
                <li>Bei Verdacht auf Missbrauch ist der Betreiber unverzüglich zu informieren.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 9 Geldwäscheprävention (AML)</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Betreiber ist zur Einhaltung der KryptoWTransferV verpflichtet.</li>
                <li>Verdächtige Transaktionen werden an die Finanzbehörden gemeldet.</li>
                <li>Der Betreiber kann Ein- und Auszahlungen sperren, wenn die Herkunft der Mittel nicht nachgewiesen wird.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">§ 10 Laufzeit und Kündigung</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>Der Vertrag wird auf unbestimmte Zeit geschlossen.</li>
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
                <li>Gerichtsstand für Kaufleute ist [Stadt].</li>
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
    </div>
  );
}