import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-2xl mx-auto px-4 text-center">
        {/* Animated 404 Number */}
        <div className="relative mb-8">
          <div className="text-[120px] md:text-[200px] font-bold text-transparent bg-gradient-to-r from-primary/20 to-blue-500/20 bg-clip-text leading-none">
            404
          </div>
          <div className="absolute inset-0 text-[120px] md:text-[200px] font-bold text-transparent bg-gradient-to-r from-primary to-blue-500 bg-clip-text leading-none animate-pulse">
            404
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Page Not Found
          </h1>

          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's
            get you back on track!
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 group"
              asChild
            >
              <Link href="/">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                Go Home
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-primary/20 hover:bg-primary/10 group"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="mt-12 pt-8 border-t border-border/50">
            <p className="text-sm text-muted-foreground mb-4">Popular pages:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/bundles">Services</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/custom-order">Custom Order</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/contact">Contact</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/faq">FAQ</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
      </div>
    </div>
  );
}
