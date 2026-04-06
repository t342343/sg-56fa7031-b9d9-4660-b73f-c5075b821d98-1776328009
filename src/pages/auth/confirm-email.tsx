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
        console.log("🔍 [CONFIRM] Starting email confirmation process");
        
        // Warte etwas länger, damit Supabase die Session aus dem URL-Hash verarbeiten kann
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Hole die Session aus dem URL-Hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log("🔍 [CONFIRM] Session check:", { 
          hasSession: !!session, 
          hasUser: !!session?.user,
          email: session?.user?.email,
          error: sessionError 
        });

        if (sessionError) {
          console.error("❌ [CONFIRM] Session error:", sessionError);
          setStatus("error");
          setMessage("Fehler bei der Email-Bestätigung. Bitte versuche es erneut.");
          return;
        }

        if (!session?.user) {
          console.warn("❌ [CONFIRM] No session found - invalid confirmation link");
          setStatus("error");
          setMessage("Ungültiger Bestätigungslink. Bitte fordere einen neuen an.");
          return;
        }

        // Session gefunden - User ist bestätigt
        console.log("✅ [CONFIRM] Session found, confirming user:", session.user.email);
        
        // Stelle sicher dass die Session persistent gespeichert wird
        const { error: setError } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        });

        if (setError) {
          console.error("❌ [CONFIRM] Error setting session:", setError);
          setStatus("error");
          setMessage("Fehler beim Speichern der Session. Bitte melde dich manuell an.");
          return;
        }

        // Verifiziere dass die Session jetzt gesetzt ist
        const { data: { session: verifySession } } = await supabase.auth.getSession();
        console.log("🔍 [CONFIRM] Session verification:", { 
          hasSession: !!verifySession,
          email: verifySession?.user?.email 
        });

        // Erfolg!
        setStatus("success");
        setMessage("Email erfolgreich bestätigt! Du wirst automatisch eingeloggt...");
        
        console.log("✅ [CONFIRM] Redirecting to dashboard in 2 seconds...");
        
        // Nach 2 Sekunden zum Dashboard weiterleiten
        setTimeout(() => {
          console.log("🔄 [CONFIRM] Redirecting now...");
          router.push("/dashboard");
        }, 2000);

      } catch (err) {
        console.error("❌ [CONFIRM] Confirmation exception:", err);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center border border-slate-200">
          {status === "loading" && (
            <>
              <div className="mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Email wird bestätigt...</h1>
              <p className="text-slate-600">Bitte warten Sie einen Moment.</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Erfolgreich bestätigt!</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <div className="flex items-center justify-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                <span className="text-sm">Weiterleitung zum Dashboard...</span>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-2">Bestätigung fehlgeschlagen</h1>
              <p className="text-slate-600 mb-6">{message}</p>
              <Link 
                href="/login" 
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg hover:shadow-xl"
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