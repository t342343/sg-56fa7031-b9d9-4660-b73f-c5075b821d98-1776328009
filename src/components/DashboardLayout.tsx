import { ReactNode, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogOut, Home, User, Info, FileText, Menu, X, Users, Settings, MessageSquare, Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [homeUrl, setHomeUrl] = useState("/");

  useEffect(() => {
    checkAdmin();
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("setting_value")
      .eq("setting_key", "home_button_url")
      .single();
    
    if (data) setHomeUrl(data.setting_value);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Abgemeldet",
        description: "Sie wurden erfolgreich abgemeldet."
      });
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const checkAdmin = async () => {
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex">
        {/* Mobile Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-50 px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => window.location.href = homeUrl}
            className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
          >
            Finanzportal
          </button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-3"
          >
            {mobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </Button>
        </div>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 fixed left-0 top-0 bottom-0">
          <div className="p-6 border-b border-slate-200">
            <button
              onClick={() => window.location.href = homeUrl}
              className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
            >
              Finanzportal
            </button>
          </div>
        </aside>

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
                  variant={router.pathname === homeUrl ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(homeUrl);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Home className="mr-2 h-4 w-4" />
                  Home
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