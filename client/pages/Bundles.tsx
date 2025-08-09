import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Package,
  Star,
  ShoppingCart,
  CheckCircle,
  Clock,
  Trophy,
  Zap,
  ArrowRight,
  Shield,
  MessageSquare,
} from "lucide-react";

interface Bundle {
  id: string;
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  discountedPrice: number;
  discount: number;
  duration: string;
  popular?: boolean;
  badge?: string;
  features: string[];
}

const bundles: Bundle[] = [
  {
    id: "starter-pack",
    name: "Starter Pack",
    description: "Perfect for new Helldivers looking to get started quickly",
    services: [
      "Level Boost (1-25)",
      "Basic Equipment Unlock",
      "Tutorial Completion",
    ],
    originalPrice: 49.97,
    discountedPrice: 34.99,
    discount: 30,
    duration: "1-2 days",
    features: [
      "Level 1-25 boost",
      "Essential equipment unlocked",
      "Basic difficulty access",
      "24/7 progress updates",
    ],
  },
  {
    id: "elite-package",
    name: "Elite Package",
    description: "Complete transformation for serious Helldivers",
    services: [
      "Level Boost (1-50)",
      "Planet Liberation x3",
      "All Difficulties Unlock",
      "Super Sample Farming",
    ],
    originalPrice: 134.96,
    discountedPrice: 89.99,
    discount: 33,
    duration: "3-5 days",
    popular: true,
    badge: "Best Value",
    features: [
      "Full level 50 boost",
      "3 Planet liberations",
      "All difficulty levels unlocked",
      "50+ Super samples",
      "Priority support",
      "VIP treatment",
    ],
  },
  {
    id: "champion-bundle",
    name: "Champion Bundle",
    description: "Ultimate package for becoming a Helldivers legend",
    services: [
      "Level Boost (1-50)",
      "Planet Liberation x5",
      "Galactic War Progress",
      "Medal & Credits Farming",
      "Super Sample Farming",
    ],
    originalPrice: 189.95,
    discountedPrice: 129.99,
    discount: 32,
    duration: "5-7 days",
    badge: "Most Popular",
    features: [
      "Complete level 50 boost",
      "5 Planet liberations",
      "Major order completion",
      "1000+ Medals collected",
      "500+ Super credits",
      "All achievements unlocked",
      "Premium support",
      "Post-completion guidance",
    ],
  },
  {
    id: "speed-run",
    name: "Speed Run Special",
    description: "Express service for immediate results",
    services: ["Level Boost (1-30)", "Difficulty Unlock", "Equipment Boost"],
    originalPrice: 79.97,
    discountedPrice: 59.99,
    discount: 25,
    duration: "12-24 hours",
    badge: "Express",
    features: [
      "Level 30 in under 24h",
      "Fast difficulty unlock",
      "Essential equipment",
      "Express queue priority",
      "Real-time updates",
    ],
  },
];

export default function Bundles() {
  const { addToCart } = useCart();
  const { toast } = useToast();

  const handleAddBundle = (bundle: Bundle) => {
    // Create a bundle service object
    const bundleService = {
      id: bundle.id,
      title: bundle.name,
      description: bundle.description,
      price: bundle.discountedPrice,
      originalPrice: bundle.originalPrice,
      duration: bundle.duration,
      difficulty: "Various",
      features: bundle.features,
      active: true,
      createdAt: new Date().toISOString(),
      orders: 0,
    };

    addToCart(bundleService);
    toast({
      title: "Bundle added to cart!",
      description: `${bundle.name} has been added to your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Package className="w-4 h-4 mr-2" />
              Service Bundles
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Bundle
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Deals
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Save more with our carefully crafted service packages designed for
              every type of Helldiver
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Benefits Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <Card className="text-center border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Save up to 33%</h3>
              <p className="text-sm text-muted-foreground">
                Significant savings compared to individual services
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Priority Queue</h3>
              <p className="text-sm text-muted-foreground">
                Bundle orders get priority processing
              </p>
            </CardContent>
          </Card>

          <Card className="text-center border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Guaranteed Results</h3>
              <p className="text-sm text-muted-foreground">
                All services in bundle fully completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Bundles Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {bundles.map((bundle) => (
            <Card
              key={bundle.id}
              className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl ${
                bundle.popular
                  ? "border-2 border-primary shadow-lg bg-gradient-to-br from-card to-primary/5"
                  : "border border-border/50 hover:border-primary/30 bg-gradient-to-br from-card to-card/80"
              }`}
            >
              {bundle.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <Badge
                    className={
                      bundle.popular
                        ? "bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg"
                        : "bg-accent text-accent-foreground"
                    }
                  >
                    {bundle.badge}
                  </Badge>
                </div>
              )}

              {bundle.popular && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-600"></div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">
                      {bundle.name}
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      {bundle.description}
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-baseline gap-3 mt-4">
                  <span className="text-4xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                    ${bundle.discountedPrice}
                  </span>
                  <span className="text-lg text-muted-foreground line-through">
                    ${bundle.originalPrice}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-green-600 border-green-600/20"
                  >
                    Save {bundle.discount}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 text-primary mr-2" />
                    <span className="text-muted-foreground">
                      Estimated completion:{" "}
                    </span>
                    <span className="font-medium text-primary ml-1">
                      {bundle.duration}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-sm">
                      Included Services:
                    </h4>
                    <div className="space-y-1">
                      {bundle.services.map((service, index) => (
                        <div
                          key={index}
                          className="text-sm text-muted-foreground flex items-center"
                        >
                          <CheckCircle className="w-3 h-3 text-primary mr-2 flex-shrink-0" />
                          {service}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 text-sm">
                      What You Get:
                    </h4>
                    <div className="space-y-1">
                      {bundle.features.map((feature, index) => (
                        <div
                          key={index}
                          className="text-sm text-muted-foreground flex items-center"
                        >
                          <div className="w-2 h-2 bg-primary rounded-full mr-3 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    className={`w-full mt-6 group ${
                      bundle.popular
                        ? "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
                        : "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    }`}
                    onClick={() => handleAddBundle(bundle)}
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add Bundle to Cart
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Custom Bundle CTA */}
        <div className="mt-16">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
            <CardContent className="p-8 text-center">
              <Package className="w-16 h-16 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Need a Custom Bundle?</h3>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Don't see exactly what you need? Our team can create a custom
                bundle tailored to your specific requirements.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  asChild
                >
                  <Link to="/contact">Request Custom Bundle</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10"
                  asChild
                >
                  <Link to="/contact">Contact Support</Link>
                </Button>
                <Button
                  variant="outline"
                  className="border-primary/20 hover:bg-primary/10"
                  asChild
                >
                  <a
                    href="https://discord.gg/helldivers2boost"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Ask Discord
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
