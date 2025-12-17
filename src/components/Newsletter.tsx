import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail } from "lucide-react";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Tack för din anmälan!",
      description: "Du kommer nu få våra senaste nyheter och uppdateringar.",
    });
    
    setEmail("");
    setIsLoading(false);
  };

  return (
    <section id="newsletter" className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-8">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground mb-6">
            Håll Dig <span className="text-gradient">Uppdaterad</span>
          </h2>
          <p className="text-cream-muted text-lg mb-10">
            Prenumerera på vårt nyhetsbrev för exklusiva inbjudningar, 
            reserapporter och nyheter om kommande äventyr.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Din e-postadress"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-12 bg-background border-border focus:border-primary text-foreground placeholder:text-muted-foreground"
              required
            />
            <Button 
              type="submit" 
              variant="gold" 
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Skickar..." : "Prenumerera"}
            </Button>
          </form>
          
          <p className="text-muted-foreground text-sm mt-4">
            Vi respekterar din integritet. Avprenumerera när som helst.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
