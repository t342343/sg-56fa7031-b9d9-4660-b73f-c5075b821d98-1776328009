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
import { ArrowDownLeft, Copy, Check, Clock, MessageCircle, Send } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function UserDashboard() {
  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadChat();
    const profile = profileService.getCurrentProfile();
    profile.then(p => {
      if (p) {
        const channel = chatService.subscribeToMessages(p.id, (message) => {
          setMessages(prev => [...prev, message]);
        });
        return () => { channel.unsubscribe(); };
      }
    });
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

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

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date().getTime();
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
                Ihnen wurde noch keine Bitcoin Wallet zugewiesen.
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
                <CardTitle>Transaktionshistorie</CardTitle>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-muted-foreground py-4">Noch keine Transaktionen.</p>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((tx) => {
                      const timeInfo = getTimeRemaining(tx.expires_at);
                      const isExpired = timeInfo.expired;
                      
                      return (
                        <div 
                          key={tx.id} 
                          className={`border rounded-lg p-4 ${isExpired ? 'opacity-50 bg-muted/30' : 'bg-card hover:bg-muted/50'} transition-colors`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-start gap-3">
                              <div className="bg-green-100 text-green-700 p-2 rounded-full dark:bg-green-900/30 dark:text-green-400 flex-shrink-0">
                                <ArrowDownLeft className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="text-xs font-mono text-green-600 dark:text-green-400">
                                  +{Number(tx.amount_btc).toFixed(8)} BTC
                                </div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {new Date(tx.timestamp).toLocaleString('de-DE')}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="font-bold text-lg">
                                {Number(tx.amount_eur).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                              </div>
                              <div className="text-xs text-muted-foreground">Eingezahlter Betrag</div>
                              
                              <div className="flex items-center gap-2 mt-2 justify-end">
                                <Clock className="w-3 h-3" />
                                <span className={`text-xs font-medium ${isExpired ? 'text-red-500' : 'text-blue-600'}`}>
                                  {timeInfo.text}
                                </span>
                              </div>

                              {isExpired && tx.status === "active" && (
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleExtend(tx.id)}
                                  >
                                    Verlängern
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => setSelectedTx(tx.id)}
                                  >
                                    Auszahlen
                                  </Button>
                                </div>
                              )}

                              {selectedTx === tx.id && (
                                <div className="mt-3 space-y-2">
                                  <Input
                                    placeholder="BTC Auszahlungsadresse"
                                    value={withdrawalAddress}
                                    onChange={(e) => setWithdrawalAddress(e.target.value)}
                                    className="text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setSelectedTx(null)}
                                    >
                                      Abbrechen
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleWithdraw(tx.id)}
                                    >
                                      Bestätigen
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
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