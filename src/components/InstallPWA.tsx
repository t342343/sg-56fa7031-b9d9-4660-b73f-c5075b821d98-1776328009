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
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5 z-50">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Für Offline-Zugriff & Icon auf dem Desktop
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Schneller Zugriff von Ihrem Startbildschirm
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Button 
          onClick={(e) => { e.preventDefault(); promptInstall(); }} 
          size="sm" 
          className="h-8 text-xs font-medium"
        >
          <Download className="w-3.5 h-3.5 mr-1.5" />
          APP
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