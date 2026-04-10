import type { GetServerSideProps } from "next";

export default function ConfirmationEmail() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ query, res }) => {
  const tokenHash = query.token_hash as string || "";
  const type = query.type as string || "signup";

  // Leite direkt zur Bestätigungsseite mit token_hash weiter
  const confirmUrl = `https://finanzportal.is/auth/confirm-email?token_hash=${encodeURIComponent(tokenHash)}&type=${encodeURIComponent(type)}`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email bestätigen</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="padding: 40px 40px 30px;">
              <h1 style="margin: 0 0 20px; font-size: 24px; font-weight: 600; color: #111827;">Email bestätigen</h1>
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 24px; color: #4b5563;">
                Willkommen! Bitte bestätige deine Email-Adresse, um dein Konto zu aktivieren.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${confirmUrl}" style="display: inline-block; padding: 12px 32px; background-color: #3b82f6; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Email bestätigen
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 14px; line-height: 20px; color: #6b7280;">
                Wenn du dich nicht registriert hast, kannst du diese Email ignorieren.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                © 2026 Finanzportal. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html");
  res.write(html);
  res.end();

  return {
    props: {},
  };
};
]]></create_file><full_file_rewrite file_path="src/pages/auth/confirm-email.tsx"><![CDATA[import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Lese token_hash und type aus Query-Parametern
        const { token_hash, type } = router.query;

        if (!token_hash || !type) {
          setStatus("error");
          setErrorMessage("Ungültiger Bestätigungslink. Token fehlt.");
          return;
        }

        console.log("Verifying with token_hash:", token_hash, "type:", type);

        // Verifiziere den Token mit Supabase
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: token_hash as string,
          type: type as "signup" | "recovery" | "invite" | "magiclink" | "email_change" | "sms" | "phone_change",
        });

        if (error) {
          console.error("Verification error:", error);
          setStatus("error");
          setErrorMessage(error.message || "Bestätigung fehlgeschlagen");
          return;
        }

        if (!data?.session) {
          console.error("No session returned");
          setStatus("error");
          setErrorMessage("Keine Session erstellt");
          return;
        }

        console.log("Verification successful:", data);
        setStatus("success");

        // Weiterleitung zum Dashboard nach 2 Sekunden
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (err) {
        console.error("Unexpected error:", err);
        setStatus("error");
        setErrorMessage("Ein unerwarteter Fehler ist aufgetreten");
      }
    };

    if (router.isReady) {
      confirmEmail();
    }
  }, [router.isReady, router.query]);

  return (
    <>
      <SEO
        title="Email bestätigen"
        description="Bestätige deine Email-Adresse"
      />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Email wird bestätigt...
              </h1>
              <p className="text-gray-600">
                Bitte warte einen Moment.
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bestätigung erfolgreich!
              </h1>
              <p className="text-gray-600 mb-4">
                Deine Email wurde erfolgreich bestätigt. Du wirst in Kürze weitergeleitet...
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Weiterleitung zum Dashboard</span>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Bestätigung fehlgeschlagen
              </h1>
              <p className="text-gray-600 mb-6">
                {errorMessage}
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Zurück zum Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}