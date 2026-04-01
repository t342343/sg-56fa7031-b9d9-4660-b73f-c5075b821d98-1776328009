import { AuthForm } from "@/components/AuthForm";
import { SEO } from "@/components/SEO";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <>
      <SEO
        title="Finanzportal - Login"
        description="Melden Sie sich bei Ihrem Finanzportal-Konto an"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-warm-bg to-background p-4">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </>
  );
}