import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { LogOut, LayoutDashboard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const session = await authService.getCurrentSession();
    if (!session) {
      router.push("/login");
      return;
    }

    const profile = await profileService.getCurrentProfile();
    if (!profile) {
      router.push("/login");
      return;
    }

    if (requireAdmin && profile.role !== "admin") {
      toast({ title: "Zugriff verweigert", description: "Sie benötigen Admin-Rechte", variant: "destructive" });
      router.push("/dashboard");
      return;
    }

    setUserName(profile.full_name || "User");
    setLoading(false);
  };

  const handleLogout = async () => {
    await authService.signOut();
    toast({ title: "Abgemeldet", description: "Sie wurden erfolgreich abgemeldet" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg">Laden...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-warm-bg to-background">
      <nav className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-heading font-bold text-navy">Finanzportal</h1>
              <div className="flex gap-4">
                {requireAdmin ? (
                  <Button variant="ghost" onClick={() => router.push("/admin")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Admin-Panel
                  </Button>
                ) : (
                  <Button variant="ghost" onClick={() => router.push("/dashboard")}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Hallo, {userName}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Abmelden
              </Button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}