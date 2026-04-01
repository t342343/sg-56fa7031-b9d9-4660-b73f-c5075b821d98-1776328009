import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { authService } from "@/services/authService";
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
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!profile) return;
    
    setSaving(true);
    try {
      const success = await profileService.updateProfile(profile.id, {
        full_name: fullName.trim() || null,
        email: email.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null
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
      // Schritt 1: Aktuelles Passwort verifizieren durch Re-Login
      if (!profile?.email) {
        toast({ 
          title: "Fehler", 
          description: "E-Mail-Adresse nicht gefunden.", 
          variant: "destructive" 
        });
        setSaving(false);
        return;
      }

      const { error: loginError } = await authService.signIn(profile.email, currentPassword);
      
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
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Adresse
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Musterstraße 123, 12345 Musterstadt"
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
    </>
  );
}