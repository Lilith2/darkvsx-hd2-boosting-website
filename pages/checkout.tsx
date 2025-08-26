import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { motion } from "framer-motion";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_CONSTANTS } from "@/lib/constants";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  ShoppingCart,
  CreditCard,
  Shield,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Loader2,
  Package,
  Clock,
  Star,
  Trophy,
  Trash2,
  Plus,
  Minus,
} from "lucide-react";
import Link from "next/link";
import { SimplePaymentForm } from "../src/components/checkout/SimplePaymentForm";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

// Types
interface ValidationResponse {
  valid: boolean;
  error?: string;
  type?: "promo" | "referral";
  discount_type?: "percentage" | "fixed";
  discount_value?: number;
}

interface PaymentMetadata {
  orderId: string;
  userEmail: string;
  userName: string;
}

export default function CheckoutPage() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeStatus, setPromoCodeStatus] = useState<
    "idle" | "loading" | "applied" | "error"
  >("idle");

  // Calculations
  const subtotal = getCartTotal();
  const tax = (subtotal - promoDiscount) * PAYMENT_CONSTANTS.TAX_RATE;
  const total = Math.max(0, subtotal - promoDiscount + tax);

  // Authentication redirect
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to complete your checkout.",
        variant: "destructive",
      });
      router.push("/login?redirect=/checkout");
    }
  }, [isAuthenticated, router, toast]);

  // Empty cart redirect
  useEffect(() => {
    if (cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some services to your cart before checkout.",
        variant: "destructive",
      });
      router.push("/bundles");
    }
  }, [cartItems.length, router, toast]);

  // Clean cart items - remove any with invalid data
  const cleanedCartItems = useMemo(() => {
    return cartItems.filter(
      (item) =>
        item.service &&
        item.service.id &&
        item.service.title &&
        typeof item.service.price === "number" &&
        item.quantity > 0,
    );
  }, [cartItems]);

  // Payment metadata
  const paymentMetadata: PaymentMetadata = useMemo(
    () => ({
      orderId: `order_${Date.now()}`,
      userEmail: user?.email || "",
      userName: user?.username || "",
    }),
    [user?.email, user?.username],
  );

  // Validate promo code
  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoDiscount(0);
      setPromoCodeStatus("idle");
      return;
    }

    setPromoCodeStatus("loading");

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      const { data, error } = await supabase.rpc("validate_referral_code", {
        code: code.trim(),
        user_id: user?.id || null,
      });

      if (error) {
        console.error("Error validating promo code:", error);
        setPromoCodeStatus("error");
        toast({
          title: "Error",
          description: "Could not validate promo code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const validation = data as unknown as ValidationResponse;

      if (!validation || !validation.valid) {
        setPromoCodeStatus("error");
        toast({
          title: "Invalid promo code",
          description: validation?.error || "Please enter a valid promo code.",
          variant: "destructive",
        });
        setPromoDiscount(0);
        return;
      }

      // Calculate discount
      let discountAmount = 0;
      if (validation.type === "promo") {
        if (validation.discount_type === "percentage") {
          discountAmount = subtotal * (validation.discount_value! / 100);
        } else {
          discountAmount = Math.min(validation.discount_value!, subtotal);
        }
      } else {
        // Referral code - 15% discount
        discountAmount = subtotal * 0.15;
      }

      setPromoDiscount(discountAmount);
      setPromoCodeStatus("applied");
      toast({
        title: "Promo code applied!",
        description: `You saved $${discountAmount.toFixed(2)} with the promo code.`,
      });
    } catch (err) {
      console.error("Unexpected error validating promo code:", err);
      setPromoCodeStatus("error");
      toast({
        title: "Error",
        description: "Could not validate promo code. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent: any) => {
    setIsProcessing(true);

    try {
      // Call secure server endpoint to verify payment and create order
      const orderData = {
        userId: user?.id || null,
        customerEmail: user?.email || "",
        customerName: user?.username || "",
        services: cleanedCartItems.map((item) => ({
          id: item.service.id,
          name: item.service.title,
          price: item.service.price,
          quantity: item.quantity,
        })),
        notes: orderNotes,
        referralCode: promoCode || undefined,
        referralDiscount: promoDiscount || undefined,
      };

      const response = await fetch("/api/orders/verify-and-create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          orderData: orderData,
        }),
      });

      let result;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server");
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error(
          "Failed to parse order verification response:",
          parseError,
        );
        throw new Error(
          "Invalid response from order server. Please contact support with your payment ID: " +
            paymentIntent.id,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Server verification failed",
        );
      }

      toast({
        title: "Payment successful!",
        description: `Your order has been confirmed. Payment ID: ${paymentIntent.id}`,
      });

      // Clear cart and redirect
      clearCart();

      if (result.orderId) {
        router.push(
          `/order-confirmation?orderId=${result.orderId}&sendEmail=true&paymentId=${paymentIntent.id}`,
        );
      } else {
        router.push("/account");
      }
    } catch (error: any) {
      console.error("Error processing order:", error);

      let errorMessage = "Unknown error";
      if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Order processing failed",
        description: errorMessage.includes("Payment")
          ? errorMessage
          : `We couldn't process your order: ${errorMessage}. Please contact support.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  // Cart management
  const handleUpdateQuantity = (serviceId: string, change: number) => {
    const currentItem = cleanedCartItems.find(
      (item) => item.service.id === serviceId,
    );
    if (currentItem) {
      const newQuantity = Math.max(1, currentItem.quantity + change);
      updateQuantity(serviceId, newQuantity);
    }
  };

  const handleRemoveItem = (serviceId: string) => {
    removeFromCart(serviceId);
    toast({
      title: "Item removed",
      description: "The service has been removed from your cart.",
    });
  };

  // Validation
  const canProceedToPayment = () => {
    return cleanedCartItems.length > 0 && agreeToTerms && total >= 0.5;
  };

  if (cleanedCartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Add some amazing boosting services to your cart before proceeding
              to checkout.
            </p>
            <Button
              asChild
              size="lg"
              className="min-w-48 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              <Link href="/bundles">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Browse Services
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/bundles"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Services
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Secure Checkout
                </h1>
                <p className="text-muted-foreground">
                  Complete your order with Stripe
                </p>
              </div>
            </div>
            <Badge
              variant="outline"
              className="bg-green-500/10 border-green-500/30"
            >
              <Shield className="w-3 h-3 mr-1 text-green-400" />
              <span className="text-green-300 text-xs">Stripe Secured</span>
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Cart & Details */}
          <div className="space-y-6">
            {/* Cart Items */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-2xl">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mr-4">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  Your Order
                  <Badge
                    variant="secondary"
                    className="ml-auto bg-primary/10 text-primary"
                  >
                    {cleanedCartItems.length} item
                    {cleanedCartItems.length !== 1 ? "s" : ""}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cleanedCartItems.map((item) => (
                  <div
                    key={item.service.id}
                    className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10"
                  >
                    <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-lg">
                        {item.service.title}
                      </h4>
                      <div className="flex items-center space-x-3 mt-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="w-3 h-3 mr-1" />
                          Professional
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      </div>
                    </div>

                    {/* Quantity Controls */}
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
                        onClick={() => handleUpdateQuantity(item.service.id, 1)}
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
                ))}
              </CardContent>
            </Card>

            {/* Order Notes */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">
                  Order Notes (Optional)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Include your Discord username, preferred gaming hours, or any specific requirements..."
                  rows={3}
                  className="resize-none border-border/50 focus:border-primary/50 bg-background/50"
                />
              </CardContent>
            </Card>

            {/* Promo Code */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Promo Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-3">
                  <div className="flex-1 relative">
                    <Input
                      value={promoCode}
                      onChange={(e) =>
                        setPromoCode(e.target.value.toUpperCase())
                      }
                      placeholder="Enter promo code"
                      className="h-12 pr-10 border-border/50 focus:border-primary/50 text-base"
                      disabled={promoCodeStatus === "loading"}
                    />
                    {promoCodeStatus === "applied" && (
                      <CheckCircle className="w-5 h-5 text-green-600 absolute right-3 top-3.5" />
                    )}
                  </div>
                  <Button
                    onClick={() => validatePromoCode(promoCode)}
                    disabled={
                      !promoCode.trim() || promoCodeStatus === "loading"
                    }
                    className="h-12 px-6"
                  >
                    {promoCodeStatus === "loading" ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
                {promoDiscount > 0 && (
                  <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                      Promo code applied! You saved ${promoDiscount.toFixed(2)}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Terms Agreement */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-4">
                  <Checkbox
                    id="terms"
                    checked={agreeToTerms}
                    onCheckedChange={(checked) =>
                      setAgreeToTerms(checked as boolean)
                    }
                    className="mt-1 w-5 h-5"
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="terms"
                      className="text-base leading-7 cursor-pointer"
                    >
                      I agree to the{" "}
                      <Link
                        href="/terms"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        target="_blank"
                        className="text-primary hover:underline"
                      >
                        Privacy Policy
                      </Link>
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Payment & Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <Package className="w-6 h-6 mr-3" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base">Subtotal</span>
                    <span className="font-semibold text-lg">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  {promoDiscount > 0 && (
                    <div className="flex justify-between items-center text-green-600">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Promo Discount
                      </span>
                      <span className="font-semibold">
                        -${promoDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Tax (8%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Form */}
            {canProceedToPayment() && (
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-2xl">
                    <CreditCard className="w-6 h-6 mr-3" />
                    Complete Payment
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Secure payment with Stripe
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Elements
                    stripe={stripePromise}
                    options={{
                      mode: "payment",
                      amount: Math.round(total * 100),
                      currency: "usd",
                      appearance: {
                        theme: "stripe",
                        variables: {
                          colorPrimary: "hsl(213, 93%, 68%)",
                          colorBackground: "hsl(var(--background))",
                          colorText: "hsl(var(--foreground))",
                          colorDanger: "hsl(var(--destructive))",
                          fontFamily: "Inter, system-ui, sans-serif",
                          spacingUnit: "6px",
                          borderRadius: "12px",
                        },
                      },
                    }}
                  >
                    <SimplePaymentForm
                      total={total}
                      cartItems={cleanedCartItems}
                      referralCode={promoCode}
                      referralDiscount={promoDiscount}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      isProcessing={isProcessing}
                      metadata={paymentMetadata}
                    />
                  </Elements>
                </CardContent>
              </Card>
            )}

            {/* Terms Requirement Alert */}
            {!agreeToTerms && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Please agree to the Terms of Service and Privacy Policy to
                  proceed with payment.
                </AlertDescription>
              </Alert>
            )}

            {/* Minimum Amount Alert */}
            {total < 0.5 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Minimum payment amount is $0.50. Please add more items to your
                  cart.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
