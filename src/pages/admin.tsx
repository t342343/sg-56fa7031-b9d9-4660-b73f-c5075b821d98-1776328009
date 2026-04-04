import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { DashboardLayout } from "@/components/DashboardLayout";
import { profileService } from "@/services/profileService";
import { walletService } from "@/services/walletService";
import { chatService } from "@/services/chatService";
import { withdrawalService } from "@/services/withdrawalService";
import { transactionService } from "@/services/transactionService";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SEO } from "@/components/SEO";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageCircle, Send, Clock, CheckCircle2, Wallet, ArrowUpDown, X, User, Badge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Admin() {
// Benutzer-Daten
const [users, setUsers] = useState<any[]>([]);
const [wallets, setWallets] = useState<any[]>([]);
const [transactions, setTransactions] = useState<any[]>([]);
const [bitcoinPrice, setBitcoinPrice] = useState<number>(0);
const [chatMessages, setChatMessages] = useState<any[]>([]);
const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);
const [selectedWallet, setSelectedWallet] = useState<string>("");
const [selectedCountdown, setSelectedCountdown] = useState<number>(14);
const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
const [userSearchQuery, setUserSearchQuery] = useState("");
const [pendingTransactions, setPendingTransactions] = useState<any[]>([]);
const [completedWithdrawals, setCompletedWithdrawals] = useState<any[]>([]);
const [walletPool, setWalletPool] = useState<any[]>([]);
const [walletAddresses, setWalletAddresses] = useState<{ [key: string]: string }>({});
const [countdownDays, setCountdownDays] = useState<{ [key: string]: number }>({});
const [adminMessages, setAdminMessages] = useState<{ [key: string]: string }>({});
const [maturityDays, setMaturityDays] = useState<{ [key: string]: number }>({});
const [newPoolAddress, setNewPoolAddress] = useState("");
const [minSaldo, setMinSaldo] = useState("");
const [maxSaldo, setMaxSaldo] = useState("");
const [saldoSort, setSaldoSort] = useState<"high" | "low" | "none">("none");
const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
const [chats, setChats] = useState<any[]>([]);
const [lastPriceUpdate, setLastPriceUpdate] = useState<Date | null>(null);

// Link-Einstellungen
const [homeButtonUrl, setHomeButtonUrl] = useState("/");
const [websiteButtonUrl, setWebsiteButtonUrl] = useState("/");
const [homeMenuUrl, setHomeMenuUrl] = useState("/");

// Tab-State
const [activeTab, setActiveTab] = useState("users");

// Auth-State
const [isLoading, setIsLoading] = useState(true);
const [isAdmin, setIsAdmin] = useState(false);

const { toast } = useToast();
const router = useRouter();

useEffect(() => {
  checkAuth();
}, []);

const checkAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push("/login");
      return;
    }

    // Prüfe ob User Admin ist
    const profile = await profileService.getCurrentProfile();
    if (!profile || profile.role !== "admin") {
      toast({
        title: "Zugriff verweigert",
        description: "Sie haben keine Admin-Berechtigung.",
        variant: "destructive"
      });
      router.push("/dashboard");
      return;
    }

    setIsAdmin(true);
    setIsLoading(false);
    loadData();
    loadBitcoinPrice();
  } catch (error) {
    console.error("Auth check failed:", error);
    router.push("/login");
  }
};

useEffect(() => {
  if (!isAdmin) return;
  
  const interval = setInterval(() => {
    loadData();
    loadBitcoinPrice();
  }, 10000);
  return () => clearInterval(interval);
}, [isAdmin]);

