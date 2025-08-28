import { useState } from "react";
import Link from "next/link";
import Head from "next/head";
import { useRouter } from "next/router";
import { useBundles } from "@/hooks/useBundles";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
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

export default function Bundles() {
  const router = useRouter();
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);
  const { bundles, loading, error } = useBundles();
  const { addItem } = useUnifiedCart();
  const { toast } = useToast();

  const handleAddBundle = async (bundle: any) => {
    setIsAddingToCart(bundle.id);
    try {
      // Convert bundle to unified product format
      const unifiedProduct = {
        id: bundle.id,
        name: bundle.name,
        slug: bundle.slug || bundle.name.toLowerCase().replace(/\s+/g, "-"),
        description: bundle.description,
        short_description: bundle.description,
        product_type: "bundle" as const,
        category: bundle.category || "Bundle",
        base_price: bundle.original_price,
        sale_price: bundle.discounted_price,
        minimum_quantity: 1,
        maximum_quantity: 1, // Bundles are typically single purchase
        features: bundle.features || [],
        bundled_products:
          bundle.services?.map((service: string, index: number) => ({
            id: `service-${index}`,
            name: service,
            quantity: 1,
          })) || [],
        bundle_type: "fixed" as const,
        status: "active" as const,
        visibility: "public" as const,
        featured: bundle.popular || false,
        popular: bundle.popular || false,
        estimated_duration_hours: bundle.duration
          ? parseInt(bundle.duration.replace(/[^0-9]/g, "")) || 48
          : 48,
        specifications: {
          originalPrice: bundle.original_price,
          discount: bundle.discount || 0,
          services: bundle.services || [],
        },
        // Legacy compatibility
        title: bundle.name,
        price: bundle.discounted_price,
        duration: bundle.duration,
        isBundle: true,
      };

      await addItem(unifiedProduct, 1);

      toast({
        title: "Bundle added to cart!",
        description: `${bundle.name} has been added to your cart.`,
      });

      // Redirect to unified checkout for streamlined experience
      router.push("/unified-checkout");
    } catch (error) {
      console.error("Error adding bundle to cart:", error);
      toast({
        title: "Error",
        description: "Failed to add bundle to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading bundles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Helldivers 2 Service Bundles - HelldiversBoost</title>
        <meta
          name="description"
          content="Explore our curated service bundles for Helldivers 2 boosting services."
        />
      </Head>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Header */}
        <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex items-center mb-6">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:bg-primary/10"
                >
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
                Save more with our carefully crafted service packages designed
                for every type of Helldiver
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
            {bundles.length === 0 ? (
              <div className="col-span-2 text-center py-20">
                <Package className="w-20 h-20 mx-auto text-primary/50 mb-6" />
                <h3 className="text-2xl font-bold mb-4">
                  No Bundles Available
                </h3>
                <p className="text-muted-foreground">
                  Check back soon for amazing bundle deals!
                </p>
              </div>
            ) : (
              bundles.map((bundle) => (
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
                        ${bundle.discounted_price}
                      </span>
                      <span className="text-lg text-muted-foreground line-through">
                        ${bundle.original_price}
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
                        disabled={isAddingToCart === bundle.id}
                      >
                        {isAddingToCart === bundle.id ? (
                          <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <ShoppingCart className="w-4 h-4 mr-2" />
                        )}
                        {isAddingToCart === bundle.id
                          ? "Adding..."
                          : "Add Bundle to Cart"}
                        {isAddingToCart !== bundle.id && (
                          <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Custom Bundle CTA */}
          <div className="mt-16">
            <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
              <CardContent className="p-8 text-center">
                <Package className="w-16 h-16 text-primary mx-auto mb-6" />
                <h3 className="text-2xl font-bold mb-4">
                  Need a Custom Bundle?
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Don't see exactly what you need? Our team can create a custom
                  bundle tailored to your specific requirements.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    asChild
                  >
                    <Link href="/contact">Request Custom Bundle</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10"
                    asChild
                  >
                    <Link href="/contact">Contact Support</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="border-primary/20 hover:bg-primary/10"
                    asChild
                  >
                    <a
                      href="https://discord.gg/GqPTaWnfTG"
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
    </>
  );
}

// Ensure this page is server-side rendered for proper MPA behavior
export async function getServerSideProps() {
  return {
    props: {}, // Return empty props, data is fetched client-side via hooks
  };
}
