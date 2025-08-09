import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  CreditCard,
  Shield,
  Clock,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal } = useCart();

  const handleUpdateQuantity = (serviceId: string, change: number) => {
    const currentItem = cartItems.find((item) => item.service.id === serviceId);
    if (currentItem) {
      updateQuantity(serviceId, Math.max(1, currentItem.quantity + change));
    }
  };

  const handleRemoveItem = (serviceId: string) => {
    removeFromCart(serviceId);
  };

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Services
              </Button>
            </Link>
          </div>

          <Card>
            <CardContent className="text-center py-16">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h2 className="text-2xl font-semibold mb-2">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-6">
                Add some boosting services to get started
              </p>
              <Link to="/">
                <Button>Browse Services</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Services
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Shopping Cart ({cartItems.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                          <ShoppingCart className="w-6 h-6 text-muted-foreground" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground">
                            {item.service.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.service.duration}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.service.difficulty}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.service.id, -1)
                            }
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.service.id, 1)
                            }
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-medium">
                            ${(item.service.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.service.price} each
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(item.service.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      {index < cartItems.length - 1 && (
                        <Separator className="mt-6" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>

                <div className="space-y-3 pt-4">
                  <Button className="w-full" size="lg" asChild>
                    <Link to="/checkout">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Proceed to Checkout
                    </Link>
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Secure checkout with PayPal
                    </p>
                  </div>
                </div>

                {/* Security Features */}
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 mr-2 text-green-500" />
                      100% Secure Payment
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="w-4 h-4 mr-2 text-blue-500" />
                      24/7 Progress Updates
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 mr-2 text-yellow-500" />
                      Account Safety Guaranteed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
