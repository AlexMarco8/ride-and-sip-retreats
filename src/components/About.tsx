import { Bike, Car, Beer, UtensilsCrossed } from "lucide-react";

const features = [
  {
    icon: Bike,
    title: "Motorcyklar",
    description: "Utforska Europas vackraste vägar på två hjul med likasinnade entusiaster."
  },
  {
    icon: Car,
    title: "Sportbilar",
    description: "Upplev farten och friheten på kurvor genom Alperna och pittoreska byar."
  },
  {
    icon: Beer,
    title: "Lokala Bryggerier",
    description: "Besök hantverksbryggerier och smaka lokala ölsorter längs vägen."
  },
  {
    icon: UtensilsCrossed,
    title: "Utsökt Mat",
    description: "Njut av regional gastronomi – från rustika krogar till fine dining."
  }
];

const About = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground mb-6">
            Om <span className="text-gradient">Springtouring</span>
          </h2>
          <p className="text-cream-muted text-lg leading-relaxed">
            Vi är ett exklusivt sällskap av äventyrslystna själar som delar passionen för 
            vägen, hastigheten och de goda tingen i livet. Våra resor kombinerar spänningen 
            av motorcyklar och sportbilar med kulturella upplevelser, fantastisk mat och 
            unika bryggerier.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={feature.title}
              className="group p-8 bg-background rounded-lg border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_hsla(35,50%,55%,0.15)]"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display text-xl font-semibold text-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-cream-muted text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
