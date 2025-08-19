import { useState } from "react";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { PAYMENT_CONSTANTS } from "@/lib/constants";
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
  Star,
  Zap,
  Trophy,
  CheckCircle,
  Gift,
  ArrowRight,
  Package,
  Timer,
  Target,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

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
  const tax = subtotal * PAYMENT_CONSTANTS.TAX_RATE; // Sales tax
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center mb-8">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Services
              </Button>
            </Link>
          </div>

          <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardContent className="text-center py-20">
              <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-8">
                <ShoppingCart className="w-12 h-12 text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Your cart is empty
              </h2>
              <p className="text-muted-foreground mb-8 text-lg max-w-md mx-auto">
                Discover our amazing boosting services and add them to your cart to get started
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 min-w-48">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Browse Services
                </Button>
              </Link>
              
              {/* Why Choose Us Section */}
              <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-green-400" />
                  </div>
                  <h3 className="font-semibold mb-1">100% Safe</h3>
                  <p className="text-sm text-muted-foreground">Account safety guaranteed</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Clock className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Fast Delivery</h3>
                  <p className="text-sm text-muted-foreground">Quick turnaround times</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Trophy className="w-6 h-6 text-purple-400" />
                  </div>
                  <h3 className="font-semibold mb-1">Pro Team</h3>
                  <p className="text-sm text-muted-foreground">Skilled professionals</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Services
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
                <p className="text-muted-foreground text-lg">
                  {cartItems.length} item{cartItems.length !== 1 ? "s" : ""} ready for checkout
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-base px-4 py-2">
                <Shield className="w-4 h-4 mr-2 text-green-600" />
                <span className="text-green-700 dark:text-green-400">Secure Cart</span>
              </Badge>
            </div>
          </div>

          {/* Cart Stats */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-400" />
                <div>
                  <div className="text-xl font-bold text-blue-400">{cartItems.length}</div>
                  <div className="text-sm text-blue-300">Services</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <div>
                  <div className="text-xl font-bold text-green-400">${subtotal.toFixed(2)}</div>
                  <div className="text-sm text-green-300">Subtotal</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-purple-400" />
                <div>
                  <div className="text-xl font-bold text-purple-400">24h</div>
                  <div className="text-sm text-purple-300">Est. Start</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 rounded-xl border border-orange-500/20">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-orange-400" />
                <div>
                  <div className="text-xl font-bold text-orange-400">Pro</div>
                  <div className="text-sm text-orange-300">Team</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCart className="w-5 h-5 text-white" />
                  </div>
                  Cart Items
                  <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                    {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {cartItems.map((item, index) => (
                    <div key={item.service.id}>
                      <div className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all duration-200">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                          <Zap className="w-8 h-8 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-lg text-foreground mb-2">
                            {item.service.title}
                          </h3>
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.service.duration}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30">
                              <Star className="w-3 h-3 mr-1" />
                              {item.service.difficulty}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30">
                              <Trophy className="w-3 h-3 mr-1" />
                              Premium
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.service.id, -1)
                            }
                            disabled={item.quantity <= 1}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <div className="w-12 h-8 bg-muted rounded-lg flex items-center justify-center">
                            <span className="font-semibold text-sm">
                              {item.quantity}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleUpdateQuantity(item.service.id, 1)
                            }
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-xl text-primary">
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
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 w-8 h-8 p-0"
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

          {/* Enhanced Order Summary */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-base">Subtotal</span>
                    <span className="font-semibold text-lg">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  <Button className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg" asChild>
                    <Link href="/checkout">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  </Button>

                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Secure checkout with PayPal • SSL encrypted
                    </p>
                  </div>
                </div>

                {/* Promo hint */}
                <div className="pt-4 border-t border-border/50">
                  <div className="p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-lg border border-yellow-500/20">
                    <div className="flex items-center space-x-2">
                      <Gift className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm font-medium text-yellow-300">
                        Have a promo code? Apply it at checkout!
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Features */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-200">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  Security & Trust
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium">PayPal Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                    <Trophy className="w-5 h-5 text-purple-600" />
                    <span className="text-sm font-medium">Account Safety Guaranteed</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-center space-x-2 text-xs text-green-700 dark:text-green-300">
                    <Star className="w-4 h-4" />
                    <span className="font-medium">Trusted by 10,000+ customers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Shopping */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <Link href="/">
                  <Button variant="outline" className="w-full h-12 text-base">
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Why Choose Us */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-blue-800 dark:text-blue-200">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  Why Choose Us?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
                    <Clock className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-sm font-medium">24/7 Progress Updates</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Professional Team</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-full flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium">Guaranteed Results</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
