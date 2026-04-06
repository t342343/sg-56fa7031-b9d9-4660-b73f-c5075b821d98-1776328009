import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { InstallPWA } from "@/components/InstallPWA";

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Verhindere Auth-Error Overlay
  useEffect(() => {
    const handleError = (event: PromiseRejectionEvent) => {
      if (event.reason?.message?.includes('Invalid login credentials') ||
          event.reason?.name === 'AuthApiError') {
        event.preventDefault();
        // Error wird nicht an Next.js Error Boundary weitergegeben
      }
    };

    window.addEventListener('unhandledrejection', handleError);
    return () => window.removeEventListener('unhandledrejection', handleError);
  }, []);

  // Zeige Erfolgsmeldung wenn von Registrierung weitergeleitet
  useEffect(() => {
    if (router.query.registered === "true") {
      toast({
        title: "Registrierung abgeschlossen!",
        description: "Bitte prüfen Sie Ihre E-Mails und bestätigen Sie Ihre E-Mail-Adresse.",
        duration: 5000
      });
      // Entferne Parameter aus URL
      router.replace("/login", undefined, { shallow: true });
    }
  }, [router.query.registered]);

  // Login State
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register State - direkter State statt Objekt
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [bitsuranceAccepted, setBitsuranceAccepted] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    console.log("🔍 Login attempt started");

    try {
      const { data, error } = await authService.signIn(loginData.email, loginData.password);
      console.log("🔍 Login result:", { hasData: !!data, hasError: !!error });

      if (error) {
        console.log("🔍 Error detected, showing message");
        setError("Ungültige Anmeldedaten");
        return;
      }

      if (!data.user) {
        console.log("🔍 No user in data");
        setError("Ungültige Anmeldedaten");
        return;
      }

      console.log("🔍 Getting profile for user:", data.user.id);
      const profile = await profileService.getProfile(data.user.id);

      if (!profile) {
        console.log("🔍 No profile found");
        setError("Profil nicht gefunden");
        return;
      }

      console.log("🔍 Redirecting to:", profile.role === "admin" ? "admin" : "dashboard");
      if (profile.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      console.log("🔍 Catch block hit:", err);
      setError("Ungültige Anmeldedaten");
      return;
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!agbAccepted) {
        toast({
          title: "AGB akzeptieren",
          description: "Bitte akzeptieren Sie die AGB, um fortzufahren.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!bitsuranceAccepted) {
        toast({
          title: "Versicherung bestätigen",
          description: "Bitte bestätigen Sie die Erstellung der Bitsurance Versicherung.",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Passwort-Validierung
      if (password !== confirmPassword) {
        toast({
          title: "Fehler",
          description: "Die Passwörter stimmen nicht überein",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        toast({
          title: "Fehler",
          description: "Das Passwort muss mindestens 6 Zeichen lang sein",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const combinedAddress = [street, houseNumber, postalCode, city].
      filter(Boolean).
      join(", ");

      // Verwende authService.signUp() statt direktem Supabase-Aufruf
      const { user: authUser, error: authError } = await authService.signUp(email, password);

      if (authError) {
        console.error("Registration error details:", authError);
        toast({
          title: "Registrierung fehlgeschlagen",
          description: authError.message || "Bitte versuchen Sie es erneut",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      if (!authUser) {
        toast({
          title: "Registrierung fehlgeschlagen",
          description: "Benutzer konnte nicht erstellt werden",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      console.log("Registration successful, creating profile...");

      // Warte kurz, damit Supabase die Session setzt
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Erstelle Profil mit zusätzlichen Daten
      try {
        console.log("🔍 [REGISTRATION] Calling createProfile with:", {
          id: authUser.id,
          email,
          full_name: fullName,
          address: combinedAddress,
          phone
        });

        await profileService.createProfile({
          id: authUser.id,
          email,
          full_name: fullName,
          address: combinedAddress,
          phone,
          role: "user"
        });

        console.log("✅ [REGISTRATION] Profile created successfully");

        toast({
          title: "Registrierung erfolgreich!",
          description: "Bitte prüfen Sie Ihre E-Mails und bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden."
        });

        // Logout nach Registrierung und Umleitung zum Login
        await supabase.auth.signOut();

        // Verwende window.location für zuverlässige Umleitung mit Erfolgs-Parameter
        window.location.href = "/login?registered=true";

      } catch (profileError: any) {
        console.error("❌ [REGISTRATION] Profile creation error:", profileError);
        toast({
          title: "Registrierung teilweise erfolgreich",
          description: "Account erstellt, aber Profil konnte nicht angelegt werden. Bitte kontaktieren Sie den Support.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Registration exception:", error);
      toast({
        title: "Fehler",
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!agbAccepted) {
      setError("Bitte akzeptieren Sie die AGB um fortzufahren.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein.");
      return;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-navy-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading text-center text-navy flex items-center justify-center gap-3">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="chartGradientInline" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" style={{stopColor:"#3B82F6", stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
                </linearGradient>
              </defs>
              <rect x="12" y="23" width="4" height="6.5" rx="0.5" fill="url(#chartGradientInline)" opacity="0.7"/>
              <rect x="18" y="20" width="4" height="9.5" rx="0.5" fill="url(#chartGradientInline)" opacity="0.85"/>
              <rect x="24" y="15" width="4" height="14.5" rx="0.5" fill="url(#chartGradientInline)"/>
              <path d="M 13.5 22 L 20 18 L 26.5 12.5" stroke="#8B5CF6" strokeWidth="0.75" strokeLinecap="round" fill="none"/>
              <path d="M 25 10.5 L 27.5 12.5 L 26.5 15 Z" fill="#8B5CF6"/>
            </svg>
            Finanzportal
          </CardTitle>
          <CardDescription className="text-center text-lg">Investment-Dashboard für versicherte Bitcoin-Anlage</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="mb-4 p-3 bg-red-50 border-red-200">
                    <AlertDescription className="text-red-600 text-sm font-medium flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    disabled={loading} />
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Passwort</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                    disabled={loading} />
                  
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Anmelden..." : "Anmelden"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Name</Label>
                  <Input
                    id="register-name"
                    type="text"
                    placeholder="Max Mustermann"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    disabled={loading} />
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                    required />
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Musterstraße"
                    required />
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Hausnummer</Label>
                  <Input
                    id="houseNumber"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    placeholder="123"
                    required />
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="12345"
                    required />
                  
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Berlin"
                    required />
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading} />
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Passwort</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6} />
                  
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Passwort bestätigen</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    minLength={6} />
                  
                </div>

                {/* Bitsurance Checkbox */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="bitsurance"
                    checked={bitsuranceAccepted}
                    onChange={(e) => setBitsuranceAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  
                  <Label htmlFor="bitsurance" className="text-sm leading-tight cursor-pointer">
                    Ich bestätige dass eine für mich kostenfreie Versicherung bei Bitsurance erstellt wird.
                  </Label>
                </div>

                {/* AGB Checkbox */}
                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="agb"
                    checked={agbAccepted}
                    onChange={(e) => setAgbAccepted(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  
                  <Label htmlFor="agb" className="text-sm leading-tight cursor-pointer">
                    Ich akzeptiere die{" "}
                    <a href="/agb" target="_blank" className="text-blue-600 hover:underline">
                      AGB
                    </a>
                    .
                  </Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !agbAccepted || !bitsuranceAccepted}>
                  
                  {loading ? "Registrieren..." : "Registrieren"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
        <div className="px-6 pb-6 mt-4">
          <p className="text-[10px] text-gray-400 text-center leading-tight">Als offizieler Anlageanbieter und Partner von Versicherungen und Banken sind wir verpflichtet bei Verdacht auf Verstoß gegen das Geldwäschegesetz (§ 261 StGB) auf Behördliche Anfragen Auskünfte zuerteilen.


          </p>
        </div>
        <InstallPWA />
      </Card>
    </div>);

}