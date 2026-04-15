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
import { ArrowDownLeft, Copy, Check, Clock, MessageCircle, Send, TrendingUp, Wallet, CheckCircle2, Loader2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { authService } from "@/services/authService";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

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
  const [bitcoinPrice, setBitcoinPrice] = useState<number>(85000);
  const [isValidatingAddress, setIsValidatingAddress] = useState(false);
  const [addressValid, setAddressValid] = useState<boolean | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
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

    const fetchBitcoinPrice = async () => {
      try {
        const response = await fetch("/api/bitcoin-price");
        const data = await response.json();
        if (data.price) {
          setBitcoinPrice(data.price);
        }
      } catch (error) {
        console.error("Error fetching Bitcoin price:", error);
      }
    };

    fetchServerTime();
    fetchBitcoinPrice();
    const interval = setInterval(() => {
      setServerTime((prev) => prev ? new Date(prev.getTime() + 1000) : new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  useEffect(() => {
    let channel: any;

    if (userId) {
      // Load initial chat history
      loadChat();
      
      // Subscribe to new messages
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

  // Polling als Backup für Chat-Updates (falls Realtime nicht funktioniert)
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      loadChat();
    }, 5000); // Alle 5 Sekunden

    return () => clearInterval(interval);
  }, [userId]);

  // Realtime-Listener für Auszahlungsgenehmigungen
  useEffect(() => {
    let channel: any;

    if (userId) {
      // Load initial chat history
      loadChat();
      
      // Subscribe to new messages
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

  // Auto-refresh Transaktionen alle 30 Sekunden
  useEffect(() => {
    if (!wallet?.id) return;

    const interval = setInterval(() => {
      console.log("🔄 Auto-refresh: Checking silently for new transactions...");
      silentCheckTransactions();
    }, 30000); // 30 Sekunden

    return () => clearInterval(interval);
  }, [wallet?.id]);

  // Auto-refresh Status-Updates alle 1 Stunde
  useEffect(() => {
    if (!wallet?.id) return;

    const interval = setInterval(() => {
      console.log("🔄 Hourly refresh: Checking for status updates...");
      loadDashboard(true);
    }, 3600000); // 1 Stunde (3.600.000 ms)

    return () => clearInterval(interval);
  }, [wallet?.id]);

  const silentCheckTransactions = async () => {
    if (!wallet) return;

    try {
      const newCount = await transactionService.checkNewTransactions(wallet.wallet_address, wallet.id);

      if (newCount > 0) {
        toast({
          title: newCount === 1 ? "Neue Transaktion gefunden!" : "Neue Transaktionen gefunden!",
          description: newCount === 1 ? "Eine neue Zahlung wurde erkannt und hinzugefügt." : `${newCount} neue Zahlungen wurden erkannt und hinzugefügt.`
        });
        // Lade Dashboard lautlos neu (ohne setLoading(true))
        await loadDashboard(true);
      }
    } catch (error) {
      console.error("Silent background check failed:", error);
    }
  };

  const loadDashboard = async (silent = false) => {
    if (!silent) setLoading(true);

    const profile = await profileService.getCurrentProfile();
    
    // Ghost-Session Detection: Wenn kein Profil trotz "aktiver" Session → Session ist abgelaufen
    if (!profile) {
      console.warn("Ghost session detected - profile is null despite active session");
      
      // Lösche die tote Session komplett
      await authService.signOut();
      
      toast({
        title: "Session abgelaufen",
        description: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
        variant: "destructive",
        duration: 3000
      });
      
      // Erzwinge Weiterleitung zum Login
      setTimeout(() => {
        router.push("/login");
      }, 1000);
      
      return;
    }

    setProfile(profile);
    setUserId(profile.id);

    const w = await walletService.getWalletForUser(profile.id);
    setWallet(w);

    if (w) {
      // Prüfe auf neue Transaktionen via API (nur initial, wenn nicht silent)
      if (!silent) {
        const newCount = await transactionService.checkNewTransactions(w.wallet_address, w.id);
        if (newCount > 0) {
          toast({
            title: newCount === 1 ? "Neue Transaktion eingegangen" : "Neue Transaktionen eingegangen",
            description: newCount === 1 ? "Eine neue Zahlung wurde gefunden." : `${newCount} neue Zahlungen gefunden.`
          });
        }
      }

      // Aktive Transaktionen laden
      const txs = await transactionService.getActiveTransactionsByWallet(w.id);
      setTransactions(txs);

      // Abgeschlossene Auszahlungen laden
      const withdrawn = await transactionService.getWithdrawnTransactionsByWallet(w.id);
      setWithdrawnTransactions(withdrawn);
    }

    if (!silent) setLoading(false);
  };

  const loadChat = async (specificUserId?: string) => {
    const targetId = specificUserId || userId;
    
    if (targetId) {
      const msgs = await chatService.getMessages(targetId);
      setMessages(msgs || []);
      return;
    }
    
    const profile = await profileService.getCurrentProfile();
    if (profile) {
      setUserId(profile.id);
      const msgs = await chatService.getMessages(profile.id);
      setMessages(msgs || []);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const profile = await profileService.getCurrentProfile();
    if (!profile) return;

    await chatService.sendMessage(profile.id, newMessage);

    // Automatische Standard-Antwort vom System
    await chatService.sendMessage(profile.id, "Danke für Ihre Nachricht, in Kürze antwortet Ihnen ein Kundenbetreuer.", true);

    setNewMessage("");
    loadChat();
  };

  const handleCopyAddress = () => {
    if (wallet?.wallet_address) {
      navigator.clipboard.writeText(wallet.wallet_address);
      toast({ title: "Kopiert!", description: "Wallet-Adresse in Zwischenablage kopiert" });
    }
  };

  const handleExtend = async (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    const newMaturityDate = new Date();
    newMaturityDate.setDate(newMaturityDate.getDate() + 14);

    // Aktuelles Guthaben wird der neue "Verlängerte Betrag"
    const currentBalance = calculateCurrentBalance(tx);

    const result = await transactionService.extendMaturity(
      txId, 
      newMaturityDate.toISOString(), 
      14, 
      currentBalance  // ✅ Übergebe aktuelles Guthaben
    );
    
    if (result) {
      toast({ 
        title: "Verlängert!", 
        description: `Laufzeit um 14 Tage verlängert. 3% Bonus wird in 2 Sekunden gutgeschrieben.` 
      });
      
      // Lade Dashboard sofort neu (zeigt neuen Verlängerten Betrag)
      loadDashboard();
      
      // Lade Dashboard nach 2.5 Sekunden nochmal (zeigt 3% Bonus)
      setTimeout(() => {
        loadDashboard();
      }, 2500);
    } else {
      toast({ 
        title: "Fehler", 
        description: "Konnte nicht verlängert werden", 
        variant: "destructive" 
      });
    }
  };

  const handleWithdraw = async (txId: string) => {
    if (!withdrawalAddress.trim()) {
      toast({ title: "Fehler", description: "Bitte Bitcoin-Adresse eingeben", variant: "destructive" });
      return;
    }

    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return;

    // Berechne aktuellen EUR-Betrag mit Rendite
    const currentEurAmount = calculateCurrentBalance(tx);

    // Hole aktuellen BTC-Preis
    const currentBtcPrice = await transactionService.getBitcoinPrice();

    // Berechne korrekten BTC-Betrag basierend auf aktuellem EUR-Wert
    const correctBtcAmount = currentEurAmount / currentBtcPrice;

    await transactionService.updateTransactionStatus(
      txId,
      "withdrawal_pending",
      withdrawalAddress,
      currentEurAmount,
      correctBtcAmount
    );

    setWithdrawalAddress("");
    setSelectedTx(null);
    setAddressValid(null);
    toast({ title: "Auszahlung angefordert", description: "Ihre Auszahlung wird bearbeitet." });
    loadDashboard();
  };

  const validateBitcoinAddress = async (address: string) => {
    if (!address || address.length < 26) {
      setAddressValid(null);
      return;
    }

    setIsValidatingAddress(true);
    
    try {
      // Einfache Format-Validierung (bc1, 1, 3)
      const isValidFormat = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address);
      
      if (!isValidFormat) {
        setAddressValid(false);
        setIsValidatingAddress(false);
        return;
      }

      // Prüfe ob Adresse auf Blockchain existiert
      const response = await fetch(`https://blockchain.info/balance?active=${address}`);
      
      if (response.ok) {
        setAddressValid(true);
      } else {
        setAddressValid(false);
      }
    } catch (error) {
      console.error("Address validation error:", error);
      setAddressValid(false);
    } finally {
      setIsValidatingAddress(false);
    }
  };

  // Debounce für Address-Validierung
  useEffect(() => {
    if (!withdrawalAddress) {
      setAddressValid(null);
      return;
    }

    const timer = setTimeout(() => {
      validateBitcoinAddress(withdrawalAddress);
    }, 800);

    return () => clearTimeout(timer);
  }, [withdrawalAddress]);

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
          title: newCount === 1 ? "Neue Transaktion gefunden!" : "Neue Transaktionen gefunden!",
          description: newCount === 1 ? "Eine neue Zahlung wurde erkannt und hinzugefügt." : `${newCount} neue Zahlungen wurden erkannt und hinzugefügt.`
        });
        await loadDashboard();
      } else {
        toast({
          title: "Keine neuen Transaktionenen",
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

    // 1% Sofort-Bonus NUR bei NEUEN Einzahlungen, NICHT bei verlängerten
    const eingezahlt = tx.is_extended ? tx.amount_eur : tx.amount_eur * 1.01;

    const timestamp = new Date(tx.timestamp).getTime();
    const now = serverTime.getTime();
    const timeDiffMs = now - timestamp;
    const daysPassed = Math.max(0, timeDiffMs / (1000 * 60 * 60 * 24));

    // Gesamtguthaben aller aktiven Transaktionen für die Rendite
    const totalActiveBalance = transactions
      .filter(t => t.status === "active")
      .reduce((sum, t) => sum + t.amount_eur, 0);

    let dailyRate = 0.014;
    if (totalActiveBalance >= 130000) dailyRate = 0.024;
    else if (totalActiveBalance >= 100000) dailyRate = 0.023;
    else if (totalActiveBalance >= 75000) dailyRate = 0.022;
    else if (totalActiveBalance >= 50000) dailyRate = 0.021;
    else if (totalActiveBalance >= 35000) dailyRate = 0.020;
    else if (totalActiveBalance >= 25000) dailyRate = 0.018;
    else if (totalActiveBalance >= 10000) dailyRate = 0.016;

    // Zinseszins auf Tagesbasis
    const wachstumFaktor = Math.pow(1 + dailyRate, daysPassed);
    const finalBalance = eingezahlt * wachstumFaktor;

    return finalBalance;
  };

  const calculateTotalBalance = () => {
    return transactions.
    filter((tx) => tx.status !== "withdrawal_pending").
    reduce((sum, tx) => sum + calculateCurrentBalance(tx), 0);
  };

  const calculateTotalProfit = () => {
    return transactions.
    filter((tx) => tx.status !== "withdrawal_pending").
    reduce((sum, tx) => {
      const currentBalance = calculateCurrentBalance(tx);
      const baseAmount = tx.original_deposit || tx.amount_eur;
      return sum + (currentBalance - baseAmount);
    }, 0);
  };

  const getNextProfitCountdown = (timestamp: string, expiresAt: string) => {
    if (!serverTime) return "...";

    const now = serverTime;
    const expiry = new Date(expiresAt).getTime();
    
    // Wenn Transaktion abgelaufen ist, zeige "Abgelaufen"
    if (now.getTime() >= expiry) {
      return "Abgelaufen";
    }

    const startDate = new Date(timestamp);

    // Berechne nächsten vollen Tag seit Transaktionsstart (24 Stunden)
    const timeDiff = now.getTime() - startDate.getTime();
    const daysPassed = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const nextProfitTime = new Date(startDate.getTime() + (daysPassed + 1) * 24 * 60 * 60 * 1000);

    const remainingMs = nextProfitTime.getTime() - now.getTime();

    if (remainingMs <= 0) return "Berechnung läuft...";

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor(remainingMs % (1000 * 60 * 60) / (1000 * 60));

    return `${hours}h ${minutes}m`;
  };

  const getCountdownProgress = (timestamp: string, expiresAt: string, isExtended?: boolean) => {
    if (!serverTime) return 0;

    // Wenn verlängert, berechne virtuellen Startpunkt (14 Tage vor neuem Ablaufdatum)
    // So startet der Balken bei jeder Verlängerung wieder bei 100%
    const start = isExtended 
      ? new Date(expiresAt).getTime() - (14 * 24 * 60 * 60 * 1000) // 14 Tage in Millisekunden
      : new Date(timestamp).getTime();
      
    const end = new Date(expiresAt).getTime();
    const now = serverTime.getTime();

    // Gesamtlaufzeit in Millisekunden
    const totalDuration = end - start;

    // Verbleibende Zeit
    const remaining = end - now;

    // Verbleibende Zeit als Prozentsatz der Gesamtlaufzeit
    const progress = Math.max(0, Math.min(100, remaining / totalDuration * 100));

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

  const totalActiveBalance = transactions
    .filter(tx => tx.status === "active")
    .reduce((sum, tx) => sum + tx.amount_eur, 0);

  const getDailyRateInfo = (balance: number) => {
    if (balance >= 130000) return { rate: "2,4%", threshold: "130.000€" };
    if (balance >= 100000) return { rate: "2,3%", threshold: "100.000€" };
    if (balance >= 75000) return { rate: "2,2%", threshold: "75.000€" };
    if (balance >= 50000) return { rate: "2,1%", threshold: "50.000€" };
    if (balance >= 35000) return { rate: "2,0%", threshold: "35.000€" };
    if (balance >= 25000) return { rate: "1,8%", threshold: "25.000€" };
    if (balance >= 10000) return { rate: "1,6%", threshold: "10.000€" };
    return { rate: "1,4%", threshold: "1€" };
  };

  const rateInfo = getDailyRateInfo(totalActiveBalance);

  return (
    <>
      <SEO title="Investment Dashboard - Finanzportal" />
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investment Dashboard</h1>
            <p className="text-muted-foreground">
              Willkommen zurück, {profile?.full_name}
            </p>
          </div>

          {/* Statistik-Karten - Obere Reihe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white relative overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-blue-100">
                    Gesamt-Guthaben
                  </CardTitle>
                  <Wallet className="h-4 w-4 text-blue-200" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {calculateTotalBalance().toLocaleString("de-DE", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })} €
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Aus {transactions.length} {transactions.length === 1 ? "Position" : "Positionen"}
                </p>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
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
                <p className="text-xs text-green-600 font-medium mt-1">
                  {transactions.length > 0 ?
                  (calculateTotalProfit() / transactions.reduce((sum, tx) => {
                    const baseAmount = tx.original_deposit || tx.amount_eur;
                    return sum + baseAmount;
                  }, 0) * 100).toFixed(2) :
                  "0.00"}% Rendite
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  (berechnet aus allen aktiven Positionen)
                </p>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-green-500/5 blur-2xl" />
            </Card>
          </div>

          {/* Ihre Wallet - Dazwischen */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center py-8">
                Ihnen wurde noch keine Bitcoin Wallet zugewiesen. Bitte warten Sie, bis der Administrator Ihr Konto eingerichtet hat.
              </p>
            </CardContent>
          </Card>

          {/* Statistik-Karten - Untere Reihe */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <Card className="bg-gradient-to-br from-slate-500 to-slate-600 text-white relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-100">
                  Tägliche Rendite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white mb-4">{rateInfo.rate}</div>
                <Button 
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                  onClick={() => router.push("/gewinnberechnung")}
                >
                  Erfahre wie du eine höhere Rendite erzielst
                </Button>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            </Card>

            <Card className="bg-gradient-to-br from-gray-500 to-gray-600 text-white relative overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-100">Aktive Positionen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">
                  {transactions.filter(tx => tx.status === "active").length}
                </div>
              </CardContent>
              <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
            </Card>
          </div>

          {/* Restlicher Content */}
          {!loading && wallet && (
            <div className="space-y-6">
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
                    const baseAmount = tx.original_deposit || tx.amount_eur;
                    const profit = currentBalance - baseAmount;

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
                                  Die Auszahlung erfolgt automatisiert. Dies kann selten jedoch bis zu 6 Stunden dauern.
                                </p>
                              </div>
                          )}

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <ArrowDownLeft className="w-3 h-3 text-white" />
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
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
                                <div className="text-xs text-muted-foreground mb-1">
                                  {tx.is_extended ? "Verlängerter Betrag" : "Eingezahlter Betrag"}
                                </div>
                                <div className="text-lg font-semibold">
                                  {tx.is_extended 
                                    ? (tx.extended_base_amount || tx.amount_eur).toFixed(2)
                                    : (tx.original_deposit || tx.amount_eur).toFixed(2)} €
                                </div>
                              </div>
                              
                              <div>
                                <div className="text-xs text-muted-foreground mb-1">Aktuelles Guthaben</div>
                                <div className="text-lg font-semibold text-green-600">
                                  {currentBalance.toFixed(2)} €
                                </div>
                                {profit > 0 && (
                                  <div className="text-xs text-green-600 font-medium">
                                    +{profit.toFixed(2)} € Gewinn
                                  </div>
                                )}
                                {tx.is_extended && (
                                  <div className="text-xs text-gray-400 mt-0.5">
                                    Ursprünglich eingezahlt: {tx.original_deposit?.toFixed(2) || tx.amount_eur.toFixed(2)} €
                                  </div>
                                )}
                                <div className="text-[10px] text-muted-foreground mt-0.5">
                                  {rateInfo.rate} tägliche Rendite
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Laufzeit</span>
                                <span className="font-medium">
                                  {!isExpired ? `${timeRemaining.text} verbleibend` : "Abgelaufen"}
                                </span>
                              </div>
                              <Progress
                              value={getCountdownProgress(tx.timestamp, tx.expires_at, tx.is_extended)}
                              className="h-2 [&>div]:bg-blue-600" />
                            
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t">
                              {!isExpired ?
                            <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-muted-foreground" />
                                  <span className="font-mono">
                                    {timeRemaining.text}
                                  </span>
                                </div> :

                            <div className="text-sm text-red-600 font-medium">Abgelaufen</div>
                            }

                              {isExpired && tx.status !== "withdrawal_pending" &&
                            <div className="flex gap-2">
                                  <Button
                                size="sm"
                                variant="default"
                                onClick={() => setSelectedTx(tx.id)}>
                                
                                    Auszahlen
                                  </Button>
                                  <Button
                                size="sm"
                                variant="outline"
                                className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                                onClick={() => handleExtend(tx.id)}>
                                
                                    Verlängern
                                  </Button>
                                </div>
                            }
                              {isExpired && tx.status !== "withdrawal_pending" &&
                            <p className="text-xs text-green-600 mt-2 text-center">
                                  (Bonus 3 % Sofort Rendite.)
                                </p>
                            }
                            </div>

                            {selectedTx === tx.id && tx.status !== "withdrawal_pending" &&
                          <div className="mt-4 pt-4 border-t space-y-3">
                                <div>
                                  <label className="text-sm font-medium mb-2 block">
                                    Bitcoin Auszahlungsadresse
                                  </label>
                                  <div className="relative">
                                    <input
                                type="text"
                                value={withdrawalAddress}
                                onChange={(e) => setWithdrawalAddress(e.target.value)}
                                placeholder="bc1q..."
                                className={cn(
                                  "w-full px-3 py-2 border rounded-md text-sm pr-10",
                                  addressValid === true && "border-green-500 bg-green-50",
                                  addressValid === false && "border-red-500 bg-red-50"
                                )} />
                                    
                                    {isValidatingAddress && (
                                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                                    )}
                                    {!isValidatingAddress && addressValid === true && (
                                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                                    )}
                                    {!isValidatingAddress && addressValid === false && (
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold">✗</span>
                                    )}
                                  </div>
                                  {addressValid === false && (
                                    <p className="text-xs text-red-600 mt-1">
                                      Ungültige oder nicht existierende Bitcoin-Adresse
                                    </p>
                                  )}
                                  {addressValid === true && (
                                    <p className="text-xs text-green-600 mt-1">
                                      ✓ Adresse verifiziert
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleWithdraw(tx.id)}
                                disabled={!addressValid || isValidatingAddress}>
                              
                                    Auszahlung beantragen
                                  </Button>
                                  <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedTx(null);
                                  setWithdrawalAddress("");
                                  setAddressValid(null);
                                }}>
                              
                                    Abbrechen
                                  </Button>
                                </div>
                              </div>
                          }
                          </CardContent>
                          </Card>);

                  })}
                    </div>
                }
                </CardContent>
              </Card>

              {/* Abgeschlossene Auszahlungen */}
              {withdrawnTransactions.length > 0 &&
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Abgeschlossene Auszahlungen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {withdrawnTransactions.map((tx) =>
                        <div key={tx.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <span className="font-semibold text-green-800">Auszahlung abgeschlossen</span>
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
                                {tx.withdrawn_amount_eur?.toFixed(2) || calculateCurrentBalance(tx).toFixed(2)} €
                              </div>
                              <div className="text-sm text-green-600 font-medium">
                                {tx.withdrawn_amount_btc ?
                                  `${tx.withdrawn_amount_btc.toFixed(8)} BTC` :
                                  `${((tx.withdrawn_amount_eur || calculateCurrentBalance(tx)) / (bitcoinPrice || 85000)).toFixed(8)} BTC`
                                }
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                Gewinn: +{((tx.withdrawn_amount_eur || calculateCurrentBalance(tx)) - tx.amount_eur).toFixed(2)} €
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
                                {tx.withdrawn_amount_eur?.toFixed(2) || calculateCurrentBalance(tx).toFixed(2)} €
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">In Bitcoin:</span>
                              <span className="font-mono text-sm font-medium">
                                {tx.withdrawn_amount_btc ?
                                  `${tx.withdrawn_amount_btc.toFixed(8)} BTC` :
                                  `${((tx.withdrawn_amount_eur || calculateCurrentBalance(tx)) / (bitcoinPrice || 85000)).toFixed(8)} BTC`
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
                            <div className="border-t pt-2 mt-2">
                              <div className="text-gray-600 mb-1">Auszahlung an:</div>
                              <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all">
                                {tx.withdrawal_address || "Nicht verfügbar"}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              }

              {/* Kundensupport Chat - Immer sichtbar (außer beim anfänglichen Laden) */}
              {!loading && (
                <Card id="chat-section" className="mt-6">
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
              )}
            </div>
          )}

          {/* Footer */}
          <footer className="bg-slate-900 text-white py-8">
          </footer>

        </div>
      </DashboardLayout>

      {/* Versicherungs-Hinweis */}
      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Alle eingezahlten Vermögenswerte sind "kreuzversichert". Das bedeutet ihre Bitcoin Einzahlungen sind gegen Kursschwankungen und Entwertung versichert. Außerdem sind alle eingezahlten Vermögenswerte vollständig gegen Verlust und Diebstahl bei Bitsurance versichert.
        </p>
      </div>

      {/* Geldwäsche-Hinweis */}
      <div className="container mx-auto px-4 py-3">
        <p className="text-[10px] text-gray-400 text-center leading-tight max-w-4xl mx-auto">
          Als offizieller Anlageanbieter und Partner von Versicherungen und Banken sind wir verpflichtet bei Verdacht auf Verstoß gegen das Geldwäschegesetz (§ 261 StGB) auf Behördliche Anfragen Auskünfte zu erteilen.
        </p>
      </div>

      {/* Floating Chat Button - Scrollt zum Chat */}
      {!loading && (
        <button
          onClick={() => {
            const chatSection = document.getElementById('chat-section');
            if (chatSection) {
              chatSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
          aria-label="Zum Chat scrollen"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

    </>);

}