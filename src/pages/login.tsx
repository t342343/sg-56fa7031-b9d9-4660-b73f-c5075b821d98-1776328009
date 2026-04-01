import { AuthForm } from "@/components/AuthForm";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <SEO
        title="Finanzportal - Login"
        description="Melden Sie sich bei Ihrem Finanzportal-Konto an"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-warm-bg to-background p-4">
        <div className="w-full max-w-4xl space-y-8">
          {/* Admin-Hinweis */}
          <Card className="border-blue-500/50 bg-blue-50 dark:bg-blue-950">
            <CardHeader>
              <CardTitle className="text-xl font-heading text-blue-900 dark:text-blue-100">
                🔐 Admin-Erstanmeldung
              </CardTitle>
              <CardDescription className="text-blue-700 dark:text-blue-300">
                <strong>Wichtig:</strong> Der Admin-Account wird beim ersten Mal erstellt
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Für Ihre erste Anmeldung:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
                  <li>Wählen Sie den Tab <strong>"Registrieren"</strong> unten</li>
                  <li>Geben Sie diese Daten ein:</li>
                  <ul className="ml-6 mt-2 space-y-1">
                    <li>• <strong>Email:</strong> admin@finanzportal.dev</li>
                    <li>• <strong>Passwort:</strong> hks.2837</li>
                    <li>• Name, Adresse und Telefon können beliebig sein</li>
                  </ul>
                  <li>Klicken Sie auf <strong>"Registrieren"</strong></li>
                  <li>Sie werden automatisch als <strong>Admin</strong> markiert</li>
                  <li>Danach können Sie sich mit diesen Daten anmelden</li>
                </ol>
              </div>
            </CardContent>
          </Card>

          {/* Login/Registrierung */}
          <AuthForm />
        </div>
      </div>
    </>
  );
}