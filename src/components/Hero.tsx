import { Button } from "@/components/ui/button";
import heroImage from "@/assets/castle-town.jpeg";
import logoImage from "@/assets/logo.jpeg";

const Hero = () => {
  const scrollToNewsletter = () => {
    document.getElementById('newsletter')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToInterest = () => {
    document.getElementById('interest')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Europeisk stad med motorcyklar" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/60 to-background" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="animate-fade-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
          <img 
            src={logoImage} 
            alt="Springtouring.se" 
            className="h-16 md:h-20 mx-auto mb-8 object-contain"
          />
        </div>
        
        <h1 
          className="font-display text-4xl md:text-6xl lg:text-7xl font-semibold text-foreground mb-6 animate-fade-up"
          style={{ animationDelay: '0.4s', opacity: 0 }}
        >
          Exklusiva Resor.<br />
          <span className="text-gradient">Oförglömliga Upplevelser.</span>
        </h1>
        
        <p 
          className="text-lg md:text-xl text-cream-muted max-w-2xl mx-auto mb-10 font-body animate-fade-up"
          style={{ animationDelay: '0.6s', opacity: 0 }}
        >
          Ett exklusivt resesällskap för entusiaster av motorcyklar, sportbilar, 
          lokala bryggerier och utsökt mat.
        </p>

        <div 
          className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
          style={{ animationDelay: '0.8s', opacity: 0 }}
        >
          <Button variant="hero" size="xl" onClick={scrollToInterest}>
            Anmäl Intresse
          </Button>
          <Button variant="heroOutline" size="xl" onClick={scrollToNewsletter}>
            Nyhetsbrev
          </Button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary rounded-full mt-2" />
        </div>
      </div>
    </section>
  );
};

export default Hero;
