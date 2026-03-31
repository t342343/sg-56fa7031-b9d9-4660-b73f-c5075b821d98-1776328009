import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";

export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [p, w] = await Promise.all([
      profileService.getAllProfiles(),
      walletService.getAllWallets()
    ]);
    setProfiles(p.filter(u => u.role !== 'admin'));
    setWallets(w);
  };

  const handleAssignWallet = async (userId: string) => {
    const address = walletAddresses[userId];
    if (!address) return;

    const me = await profileService.getCurrentProfile();
    if (!me) return;

    const existingWallet = wallets.find(w => w.user_id === userId);
    if (existingWallet) {
      await walletService.updateWallet(existingWallet.id, address);
    } else {
      await walletService.assignWallet(userId, address, me.id);
    }

    toast({ title: "Wallet zugewiesen", description: "Die Bitcoin Wallet wurde erfolgreich gespeichert." });
    setWalletAddresses({ ...walletAddresses, [userId]: "" });
    loadData();
  };

  return (
    <>
      <SEO title="Admin-Panel - Finanzportal" />
      <DashboardLayout requireAdmin={true}>
        <h2 className="text-2xl font-bold mb-6 text-navy">Benutzerverwaltung</h2>
        <div className="grid gap-6">
          {profiles.length === 0 ? (
            <p className="text-muted-foreground">Noch keine Benutzer registriert.</p>
          ) : (
            profiles.map(profile => {
              const wallet = wallets.find(w => w.user_id === profile.id);
              return (
                <Card key={profile.id}>
                  <CardHeader>
                    <CardTitle>{profile.full_name || profile.email}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-6">
                      <div><strong>Email:</strong> {profile.email}</div>
                      <div><strong>Telefon:</strong> {profile.phone || "-"}</div>
                      <div><strong>Adresse:</strong> {profile.address || "-"}</div>
                      <div>
                        <strong>Aktuelle Wallet:</strong>{" "}
                        {wallet ? (
                          <span className="font-mono text-xs bg-muted p-1 rounded break-all">{wallet.wallet_address}</span>
                        ) : (
                          <span className="text-muted-foreground">Keine zugewiesen</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 items-center max-w-md">
                      <Input 
                        placeholder="Neue BTC Wallet Adresse..." 
                        value={walletAddresses[profile.id] || ""}
                        onChange={e => setWalletAddresses({ ...walletAddresses, [profile.id]: e.target.value })}
                      />
                      <Button onClick={() => handleAssignWallet(profile.id)}>
                        {wallet ? "Aktualisieren" : "Zuweisen"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </DashboardLayout>
    </>
  );
}