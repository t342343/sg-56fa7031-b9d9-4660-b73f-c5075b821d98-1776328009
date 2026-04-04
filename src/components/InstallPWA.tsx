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
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (isDismissed === 'true') {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!mounted) return null;
  if (isInstalled || !installPrompt || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-gray-900 border border-orange-500/30 p-4 rounded-xl shadow-2xl z-[100] flex items-center justify-between gap-4 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex flex-col">
        <span className="text-white font-semibold text-sm">App installieren</span>
        <span className="text-gray-400 text-xs mt-0.5">Für Offline-Zugriff & Icon auf dem Desktop</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          onClick={promptInstall} 
          size="sm" 
          className="bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Installieren
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDismiss} 
          className="text-gray-400 hover:text-white h-8 w-8"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}