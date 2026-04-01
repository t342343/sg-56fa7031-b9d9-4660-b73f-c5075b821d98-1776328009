import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { chatService } from "@/services/chatService";
import { withdrawalService } from "@/services/withdrawalService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Clock } from "lucide-react";

export default function AdminPage() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const [countdownDays, setCountdownDays] = useState<Record<string, number>>({});
  const [chats, setChats] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const [p, w, c, wd] = await Promise.all([
      profileService.getAllProfiles(),
      walletService.getAllWallets(),
      chatService.getAllChats(),
      withdrawalService.getWithdrawalRequests()
    ]);
    setProfiles(p.filter(u => u.role !== 'admin'));
    setWallets(w);
    
    const grouped = c.reduce((acc: any, msg: any) => {
      if (!acc[msg.user_id]) acc[msg.user_id] = [];
      acc[msg.user_id].push(msg);
      return acc;
    }, {});
    setChats(Object.entries(grouped));
    setWithdrawals(wd);
  };

  const handleAssignWallet = async (userId: string) => {
    const address = walletAddresses[userId];
    if (!address) return;

    const me = await profileService.getCurrentProfile();
    if (!me) return;

    const existingWallet = wallets.find(w => w.user_id === userId);
    if (existingWallet) {
      // Archiviere alte Transaktionen VOR dem Update der Wallet
      await transactionService.archiveWalletTransactions(existingWallet.id);
      
      // Aktualisiere die Wallet-Adresse
      await walletService.updateWallet(existingWallet.id, address);
    } else {
      await walletService.assignWallet(userId, address, me.id);
    }

    toast({ 
      title: "Wallet zugewiesen", 
      description: existingWallet ? "Alte Transaktionen wurden archiviert." : undefined
    });
    setWalletAddresses({ ...walletAddresses, [userId]: "" });
    loadData();
  };

  const handleUpdateCountdown = async (userId: string) => {
    const days = countdownDays[userId];
    if (!days || days < 1) return;

    const wallet = wallets.find(w => w.user_id === userId);
    if (!wallet) return;

    await walletService.updateCountdownDays(wallet.id, days);
    toast({ title: "Countdown aktualisiert", description: `Neue Transaktionen laufen ${days} Tage.` });
    loadData();
  };

  const sendAdminMessage = async (userId: string) => {
    const message = adminMessages[userId];
    if (!message?.trim()) return;

    await chatService.sendMessage(userId, message, true);
    setAdminMessages({ ...adminMessages, [userId]: "" });
    toast({ title: "Nachricht gesendet" });
    loadData();
  };

  const handleWithdrawal = async (requestId: string, status: "approved" | "rejected") => {
    await withdrawalService.updateWithdrawalStatus(requestId, status);
    toast({ 
      title: status === "approved" ? "Auszahlung genehmigt" : "Auszahlung abgelehnt" 
    });
    loadData();
  };

  return (
    <>
      <SEO title="Admin-Panel - Finanzportal" />
      <DashboardLayout requireAdmin={true}>
        <h2 className="text-2xl font-bold mb-6 text-navy">Admin-Panel</h2>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">Benutzer</TabsTrigger>
            <TabsTrigger value="chat">Chats ({chats.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Auszahlungen ({withdrawals.filter(w => w.status === "pending").length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-6">
            {profiles.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Benutzer.</p>
            ) : (
              profiles.map(profile => {
                const wallet = wallets.find(w => w.user_id === profile.id);
                return (
                  <Card key={profile.id}>
                    <CardHeader>
                      <CardTitle>{profile.full_name || profile.email}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div><strong>Email:</strong> {profile.email}</div>
                        <div><strong>Telefon:</strong> {profile.phone || "-"}</div>
                        <div><strong>Adresse:</strong> {profile.address || "-"}</div>
                        <div>
                          <strong>Aktuelle Wallet:</strong>{" "}
                          {wallet ? (
                            <span className="font-mono text-xs bg-muted p-1 rounded break-all">
                              {wallet.wallet_address}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Keine zugewiesen</span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex gap-2 items-center">
                          <Input 
                            placeholder="BTC Wallet Adresse..." 
                            value={walletAddresses[profile.id] || ""}
                            onChange={e => setWalletAddresses({ ...walletAddresses, [profile.id]: e.target.value })}
                            className="flex-1"
                          />
                          <Button onClick={() => handleAssignWallet(profile.id)}>
                            {wallet ? "Aktualisieren" : "Zuweisen"}
                          </Button>
                        </div>

                        <div className="flex gap-2 items-center">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Input 
                            type="number"
                            placeholder="Countdown Tage (Standard: 14)" 
                            value={countdownDays[profile.id] || wallet?.countdown_days || ""}
                            onChange={e => setCountdownDays({ ...countdownDays, [profile.id]: parseInt(e.target.value) || 0 })}
                            className="flex-1"
                            min="1"
                          />
                          <Button onClick={() => handleUpdateCountdown(profile.id)} variant="outline">
                            Countdown setzen
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Aktuell: {wallet?.countdown_days || 14} Tage bis Ablauf neuer Transaktionen
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 mt-6">
            {chats.length === 0 ? (
              <p className="text-muted-foreground">Keine Chats vorhanden.</p>
            ) : (
              chats.map(([userId, messages]: [string, any[]]) => {
                const profile = profiles.find(p => p.id === userId);
                return (
                  <Card key={userId}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5" />
                        {profile?.full_name || profile?.email || "Unbekannt"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="h-48 overflow-y-auto border rounded-lg p-4 space-y-2 bg-muted/20">
                        {messages.map((msg: any) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.is_admin ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[80%] rounded-lg p-2 text-sm ${
                                msg.is_admin
                                  ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                                  : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                              }`}
                            >
                              <p>{msg.message}</p>
                              <p className="text-xs opacity-60 mt-1">
                                {new Date(msg.created_at).toLocaleString('de-DE')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Antwort schreiben..."
                          value={adminMessages[userId] || ""}
                          onChange={e => setAdminMessages({ ...adminMessages, [userId]: e.target.value })}
                          rows={2}
                        />
                        <Button onClick={() => sendAdminMessage(userId)} className="self-end">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4 mt-6">
            {withdrawals.length === 0 ? (
              <p className="text-muted-foreground">Keine Auszahlungsanfragen.</p>
            ) : (
              withdrawals.map(wd => {
                const profile = profiles.find(p => p.id === wd.user_id);
                return (
                  <Card key={wd.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{profile?.full_name || profile?.email || "Unbekannt"}</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          wd.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          wd.status === "approved" ? "bg-green-100 text-green-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {wd.status === "pending" ? "Ausstehend" : wd.status === "approved" ? "Genehmigt" : "Abgelehnt"}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Betrag:</strong> {wd.amount_btc} BTC
                        </div>
                        <div>
                          <strong>EUR-Wert:</strong> {Number(wd.amount_eur).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </div>
                        <div className="col-span-2">
                          <strong>Auszahlungsadresse:</strong>
                          <p className="font-mono text-xs bg-muted p-2 rounded mt-1 break-all">
                            {wd.withdrawal_address}
                          </p>
                        </div>
                        <div className="col-span-2 text-xs text-muted-foreground">
                          Angefragt: {new Date(wd.created_at).toLocaleString('de-DE')}
                        </div>
                      </div>

                      {wd.status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleWithdrawal(wd.id, "approved")}
                            className="flex-1"
                          >
                            Genehmigen
                          </Button>
                          <Button
                            onClick={() => handleWithdrawal(wd.id, "rejected")}
                            variant="destructive"
                            className="flex-1"
                          >
                            Ablehnen
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </>
  );
}