import { usePWAInstall } from "@/hooks/usePWAInstall";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 z-50"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"></line>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
          </svg>
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Benutze unsere App
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={(e) => { e.preventDefault(); promptInstall(); }} 
              size="sm"
              className="flex-1"
            >
              App installieren
            </Button>
            <Button
              onClick={(e) => { e.preventDefault(); handleDismiss(); }} 
              size="sm"
              variant="ghost"
            >
              Später
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}