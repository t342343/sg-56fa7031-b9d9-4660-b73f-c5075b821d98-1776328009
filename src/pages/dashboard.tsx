import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { transactionService } from "@/services/transactionService";
import { chatService } from "@/services/chatService";
import { withdrawalService } from "@/services/withdrawalService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { ArrowDownLeft, Copy, Check, Clock, MessageCircle, Send, TrendingUp, Wallet, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [withdrawnTransactions, setWithdrawnTransactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingTransactions, setCheckingTransactions] = useState(false);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Hole Server-Zeit beim Laden
  useEffect(() => {
    const fetchServerTime = async () => {
      try {
        const response = await fetch("/api/server-time");
        const data = await response.json();
        setServerTime(new Date(data.timestamp));
      } catch (error) {
        console.error("Error fetching server time:", error);
        setServerTime(new Date());
      }
    };

    fetchServerTime();
    const interval = setInterval(() => {
      setServerTime((prev) => prev ? new Date(prev.getTime() + 1000) : new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    let channel: any;

    if (userId) {
      channel = chatService.subscribeToMessages(userId, (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      });
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [userId]);

  const loadDashboard = async () => {
    setLoading(true);
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    setUserId(profile.id);

    const w = await walletService.getWalletForUser(profile.id);
    setWallet(w);

    if (w) {
      // Prüfe auf neue Transaktionen via API
      const newCount = await transactionService.checkNewTransactions(w.wallet_address, w.id);
      if (newCount > 0) {
        toast({ title: "Neue Transaktionen", description: `${newCount} neue Zahlungen gefunden.` });
      }

      // Aktive Transaktionen laden
      const txs = await transactionService.getActiveTransactionsByWallet(w.id);
      console.log("📋 Dashboard loaded", txs.length, "transactions - Status:", txs.map(t => t.status));
      setTransactions(txs);

      // Abgeschlossene Auszahlungen laden
      const withdrawn = await transactionService.getWithdrawnTransactionsByWallet(w.id);
      setWithdrawnTransactions(withdrawn);
    }
    setLoading(false);
  };

  const loadChat = async () => {
    const profile = await profileService.getCurrentProfile();
    if (profile) {
      setUserId(profile.id);
      const msgs = await chatService.getMessages(profile.id);
      setMessages(msgs);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    await chatService.sendMessage(profile.id, newMessage);
    setNewMessage("");
    loadChat();
  };

  const handleExtend = async (txId: string) => {
    try {
      await transactionService.extendTransaction(txId, wallet.countdown_days ?? 14);
      toast({ title: "Verlängert", description: "Die Transaktion wurde erfolgreich verlängert." });
      loadDashboard();
    } catch (error) {
      toast({ title: "Fehler", description: "Verlängerung fehlgeschlagen.", variant: "destructive" });
    }
  };

  const handleWithdraw = async (txId: string) => {
    if (!wallet?.wallet_address) {
      toast({ title: "Fehler", description: "Keine Wallet-Adresse gefunden.", variant: "destructive" });
      return;
    }

    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    try {
      const success = await transactionService.requestWithdrawal(txId, wallet.wallet_address, tx.amount_btc);
      if (success) {
        setSelectedTx(null); // Schließe das Formular
        setWithdrawalAddress(""); // Leere das Adressfeld
        toast({ title: "Auszahlungsanfrage gesendet", description: "Die Auszahlung erfolgt in Kürze." });
        loadDashboard();
      } else {
        toast({ title: "Fehler", description: "Auszahlungsanfrage fehlgeschlagen.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Fehler", description: "Auszahlungsanfrage fehlgeschlagen.", variant: "destructive" });
    }
  };

  const copyWalletAddress = async () => {
    if (wallet?.wallet_address) {
      await navigator.clipboard.writeText(wallet.wallet_address);
      setCopied(true);
      toast({ title: "Adresse kopiert", description: "Die Bitcoin-Wallet-Adresse wurde kopiert." });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const manualCheckTransactions = async () => {
    if (!wallet) return;

    setCheckingTransactions(true);
    toast({ title: "Prüfe Transaktionen...", description: "Suche nach neuen Zahlungseingängen." });

    try {
      const newCount = await transactionService.checkNewTransactions(wallet.wallet_address, wallet.id);

      if (newCount > 0) {
        toast({
          title: "Neue Transaktionen gefunden!",
          description: `${newCount} neue Zahlungen wurden erkannt und hinzugefügt.`
        });
        await loadDashboard();
      } else {
        toast({
          title: "Keine neuen Transaktionen",
          description: "Es wurden keine neuen Zahlungen gefunden."
        });
      }
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Transaktionsprüfung fehlgeschlagen.",
        variant: "destructive"
      });
    } finally {
      setCheckingTransactions(false);
    }
  };

  const calculateCurrentBalance = (tx: any) => {
    if (!serverTime) return tx.amount_eur; // Fallback wenn serverTime noch nicht geladen
    
    const eingezahlt = tx.amount_eur;
    const timestamp = new Date(tx.timestamp).getTime();
    const now = serverTime.getTime(); // Verwende serverTime statt Date.now()
    const timeDiffMs = now - timestamp;
    const hoursPassed = Math.floor(timeDiffMs / (1000 * 60 * 60));
    
    // Verhindere negative Stunden (falls Transaktion in der Zukunft liegt)
    const safeHoursPassed = Math.max(0, hoursPassed);
    
    const startBonus = eingezahlt * 1.01;
    const wachstumFaktor = Math.pow(1.005, safeHoursPassed);
    const finalBalance = startBonus * wachstumFaktor;

    console.log("💰 Balance Calculation:", {
      txid: tx.txid?.substring(0, 8),
      eingezahlt,
      hoursPassed: safeHoursPassed,
      startBonus,
      wachstumFaktor,
      finalBalance,
      gewinn: finalBalance - eingezahlt
    });

    return finalBalance;
  };

  const calculateTotalBalance = () => {
    return transactions
      .filter(tx => tx.status !== "withdrawal_pending")
      .reduce((sum, tx) => sum + calculateCurrentBalance(tx), 0);
  };

  const calculateTotalProfit = () => {
    return transactions
      .filter(tx => tx.status !== "withdrawal_pending")
      .reduce((sum, tx) => {
        const currentBalance = calculateCurrentBalance(tx);
        return sum + (currentBalance - tx.amount_eur);
      }, 0);
  };

  const getNextProfitCountdown = (timestamp: string) => {
    if (!serverTime) return "...";

    const now = serverTime;
    const startDate = new Date(timestamp);

    // Berechne nächste volle Stunde seit Transaktionsstart
    const timeDiff = now.getTime() - startDate.getTime();
    const hoursPassed = Math.floor(timeDiff / (1000 * 60 * 60));
    const nextProfitTime = new Date(startDate.getTime() + (hoursPassed + 1) * 60 * 60 * 1000);

    const remainingMs = nextProfitTime.getTime() - now.getTime();

    if (remainingMs <= 0) return "Berechnung läuft...";

    const minutes = Math.floor(remainingMs / (1000 * 60));
    const seconds = Math.floor(remainingMs % (1000 * 60) / 1000);

    return `${minutes}m ${seconds}s`;
  };

  const getCountdownProgress = (timestamp: string, expiresAt: string) => {
    if (!serverTime) return 0;

    const now = serverTime;
    const startDate = new Date(timestamp);
    const expiresDate = new Date(expiresAt);

    const totalDuration = expiresDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min(elapsed / totalDuration * 100, 100);

    return progress;
  };

  const getTimeRemaining = (expiresAt: string) => {
    if (!serverTime) return { expired: false, text: "..." };

    const now = serverTime.getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return { expired: true, text: "Abgelaufen" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));

    return { expired: false, text: `${days}T ${hours}H` };
  };

  return (
    <>
      <SEO title="Investment Dashboard - Finanzportal" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investment Dashboard</h1>
            <p className="text-muted-foreground">
              Willkommen zurück, {profile?.full_name || user?.email}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gesamt-Guthaben
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {calculateTotalBalance().toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Aus {transactions.length} {transactions.length === 1 ? "Position" : "Positionen"}
                </p>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
            </Card>

            <Card className="relative overflow-hidden border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Gesamt-Gewinn
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "text-3xl font-bold",
                  calculateTotalProfit() >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {calculateTotalProfit() >= 0 ? "+" : ""}
                  {calculateTotalProfit().toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} €
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {transactions.length > 0 ?
                  (calculateTotalProfit() / transactions.reduce((sum, tx) => sum + tx.amount_eur, 0) * 100).toFixed(2) :
                  "0.00"}% Rendite
                </p>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-500/5 blur-2xl" />
            </Card>
          </div>

          {loading ?
          <div className="animate-pulse text-muted-foreground">Lade Daten...</div> :
          !wallet ?
          <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground text-center py-8">
                  Ihnen wurde noch keine Bitcoin Wallet zugewiesen. Bitte warten Sie, bis der Administrator Ihr Konto eingerichtet hat.
                </p>
              </CardContent>
            </Card> :

          <div className="space-y-6">
              <Card className="border-blue-accent/20 bg-blue-accent/5">
                <CardHeader>
                  <CardTitle className="text-lg">Ihre Wallet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="flex-1 w-full">
                      <div className="relative">
                        <p className="font-mono bg-background border p-4 rounded-md break-all select-all text-sm pr-12">
                          {wallet.wallet_address}
                        </p>
                        <Button
                        size="icon"
                        variant="ghost"
                        onClick={copyWalletAddress}
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        title="Adresse kopieren">
                        
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">Dies ist Ihre persönliche Einzahlungsadresse. Es kann einige Minuten dauern, bis neue Einzahlungen sichtbar werden.

                    </p>
                    </div>
                    
                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                      <QRCodeSVG
                      value={wallet.wallet_address}
                      size={160}
                      level="H"
                      includeMargin={true} />
                    
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t">
                    <Button
                    onClick={manualCheckTransactions}
                    disabled={checkingTransactions}
                    variant="outline"
                    size="sm"
                    className="flex-1">Transaktionen aktualisieren


                  </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Positionen</CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ?
                <p className="text-muted-foreground text-center py-8">Noch keine Transaktionen</p> :

                <div className="space-y-4">
                      {transactions.map((tx) => {
                    const timeRemaining = getTimeRemaining(tx.expires_at);
                    const isExpired = timeRemaining.expired;
                    const currentBalance = calculateCurrentBalance(tx);
                    const profit = currentBalance - tx.amount_eur;

                    return (
                      <Card key={tx.id} className={tx.status === "withdrawal_pending" ? "opacity-50 border-amber-200" : ""}>
                        <CardContent className="p-6">
                            {tx.status === "withdrawal_pending" && (
                              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-2 text-amber-800">
                                  <Clock className="w-5 h-5" />
                                  <span className="font-semibold">⏳ Ihre Auszahlung erfolgt in Kürze</span>
                                </div>
                                <p className="text-sm text-amber-700 mt-1">
                                  Der Administrator wird Ihre Auszahlungsanfrage in Kürze bearbeiten.
                                </p>
                              </div>
                            )}

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <ArrowDownLeft className="w-3 h-3 text-white" />
                                </div>
                                <div className="text-xs text-green-600 font-medium">
                                  +{tx.amount_btc.toFixed(8)} BTC
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleString("de-DE")}
                                </div>
                                {tx.status === "withdrawal_pending" && (
                                  <div className="text-xs text-amber-500 font-medium mt-1">
                                    ⏳ Auszahlung in Kürze
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Eingezahlter Betrag</div>
                                <div className="text-lg font-semibold">{tx.amount_eur.toFixed(2)} €</div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Aktuelles Guthaben</div>
                                <div className="text-lg font-semibold text-green-600">
                                  {currentBalance.toFixed(2)} €
                                </div>
                                {profit > 0 && !isExpired &&
                            <>
                                    <div className="text-xs text-green-600 font-medium">
                                      +{profit.toFixed(2)} € Gewinn
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      Nächster Gewinn in: {getNextProfitCountdown(tx.timestamp)}
                                    </div>
                                  </>
                            }
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium text-muted-foreground">Restlaufzeit</span>
                                <span className={cn(
                              "font-bold",
                              getTimeRemaining(tx.expires_at).expired ? "text-red-500" : "text-primary"
                            )}>
                                  {getTimeRemaining(tx.expires_at).text}
                                </span>
                              </div>
                              
                              <div className="relative h-8 bg-muted/30 rounded-lg overflow-hidden border border-border/50 shadow-inner">
                                <div
                              className={cn(
                                "absolute inset-y-0 left-0 transition-all duration-500 rounded-lg",
                                "shadow-md"
                              )}
                              style={{
                                width: `${getCountdownProgress(tx.timestamp, tx.expires_at)}%`,
                                background: getCountdownProgress(tx.timestamp, tx.expires_at) < 25 ?
                                "linear-gradient(90deg, #10b981 0%, #34d399 100%)" :
                                getCountdownProgress(tx.timestamp, tx.expires_at) < 50 ?
                                "linear-gradient(90deg, #34d399 0%, #fbbf24 100%)" :
                                getCountdownProgress(tx.timestamp, tx.expires_at) < 75 ?
                                "linear-gradient(90deg, #fbbf24 0%, #fb923c 100%)" :
                                "linear-gradient(90deg, #fb923c 0%, #ef4444 100%)"
                              }}>
                              
                                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              {!isExpired ? (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono">
                                    {timeRemaining.text}
                                  </span>
                                </div>
                              ) : (
                                <div className="text-sm text-red-600 font-medium">Abgelaufen</div>
                              )}

                              {isExpired && tx.status !== "withdrawal_pending" && (
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleExtend(tx.id)}
                                  >
                                    Verlängern
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => setSelectedTx(tx.id)}
                                  >
                                    Auszahlen
                                  </Button>
                                </div>
                              )}
                            </div>

                            {selectedTx === tx.id && tx.status !== "withdrawal_pending" && (
                              <div className="mt-4 pt-4 border-t space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    Bitcoin Auszahlungsadresse
                                  </label>
                                  <input
                              type="text"
                              value={withdrawalAddress}
                              onChange={(e) => setWithdrawalAddress(e.target.value)}
                              placeholder="bc1q..."
                              className="w-full px-3 py-2 border rounded-md text-sm" />
                            
                                </div>
                                <div className="flex gap-2">
                                  <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleWithdraw(tx.id)}
                              disabled={!withdrawalAddress}>
                              
                                    Auszahlung beantragen
                                  </Button>
                                  <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTx(null)}>
                              
                                    Abbrechen
                                  </Button>
                                </div>
                              </div>
                            )}
                          </CardContent>
                          </Card>);

                  })}
                    </div>
                }
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Kundensupport Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-64 overflow-y-auto border rounded-lg p-4 space-y-3 bg-muted/20">
                      {messages.length === 0 ?
                    <p className="text-sm text-muted-foreground text-center py-8">
                          Noch keine Nachrichten. Schreiben Sie dem Support!
                        </p> :

                    messages.map((msg) =>
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                      
                            <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                        msg.is_admin ?
                        'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100' :
                        'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'}`
                        }>
                        
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-60 mt-1">
                                {new Date(msg.created_at).toLocaleString('de-DE')}
                              </p>
                            </div>
                          </div>
                    )
                    }
                    </div>
                    
                    <div className="flex gap-2">
                      <Textarea
                      placeholder="Nachricht schreiben..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      rows={2} />
                    
                      <Button onClick={sendMessage} className="self-end">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Abgeschlossene Auszahlungen */}
              {withdrawnTransactions.length > 0 && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Abgeschlossene Auszahlungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {withdrawnTransactions.map((tx) => (
                        <div key={tx.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-800">Auszahlung veranlasst</span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {new Date(tx.updated_at || tx.created_at).toLocaleDateString("de-DE", {
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
                                {calculateCurrentBalance(tx).toFixed(2)} €
                              </div>
                              <div className="text-sm text-gray-600">
                                Gewinn: +{(calculateCurrentBalance(tx) - tx.amount_eur).toFixed(2)} €
                              </div>
                            </div>
                          </div>

                          <div className="bg-white rounded p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Eingezahlter Betrag:</span>
                              <span className="font-medium">{tx.amount_eur.toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Eingezahlt am:</span>
                              <span className="font-medium">
                                {new Date(tx.timestamp).toLocaleDateString("de-DE", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric"
                                })}
                              </span>
                            </div>
                            <div className="border-t pt-2 mt-2">
                              <div className="text-gray-600 mb-1">Auszahlung an:</div>
                              <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                                {tx.withdrawal_address || "Nicht verfügbar"}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          }
        </div>
      </DashboardLayout>
    </>);

}