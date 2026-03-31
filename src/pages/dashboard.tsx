import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { transactionService } from "@/services/transactionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { ArrowDownLeft } from "lucide-react";

export default function UserDashboard() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    const w = await walletService.getWalletForUser(profile.id);
    setWallet(w);

    if (w) {
      // API Check für neue Transaktionen
      const newCount = await transactionService.checkNewTransactions(w.wallet_address, w.id);
      if (newCount > 0) {
        toast({ title: "Neue Transaktionen", description: `${newCount} neue Zahlungen gefunden und verarbeitet.` });
      }

      // Lade historische Transaktionen
      const txs = await transactionService.getTransactionsForWallet(w.id);
      setTransactions(txs);
    }
    setLoading(false);
  };

  return (
    <>
      <SEO title="Investment Dashboard - Finanzportal" />
      <DashboardLayout>
        <h2 className="text-2xl font-bold mb-6 text-navy">Ihr Investment Dashboard</h2>
        
        {loading ? (
          <div className="animate-pulse text-muted-foreground">Lade Daten...</div>
        ) : !wallet ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                Ihnen wurde noch keine Bitcoin Wallet zugewiesen. Bitte warten Sie, bis der Administrator Ihr Konto eingerichtet hat.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="border-blue-accent/20 bg-blue-accent/5">
              <CardHeader>
                <CardTitle className="text-lg">Ihre Read-Only Bitcoin Wallet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-mono bg-background border p-4 rounded-md break-all select-all text-sm">
                  {wallet.wallet_address}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Dies ist Ihre persönliche Einzahlungsadresse.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaktionshistorie (Eingänge)</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground py-4">Noch keine Transaktionen gefunden. Die Historie wird automatisch aktualisiert.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map(tx => (
                      <div key={tx.id} className="flex justify-between items-center p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="bg-green-100 text-green-700 p-2 rounded-full dark:bg-green-900/30 dark:text-green-400">
                            <ArrowDownLeft className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="font-semibold text-green-600 dark:text-green-400">+{Number(tx.amount_btc).toFixed(8)} BTC</div>
                            <div className="text-xs text-muted-foreground">Kurs: 1 BTC = {Number(tx.eur_rate).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg">{Number(tx.amount_eur).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(tx.timestamp).toLocaleString('de-DE')}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}