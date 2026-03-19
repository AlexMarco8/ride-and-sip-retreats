import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InterestForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    setIsLoading(true);
    
    const { error } = await supabase
      .from("interest_leads")
      .insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        message: formData.message || null,
      });
    
    if (error) {
      toast({ title: "Något gick fel", description: "Försök igen senare.", variant: "destructive" });
    } else {
      toast({
        title: "Intresseanmälan mottagen!",
        description: "Vi återkommer till dig inom kort med mer information.",
      });
      setFormData({ name: "", email: "", phone: "", message: "" });
    }
    
    setIsLoading(false);
  };

  return (
    <section id="interest" className="py-24 bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Users className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground mb-6">
              Anmäl Ditt <span className="text-gradient">Intresse</span>
            </h2>
            <p className="text-cream-muted text-lg">
              Vill du vara med på nästa äventyr? Fyll i formuläret så kontaktar vi dig 
              med information om kommande resor och evenemang.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                type="text"
                placeholder="Ditt namn *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-12 bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                required
              />
              <Input
                type="email"
                placeholder="E-postadress *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-12 bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
                required
              />
            </div>
            
            <Input
              type="tel"
              placeholder="Telefonnummer (valfritt)"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="h-12 bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
            />
            
            <Textarea
              placeholder="Berätta gärna lite om dig själv och ditt intresse..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="min-h-32 bg-card border-border focus:border-primary text-foreground placeholder:text-muted-foreground resize-none"
            />

            <Button 
              type="submit" 
              variant="hero" 
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Skickar..." : "Skicka Intresseanmälan"}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default InterestForm;