const loadBitcoinPrice = async () => {
  try {
    const response = await fetch("/api/bitcoin-price");
    const data = await response.json();
    if (data.price && data.price > 0) {
      setBitcoinPrice(data.price);
      setLastPriceUpdate(new Date());
      // Speichere letzten erfolgreichen Kurs als Fallback
      localStorage.setItem("lastBitcoinPrice", data.price.toString());
    } else {
      // Stille Fallback-Behandlung ohne Error
      console.warn("API lieferte ungültigen Bitcoin-Kurs, verwende Fallback");
      const lastPrice = localStorage.getItem("lastBitcoinPrice");
      if (lastPrice && parseFloat(lastPrice) > 0) {
        setBitcoinPrice(parseFloat(lastPrice));
        console.log("Verwende letzten bekannten Bitcoin-Kurs:", lastPrice);
      }
    }
  } catch (error) {
    console.error("Fehler beim Laden des Bitcoin-Kurses:", error);
    // Verwende letzten bekannten Kurs aus localStorage
    const lastPrice = localStorage.getItem("lastBitcoinPrice");
    if (lastPrice && parseFloat(lastPrice) > 0) {
      setBitcoinPrice(parseFloat(lastPrice));
      console.log("Verwende letzten bekannten Bitcoin-Kurs:", lastPrice);
    }
  }
};

const loadData = async () => {
  const usersData = await profileService.getAllProfiles();
  const walletsData = await walletService.getAllWallets();
  const txData = await transactionService.getAllTransactions();
  const pendingTx = await transactionService.getPendingWithdrawals();
  const completedTx = await transactionService.getCompletedWithdrawals();
  const poolData = await walletService.getWalletPool();
  
  // Link-Einstellungen laden
  const { data: settings } = await supabase.from("site_settings").select("*");
  if (settings) {
    const homeUrl = settings.find(s => s.setting_key === "home_button_url");
    const websiteUrl = settings.find(s => s.setting_key === "website_button_url");
    const homeMenuLinkUrl = settings.find(s => s.setting_key === "home_menu_url");
    if (homeUrl) setHomeButtonUrl(homeUrl.setting_value);
    if (websiteUrl) setWebsiteButtonUrl(websiteUrl.setting_value);
    if (homeMenuLinkUrl) setHomeMenuUrl(homeMenuLinkUrl.setting_value);
  }
  
  setUsers(usersData);
  setWallets(walletsData);
  setTransactions(txData);
  setPendingTransactions(pendingTx);
  setCompletedWithdrawals(completedTx);
  setWalletPool(poolData);

  // Chat-Nachrichten laden
  const { data: chatData } = await supabase.from("chat_messages").select("*").order("created_at", { ascending: false });
  setChatMessages(chatData || []);
  
  if (chatData) {
    const groupedChats = chatData.reduce((acc: any, msg: any) => {
      if (!acc[msg.user_id]) acc[msg.user_id] = [];
      acc[msg.user_id].push(msg);
      return acc;
    }, {});
    setChats(Object.entries(groupedChats));
  }
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

      // Verwende aktuellen Bitcoin-Kurs aus State (mit Fallback auf letzten Kurs)
      if (bitcoinPrice === 0) {
        toast({ title: "Fehler", description: "Bitcoin-Kurs nicht verfügbar. Bitte später versuchen.", variant: "destructive" });
        return;
      }
      
      // Berechne Bitcoin-Betrag basierend auf EUR-Auszahlungsbetrag
      const finalAmountBtc = finalAmountEur / bitcoinPrice;

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

const updateSetting = async (key: string, value: string) => {
  try {
    const { error } = await supabase
      .from("site_settings")
      .update({ setting_value: value, updated_at: new Date().toISOString() })
      .eq("setting_key", key);

    if (error) throw error;

    toast({
      title: "Gespeichert",
      description: "Link-Einstellung wurde erfolgreich aktualisiert."
    });
  } catch (error) {
    console.error("Error updating setting:", error);
    toast({
      title: "Fehler",
      description: "Einstellung konnte nicht gespeichert werden.",
      variant: "destructive"
    });
  }
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
    
    // Prüfe, ob es User ohne Wallet gibt
    const usersWithoutWallet = users.filter(user => {
      return !wallets.find(w => w.user_id === user.id);
    });

    if (usersWithoutWallet.length > 0) {
      // Hole verfügbare Wallets aus Pool
      const availableWallets = await walletService.getWalletPool();
      const unassignedWallets = availableWallets.filter(w => !w.assigned_to_user_id);

      // Teile Wallets automatisch zu
      let assignedCount = 0;
      for (let i = 0; i < Math.min(usersWithoutWallet.length, unassignedWallets.length); i++) {
        const user = usersWithoutWallet[i];
        const wallet = unassignedWallets[i];
        
        const me = await profileService.getCurrentProfile();
        if (me) {
          await walletService.assignWallet(user.id, wallet.wallet_address, me.id);
          assignedCount++;
        }
      }

      if (assignedCount > 0) {
        toast({ 
          title: "Wallet hinzugefügt und zugeteilt", 
          description: `${assignedCount} Wallet(s) automatisch an User ohne Wallet zugeteilt.`
        });
      } else {
        toast({ title: "Wallet zum Pool hinzugefügt" });
      }
    } else {
      toast({ title: "Wallet zum Pool hinzugefügt" });
    }

    setNewPoolAddress("");
    loadData();
  } catch (error) {
    toast({ title: "Fehler", description: "Wallet-Adresse existiert bereits oder ist ungültig", variant: "destructive" });
  }
};

