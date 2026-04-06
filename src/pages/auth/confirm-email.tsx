import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";
import { SEO } from "@/components/SEO";
import Link from "next/link";

export default function ConfirmEmail() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Warte kurz, damit Supabase die Session aus dem URL-Hash verarbeiten kann
        await new Promise(resolve => setTimeout(resolve, 500));

        // Prüfe ob User aus der URL-Hash authentifiziert wurde
        const { data: { session }, error } = await supabase.auth.getSession();

        console.log("🔍 Email confirmation check:", { hasSession: !!session, error });

        if (error) {
          console.error("Session error:", error);
          setStatus("error");
          setMessage("Fehler bei der Email-Bestätigung. Bitte versuche es erneut.");
          return;
        }

        if (session?.user) {
          console.log("✅ Session found, user confirmed:", session.user.email);
          setStatus("success");
          setMessage("Email erfolgreich bestätigt! Du wirst automatisch eingeloggt...");
          
          // Stelle sicher dass die Session gesetzt ist
          await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token
          });

          // Nach 1.5 Sekunden zum Dashboard weiterleiten
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          console.warn("❌ No session found");
          setStatus("error");
          setMessage("Ungültiger Bestätigungslink. Bitte fordere einen neuen an.");
        }
      } catch (err) {
        console.error("Confirmation error:", err);
        setStatus("error");
        setMessage("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
      }
    };

    handleEmailConfirmation();
  }, [router]);

  return (
    <>
      <SEO 
        title="Email-Bestätigung"
        description="Bestätige deine Email-Adresse"
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
          {status === "loading" && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Email wird bestätigt...</h1>
              <p className="text-slate-600">Bitte warten Sie einen Moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-green-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Erfolgreich bestätigt!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-red-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Bestätigung fehlgeschlagen</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link href="/login" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Zurück zum Login
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}