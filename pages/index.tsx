import { useState, useEffect } from "react";
import { SEOHead } from "../components/SEOHead";
import { SimpleHeroSection } from "@/components/home/SimpleHeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";

export default function Index() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect for scroll-to-top button
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <SEOHead
        title="Helldivers 2 Boosting Services - Fast & Professional | HelldiversBoost"
        description="Professional Helldivers 2 boosting services. Level boosts, weapon unlocks, credit farming, and mission completion. Fast delivery, expert support."
      />
      <div className="bg-gradient-to-br from-background via-background to-background/80">
        <SimpleHeroSection />
        <HowItWorksSection />
        <ServicesSection />
        <TestimonialsSection />

        {/* Scroll to Top Button */}
        {mounted && scrolled && (
          <Button
            onClick={scrollToTop}
            size="lg"
            className="fixed bottom-8 right-8 z-50 rounded-full w-14 h-14 shadow-lg shadow-primary/25 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 transition-all hover:scale-110"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-6 h-6" />
          </Button>
        )}
      </div>
    </>
  );
}
