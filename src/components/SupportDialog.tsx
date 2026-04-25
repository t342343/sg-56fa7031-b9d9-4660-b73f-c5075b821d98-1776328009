import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supportService } from "@/services/supportService";
import { MessageCircle, Loader2 } from "lucide-react";

export function SupportDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Fehlende Angaben",
        description: "Bitte füllen Sie Name, E-Mail und Nachricht aus.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await supportService.createSupportRequest(formData);
      toast({
        title: "Anfrage gesendet",
        description: "Wir melden uns in Kürze bei Ihnen zurück.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
      setOpen(false);
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Ihre Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es später erneut.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <MessageCircle className="w-4 h-4" />
          Kundensupport
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Kundensupport kontaktieren</DialogTitle>
          <DialogDescription>
            Haben Sie Probleme beim Login oder Fragen? Senden Sie uns eine Nachricht und wir helfen Ihnen weiter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ihr Name"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-Mail *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ihre@email.de"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefon (optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+49 123 456789"
                disabled={loading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Nachricht *</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Beschreiben Sie Ihr Anliegen..."
                className="min-h-[100px]"
                disabled={loading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird gesendet...
                </>
              ) : (
                "Anfrage senden"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}