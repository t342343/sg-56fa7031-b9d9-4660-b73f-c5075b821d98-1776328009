import { AuthForm } from "@/components/AuthForm";
import { SEO } from "@/components/SEO";

export default function LoginPage() {
  return (
    <>
      <SEO 
        title="Anmelden - Finanzportal"
        description="Melden Sie sich bei Ihrem Finanzportal-Konto an"
      />
      <AuthForm />
    </>
  );
}