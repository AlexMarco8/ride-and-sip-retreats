import Hero from "@/components/Hero";
import About from "@/components/About";
import UpcomingEvents from "@/components/UpcomingEvents";
import Gallery from "@/components/Gallery";
import Newsletter from "@/components/Newsletter";
import InterestForm from "@/components/InterestForm";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <main className="min-h-screen bg-background">
      <Hero />
      <About />
      <UpcomingEvents />
      <Gallery />
      <Newsletter />
      <InterestForm />
      <Footer />
    </main>
  );
};

export default Index;