const handleDistributeWallets = async () => {
  try {
    // Finde alle User ohne Wallet
    const usersWithoutWallet = users.filter(user => {
      return !wallets.find(w => w.user_id === user.id);
    });

    if (usersWithoutWallet.length === 0) {
      toast({ 
        title: "Keine Aktion nötig", 
        description: "Alle User haben bereits eine Wallet zugewiesen."
      });
      return;
    }

    // Hole verfügbare Wallets aus Pool
    const availableWallets = await walletService.getWalletPool();
    const unassignedWallets = availableWallets.filter(w => !w.assigned_to_user_id);

    if (unassignedWallets.length === 0) {
      toast({ 
        title: "Keine Wallets verfügbar", 
        description: `${usersWithoutWallet.length} User ohne Wallet gefunden, aber keine freien Wallets im Pool.`,
        variant: "destructive"
      });
      return;
    }

    // Teile Wallets automatisch zu
    const me = await profileService.getCurrentProfile();
    if (!me) {
      toast({ title: "Fehler", description: "Admin-Profil nicht gefunden", variant: "destructive" });
      return;
    }

    let assignedCount = 0;
    for (let i = 0; i < Math.min(usersWithoutWallet.length, unassignedWallets.length); i++) {
      const user = usersWithoutWallet[i];
      const wallet = unassignedWallets[i];
      
      await walletService.assignWallet(user.id, wallet.wallet_address, me.id);
      assignedCount++;
    }

    toast({ 
      title: "Wallets erfolgreich verteilt", 
      description: `${assignedCount} Wallet(s) an User ohne Wallet zugeteilt.`
    });

    loadData();
  } catch (error) {
    console.error("Error distributing wallets:", error);
    toast({ title: "Fehler", description: "Fehler beim Verteilen der Wallets", variant: "destructive" });
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
    {isLoading ? (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Überprüfe Berechtigung...</p>
        </div>
      </div>
    ) : (
    <DashboardLayout>
      <div className="max-w-screen-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-gray-600 mt-1">Benutzerverwaltung & Transaktionen</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Aktueller Bitcoin-Kurs</div>
            <div className="text-xl font-bold text-amber-600">
              {bitcoinPrice > 0 ? `${bitcoinPrice.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : 'Lädt...'}
            </div>
            <div className="text-xs text-gray-500">
              {lastPriceUpdate 
                ? `Letztes Update: ${lastPriceUpdate.toLocaleTimeString('de-DE')}`
                : 'Aktualisiert alle 10 Sek.'
              }
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Benutzer</TabsTrigger>
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="transactions">Transaktionen</TabsTrigger>
            <TabsTrigger value="withdrawals">Auszahlungen</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="settings">Einstellungen</TabsTrigger>
          </TabsList>

          {/* Benutzer-Verwaltung Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Benutzerverwaltung</CardTitle>
                <CardDescription>
                  Verwalten Sie Benutzerkonten und Wallet-Zuweisungen
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Such- und Sortier-Optionen */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="Benutzer suchen (Name, E-Mail)..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="flex items-center gap-2"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    Saldo: {sortOrder === "asc" ? "Niedrig → Hoch" : "Hoch → Niedrig"}
                  </Button>
                </div>

                {/* Benutzer-Liste */}
                <div className="space-y-3">
                  {users
                    .filter(user => {
                      if (!userSearchQuery) return true;
                      const query = userSearchQuery.toLowerCase();
                      return (
                        user.full_name?.toLowerCase().includes(query) ||
                        user.email?.toLowerCase().includes(query)
                      );
                    })
                    .sort((a, b) => {
                      const balanceA = calculateUserBalance(a.id);
                      const balanceB = calculateUserBalance(b.id);
                      return sortOrder === "asc" ? balanceA - balanceB : balanceB - balanceA;
                    })
                    .map((user) => {
                      const wallet = wallets.find(w => w.user_id === user.id);
                      const balance = calculateUserBalance(user.id);

                      return (
                        <Card key={user.id} className="hover:bg-slate-50 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <button
                                  onClick={() => setSelectedUserDetails(user)}
                                  className="text-left hover:text-blue-600 transition-colors"
                                >
                                  <p className="font-semibold text-lg">{user.full_name || "Kein Name"}</p>
                                  <p className="text-sm text-muted-foreground">{user.email}</p>
                                </button>
                                {wallet?.wallet_address && (
                                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                    <Wallet className="h-3 w-3" />
                                    <span className="font-mono">{wallet.wallet_address}</span>
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-2xl font-bold text-blue-600">
                                  {balance.toFixed(2)} €
                                </p>
                                <p className="text-xs text-muted-foreground">Aktueller Saldo</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </CardContent>
            </Card>

            {/* Detail-Ansicht Modal */}
            {selectedUserDetails && (() => {
              const user = selectedUserDetails;
              const wallet = wallets.find(w => w.user_id === user.id);
              const userTransactions = transactions.filter(tx => tx.wallet_id === wallet?.id);
              const userMessages = chatMessages.filter(msg => msg.user_id === user.id);
              const balance = calculateUserBalance(user.id);

              return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                  <Card className="w-full max-w-4xl my-8">
                    <CardHeader className="border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">{user.full_name || "Kein Name"}</CardTitle>
                          <CardDescription>{user.email}</CardDescription>
                          {user.phone && (
                            <CardDescription className="mt-1">Tel: {user.phone}</CardDescription>
                          )}
                          {user.address && (
                            <CardDescription className="mt-1">Adresse: {user.address}</CardDescription>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedUserDetails(null)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      {/* Saldo-Anzeige */}
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
                        <p className="text-sm text-muted-foreground mb-1">Aktueller Saldo</p>
                        <p className="text-4xl font-bold text-blue-600">{balance.toFixed(2)} €</p>
                        {wallet?.wallet_address && (
                          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                            <Wallet className="h-4 w-4" />
                            <span className="font-mono">{wallet.wallet_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Transaktionen-Anzeige */}
                      {(() => {
                        if (!wallet) return null;
                        const userTransactions = transactions.filter(tx => tx.wallet_id === wallet.id);
                        if (userTransactions.length === 0) return null;
                        
                        return (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-3">
                              Transaktionen ({userTransactions.length})
                            </p>
                            <div className="space-y-2 max-h-64 overflow-y-auto">
                              {userTransactions.map(tx => {
                                const maturityDate = tx.maturity_date ? new Date(tx.maturity_date) : null;
                                const now = new Date();
                                const daysRemaining = maturityDate 
                                  ? Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
                                  : null;
                                
                                return (
                                  <div key={tx.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-mono font-bold text-slate-900 text-sm">
                                        {tx.amount_btc?.toFixed(8) || '0.00000000'} BTC
                                      </span>
                                      <span className="text-slate-700 font-semibold text-sm">
                                        {tx.amount_eur?.toFixed(2) || '0.00'} €
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                                      <span>{new Date(tx.timestamp || tx.created_at).toLocaleDateString('de-DE', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                      })}</span>
                                      {daysRemaining !== null && (
                                        <span className={`font-medium px-2 py-0.5 rounded ${
                                          daysRemaining > 7 ? 'bg-green-100 text-green-700' : 
                                          daysRemaining > 0 ? 'bg-orange-100 text-orange-700' : 
                                          'bg-red-100 text-red-700'
                                        }`}>
                                          {daysRemaining > 0 ? `${daysRemaining} Tage` : 'Fällig'}
                                        </span>
                                      )}
                                    </div>
                                    {tx.txid && (
                                      <div className="text-slate-400 font-mono text-xs truncate">
                                        TxID: {tx.txid.substring(0, 20)}...
                                      </div>
                                    )}
                                    <div className="mt-1">
                                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                        tx.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                        tx.status === 'withdrawal_pending' ? 'bg-yellow-100 text-yellow-700' :
                                        tx.status === 'withdrawn' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                                      }`}>
                                        {tx.status === 'active' ? 'Aktiv' :
                                         tx.status === 'withdrawal_pending' ? 'Auszahlung beantragt' :
                                         tx.status === 'withdrawn' ? 'Ausgezahlt' :
                                         tx.status}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Chat-Nachrichten */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold">Chat-Nachrichten ({userMessages.length})</h3>
                          {userMessages.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedUserDetails(null);
                                setActiveTab("chat");
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Zum Chat
                            </Button>
                          )}
                        </div>
                        {userMessages.length > 0 ? (
                          <div className="space-y-2">
                            {userMessages.slice(0, 2).map(msg => (
                              <div key={msg.id} className={`p-3 rounded-lg ${
                                msg.is_admin ? 'bg-purple-50 border border-purple-200' : 'bg-blue-50 border border-blue-200'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-muted-foreground">
                                    {msg.is_admin ? 'Admin' : 'Benutzer'}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(msg.created_at).toLocaleDateString('de-DE', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </div>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                            ))}
                            {userMessages.length > 2 && (
                              <p className="text-xs text-center text-muted-foreground italic pt-2">
                                + {userMessages.length - 2} weitere Nachrichten
                              </p>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Keine Nachrichten vorhanden</p>
                        )}
                      </div>

                      {/* Auszahlungsanfragen */}
                      {(() => {
                        if (!wallet) return null;
                        const userPendingWithdrawals = pendingTransactions.filter(tx => tx.wallet_id === wallet.id);
                        const userCompletedWithdrawals = completedWithdrawals.filter(tx => tx.wallet_id === wallet.id);
                        const totalWithdrawals = userPendingWithdrawals.length + userCompletedWithdrawals.length;
                        
                        if (totalWithdrawals === 0) return null;
                        
                        return (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-lg font-semibold">
                                Auszahlungsanfragen ({totalWithdrawals})
                              </h3>
                              {totalWithdrawals > 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedUserDetails(null);
                                    setActiveTab("withdrawals");
                                  }}
                                >
                                  Zu Auszahlungen
                                </Button>
                              )}
                            </div>
                            
                            {userPendingWithdrawals.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-semibold text-amber-700 mb-2">
                                  Offene Anfragen ({userPendingWithdrawals.length})
                                </p>
                                <div className="space-y-2">
                                  {userPendingWithdrawals.map(tx => (
                                    <div key={tx.id} className="bg-amber-50 border border-amber-200 p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono font-bold text-amber-900 text-sm">
                                          {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-amber-200 text-amber-800 rounded font-medium">
                                          Ausstehend
                                        </span>
                                      </div>
                                      <div className="text-xs text-amber-700">
                                        Angefragt: {new Date(tx.created_at).toLocaleDateString('de-DE', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {userCompletedWithdrawals.length > 0 && (
                              <div>
                                <p className="text-sm font-semibold text-green-700 mb-2">
                                  Archiv ({userCompletedWithdrawals.length})
                                </p>
                                <div className="space-y-2">
                                  {userCompletedWithdrawals.slice(0, 2).map(tx => (
                                    <div key={tx.id} className="bg-green-50 border border-green-200 p-3 rounded-lg">
                                      <div className="flex items-center justify-between mb-1">
                                        <span className="font-mono font-bold text-green-900 text-sm">
                                          {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                                        </span>
                                        <span className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded font-medium">
                                          ✓ Ausgezahlt
                                        </span>
                                      </div>
                                      <div className="text-xs text-green-700">
                                        Ausgezahlt: {new Date(tx.updated_at || tx.created_at).toLocaleDateString('de-DE', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                  {userCompletedWithdrawals.length > 2 && (
                                    <p className="text-xs text-center text-muted-foreground italic pt-2">
                                      + {userCompletedWithdrawals.length - 2} weitere Auszahlungen
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                </div>
              );
            })()}
          </TabsContent>

          <TabsContent value="wallets" className="space-y-4 mt-6">
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
                  <Button onClick={handleDistributeWallets} variant="outline">
                    Wallets verteilen
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

          <TabsContent value="transactions" className="space-y-4">
            {/* Alle Transaktionen anzeigen */}
            <Card>
              <CardHeader>
                <CardTitle>Alle Transaktionen ({transactions.length})</CardTitle>
                <CardDescription>
                  Übersicht aller Transaktionen im System
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <p className="text-gray-500">Keine Transaktionen vorhanden</p>
                ) : (
                  <div className="space-y-3">
                    {transactions.map((tx) => {
                      const wallet = wallets.find(w => w.id === tx.wallet_id);
                      const user = users.find(u => u.id === wallet?.user_id);
                      const maturityDate = tx.maturity_date ? new Date(tx.maturity_date) : null;
                      const now = new Date();
                      const daysRemaining = maturityDate 
                        ? Math.ceil((maturityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) 
                        : null;

                      return (
                        <Card 
                          key={tx.id} 
                          className={`cursor-pointer transition-colors ${
                            selectedTransactionId === tx.id 
                              ? 'bg-blue-50 border-blue-300' 
                              : 'hover:bg-slate-50'
                          }`}
                          onClick={() => setSelectedTransactionId(tx.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <p className="font-semibold text-lg">
                                    {user?.full_name || user?.email || "Unbekannt"}
                                  </p>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    tx.status === 'active' ? 'bg-blue-100 text-blue-700' :
                                    tx.status === 'withdrawal_pending' ? 'bg-yellow-100 text-yellow-700' :
                                    tx.status === 'withdrawn' ? 'bg-green-100 text-green-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {tx.status === 'active' ? 'Aktiv' :
                                     tx.status === 'withdrawal_pending' ? 'Auszahlung beantragt' :
                                     tx.status === 'withdrawn' ? 'Ausgezahlt' :
                                     tx.status}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-semibold text-slate-900">
                                      {tx.amount_btc?.toFixed(8) || '0.00000000'} BTC
                                    </span>
                                    <span>→</span>
                                    <span className="font-semibold text-slate-700">
                                      {tx.amount_eur?.toFixed(2) || '0.00'} €
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs">
                                    <span>{new Date(tx.timestamp || tx.created_at).toLocaleDateString('de-DE', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric'
                                    })}</span>
                                    {daysRemaining !== null && (
                                      <span className={`px-2 py-0.5 rounded font-medium ${
                                        daysRemaining > 7 ? 'bg-green-100 text-green-700' : 
                                        daysRemaining > 0 ? 'bg-orange-100 text-orange-700' : 
                                        'bg-red-100 text-red-700'
                                      }`}>
                                        {daysRemaining > 0 ? `${daysRemaining} Tage` : 'Fällig'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
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
                                  value={maturityDays[selectedTransactionId] ?? ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (value === "") {
                                      setMaturityDays(prev => {
                                        const newState = { ...prev };
                                        delete newState[selectedTransactionId];
                                        return newState;
                                      });
                                    } else {
                                      const numValue = parseInt(value);
                                      if (!isNaN(numValue) && numValue >= 0 && numValue <= 14) {
                                        setMaturityDays(prev => ({ ...prev, [selectedTransactionId]: numValue }));
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
                                onClick={() => handleSetMaturityDate(selectedTransactionId)}
                                disabled={maturityDays[selectedTransactionId] === undefined}
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
                                  onClick={() => handleWithdraw(selectedTransactionId)}
                                  variant="default"
                                  className="flex-1"
                                >
                                  Auszahlen
                                </Button>
                                <Button
                                  onClick={() => handleExtend(selectedTransactionId)}
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
          </TabsContent>

          {/* Auszahlungsanfragen Tab */}
          <TabsContent value="withdrawals" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Offene Auszahlungsanfragen</CardTitle>
                <CardDescription>
                  Verwalten Sie ausstehende Auszahlungsanträge
                </CardDescription>
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
                              {bitcoinPrice > 0 ? 
                                `${((tx.withdrawn_amount_eur || tx.amount_eur) / bitcoinPrice).toFixed(8)} BTC` :
                                'Kurs lädt...'
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
                            <span className="text-gray-600">Ausgezahlter Betrag (EUR):</span>
                            <span className="font-bold text-amber-800">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ausgezahlter Betrag (BTC):</span>
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
                            <div className="text-gray-600 mb-1">Ausgezahlt an:</div>
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all border">
                              {tx.withdrawal_address || "Nicht verfügbar"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex gap-2">
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

            {/* Bestätigte Auszahlungsanfragen */}
            <Card>
              <CardHeader>
                <CardTitle>Bestätigte Auszahlungsanfragen (Archiv)</CardTitle>
                <CardDescription>
                  Bereits bearbeitete Auszahlungsanträge
                </CardDescription>
              </CardHeader>
              <CardContent>
                {completedWithdrawals.length === 0 ? (
                  <p className="text-gray-500">Keine abgeschlossenen Auszahlungen vorhanden</p>
                ) : (
                  <div className="space-y-4">
                    {completedWithdrawals.map((tx) => (
                      <div key={tx.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
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
                            <div className="text-xs text-green-600 font-medium">
                              ✓ Ausgezahlt: {tx.updated_at ? new Date(tx.updated_at).toLocaleString('de-DE') : '-'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-green-800">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </div>
                            <div className="text-sm text-green-600 font-medium">
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
                            <span className="text-gray-600">Ausgezahlter Betrag (EUR):</span>
                            <span className="font-bold text-green-800">
                              {(tx.withdrawn_amount_eur || tx.amount_eur).toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Ausgezahlter Betrag (BTC):</span>
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
                            <div className="text-gray-600 mb-1">Ausgezahlt an:</div>
                            <div className="font-mono text-xs bg-gray-100 p-2 rounded break-all border">
                              {tx.withdrawal_address || "Nicht verfügbar"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-center gap-2 text-green-700">
                          <CheckCircle2 className="h-5 w-5" />
                          <span className="font-medium">Auszahlung abgeschlossen</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4 mt-6">
            {/* Alle Benutzer anzeigen - auch ohne bestehende Chats */}
            {users.length === 0 ? (
              <p className="text-muted-foreground">Keine Benutzer vorhanden.</p>
            ) : (
              users.map((user) => {
                const userMessages = chatMessages.filter(msg => msg.user_id === user.id);
                
                return (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <MessageCircle className="w-5 h-5" />
                          <button
                            onClick={() => {
                              setSelectedUserDetails(user);
                              setActiveTab("users");
                            }}
                            className="text-left hover:text-blue-600 transition-colors underline-offset-4 hover:underline"
                          >
                            {user.full_name || user.email || "Unbekannt"}
                          </button>
                          {userMessages.length > 0 && (
                            <Badge variant="secondary">{userMessages.length} Nachrichten</Badge>
                          )}
                        </CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveTab("users");
                            setSelectedUserDetails(user);
                          }}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {userMessages.length > 0 && (
                        <div className="h-48 overflow-y-auto border rounded-lg p-4 space-y-2 bg-muted/20">
                          {userMessages.map((msg: any) => (
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
                      )}

                      <div className="flex gap-2">
                        <Textarea
                          placeholder="Nachricht schreiben..."
                          value={adminMessages[user.id] || ""}
                          onChange={e => setAdminMessages({ ...adminMessages, [user.id]: e.target.value })}
                          rows={2}
                        />
                        <Button onClick={() => sendAdminMessage(user.id)} className="self-end">
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* Links-Einstellungen Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Website Link-Einstellungen</CardTitle>
                <CardDescription>
                  Verwalten Sie die Ziel-URLs für wichtige Buttons (interne oder externe Links möglich)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Home Button URL */}
                <div className="space-y-2">
                  <Label htmlFor="home-url" className="text-base font-semibold">Finanzportal Logo - Ziel-Link</Label>
                  <p className="text-sm text-muted-foreground">
                    Wohin soll das "Finanzportal"-Logo oben links führen?
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="home-url"
                      type="text"
                      placeholder="z.B. https://ihre-website.de oder /dashboard"
                      value={homeButtonUrl}
                      onChange={(e) => setHomeButtonUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => updateSetting("home_button_url", homeButtonUrl)}>
                      Speichern
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Externe Links (https://...) öffnen in neuem Tab | Interne Links (/...) im gleichen Tab
                  </p>
                </div>

                <div className="border-b" />

                {/* Website Button URL */}
                <div className="space-y-2">
                  <Label htmlFor="website-url" className="text-base font-semibold">"Zur Website"-Button - Ziel-Link</Label>
                  <p className="text-sm text-muted-foreground">
                    Wohin soll der "Zur Website"-Button auf der Info-Seite führen?
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="website-url"
                      type="text"
                      placeholder="z.B. https://ihre-website.de oder /kontakt"
                      value={websiteButtonUrl}
                      onChange={(e) => setWebsiteButtonUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => updateSetting("website_button_url", websiteButtonUrl)}>
                      Speichern
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Externe Links (https://...) öffnen in neuem Tab | Interne Links (/...) im gleichen Tab
                  </p>
                </div>

                <div className="border-b" />

                {/* Home Menu Button URL */}
                <div className="space-y-2">
                  <Label htmlFor="home-menu-url" className="text-base font-semibold">Home-Button Link (Menü)</Label>
                  <p className="text-sm text-muted-foreground">
                    Wohin soll der "Home"-Button im Dashboard-Menü führen?
                  </p>
                  <div className="flex gap-2">
                    <Input
                      id="home-menu-url"
                      type="text"
                      placeholder="z.B. https://ihre-website.de oder /dashboard"
                      value={homeMenuUrl}
                      onChange={(e) => setHomeMenuUrl(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={() => updateSetting("home_menu_url", homeMenuUrl)}>
                      Speichern
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Externe Links (https://...) öffnen in neuem Tab | Interne Links (/...) im gleichen Tab
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
    )}
  </>
);
}