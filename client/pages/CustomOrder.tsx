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
          // Use default pricing if database fails
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
        return <Trophy className="w-6 h-6" />;
      case "levels":
        return <TrendingUp className="w-6 h-6" />;
      case "samples":
        return <Zap className="w-6 h-6" />;
      case "super_credits":
        return <Coins className="w-6 h-6" />;
      default:
        return <Star className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "medals":
        return "from-yellow-500 to-orange-500";
      case "levels":
        return "from-blue-500 to-purple-500";
      case "samples":
        return "from-green-500 to-teal-500";
      case "super_credits":
        return "from-purple-500 to-pink-500";
      default:
        return "from-gray-500 to-slate-500";
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
  };

  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
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

    // Create a custom service object for the cart
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading custom order options...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center bg-primary/10 text-primary px-6 py-3 rounded-full text-sm font-medium mb-6 border border-primary/20">
              <Calculator className="w-4 h-4 mr-2" />
              Custom Order Builder
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Build Your Custom Order
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Create a personalized Helldivers 2 boosting package tailored to your exact needs
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Builder */}
          <div className="lg:col-span-2 space-y-8">
            {Object.entries(groupedPricing).map(([category, items]) => (
              <Card key={category} className="border border-border/50">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getCategoryColor(category)} p-2 text-white flex items-center justify-center`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{getCategoryTitle(category)}</CardTitle>
                      <CardDescription>
                        Choose the quantity you need
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
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
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            {/* Order Notes */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="w-5 h-5 mr-2" />
                  Special Instructions
                </CardTitle>
                <CardDescription>
                  Any specific requirements or preferences for your order
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any special instructions, account details, preferred gaming hours, etc..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={4}
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border border-border/50 sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <Calculator className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">
                      Add items to see your order summary
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {orderItems.map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {item.quantity} {item.item_name}
                              {item.quantity > 1 ? "s" : ""}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${item.price_per_unit} each
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-primary">
                              ${item.total_price.toFixed(2)}
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeOrderItem(index)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">${getTotalPrice().toFixed(2)}</span>
                    </div>

                    <Button
                      onClick={addToCartAndNavigate}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                      size="lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      You'll be able to review your order before payment
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component for individual custom order items
interface CustomOrderItemProps {
  item: CustomPricing;
  onAdd: (item: CustomPricing, quantity: number) => void;
  currentQuantity: number;
}

function CustomOrderItem({ item, onAdd, currentQuantity }: CustomOrderItemProps) {
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
    <div className="border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="font-medium">{item.item_name}</h4>
          <p className="text-sm text-muted-foreground">{item.description}</p>
          <p className="text-xs text-muted-foreground mt-1">
            ${item.price_per_unit} per {item.item_name.toLowerCase()}
          </p>
        </div>
        <Badge variant="outline" className="bg-primary/10">
          ${item.price_per_unit}
        </Badge>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(-1)}
            disabled={quantity <= item.minimum_quantity}
            className="h-8 w-8 p-0"
          >
            <Minus className="w-3 h-3" />
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
            className="w-20 text-center"
            min={item.minimum_quantity}
            max={item.maximum_quantity}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => adjustQuantity(1)}
            disabled={quantity >= item.maximum_quantity}
            className="h-8 w-8 p-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="font-bold text-primary">${totalPrice.toFixed(2)}</p>
          </div>
          <Button onClick={handleAdd} size="sm">
            {currentQuantity > 0 ? "Update" : "Add"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-2">
        Min: {item.minimum_quantity} • Max: {item.maximum_quantity}
      </div>
    </div>
  );
}
