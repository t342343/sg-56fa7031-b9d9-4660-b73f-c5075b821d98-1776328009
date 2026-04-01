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
import { ArrowDownLeft, Copy, Check, Clock, MessageCircle, Send, TrendingUp } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

export default function UserDashboard() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
    loadChat();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Realtime Countdown Update (jede Sekunde)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Chat subscription
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
      const newCount = await transactionService.checkNewTransactions(w.wallet_address, w.id);
      if (newCount > 0) {
        toast({ title: "Neue Transaktionen", description: `${newCount} neue Zahlungen gefunden.` });
      }

      const txs = await transactionService.getTransactionsForWallet(w.id);
      setTransactions(txs);
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
      await transactionService.extendTransaction(txId, wallet.countdown_days || 14);
      toast({ title: "Verlängert", description: "Die Transaktion wurde erfolgreich verlängert." });
      loadDashboard();
    } catch (error) {
      toast({ title: "Fehler", description: "Verlängerung fehlgeschlagen.", variant: "destructive" });
    }
  };

  const handleWithdraw = async (txId: string) => {
    if (!withdrawalAddress.trim()) {
      toast({ title: "Fehler", description: "Bitte geben Sie eine Auszahlungsadresse ein.", variant: "destructive" });
      return;
    }

    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;

    try {
      await withdrawalService.createWithdrawalRequest(
        txId,
        profile.id,
        withdrawalAddress,
        tx.amount_btc,
        tx.amount_eur
      );

      await chatService.sendMessage(
        profile.id,
        `Auszahlungsanfrage für ${tx.amount_btc} BTC (${tx.amount_eur.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}) an ${withdrawalAddress}`
      );

      await transactionService.updateTransactionStatus(txId, "withdrawal_requested");

      toast({ title: "Auszahlung angefragt", description: "Ihre Auszahlungsanfrage wurde an den Admin gesendet." });
      setSelectedTx(null);
      setWithdrawalAddress("");
      loadDashboard();
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

  const calculateCurrentBalance = (transaction: any) => {
    const now = currentTime;
    const startDate = new Date(transaction.timestamp);
    const expiresDate = new Date(transaction.expires_at);
    
    // Berechne vergangene Stunden seit Einzahlung
    const timeDiff = now.getTime() - startDate.getTime();
    const hoursPassed = Math.floor(timeDiff / (1000 * 60 * 60));
    
    // Nur berechnen wenn Countdown noch läuft (Status active)
    if (transaction.status !== "active" || now > expiresDate) {
      // Bei Ablauf: Berechne den finalen Betrag basierend auf gesamter Laufzeit
      const totalHours = Math.floor((expiresDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      // +1% Startbonus × (1.0005 ^ Stunden) = 0.05% pro Stunde
      return transaction.amount_eur * 1.01 * Math.pow(1.0005, totalHours);
    }
    
    // Guthaben = Eingezahlter Betrag × 1.01 (Startbonus) × (1.0005 ^ vergangene Stunden)
    // 1.0005 = 0.05% stündliches Wachstum
    // 1.01 = einmaliger 1% Bonus am ersten Tag
    const currentBalance = transaction.amount_eur * 1.01 * Math.pow(1.0005, hoursPassed);
    
    return currentBalance;
  };

  const getNextGrowthTime = () => {
    const now = currentTime;
    
    // Berechne wann die nächste Stunde beginnt
    const nextGrowth = new Date(now);
    nextGrowth.setMinutes(0, 0, 0);
    nextGrowth.setHours(nextGrowth.getHours() + 1);
    
    const timeUntilGrowth = nextGrowth.getTime() - now.getTime();
    const minutesLeft = Math.floor(timeUntilGrowth / (1000 * 60));
    const secondsLeft = Math.floor((timeUntilGrowth % (1000 * 60)) / 1000);
    
    return { minutes: minutesLeft, seconds: secondsLeft, total: timeUntilGrowth };
  };

  const getCountdownProgress = (timestamp: string, expiresAt: string) => {
    const now = currentTime;
    const startDate = new Date(timestamp);
    const expiresDate = new Date(expiresAt);
    
    const totalDuration = expiresDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();
    const progress = Math.min((elapsed / totalDuration) * 100, 100);
    
    return progress;
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = currentTime;
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return { expired: true, text: "Abgelaufen" };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    return { expired: false, text: `${days}T ${hours}H` };
  };

  return (
    <>
      <SEO title="Investment Dashboard - Finanzportal" />
      <DashboardLayout>
        <h2 className="text-2xl font-bold mb-6 text-navy">Kundenbereich</h2>
        
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
                        title="Adresse kopieren"
                      >
                        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dies ist Ihre persönliche Einzahlungsadresse.
                    </p>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg border shadow-sm">
                    <QRCodeSVG 
                      value={wallet.wallet_address} 
                      size={160}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaktionshistorie</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Noch keine Transaktionen</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => {
                      const timeRemaining = getTimeRemaining(tx.expires_at);
                      const isExpired = timeRemaining.expired;
                      const currentBalance = calculateCurrentBalance(tx);
                      const profit = currentBalance - tx.amount_eur;
                      const nextGrowth = getNextGrowthTime();
                      const progress = getCountdownProgress(tx.timestamp, tx.expires_at);

                      return (
                        <div
                          key={tx.id}
                          className={`border rounded-lg p-4 ${isExpired ? "opacity-50 bg-muted" : ""}`}
                        >
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
                              {profit > 0 && !isExpired && (
                                <div className="text-xs text-green-600 font-medium">
                                  +{profit.toFixed(2)} € Gewinn
                                </div>
                              )}
                            </div>
                          </div>

                          {!isExpired && nextGrowth.total > 0 && (
                            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/10 rounded-md border border-green-200 dark:border-green-800">
                              <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-400">
                                <TrendingUp className="w-3 h-3" />
                                <span className="font-medium">
                                  Nächstes Wachstum (+0.05%) in {nextGrowth.minutes}min {nextGrowth.seconds}s
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="space-y-2 mb-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Countdown-Fortschritt</span>
                              <span className="font-mono text-muted-foreground">{progress.toFixed(1)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
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

                            {isExpired && (
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

                          {selectedTx === tx.id && (
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
                                  className="w-full px-3 py-2 border rounded-md text-sm"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => handleWithdraw(tx.id)}
                                  disabled={!withdrawalAddress}
                                >
                                  Auszahlung beantragen
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedTx(null)}
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
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
                    {messages.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Noch keine Nachrichten. Schreiben Sie dem Support!
                      </p>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.is_admin
                                ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                                : 'bg-green-100 text-green-900 dark:bg-green-900/30 dark:text-green-100'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <p className="text-xs opacity-60 mt-1">
                              {new Date(msg.created_at).toLocaleString('de-DE')}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
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
                      rows={2}
                    />
                    <Button onClick={sendMessage} className="self-end">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DashboardLayout>
    </>
  );
}