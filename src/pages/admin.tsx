import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { chatService } from "@/services/chatService";
import { withdrawalService } from "@/services/withdrawalService";
import { transactionService } from "@/services/transactionService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Clock, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
  const [completedWithdrawals, setCompletedWithdrawals] = useState<any[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [newMessage, setNewMessage] = useState("");
  const [bitcoinAddress, setBitcoinAddress] = useState("");
  const [selectedWalletUserId, setSelectedWalletUserId] = useState("");
  const [walletAddresses, setWalletAddresses] = useState<Record<string, string>>({});
  const [countdownDays, setCountdownDays] = useState<Record<string, number>>({});
  const [chats, setChats] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [adminMessages, setAdminMessages] = useState<Record<string, string>>({});
  const [walletPool, setWalletPool] = useState<any[]>([]);
  const [newPoolAddress, setNewPoolAddress] = useState("");
  const [maturityDays, setMaturityDays] = useState<{ [key: string]: number }>({});
  const [minSaldo, setMinSaldo] = useState<string>("");
  const [maxSaldo, setMaxSaldo] = useState<string>("");
  const [saldoSort, setSaldoSort] = useState<"high" | "low" | "none">("none");
  const { toast } = useToast();

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    const usersData = await profileService.getAllProfiles();
    const walletsData = await walletService.getAllWallets();
    const txData = await transactionService.getAllTransactions();
    const pendingTx = await transactionService.getPendingWithdrawals();
    const completedTx = await transactionService.getCompletedWithdrawals();
    const poolData = await walletService.getWalletPool();
    
    setUsers(usersData);
    setWallets(walletsData);
    setTransactions(txData);
    setPendingTransactions(pendingTx);
    setCompletedWithdrawals(completedTx);
    setWalletPool(poolData);
  };

  const calculateUserBalance = (userId: string) => {
    const userWallet = wallets.find(w => w.user_id === userId);
    if (!userWallet) return 0;

    const userTransactions = transactions.filter(
      tx => tx.wallet_id === userWallet.id && tx.status === 'active'
    );

    return userTransactions.reduce((sum, tx) => {
      const eingezahlt = tx.amount_eur * 1.01;
      const timestamp = new Date(tx.timestamp).getTime();
      const now = Date.now();
      const hoursPassed = Math.max(0, Math.floor((now - timestamp) / (1000 * 60 * 60)));
      const hourlyRate = tx.is_extended ? 0.001 : 0.0005;
      const wachstumFaktor = Math.pow(1 + hourlyRate, hoursPassed);
      return sum + (eingezahlt * wachstumFaktor);
    }, 0);
  };

  const handleAssignWallet = async (userId: string) => {
    const address = walletAddresses[userId];
    if (!address) return;

    const me = await profileService.getCurrentProfile();
    if (!me) return;

    try {
      const existingWallet = wallets.find(w => w.user_id === userId);
      
      if (existingWallet) {
        console.log("🔄 Updating wallet for user:", userId);
        console.log("📍 Old address:", existingWallet.wallet_address);
        console.log("📍 New address:", address);
        
        // LÖSCHE alle alten Transaktionen BEVOR die Wallet-Adresse geändert wird
        console.log("🗑️ Deleting old transactions for wallet_id:", existingWallet.id);
        await transactionService.deleteWalletTransactions(existingWallet.id);
        
        // Aktualisiere die Wallet-Adresse
        console.log("💾 Updating wallet address...");
        await walletService.updateWallet(existingWallet.id, address);
        console.log("✅ Wallet updated successfully");
        
        toast({ 
          title: "Wallet aktualisiert", 
          description: "Alte Transaktionen wurden gelöscht. Neue werden zur neuen Adresse erkannt."
        });
      } else {
        // Erstelle neue Wallet
        console.log("➕ Creating new wallet for user:", userId);
        await walletService.assignWallet(userId, address, me.id);
        
        toast({ 
          title: "Wallet zugewiesen"
        });
      }

      setWalletAddresses({ ...walletAddresses, [userId]: "" });
      loadData();
    } catch (error) {
      console.error("❌ Error assigning wallet:", error);
      toast({ 
        title: "Fehler", 
        description: "Wallet konnte nicht zugewiesen werden.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCountdown = async (userId: string) => {
    const days = countdownDays[userId];
    if (days === undefined || days < 0) return;

    const wallet = wallets.find(w => w.user_id === userId);
    if (!wallet) return;

    await walletService.updateCountdownDays(wallet.id, days);
    toast({ title: "Countdown aktualisiert", description: days === 0 ? "Transaktionen laufen sofort ab." : `Neue Transaktionen laufen ${days} Tage.` });
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

  const handleTransactionWithdrawal = async (txId: string, status: "withdrawn" | "active") => {
    if (status === "withdrawn") {
      try {
        // Hole aktuelle Transaktion
        const { data: transaction, error: fetchError } = await supabase
          .from("transactions")
          .select("*")
          .eq("id", txId)
          .single();

        if (fetchError) throw fetchError;

        // Hole Server-Zeit für genaue Berechnung
        const serverTimeRes = await fetch("/api/server-time");
        const serverTimeData = await serverTimeRes.json();
        const serverTime = new Date(serverTimeData.timestamp);

        // Berechne finalen Auszahlungsbetrag mit Rendite
        const eingezahlt = transaction.amount_eur;
        const timestamp = new Date(transaction.timestamp).getTime();
        const timeDiffMs = serverTime.getTime() - timestamp;
        const hoursPassed = Math.max(0, Math.floor(timeDiffMs / (1000 * 60 * 60)));
        
        // 1% Start-Bonus + 0.05% pro Stunde
        const startBonus = eingezahlt * 1.01;
        const wachstumFaktor = Math.pow(1.0005, hoursPassed);
        const finalAmountEur = startBonus * wachstumFaktor;

        // Hole aktuellen Bitcoin-Kurs
        const btcPriceResponse = await fetch("/api/bitcoin-price");
        const btcPriceData = await btcPriceResponse.json();
        const currentBtcPrice = btcPriceData.price;
        
        // Berechne Bitcoin-Betrag
        const finalAmountBtc = finalAmountEur / currentBtcPrice;

        // Aktualisiere Transaktion mit finalen Beträgen
        const { error } = await supabase
          .from("transactions")
          .update({ 
            status: "withdrawn",
            withdrawn_amount_eur: finalAmountEur,
            withdrawn_amount_btc: finalAmountBtc
          })
          .eq("id", txId);

        if (error) throw error;

        toast({ 
          title: "Auszahlung genehmigt", 
          description: `${finalAmountEur.toFixed(2)} € (${finalAmountBtc.toFixed(8)} BTC) veranlasst.` 
        });
      } catch (error) {
        console.error("Fehler bei Genehmigung:", error);
        toast({ title: "Fehler", description: "Konnte nicht genehmigt werden", variant: "destructive" });
      }
    } else {
      await transactionService.updateTransactionStatus(txId, "active");
      toast({ title: "Auszahlung abgelehnt", description: "Transaktion ist wieder aktiv." });
    }
    loadData();
  };

  const handleSetMaturityDate = async (txId: string) => {
    const days = maturityDays[txId];
    if (days === undefined || days < 0 || days > 14) {
      toast({ title: "Fehler", description: "Bitte 0-14 Tage eingeben", variant: "destructive" });
      return;
    }

    // Berechne maturity_date aus Tagen
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    const transactionDate = new Date(tx.timestamp);
    const maturityDate = new Date(transactionDate);
    maturityDate.setDate(maturityDate.getDate() + days);

    const result = await transactionService.updateMaturityDate(txId, maturityDate.toISOString(), days);
    if (result) {
      toast({ title: "Laufzeit gesetzt", description: `Fälligkeit auf ${days} Tage gesetzt` });
      loadData();
      setMaturityDays(prev => ({ ...prev, [txId]: 0 }));
    } else {
      toast({ title: "Fehler", description: "Konnte nicht aktualisiert werden", variant: "destructive" });
    }
  };

  const handleAddToPool = async () => {
    if (!newPoolAddress.trim()) {
      toast({ title: "Fehler", description: "Bitte Wallet-Adresse eingeben", variant: "destructive" });
      return;
    }

    try {
      await walletService.addToWalletPool(newPoolAddress.trim());
      toast({ title: "Wallet zum Pool hinzugefügt" });
      setNewPoolAddress("");
      loadData();
    } catch (error) {
      toast({ title: "Fehler", description: "Wallet-Adresse existiert bereits oder ist ungültig", variant: "destructive" });
    }
  };

  const handleRemoveFromPool = async (poolId: string) => {
    try {
      await walletService.removeFromWalletPool(poolId);
      toast({ title: "Wallet aus Pool entfernt" });
      loadData();
    } catch (error) {
      toast({ title: "Fehler", description: "Wallet konnte nicht entfernt werden", variant: "destructive" });
    }
  };

  const handleExtend = async (txId: string) => {
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    // Verlängere automatisch auf 14 Tage
    const newMaturityDate = new Date();
    newMaturityDate.setDate(newMaturityDate.getDate() + 14);

    // Berechne Sofortbonus (2%)
    const instantBonus = tx.amount_eur * 0.02;

    const result = await transactionService.extendMaturity(txId, newMaturityDate.toISOString(), 14, instantBonus);
    if (result) {
      toast({ title: "Verlängert", description: `Laufzeit um 14 Tage verlängert. Bonus: ${instantBonus.toFixed(2)} € sofort gutgeschrieben` });
      loadData();
    } else {
      toast({ title: "Fehler", description: "Konnte nicht verlängert werden", variant: "destructive" });
    }
  };

  const handleWithdraw = async (txId: string) => {
    await transactionService.updateTransactionStatus(txId, "withdrawal_pending");
    toast({ title: "Auszahlung angefordert", description: "Die Transaktion wurde zur Auszahlung markiert." });
    loadData();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Hardcoded Admin-Zugangsdaten
      if (adminEmail === "admin" && adminPassword === "hks.2837") {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: "admin@finanzportal.de",
          password: "hks.2837",
        });
      }
    } catch (error) {
      console.error("❌ Error assigning wallet:", error);
      toast({ 
        title: "Fehler", 
        description: "Wallet konnte nicht zugewiesen werden.",
        variant: "destructive"
      });
    }
  };

  // Berechne Gesamtrendite aller aktiven Transaktionen
  const calculateTotalYield = () => {
    const activeTransactions = transactions.filter(t => t.status === "active");
    return activeTransactions.reduce((sum, tx) => {
      const daysActive = Math.floor((Date.now() - new Date(tx.timestamp).getTime()) / (1000 * 60 * 60 * 24));
      const dailyYield = tx.amount_eur * 0.01; // 1% pro Tag Standard
      
      const multiplier = tx.is_extended ? 2 : 1; // 2x Rendite bei Verlängerung
      
      return sum + (daysActive * dailyYield * multiplier);
    }, 0);
  };

  return (
    <>
      <SEO title="Admin-Panel - Finanzportal" />
      <DashboardLayout requireAdmin={true}>
        <h2 className="text-2xl font-bold mb-6 text-navy">Admin-Panel</h2>
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="users">Benutzer</TabsTrigger>
            <TabsTrigger value="pool">Wallet-Pool ({walletPool.filter(w => !w.assigned_to_user_id).length})</TabsTrigger>
            <TabsTrigger value="chat">Chats ({chats.length})</TabsTrigger>
            <TabsTrigger value="withdrawals">Auszahlungen ({withdrawals.filter(w => w.status === "pending").length + pendingTransactions.length})</TabsTrigger>
            <TabsTrigger value="transactions">Transaktionen ({transactions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Filter & Sortierung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 block mb-1">Min. Saldo (€)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={minSaldo}
                      onChange={e => setMinSaldo(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 block mb-1">Max. Saldo (€)</label>
                    <Input
                      type="number"
                      placeholder="Unbegrenzt"
                      value={maxSaldo}
                      onChange={e => setMaxSaldo(e.target.value)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm text-gray-600 block mb-1">Sortieren nach Saldo</label>
                    <select
                      value={saldoSort}
                      onChange={e => setSaldoSort(e.target.value as "high" | "low" | "none")}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background"
                    >
                      <option value="none">Keine Sortierung</option>
                      <option value="high">Hoch → Niedrig</option>
                      <option value="low">Niedrig → Hoch</option>
                    </select>
                  </div>
                  <Button
                    onClick={() => {
                      setMinSaldo("");
                      setMaxSaldo("");
                      setSaldoSort("none");
                    }}
                    variant="outline"
                  >
                    Zurücksetzen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {users.length === 0 ? (
              <p className="text-muted-foreground">Noch keine Benutzer.</p>
            ) : (
              users
                .filter(profile => {
                  const balance = calculateUserBalance(profile.id);
                  const min = minSaldo ? parseFloat(minSaldo) : 0;
                  const max = maxSaldo ? parseFloat(maxSaldo) : Infinity;
                  return balance >= min && balance <= max;
                })
                .sort((a, b) => {
                  if (saldoSort === "none") return 0;
                  const balanceA = calculateUserBalance(a.id);
                  const balanceB = calculateUserBalance(b.id);
                  return saldoSort === "high" ? balanceB - balanceA : balanceA - balanceB;
                })
                .map(profile => {
                const wallet = wallets.find(w => w.user_id === profile.id);
                const balance = calculateUserBalance(profile.id);
                return (
                  <Card key={profile.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{profile.full_name || profile.email}</span>
                        <span className="text-xl font-bold text-green-600">
                          {balance.toFixed(2)} €
                        </span>
                      </CardTitle>
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
                            value={countdownDays[profile.id] !== undefined ? countdownDays[profile.id] : (wallet?.countdown_days ?? "")}
                            onChange={e => setCountdownDays({ ...countdownDays, [profile.id]: parseInt(e.target.value) || 0 })}
                            className="flex-1"
                            min="0"
                          />
                          <Button onClick={() => handleUpdateCountdown(profile.id)} variant="outline">
                            Countdown setzen
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Aktuell: {wallet?.countdown_days ?? 14} Tage bis Ablauf neuer Transaktionen
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          <TabsContent value="pool" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Neue Wallet-Adresse zum Pool hinzufügen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Bitcoin Wallet-Adresse (bc1...)" 
                    value={newPoolAddress}
                    onChange={e => setNewPoolAddress(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button onClick={handleAddToPool}>
                    Hinzufügen
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Maximale Pool-Größe: 20 Adressen. Bei neuer Registrierung wird automatisch eine freie Adresse zugewiesen.
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold">
                Vorrätige Wallets ({walletPool.filter(w => !w.assigned_to_user_id).length} verfügbar / {walletPool.length} gesamt)
              </h3>
              
              {walletPool.length === 0 ? (
                <p className="text-muted-foreground">Noch keine Wallets im Pool.</p>
              ) : (
                walletPool.map(wallet => {
                  const isAssigned = !!wallet.assigned_to_user_id;
                  const assignedUser = isAssigned ? users.find(p => p.id === wallet.assigned_to_user_id) : null;
                  
                  return (
                    <Card key={wallet.id} className={isAssigned ? "bg-muted/30" : ""}>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-mono text-sm break-all">
                              {wallet.wallet_address}
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              {isAssigned ? (
                                <>
                                  <span className="px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 rounded">
                                    Zugewiesen
                                  </span>
                                  <span>→ {assignedUser?.full_name || assignedUser?.email || "Unbekannt"}</span>
                                  <span>am {new Date(wallet.assigned_at).toLocaleDateString('de-DE')}</span>
                                </>
                              ) : (
                                <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 rounded">
                                  Verfügbar
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {!isAssigned && (
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleRemoveFromPool(wallet.id)}
                            >
                              Entfernen
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 mt-6">
            {chats.length === 0 ? (
              <p className="text-muted-foreground">Keine Chats vorhanden.</p>
            ) : (
              chats.map(([userId, messages]: [string, any[]]) => {
                const profile = users.find(p => p.id === userId);
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

          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offene Auszahlungsanfragen</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTransactions.length === 0 ? (
                  <p className="text-gray-500">Keine offenen Auszahlungsanfragen</p>
                ) : (
                  <div className="space-y-4">
                    {pendingTransactions.map((tx) => (
                      <div key={tx.id} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div className="space-y-1">
                            <div className="font-semibold text-lg">
                              {tx.bitcoin_wallets?.profiles?.full_name || tx.bitcoin_wallets?.profiles?.email}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Wallet: {tx.bitcoin_wallets?.wallet_address?.substring(0, 20)}...
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Angefragt: {new Date(tx.created_at).toLocaleString('de-DE')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-amber-800">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </div>
                            <div className="text-sm text-amber-600 font-medium">
                              {tx.withdrawn_amount_btc ? 
                                `${tx.withdrawn_amount_btc.toFixed(8)} BTC` : 
                                `${(tx.amount_btc || 0).toFixed(8)} BTC`
                              }
                            </div>
                            <div className="text-sm text-green-600 mt-1">
                              Gewinn: +{((tx.withdrawn_amount_eur || tx.amount_eur) - tx.amount_eur).toFixed(2)} €
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Eingezahlter Betrag:</span>
                            <span className="font-medium">{tx.amount_eur.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Auszahlungsbetrag (EUR):</span>
                            <span className="font-bold text-amber-800">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Auszahlungsbetrag (BTC):</span>
                            <span className="font-mono text-xs font-medium">
                              {tx.withdrawn_amount_btc ? 
                                `${tx.withdrawn_amount_btc.toFixed(8)} BTC` : 
                                `${(tx.amount_btc || 0).toFixed(8)} BTC`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Eingezahlt am:</span>
                            <span className="font-medium">
                              {new Date(tx.timestamp).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wallet:</span>
                            <span className="font-mono text-xs">
                              {tx.bitcoin_wallets?.wallet_address?.substring(0, 30)}...
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="text-gray-600 mb-1">Auszahlung an:</div>
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all border">
                              {tx.withdrawal_address || "Nicht verfügbar"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                          <Button
                            onClick={() => handleTransactionWithdrawal(tx.id, "withdrawn")}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            ✓ Auszahlung bestätigen
                          </Button>
                          <Button
                            onClick={() => handleTransactionWithdrawal(tx.id, "active")}
                            variant="outline"
                            className="flex-1"
                          >
                            ✗ Ablehnen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Abgeschlossene Auszahlungen</CardTitle>
              </CardHeader>
              <CardContent>
                {completedWithdrawals.length === 0 ? (
                  <p className="text-gray-500">Keine abgeschlossenen Auszahlungen</p>
                ) : (
                  <div className="space-y-4">
                    {completedWithdrawals.map((tx) => (
                      <div key={tx.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-green-800">
                                {tx.bitcoin_wallets?.profiles?.full_name || tx.bitcoin_wallets?.profiles?.email}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {new Date(tx.created_at).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-700">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </div>
                            <div className="text-sm text-green-600 font-medium">
                              {tx.withdrawn_amount_btc ? 
                                `${tx.withdrawn_amount_btc.toFixed(8)} BTC` : 
                                `${(tx.amount_btc || 0).toFixed(8)} BTC`
                              }
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              Gewinn: +{((tx.withdrawn_amount_eur || tx.amount_eur) - tx.amount_eur).toFixed(2)} €
                            </div>
                          </div>
                        </div>

                        <div className="bg-white rounded p-3 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Eingezahlter Betrag:</span>
                            <span className="font-medium">{tx.amount_eur.toFixed(2)} €</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ausgezahlter Betrag:</span>
                            <span className="font-bold text-green-700">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">In Bitcoin:</span>
                            <span className="font-mono text-xs font-medium">
                              {tx.withdrawn_amount_btc ? 
                                `${tx.withdrawn_amount_btc.toFixed(8)} BTC` : 
                                `${(tx.amount_btc || 0).toFixed(8)} BTC`
                              }
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="text-gray-600">Eingezahlt am:</span>
                            <span className="font-medium">
                              {new Date(tx.timestamp).toLocaleDateString("de-DE", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric"
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wallet:</span>
                            <span className="font-mono text-xs">
                              {tx.bitcoin_wallets?.wallet_address?.substring(0, 30)}...
                            </span>
                          </div>
                          <div className="border-t pt-2 mt-2">
                            <div className="text-gray-600 mb-1">Auszahlung an:</div>
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all border">
                              {tx.withdrawal_address || "Nicht verfügbar"}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="grid grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Alle Transaktionen ({transactions.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.id}
                        onClick={() => setSelectedTransactionId(tx.id)}
                        className={`p-3 border rounded cursor-pointer transition-colors ${
                          selectedTransactionId === tx.id
                            ? "bg-blue-50 border-blue-500"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-mono text-xs text-gray-600 mb-1">
                              {tx.txid.substring(0, 20)}...
                            </div>
                            <div className="font-semibold text-lg">{tx.amount_eur.toFixed(2)} €</div>
                            <div className="text-sm text-gray-600">
                              {new Date(tx.timestamp).toLocaleDateString("de-DE")}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              tx.status === "active" ? "bg-green-100 text-green-800" :
                              tx.status === "withdrawal_pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              {tx.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>
                    {selectedTransactionId ? "Transaktionsdetails" : "Transaktion auswählen"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedTransactionId ? (
                    <div className="space-y-4">
                      {(() => {
                        const tx = transactions.find(t => t.id === selectedTransactionId);
                        if (!tx) return null;

                        const transactionDate = new Date(tx.timestamp);
                        const now = new Date();
                        const daysPassed = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
                        const maturityDate = tx.maturity_date ? new Date(tx.maturity_date) : null;
                        const daysUntilMaturity = maturityDate 
                          ? Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                          : null;

                        return (
                          <>
                            <div className="space-y-3 text-sm">
                              <div>
                                <span className="text-gray-600">Benutzer:</span>
                                <div className="font-medium">
                                  {tx.bitcoin_wallets?.profiles?.full_name || "Kein Name"}
                                </div>
                                <div className="text-gray-500 text-xs">
                                  {tx.bitcoin_wallets?.profiles?.email || "Keine Email"}
                                </div>
                              </div>
                              <div>
                                <span className="text-gray-600">TXID:</span>
                                <div className="font-mono text-xs break-all mt-1">{tx.txid}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Betrag:</span>
                                <div className="font-semibold text-lg">{tx.amount_eur.toFixed(2)} €</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <div className="font-medium capitalize">{tx.status}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Eingezahlt am:</span>
                                <div>{transactionDate.toLocaleString("de-DE")}</div>
                              </div>
                              <div>
                                <span className="text-gray-600">Tage seit Einzahlung:</span>
                                <div className="font-semibold">{daysPassed} Tage</div>
                              </div>
                              {maturityDate && (
                                <>
                                  <div>
                                    <span className="text-gray-600">Fälligkeitsdatum:</span>
                                    <div className="font-semibold text-green-600">
                                      {maturityDate.toLocaleString("de-DE")}
                                    </div>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Verbleibende Tage:</span>
                                    <div className={`font-semibold ${daysUntilMaturity && daysUntilMaturity > 0 ? "text-green-600" : "text-red-600"}`}>
                                      {daysUntilMaturity !== null ? (daysUntilMaturity > 0 ? `${daysUntilMaturity} Tage` : "Fällig") : "-"}
                                    </div>
                                  </div>
                                </>
                              )}
                            </div>

                            <div className="border-t pt-4 mt-4">
                              <div className="text-sm font-medium mb-3">Restlaufzeit festlegen</div>
                              <div className="space-y-3">
                                <div>
                                  <label className="text-xs text-gray-600 block mb-1">
                                    Laufzeit in Tagen (0-14)
                                  </label>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="14"
                                    placeholder="Tage"
                                    value={maturityDays[tx.id] ?? ""}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "") {
                                        setMaturityDays(prev => {
                                          const newState = { ...prev };
                                          delete newState[tx.id];
                                          return newState;
                                        });
                                      } else {
                                        const numValue = parseInt(value);
                                        if (!isNaN(numValue) && numValue >= 0 && numValue <= 14) {
                                          setMaturityDays(prev => ({ ...prev, [tx.id]: numValue }));
                                        }
                                      }
                                    }}
                                    className="text-center"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    0 = sofort fällig, 14 = maximale Laufzeit
                                  </p>
                                </div>
                                <Button
                                  onClick={() => handleSetMaturityDate(tx.id)}
                                  disabled={maturityDays[tx.id] === undefined}
                                  className="w-full"
                                >
                                  Laufzeit setzen
                                </Button>
                              </div>
                            </div>

                            {daysUntilMaturity !== null && daysUntilMaturity <= 0 && (
                              <div className="pt-3 border-t">
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleWithdraw(tx.id)}
                                    variant="default"
                                    className="flex-1"
                                  >
                                    Auszahlen
                                  </Button>
                                  <Button
                                    onClick={() => handleExtend(tx.id)}
                                    variant="outline"
                                    className="flex-1"
                                  >
                                    Verlängern
                                  </Button>
                                </div>
                                <p className="text-xs text-green-600 mt-2 text-center">
                                  (Bonus 2 % sofort Rendite und täglich 2fache Rendite)
                                </p>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm text-center py-8">
                      Wähle eine Transaktion aus der Liste, um Details anzuzeigen
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </>
  );
}