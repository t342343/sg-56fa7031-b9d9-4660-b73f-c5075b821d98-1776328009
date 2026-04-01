import { useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { supabase } from "@/integrations/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Login State
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register State
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    name: "",
    address: "",
    phone: "",
  });

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log("Attempting login with:", loginData.email);
      
      const { user, error } = await authService.signIn(loginData.email, loginData.password);
      
      if (error) {
        console.error("Login error details:", error);
        toast({ 
          title: "Anmeldung fehlgeschlagen", 
          description: error.message || "Bitte überprüfen Sie Ihre Anmeldedaten",
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      if (!user) {
        toast({ 
          title: "Anmeldung fehlgeschlagen", 
          description: "Ungültige Anmeldedaten",
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      console.log("Login successful, fetching profile...");
      
      // Warte kurz, damit Supabase die Session setzt
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const profile = await profileService.getCurrentProfile();
      console.log("Profile fetched:", profile);

      toast({ 
        title: "Erfolgreich angemeldet", 
        description: `Willkommen zurück, ${profile?.full_name || "User"}!` 
      });

      // Redirect basierend auf Rolle
      if (profile?.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login exception:", error);
      toast({ 
        title: "Fehler", 
        description: error.message || "Ein unerwarteter Fehler ist aufgetreten",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      const combinedAddress = [street, houseNumber, postalCode, city]
        .filter(Boolean)
        .join(", ");

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            address: combinedAddress,
          }
        }
      });

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

      if (!authData?.user) {
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
      await new Promise(resolve => setTimeout(resolve, 500));

      // Erstelle Profil - mit Admin-Check
      const isAdminEmail = registerData.email === "admin@finanzportal.dev";
      
      try {
        await profileService.createProfile({
          id: authData.user.id,
          email: registerData.email,
          full_name: registerData.name,
          address: registerData.address,
          phone: registerData.phone,
          role: isAdminEmail ? "admin" : "user"
        });

        console.log("Profile created successfully");

        toast({ 
          title: "Registrierung erfolgreich!", 
          description: isAdminEmail 
            ? "Admin-Account erstellt. Sie können sich jetzt anmelden." 
            : "Account erstellt. Sie können sich jetzt anmelden.",
        });

        // Leere Formular
        setRegisterData({ email: "", password: "", name: "", address: "", phone: "" });
        
        // Warte kurz und wechsle zum Login-Tab
        setTimeout(() => {
          const loginTab = document.querySelector('[value="login"]') as HTMLElement;
          if (loginTab) loginTab.click();
        }, 1500);

      } catch (profileError: any) {
        console.error("Profile creation error:", profileError);
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-navy-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-heading text-center text-navy">Finanzportal</CardTitle>
          <CardDescription className="text-center text-lg">
            Investment-Dashboard für Bitcoin-Verwaltung
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
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
                    disabled={loading}
                  />
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
                    value={registerData.name}
                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefonnummer</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Musterstraße"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Hausnummer</Label>
                  <Input
                    id="houseNumber"
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="12345"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Berlin"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="ihre@email.de"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                    required
                    disabled={loading}
                  />
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
                    minLength={6}
                  />
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
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Registrieren..." : "Registrieren"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}