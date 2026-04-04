import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import { useState, useEffect } from "react";

export function InstallPWA() {
  const { installPrompt, promptInstall, isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
    
    // Check if user previously dismissed the prompt
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed-login');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed-login', 'true');
  };

  if (!mounted) return null;
  if (isInstalled || !installPrompt || dismissed) return null;

  return (
    <div className="bg-gray-800/80 border border-gray-700/50 p-4 rounded-xl flex items-center justify-between gap-4 mt-4 animate-in fade-in duration-300">
      <div className="flex flex-col">
        <span className="text-white font-medium text-sm">App installieren</span>
        <span className="text-gray-400 text-xs mt-0.5">Für Offline-Zugriff & Icon auf dem Desktop</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          onClick={(e) => { e.preventDefault(); promptInstall(); }} 
          size="sm" 
          style={{ background: 'linear-gradient(to right, rgb(37, 99, 235), rgb(29, 78, 216))', color: 'white' }}
          className="hover:opacity-90 h-8 text-xs font-medium shadow-lg"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Installieren
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={(e) => { e.preventDefault(); handleDismiss(); }} 
          className="text-gray-400 hover:text-white h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}