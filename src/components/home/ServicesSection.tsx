import { useState } from "react";
import { useRouter } from "next/router";
import { useServices } from "@/hooks/useServices";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
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
import { ShoppingCart, Filter } from "lucide-react";

type ServiceCategory =
  | "All"
  | "Level Boost"
  | "Medals"
  | "Samples"
  | "Super Credits"
  | "Promotions";

export function ServicesSection() {
  const [selectedCategory, setSelectedCategory] =
    useState<ServiceCategory>("All");
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const router = useRouter();
  const { services } = useServices();
  const { addToCart } = useCart();
  const { toast } = useToast();

  // Filter services by category and active status
  const activeServices = services.filter((service) => service.active);
  const filteredServices =
    selectedCategory === "All"
      ? activeServices
      : activeServices.filter(
          (service) => service.category === selectedCategory,
        );

  // Calculate service counts by category
  const serviceCounts = activeServices.reduce(
    (counts, service) => {
      counts[service.category] = (counts[service.category] || 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );

  const handleAddToCart = (service: any) => {
    addToCart(service);
    toast({
      title: "Added to cart!",
      description: `${service.title} has been added to your cart.`,
    });
    // Redirect to unified checkout for streamlined experience
    router.push("/checkout");
  };

  const categories: ServiceCategory[] = [
    "All",
    "Level Boost",
    "Medals",
    "Samples",
    "Super Credits",
    "Promotions",
  ];

  return (
    <section
      id="services"
      className="py-24 relative"
      aria-labelledby="services-heading"
    >
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            id="services-heading"
            className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent"
          >
            Our Premium Services
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Choose from our extensive collection of professional Helldivers 2
            boosting services. All services are completed by expert players with
            guaranteed results.
          </p>
        </div>

        {/* Category Filter */}
        <div className="mb-12">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 bg-muted/20 rounded-xl p-1 border border-border/50">
              <Filter className="w-5 h-5 text-muted-foreground ml-3" />
              <div className="flex flex-wrap gap-1">
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={
                      selectedCategory === category ? "default" : "ghost"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className={`text-sm transition-all ${
                      selectedCategory === category
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    {category}
                    {category !== "All" && serviceCounts[category] && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {serviceCounts[category]}
                      </Badge>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <Card
              key={service.id}
              className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2 group-hover:text-primary transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Service Details */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <Badge variant="outline" className="text-xs">
                        {service.category}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Delivery:</span>
                      <span className="font-medium">{service.duration}</span>
                    </div>
                  </div>

                  {/* Price and CTA */}
                  <div className="pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-primary">
                          ${service.price}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Best value
                        </div>
                      </div>
                      <Button
                        onClick={() => handleAddToCart(service)}
                        className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all group"
                      >
                        <ShoppingCart className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredServices.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Filter className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No services found</h3>
            <p className="text-muted-foreground mb-6">
              Try selecting a different category or check back later.
            </p>
            <Button
              variant="outline"
              onClick={() => setSelectedCategory("All")}
            >
              Show All Services
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
