import heroMotorcycles from "@/assets/hero-motorcycles.jpeg";
import gasStation from "@/assets/gas-station.jpeg";
import mountainRide from "@/assets/mountain-ride.jpeg";
import bmwBike from "@/assets/bmw-bike.jpeg";
import castleTown from "@/assets/castle-town-2.jpeg";

const images = [
  { src: heroMotorcycles, alt: "Motorcyklar parkerade i en europeisk stad" },
  { src: castleTown, alt: "Europeisk stad med slott" },
  { src: mountainRide, alt: "Motorcykeltur genom bergen" },
  { src: gasStation, alt: "Tankpaus under resan" },
  { src: bmwBike, alt: "BMW motorcykel med utsikt" },
];

const Gallery = () => {
  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-5xl font-semibold text-foreground mb-6">
            Från Våra <span className="text-gradient">Äventyr</span>
          </h2>
          <p className="text-cream-muted text-lg max-w-2xl mx-auto">
            Ögonblick från vägen – där asfalt möter frihet och gemenskap.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`relative overflow-hidden rounded-lg group ${
                index === 0 ? 'col-span-2 row-span-2' : ''
              }`}
            >
              <img 
                src={image.src} 
                alt={image.alt}
                className="w-full h-full object-cover aspect-square transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-background/0 group-hover:bg-background/30 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
