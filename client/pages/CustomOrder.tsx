import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trophy,
  TrendingUp,
  Zap,
  DollarSign,
  Plus,
  Minus,
  Calculator,
  ShoppingCart,
  Star,
  Award,
  Coins,
  Target,
  Sparkles,
  Clock,
  Shield,
  Check,
  ArrowRight,
  Info,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CustomPricing {
  id: string;
  category: string;
  item_name: string;
  base_price: number;
  price_per_unit: number;
  minimum_quantity: number;
  maximum_quantity: number;
  description: string;
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
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toast } = useToast();

  const [pricing, setPricing] = useState<CustomPricing[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [loading, setLoading] = useState(true);

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
        return <Trophy className="w-8 h-8" />;
      case "levels":
        return <TrendingUp className="w-8 h-8" />;
      case "samples":
        return <Zap className="w-8 h-8" />;
      case "super_credits":
        return <Coins className="w-8 h-8" />;
      default:
        return <Star className="w-8 h-8" />;
    }
  };

  const getCategoryGradient = (category: string) => {
    switch (category) {
      case "medals":
        return "from-yellow-400 via-yellow-500 to-orange-500";
      case "levels":
        return "from-blue-400 via-blue-500 to-purple-500";
      case "samples":
        return "from-green-400 via-green-500 to-teal-500";
      case "super_credits":
        return "from-purple-400 via-purple-500 to-pink-500";
      default:
        return "from-gray-400 via-gray-500 to-slate-500";
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "medals":
        return "Medals & Achievements";
      case "levels":
        return "Level Progression";
      case "samples":
        return "Research Samples";
      case "super_credits":
        return "Super Credits";
      default:
        return category;
    }
  };

  const getCategorySubtitle = (category: string) => {
    switch (category) {
      case "medals":
        return "Complete challenging objectives and unlock prestigious medals";
      case "levels":
        return "Advance your character level with professional boosting";
      case "samples":
        return "Gather rare research materials for weapon upgrades";
      case "super_credits":
        return "Premium currency for exclusive cosmetics and items";
      default:
        return "Custom boosting service";
    }
  };

  const addOrderItem = (pricingItem: CustomPricing, quantity: number) => {
    if (quantity < pricingItem.minimum_quantity || quantity > pricingItem.maximum_quantity) {
      toast({
        title: "Invalid Quantity",
        description: `Quantity must be between ${pricingItem.minimum_quantity} and ${pricingItem.maximum_quantity}`,
        variant: "destructive",
      });
      return;
    }

    const totalPrice = pricingItem.price_per_unit * quantity;
    const existingIndex = orderItems.findIndex(
      (item) => item.category === pricingItem.category && item.item_name === pricingItem.item_name
    );

    if (existingIndex >= 0) {
      const updatedItems = [...orderItems];
      updatedItems[existingIndex] = {
        ...updatedItems[existingIndex],
        quantity: quantity,
        total_price: totalPrice,
      };
      setOrderItems(updatedItems);
    } else {
      const newItem: OrderItem = {
        category: pricingItem.category,
        item_name: pricingItem.item_name,
        quantity: quantity,
        price_per_unit: pricingItem.price_per_unit,
        total_price: totalPrice,
        description: pricingItem.description,
      };
      setOrderItems([...orderItems, newItem]);
    }

    toast({
      title: "Item Added!",
      description: `${quantity} ${pricingItem.item_name}${quantity > 1 ? "s" : ""} added to your order`,
    });
  };

  const removeOrderItem = (index: number) => {
    const removedItem = orderItems[index];
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
    
    toast({
      title: "Item Removed",
      description: `${removedItem.item_name} removed from your order`,
    });
  };

  const getTotalPrice = () => {
    return orderItems.reduce((sum, item) => sum + item.total_price, 0);
  };

  const addToCartAndNavigate = () => {
    if (orderItems.length === 0) {
      toast({
        title: "Empty Order",
        description: "Please add at least one item to your custom order.",
        variant: "destructive",
      });
      return;
    }

    const customService = {
      id: `custom-order-${Date.now()}`,
      name: "Custom Helldivers 2 Order",
      description: `Custom order with ${orderItems.length} items: ${orderItems
        .map((item) => `${item.quantity} ${item.item_name}${item.quantity > 1 ? "s" : ""}`)
        .join(", ")}`,
      price: getTotalPrice(),
      category: "Custom Orders",
      image: "/placeholder.svg",
      features: orderItems.map(
        (item) => `${item.quantity} ${item.item_name}${item.quantity > 1 ? "s" : ""} - $${item.total_price.toFixed(2)}`
      ),
      duration: "1-7 days",
      difficulty: "Custom",
      popular: false,
      badge: "Custom",
      active: true,
      orders: 0,
      customOrderData: {
        items: orderItems,
        notes: orderNotes,
      },
    };

    addToCart({ service: customService, quantity: 1 });

    toast({
      title: "Added to Cart!",
      description: "Your custom order has been added to the cart.",
    });

    navigate("/cart");
  };

  const groupedPricing = pricing.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, CustomPricing[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold mb-2">Loading Custom Orders</h3>
          <p className="text-muted-foreground">Fetching the latest pricing information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-blue-500/10 to-purple-500/10 border-b border-border/50">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary px-8 py-4 rounded-full text-sm font-semibold mb-8 border border-primary/30 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 mr-3" />
              Professional Custom Boosting
              <div className="ml-3 flex space-x-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping delay-100"></div>
                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-ping delay-200"></div>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
                Build Your
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Perfect Order
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Create a completely personalized Helldivers 2 boosting experience with our 
              <span className="text-primary font-semibold"> dynamic pricing system</span>
            </p>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center items-center gap-8 mt-12 pt-8 border-t border-border/50">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>100% Safe & Secure</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4 text-purple-500" />
                <span>Professional Team</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">
          {/* Order Builder */}
          <div className="xl:col-span-3 space-y-12">
            {Object.entries(groupedPricing).map(([category, items]) => (
              <Card key={category} className="border-0 shadow-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm overflow-hidden">
                <div className={`h-2 bg-gradient-to-r ${getCategoryGradient(category)}`}></div>
                <CardHeader className="pb-8">
                  <div className="flex items-center space-x-6">
                    <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${getCategoryGradient(category)} p-4 text-white flex items-center justify-center shadow-lg`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-3xl font-bold mb-2">
                        {getCategoryTitle(category)}
                      </CardTitle>
                      <CardDescription className="text-lg text-muted-foreground">
                        {getCategorySubtitle(category)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className="px-4 py-2 text-sm">
                      {items.length} option{items.length > 1 ? 's' : ''} available
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid gap-6">
                    {items.map((item) => (
                      <CustomOrderItem
                        key={item.id}
                        item={item}
                        onAdd={addOrderItem}
                        currentQuantity={
                          orderItems.find(
                            (orderItem) =>
                              orderItem.category === item.category &&
                              orderItem.item_name === item.item_name
                          )?.quantity || 0
                        }
                        categoryGradient={getCategoryGradient(category)}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Enhanced Order Notes */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 p-3 text-white flex items-center justify-center">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Special Instructions</CardTitle>
                    <CardDescription className="text-base">
                      Add any specific requirements, preferences, or account details
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="• Account login details (if needed)&#10;• Preferred gaming hours&#10;• Specific mission preferences&#10;• Any other special requirements..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={6}
                    className="bg-muted/30 border-border/50 text-base"
                  />
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Info className="w-4 h-4" />
                    <span>Your information is secure and will only be used for order completion</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Order Summary */}
          <div className="xl:col-span-1">
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm sticky top-8">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-b border-border/50">
                <CardTitle className="flex items-center text-2xl">
                  <ShoppingCart className="w-6 h-6 mr-3" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {orderItems.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Calculator className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-3">Ready to Build</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Select items from the categories above to see your personalized order summary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      {orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="group flex items-center justify-between p-4 bg-gradient-to-r from-muted/40 to-muted/20 rounded-xl border border-border/30 hover:border-primary/30 transition-all"
                        >
                          <div className="flex-1">
                            <p className="font-semibold text-sm">
                              {item.quantity} {item.item_name}
                              {item.quantity > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${item.price_per_unit} × {item.quantity}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <p className="font-bold text-primary">
                              ${item.total_price.toFixed(2)}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeOrderItem(index)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-gradient-to-r from-transparent via-border to-transparent" />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-lg">
                        <span className="font-semibold">Subtotal:</span>
                        <span className="font-bold text-primary">${getTotalPrice().toFixed(2)}</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
                        <div className="flex items-center space-x-2 text-green-600 text-sm font-medium">
                          <Check className="w-4 h-4" />
                          <span>No hidden fees • Transparent pricing</span>
                        </div>
                      </div>

                      <Button
                        onClick={addToCartAndNavigate}
                        className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 h-14 text-lg font-semibold shadow-lg"
                        size="lg"
                      >
                        <ShoppingCart className="w-5 h-5 mr-3" />
                        Add to Cart
                        <ArrowRight className="w-5 h-5 ml-3" />
                      </Button>

                      <p className="text-xs text-muted-foreground text-center leading-relaxed">
                        You'll review all details before payment. 
                        <br />
                        <span className="text-primary">24/7 support</span> available for any questions.
                      </p>
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

// Enhanced Custom Order Item Component
interface CustomOrderItemProps {
  item: CustomPricing;
  onAdd: (item: CustomPricing, quantity: number) => void;
  currentQuantity: number;
  categoryGradient: string;
}

function CustomOrderItem({ item, onAdd, currentQuantity, categoryGradient }: CustomOrderItemProps) {
  const [quantity, setQuantity] = useState(currentQuantity || item.minimum_quantity);

  useEffect(() => {
    if (currentQuantity > 0) {
      setQuantity(currentQuantity);
    }
  }, [currentQuantity]);

  const adjustQuantity = (delta: number) => {
    const newQuantity = Math.max(
      item.minimum_quantity,
      Math.min(item.maximum_quantity, quantity + delta)
    );
    setQuantity(newQuantity);
  };

  const handleAdd = () => {
    onAdd(item, quantity);
  };

  const totalPrice = item.price_per_unit * quantity;

  return (
    <div className="group relative bg-gradient-to-r from-background/50 to-muted/20 rounded-2xl p-6 border border-border/30 hover:border-primary/30 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h4 className="font-semibold text-lg">{item.item_name}</h4>
            <Badge variant="outline" className={`bg-gradient-to-r ${categoryGradient} text-white border-0 px-3 py-1`}>
              ${item.price_per_unit}
            </Badge>
          </div>
          <p className="text-muted-foreground mb-4 leading-relaxed">{item.description}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="flex items-center space-x-1">
              <Info className="w-3 h-3" />
              <span>Min: {item.minimum_quantity}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Target className="w-3 h-3" />
              <span>Max: {item.maximum_quantity}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= item.minimum_quantity}
            className="h-10 w-10 p-0 hover:bg-primary/10"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => {
              const value = parseInt(e.target.value) || item.minimum_quantity;
              setQuantity(
                Math.max(item.minimum_quantity, Math.min(item.maximum_quantity, value))
              );
            }}
            className="w-24 text-center font-semibold bg-muted/30"
            min={item.minimum_quantity}
            max={item.maximum_quantity}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= item.maximum_quantity}
            className="h-10 w-10 p-0 hover:bg-primary/10"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-xl font-bold text-primary">${totalPrice.toFixed(2)}</p>
          </div>
          <Button 
            onClick={handleAdd} 
            className={`bg-gradient-to-r ${categoryGradient} hover:opacity-90 text-white border-0 px-6`}
          >
            {currentQuantity > 0 ? "Update" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}
