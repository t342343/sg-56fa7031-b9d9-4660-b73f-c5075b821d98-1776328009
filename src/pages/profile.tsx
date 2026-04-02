import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { User, Mail, Phone, MapPin, Lock, Save } from "lucide-react";

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Profil-Daten
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [street, setStreet] = useState("");
  const [houseNumber, setHouseNumber] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  
  // Passwort-Änderung
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    const p = await profileService.getCurrentProfile();
    if (p) {
      setProfile(p);
      setFullName(p.full_name || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setAddress(p.address || "");
      
      // Parse address into components
      const addr = p.address || "";
      const parts = addr.split(", ");
      if (parts.length >= 4) {
        setStreet(parts[0] || "");
        setHouseNumber(parts[1] || "");
        setPostalCode(parts[2] || "");
        setCity(parts[3] || "");
      } else {
        setStreet("");
        setHouseNumber("");
        setPostalCode("");
        setCity("");
      }
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    const combinedAddress = [street, houseNumber, postalCode, city]
      .filter(Boolean)
      .join(", ");

    setSaving(true);
    try {
      // Prüfe ob E-Mail geändert wurde
      const emailChanged = email.trim() !== profile.email;
      
      // Update auth.users email NUR wenn geändert
      if (emailChanged) {
        const { error: authError } = await supabase.auth.updateUser({
          email: email.trim()
        });
        
        if (authError) {
          let errorMessage = authError.message;
          
          // Bessere Fehlermeldung für Rate-Limit
          if (authError.message.includes("rate limit") || authError.status === 429) {
            errorMessage = "Zu viele E-Mail-Änderungen. Bitte warten Sie einige Minuten und versuchen Sie es erneut.";
          }
          
          toast({ 
            title: "Fehler", 
            description: errorMessage, 
            variant: "destructive" 
          });
          setSaving(false);
          return;
        }
      }

      // Update profiles Tabelle
      const success = await profileService.updateProfile(profile.id, {
        full_name: fullName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        address: combinedAddress
      });

      if (success) {
        toast({ 
          title: "Profil aktualisiert", 
          description: "Ihre Änderungen wurden gespeichert." 
        });
        loadProfile();
      } else {
        toast({ 
          title: "Fehler", 
          description: "Profil konnte nicht aktualisiert werden.", 
          variant: "destructive" 
        });
      }
    } catch (error) {
      toast({ 
        title: "Fehler", 
        description: "Ein Fehler ist aufgetreten.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword || !currentPassword) {
      toast({ 
        title: "Fehler", 
        description: "Bitte füllen Sie alle Passwort-Felder aus.", 
        variant: "destructive" 
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Fehler", 
        description: "Die neuen Passwörter stimmen nicht überein.", 
        variant: "destructive" 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: "Fehler", 
        description: "Das Passwort muss mindestens 6 Zeichen lang sein.", 
        variant: "destructive" 
      });
      return;
    }

    setSaving(true);
    try {
      // Schritt 1: Aktuelles Passwort verifizieren durch Re-Login mit AKTUELLER E-Mail
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast({ 
          title: "Fehler", 
          description: "Benutzer-Session nicht gefunden.", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      const { error: loginError } = await authService.signIn(user.email, currentPassword);
      
      if (loginError) {
        toast({ 
          title: "Fehler", 
          description: "Aktuelles Passwort ist falsch.", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      // Schritt 2: Neues Passwort setzen
      const result = await authService.updatePassword(newPassword);
      
      if (result.error) {
        toast({ 
          title: "Fehler", 
          description: result.error.message || "Passwort konnte nicht geändert werden.", 
          variant: "destructive" 
        });
      } else {
        toast({ 
          title: "Passwort geändert", 
          description: "Ihr Passwort wurde erfolgreich aktualisiert." 
        });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error) {
      toast({ 
        title: "Fehler", 
        description: "Ein Fehler ist aufgetreten.", 
        variant: "destructive" 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse text-muted-foreground">Lade Profil...</div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <SEO title="Profil bearbeiten - Finanzportal" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Profil bearbeiten</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre persönlichen Daten und Sicherheitseinstellungen
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Persönliche Daten
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Vollständiger Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Max Mustermann"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-Mail-Adresse
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="max@beispiel.de"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefonnummer
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+49 123 456789"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    placeholder="Musterstraße"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Hausnummer</Label>
                  <Input
                    id="houseNumber"
                    value={houseNumber}
                    onChange={e => setHouseNumber(e.target.value)}
                    placeholder="123"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postalCode">PLZ</Label>
                  <Input
                    id="postalCode"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    placeholder="12345"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">Ort</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Berlin"
                  />
                </div>

                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Speichere..." : "Änderungen speichern"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Passwort ändern
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <p className="text-xs text-muted-foreground">
                    Mindestens 6 Zeichen
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <Button 
                  onClick={handleChangePassword} 
                  disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                  variant="secondary"
                  className="w-full"
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {saving ? "Ändere Passwort..." : "Passwort ändern"}
                </Button>

                <p className="text-xs text-muted-foreground border-t pt-3">
                  ⚠️ Aus Sicherheitsgründen werden Passwörter verschlüsselt gespeichert. 
                  Auch Administratoren können Ihr Passwort nicht einsehen.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>

      {/* Geldwäsche-Hinweis */}
      <div className="container mx-auto px-4 py-6">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Als offizieller Anlageanbieter und Partner von Versicherungen und Banken sind wir verpflichtet bei Verdacht auf Verstoß gegen das Geldwäschegesetz (§ 261 StGB) auf Behördliche Anfragen Auskünfte zu erteilen.
        </p>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-8">
      </footer>
    </>
  );
}