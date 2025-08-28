import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trophy,
  TrendingUp,
  Zap,
  DollarSign,
  Plus,
  Minus,
  ShoppingCart,
  Coins,
  Check,
  ArrowRight,
  X,
  Package,
  Sparkles,
  Star,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client-no-realtime";

interface CustomPricing {
  id: string;
  category: string;
  item_name: string;
  base_price: number;
  price_per_unit: number;
  minimum_quantity: number;
  maximum_quantity: number | null;
  description: string | null;
  is_active: boolean;
}

interface OrderItem {
  category: string;
  item_name: string;
  quantity: number;
  price_per_unit: number;
  total_price: number;
  description: string;
}

export default function CustomOrder() {
  const router = useRouter();
  const { addItem } = useUnifiedCart();
  const { toast } = useToast();
  const { user } = useAuth();

  const [pricing, setPricing] = useState<CustomPricing[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch custom pricing from database
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const { data, error } = await supabase
          .from("custom_pricing")
          .select("*")
          .eq("is_active", true)
          .order("category", { ascending: true });

        if (error) {
          console.error("Error fetching pricing:", error);
          setDefaultPricing();
        } else {
          setPricing(data || []);
        }
      } catch (err) {
        console.error("Database error:", err);
        setDefaultPricing();
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  const setDefaultPricing = () => {
    const defaultPricing: CustomPricing[] = [
      {
        id: "medals-1",
        category: "medals",
        item_name: "Medal",
        base_price: 5,
        price_per_unit: 5,
        minimum_quantity: 1,
        maximum_quantity: 50,
        description: "Unlock and complete medal challenges",
        is_active: true,
      },
      {
        id: "levels-1",
        category: "levels",
        item_name: "Level",
        base_price: 8,
        price_per_unit: 8,
        minimum_quantity: 1,
        maximum_quantity: 100,
        description: "Character level progression",
        is_active: true,
      },
      {
        id: "samples-1",
        category: "samples",
        item_name: "Sample",
        base_price: 2,
        price_per_unit: 2,
        minimum_quantity: 10,
        maximum_quantity: 1000,
        description: "Collect rare samples for upgrades",
        is_active: true,
      },
      {
        id: "credits-1",
        category: "super_credits",
        item_name: "Super Credit",
        base_price: 0.5,
        price_per_unit: 0.5,
        minimum_quantity: 100,
        maximum_quantity: 5000,
        description: "Premium currency for exclusive items",
        is_active: true,
      },
    ];
    setPricing(defaultPricing);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "medals":
        return <Trophy className="w-4 h-4" />;
      case "levels":
        return <TrendingUp className="w-4 h-4" />;
      case "samples":
        return <Zap className="w-4 h-4" />;
      case "super_credits":
        return <Coins className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "medals":
        return "from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-600";
      case "levels":
        return "from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-600";
      case "samples":
        return "from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-600";
      case "super_credits":
        return "from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-600";
      default:
        return "from-gray-500/20 to-slate-500/20 border-gray-500/30 text-gray-600";
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "medals":
        return "Medals";
      case "levels":
        return "Levels";
      case "samples":
        return "Samples";
      case "super_credits":
        return "Super Credits";
      default:
        return category;
    }
  };

  const addOrderItem = (pricingItem: CustomPricing, quantity: number) => {
    const maxQty = pricingItem.maximum_quantity || 999999; // Default to large number if null
    if (quantity < pricingItem.minimum_quantity || quantity > maxQty) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between ${pricingItem.minimum_quantity} and ${maxQty}`,
        variant: "destructive",
      });
      return;
    }

    const totalPrice = pricingItem.price_per_unit * quantity;
    const existingIndex = orderItems.findIndex(
      (item) =>
        item.category === pricingItem.category &&
        item.item_name === pricingItem.item_name,
    );

    if (existingIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: quantity,
        total_price: totalPrice,
        category: pricingItem.category || "",
        item_name: pricingItem.item_name || "",
        description: pricingItem.description || "",
        price_per_unit: pricingItem.price_per_unit || 0,
      };
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        category: pricingItem.category || "",
        item_name: pricingItem.item_name || "",
        quantity: quantity,
        price_per_unit: pricingItem.price_per_unit || 0,
        total_price: totalPrice,
        description: pricingItem.description || "",
      };
      setOrderItems([...orderItems, newItem]);
    }

    toast({
      title: "Added to Order",
      description: `${quantity} ${pricingItem.item_name}${quantity > 1 ? "s" : ""} updated`,
      duration: 2000,
    });
  };

  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    toast({
      title: "Item Removed",
      description: "Item removed from your order",
      duration: 1500,
    });
  };

  const getTotalPrice = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const addToCartAndNavigate = async () => {
    if (orderItems.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add at least one item to your custom order.",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      // Add each custom order item as a unified product
      for (const item of orderItems) {
        const unifiedProduct = {
          id: `custom-${item.category}-${item.item_name}-${Date.now()}-${Math.random()}`,
          name: `${item.item_name} (Custom Order)`,
          slug: `custom-${item.category}-${item.item_name}`
            .toLowerCase()
            .replace(/\s+/g, "-"),
          description: item.description || `Custom ${item.item_name} order`,
          short_description: `${item.quantity} ${item.item_name}${item.quantity > 1 ? "s" : ""}`,
          product_type: "custom_item" as const,
          category: item.category,
          subcategory: "custom_order",
          base_price: item.price_per_unit,
          price_per_unit: item.price_per_unit,
          minimum_quantity: 1,
          maximum_quantity: 999,
          status: "active" as const,
          visibility: "public" as const,
          featured: false,
          popular: false,
          specifications: {
            customOrder: true,
            originalCategory: item.category,
            originalItemName: item.item_name,
            specialInstructions: orderNotes,
          },
          // Legacy compatibility
          title: `${item.item_name} (Custom)`,
          price: item.total_price,
        };

        await addItem(unifiedProduct, item.quantity, {
          instructions: orderNotes,
          notes: `Custom order: ${item.quantity} ${item.item_name}${item.quantity > 1 ? "s" : ""}`,
          customOrderData: {
            category: item.category,
            itemName: item.item_name,
            pricePerUnit: item.price_per_unit,
            originalQuantity: item.quantity,
          },
        });
      }

      toast({
        title: "Added to Cart!",
        description: `Your custom order with ${orderItems.length} item type${orderItems.length > 1 ? "s" : ""} has been added to the cart.`,
      });

      // Clear local state after successful addition
      setOrderItems([]);
      setOrderNotes("");

      router.push("/unified-checkout");
    } catch (error: any) {
      console.error("Error processing order:", error);
      const errorMessage =
        error?.message ||
        error?.error_description ||
        JSON.stringify(error) ||
        "Unknown error";
      toast({
        title: "Error",
        description: `Failed to process your order: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const groupedPricing = pricing.reduce(
    (acc, item) => {
      const category = item.category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category]!.push(item);
      return acc;
    },
    {} as Record<string, CustomPricing[]>,
  );

  const categories = Object.keys(groupedPricing);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Compact Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">
                Custom <span className="text-primary">Order Builder</span>
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Craft your perfect Helldivers 2 progression package
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Category Sidebar */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {categories.map((category) => {
                  const items = groupedPricing[category];
                  const isSelected = selectedCategory === category;
                  return (
                    <button
                      key={category}
                      onClick={() =>
                        setSelectedCategory(isSelected ? null : category)
                      }
                      className={`w-full p-3 rounded-lg border transition-all text-left ${
                        isSelected
                          ? `bg-gradient-to-r ${getCategoryColor(category)} border-current`
                          : "border-border hover:border-primary/30 hover:bg-accent/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon(category)}
                          <span className="font-medium text-sm">
                            {getCategoryTitle(category)}
                          </span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          ${items?.[0]?.price_per_unit || 0}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Items Grid */}
          <div className="xl:col-span-2">
            <div className="space-y-4">
              {categories
                .filter(
                  (category) =>
                    !selectedCategory || selectedCategory === category,
                )
                .map((category) => {
                  const items = groupedPricing[category];
                  return (
                    <Card key={category} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div
                              className={`p-2 rounded-lg bg-gradient-to-r ${getCategoryColor(category)}`}
                            >
                              {getCategoryIcon(category)}
                            </div>
                            <div>
                              <CardTitle className="text-lg">
                                {getCategoryTitle(category)}
                              </CardTitle>
                              <CardDescription className="text-xs">
                                Starting at ${items?.[0]?.price_per_unit || 0}{" "}
                                per{" "}
                                {items?.[0]?.item_name?.toLowerCase() || "item"}
                              </CardDescription>
                            </div>
                          </div>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          {(items || []).map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              onAdd={addOrderItem}
                              currentQuantity={
                                orderItems.find(
                                  (orderItem) =>
                                    orderItem.category === item.category &&
                                    orderItem.item_name === item.item_name,
                                )?.quantity || 0
                              }
                            />
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

              {/* Order Notes */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Special Instructions
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Add account details or specific requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <Textarea
                    placeholder="Account details, preferred gaming hours, special requirements..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Summary */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-base">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {orderItems.length === 0 ? (
                  <div className="text-center py-6">
                    <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-xs text-muted-foreground">
                      Select items to build your order
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ScrollArea className="max-h-64">
                      <div className="space-y-2 pr-2">
                        {orderItems.map((item, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-accent/30 rounded-md"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate">
                                {item.quantity} {item.item_name}
                                {item.quantity > 1 ? "s" : ""}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${item.price_per_unit} each
                              </p>
                            </div>
                            <div className="flex items-center space-x-1">
                              <p className="font-bold text-xs text-primary">
                                ${item.total_price.toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeOrderItem(index)}
                                className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-sm">Total:</span>
                      <span className="text-lg font-bold text-primary">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={addToCartAndNavigate}
                      className="w-full"
                      size="sm"
                      disabled={isAddingToCart}
                    >
                      {isAddingToCart ? (
                        <div className="w-3 h-3 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <ShoppingCart className="w-3 h-3 mr-2" />
                      )}
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                      {!isAddingToCart && (
                        <ArrowRight className="w-3 h-3 ml-2" />
                      )}
                    </Button>

                    <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Review in cart</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact Item Component
interface ItemCardProps {
  item: CustomPricing;
  onAdd: (item: CustomPricing, quantity: number) => void;
  currentQuantity: number;
}

function ItemCard({ item, onAdd, currentQuantity }: ItemCardProps) {
  const [quantity, setQuantity] = useState(
    currentQuantity || Math.max(1, item.minimum_quantity || 1),
  );

  useEffect(() => {
    if (currentQuantity > 0) {
      setQuantity(currentQuantity);
    }
  }, [currentQuantity]);

  const adjustQuantity = (delta: number) => {
    const maxQty = item.maximum_quantity || 999999; // Default to large number if null
    const newQuantity = Math.max(
      item.minimum_quantity,
      Math.min(maxQty, quantity + delta),
    );
    setQuantity(newQuantity);
  };

  const handleAdd = () => {
    onAdd(item, quantity);
  };

  const totalPrice = item.price_per_unit * quantity;

  return (
    <div className="border border-border/50 rounded-lg p-3 hover:border-primary/30 transition-all hover:shadow-sm bg-background/50">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-sm">{item.item_name}</h4>
            <Badge variant="outline" className="text-xs h-5">
              ${item.price_per_unit}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground leading-tight">
            {item.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= item.minimum_quantity}
            className="h-6 w-6 p-0"
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const inputValue = e.target.value;
              // Allow empty input or any number during typing
              if (inputValue === "" || inputValue === "0") {
                setQuantity(item.minimum_quantity);
                return;
              }
              const value = parseInt(inputValue);
              if (!isNaN(value)) {
                const maxQty = item.maximum_quantity || 999999;
                // Only apply maximum constraint, not minimum during typing
                setQuantity(Math.min(maxQty, value));
              }
            }}
            onBlur={(e) => {
              // Apply minimum constraint only when user finishes editing
              const value = parseInt(e.target.value) || item.minimum_quantity;
              const maxQty = item.maximum_quantity || 999999;
              setQuantity(
                Math.max(item.minimum_quantity, Math.min(maxQty, value)),
              );
            }}
            className="w-20 text-center text-xs h-6"
            min={item.minimum_quantity}
            max={item.maximum_quantity || 999999}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= (item.maximum_quantity || 999999)}
            className="h-6 w-6 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-right">
            <p className="text-sm font-bold text-primary">
              ${totalPrice.toFixed(2)}
            </p>
          </div>
          <Button onClick={handleAdd} size="sm" className="h-6 text-xs px-2">
            {currentQuantity > 0 ? "Update" : "Add"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-1 flex items-center justify-between">
        <span>Min: {item.minimum_quantity}</span>
        <span>Max: {item.maximum_quantity || "∞"}</span>
      </div>
    </div>
  );
}
