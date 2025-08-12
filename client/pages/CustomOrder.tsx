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
  ShoppingCart,
  Coins,
  Check,
  ArrowRight,
  Info,
  X,
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
        return <Trophy className="w-5 h-5" />;
      case "levels":
        return <TrendingUp className="w-5 h-5" />;
      case "samples":
        return <Zap className="w-5 h-5" />;
      case "super_credits":
        return <Coins className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "medals":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "levels":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "samples":
        return "text-green-600 bg-green-50 border-green-200";
      case "super_credits":
        return "text-purple-600 bg-purple-50 border-purple-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
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

    toast({
      title: "Item Updated",
      description: `${quantity} ${pricingItem.item_name}${quantity > 1 ? "s" : ""} added to your order`,
    });
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pricing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              Build Your <span className="text-primary">Custom Order</span>
            </h1>
            <p className="text-muted-foreground">
              Choose exactly what you need for your Helldivers 2 progression
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Builder */}
          <div className="lg:col-span-2 space-y-6">
            {Object.entries(groupedPricing).map(([category, items]) => (
              <Card key={category} className="border border-border">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-lg ${getCategoryColor(category)} flex items-center justify-center`}>
                      {getCategoryIcon(category)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{getCategoryTitle(category)}</CardTitle>
                      <CardDescription className="text-sm">
                        ${items[0]?.price_per_unit} per {items[0]?.item_name.toLowerCase()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Special Instructions</CardTitle>
                <CardDescription>
                  Add any specific requirements or account details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Enter any special instructions, account details, preferred gaming hours, etc..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {orderItems.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground text-sm">
                      Add items to see your order summary
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
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
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="font-semibold">Total:</span>
                      <span className="text-xl font-bold text-primary">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      onClick={addToCartAndNavigate}
                      className="w-full"
                      size="lg"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>

                    <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>Review before payment</span>
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

// Compact Custom Order Item Component
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
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium">{item.item_name}</h4>
            <Badge variant="outline" className="text-xs">
              ${item.price_per_unit}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{item.description}</p>
        </div>
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
            className="w-16 text-center text-sm"
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
            <p className="text-sm font-bold text-primary">${totalPrice.toFixed(2)}</p>
          </div>
          <Button onClick={handleAdd} size="sm">
            {currentQuantity > 0 ? "Update" : "Add"}
          </Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground mt-2 flex items-center space-x-4">
        <span>Min: {item.minimum_quantity}</span>
        <span>Max: {item.maximum_quantity}</span>
      </div>
    </div>
  );
}
