import { useEffect } from "react";
import { useRouter } from "next/router";
import { supabase } from "@/integrations/supabase/client";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        router.replace("/dashboard");
      } else {
        router.replace("/login");
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Wird geladen...</p>
      </div>
    </div>
  );
}