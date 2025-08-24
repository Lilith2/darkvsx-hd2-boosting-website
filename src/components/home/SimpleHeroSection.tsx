import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Gamepad2, Star } from "lucide-react";

export function SimpleHeroSection() {
  return (
    <section
      className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-16"
      role="banner"
      aria-labelledby="hero-heading"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-background/80" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float delay-1000" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Heading */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up"
          >
            Helldivers 2
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Boosting Services
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Professional boosting services with fast delivery and expert support for all your Helldivers 2 progression needs.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up delay-200">
            <Link href="#services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-lg px-8 py-6 h-auto group"
              >
                <Gamepad2 className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                Browse Services
                <ArrowRight className="w-4 h-4 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="hover:bg-primary/10 hover:border-primary/50 text-lg px-8 py-6 h-auto group"
              asChild
            >
              <Link href="/custom-order">
                <Star className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                Custom Order
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-muted-foreground/30 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
}
