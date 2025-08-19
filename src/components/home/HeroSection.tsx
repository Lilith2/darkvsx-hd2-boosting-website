import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Play, Award, Gamepad2, Star, Shield, Target, Zap, User, Trophy } from "lucide-react";

export function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
      role="banner"
      aria-labelledby="hero-heading"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 via-transparent to-background/80" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Status Badge */}
          <Badge
            variant="outline"
            className="mb-8 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-200 border-green-200 dark:border-green-800 text-base px-6 py-2 animate-fade-in-up"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
            🔥 All Boosters Online • Average Response Time: 5 minutes
          </Badge>

          {/* Main Heading */}
          <h1
            id="hero-heading"
            className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent animate-fade-in-up"
          >
            Elite Helldivers 2
            <br />
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              Boosting Services
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-100">
            Professional boosting with{" "}
            <span className="text-primary font-semibold">99.9% success rate</span>. 
            Fast delivery, secure methods, and 24/7 expert support for all your 
            Helldivers 2 progression needs.
          </p>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-fade-in-up delay-200">
            {[
              { icon: Shield, label: "100% Safe", color: "text-green-500" },
              { icon: Target, label: "99.9% Success", color: "text-blue-500" },
              { icon: Zap, label: "Fast Delivery", color: "text-yellow-500" },
              { icon: Award, label: "Expert Team", color: "text-purple-500" },
            ].map(({ icon: Icon, label, color }, index) => (
              <div
                key={label}
                className="flex flex-col items-center space-y-3 p-6 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all hover:scale-105"
              >
                <div className={`w-12 h-12 ${color} bg-current/20 rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <span className="font-semibold text-foreground">{label}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center animate-fade-in-up delay-300">
            <Link href="#services">
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all text-lg px-8 py-6 h-auto group"
              >
                <Gamepad2 className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                Browse Services
                <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <Button
              variant="outline"
              size="lg"
              className="hover:bg-primary/10 hover:border-primary/50 text-lg px-8 py-6 h-auto group"
              asChild
            >
              <Link href="/custom-order">
                <Star className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                Custom Order
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground animate-fade-in-up delay-400">
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full border-2 border-background flex items-center justify-center"
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                ))}
              </div>
              <span className="text-sm">
                <span className="font-semibold text-foreground">1,200+</span> satisfied customers
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-sm">
                <span className="font-semibold text-foreground">4.9/5</span> average rating
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Trophy className="w-4 h-4 text-primary" />
              <span className="text-sm">
                <span className="font-semibold text-foreground">24/7</span> support available
              </span>
            </div>
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
