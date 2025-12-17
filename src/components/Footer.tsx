import logoImage from "@/assets/logo.jpeg";

const Footer = () => {
  return (
    <footer className="py-12 bg-charcoal-light border-t border-border">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img 
              src={logoImage} 
              alt="Springtouring.se" 
              className="h-10 object-contain"
            />
          </div>
          
          <nav className="flex gap-8 text-sm">
            <a href="#" className="text-cream-muted hover:text-primary transition-colors">
              Om Oss
            </a>
            <a href="#newsletter" className="text-cream-muted hover:text-primary transition-colors">
              Nyhetsbrev
            </a>
            <a href="#interest" className="text-cream-muted hover:text-primary transition-colors">
              Kontakt
            </a>
          </nav>
          
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Springtouring. Alla rättigheter reserverade.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
