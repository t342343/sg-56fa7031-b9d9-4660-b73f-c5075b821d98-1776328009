import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/authService";
import { profileService } from "@/services/profileService";
import { LogOut, LayoutDashboard, Wallet, User, Info, Calculator, Menu, X, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface DashboardLayoutProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function DashboardLayout({ children, requireAdmin = false }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Finanzportal
          </h1>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </Button>
        </div>

        {/* Sidebar - Desktop & Mobile */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-64 bg-white border-r border-slate-200
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${mobileMenuOpen ? 'pt-16' : 'pt-0 lg:pt-0'}
        `}>
          <div className="h-full overflow-y-auto">
            <div className="p-6">
              <h1 className="hidden lg:block text-2xl font-bold mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Finanzportal
              </h1>

              <div className="space-y-2">
                <Button
                  variant={router.pathname === "/dashboard" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>

                <Button
                  variant={router.pathname === "/profile" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/profile");
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </Button>

                <Button
                  variant={router.pathname === "/gewinnberechnung" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/gewinnberechnung");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Calculator className="mr-2 h-4 w-4" />
                  Gewinnberechnung
                </Button>

                <Button
                  variant={router.pathname === "/info" ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push("/info");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Info className="mr-2 h-4 w-4" />
                  Info
                </Button>

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Abmelden
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay für Mobile */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 lg:ml-0 pt-16 lg:pt-0">
          <div className="p-4 lg:p-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}