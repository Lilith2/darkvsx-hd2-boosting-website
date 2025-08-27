import React, { memo, useCallback, useState } from "react";
import { useRouter } from "next/router";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Trophy, ShieldCheck } from "lucide-react";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { useToast } from "@/hooks/use-toast";
import type { ServiceData } from "@/hooks/useServices";

interface OptimizedServiceCardProps {
  service: ServiceData;
  onQuickView?: (service: ServiceData) => void;
}

export const OptimizedServiceCard = memo<OptimizedServiceCardProps>(
  ({ service, onQuickView }) => {
    const router = useRouter();
    const { addToCart } = useCart();
    const { toast } = useToast();
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    const handleAddToCart = useCallback(() => {
      addToCart(service);
      toast({
        title: "Added to cart!",
        description: `${service.title} has been added to your cart.`,
        duration: 2000,
      });
      // Redirect to unified checkout for streamlined experience
      router.push("/checkout");
    }, [service, addToCart, toast, router]);

    const handleQuickView = useCallback(() => {
      onQuickView?.(service);
    }, [service, onQuickView]);

    const getDifficultyIcon = useCallback((difficulty: string) => {
      switch (difficulty.toLowerCase()) {
        case "easy":
          return <ShieldCheck className="w-4 h-4 text-green-500" />;
        case "medium":
          return <Trophy className="w-4 h-4 text-yellow-500" />;
        case "hard":
          return <Star className="w-4 h-4 text-red-500" />;
        default:
          return <Clock className="w-4 h-4 text-gray-500" />;
      }
    }, []);

    const isDiscounted =
      service.originalPrice && service.originalPrice > service.price;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 hover:scale-[1.02] border-border/50 hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                {service.title}
              </CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {service.category}
                </Badge>
                <div className="flex items-center gap-1">
                  {getDifficultyIcon(service.difficulty)}
                  <span className="text-xs text-muted-foreground">
                    {service.difficulty}
                  </span>
                </div>
              </CardDescription>
            </div>
            <div className="flex flex-col items-end gap-1">
              {service.popular && (
                <Badge className="bg-gradient-to-r from-primary to-blue-600 text-white text-xs">
                  Popular
                </Badge>
              )}
              {isDiscounted && (
                <Badge
                  variant="outline"
                  className="text-xs text-green-600 border-green-600"
                >
                  Sale
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-3 min-h-[60px]">
            {service.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{service.duration}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {service.orders_count} orders
            </div>
          </div>

          {service.features && service.features.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Features:
              </p>
              <ul className="text-xs text-muted-foreground space-y-1">
                {service.features.slice(0, 3).map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
                {service.features.length > 3 && (
                  <li className="text-xs text-muted-foreground italic">
                    +{service.features.length - 3} more features
                  </li>
                )}
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="pt-3 flex flex-col gap-3">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-primary">
                ${service.price.toFixed(2)}
              </span>
              {isDiscounted && (
                <span className="text-sm text-muted-foreground line-through">
                  ${service.originalPrice!.toFixed(2)}
                </span>
              )}
            </div>
            {isDiscounted && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-600"
              >
                {Math.round(
                  ((service.originalPrice! - service.price) /
                    service.originalPrice!) *
                    100,
                )}
                % OFF
              </Badge>
            )}
          </div>

          <div className="flex gap-2 w-full">
            <Button
              onClick={handleAddToCart}
              className="flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              Add to Cart
            </Button>
            {onQuickView && (
              <Button
                variant="outline"
                onClick={handleQuickView}
                className="px-3"
              >
                View
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  },
);

OptimizedServiceCard.displayName = "OptimizedServiceCard";
