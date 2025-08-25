import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/router";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useAuth } from "@/hooks/useAuth";
import { useReferrals } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { PAYMENT_CONSTANTS } from "@/lib/constants";
import { REFERRAL_CONFIG } from "@/lib/config";
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
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingCart,
  User,
  Mail,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Package,
  DollarSign,
  Sparkles,
  Clock,
  Star,
  Gift,
  Zap,
  ExternalLink,
  AlertTriangle,
  Plus,
  Minus,
  Trash2,
  Trophy,
  FileText,
  Percent,
  Play,
} from "lucide-react";
import Link from "next/link";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";

type CheckoutStep = "cart" | "terms" | "discounts" | "payment";

const STEPS = [
  { id: "cart", title: "Review Cart", icon: ShoppingCart },
  { id: "terms", title: "Terms & Policy", icon: FileText },
  { id: "discounts", title: "Discounts & Credits", icon: Percent },
  { id: "payment", title: "Payment", icon: CreditCard },
] as const;

export default function AnimatedCheckout() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } =
    useCart();
  const { addOrder } = useOrders();
  const { createOrder: createCustomOrder } = useCustomOrders();
  const { user, isAuthenticated } = useAuth();
  const { getUserCredits, useCredits } = useReferrals();
  const { toast } = useToast();
  const router = useRouter();

  // Step management
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("cart");
  const [completedSteps, setCompletedSteps] = useState<Set<CheckoutStep>>(
    new Set(),
  );

  // Form state
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [useAvailableCredits, setUseAvailableCredits] = useState(false);
  const [creditsApplied, setCreditsApplied] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [promoCodeStatus, setPromoCodeStatus] = useState<
    "idle" | "loading" | "applied" | "error"
  >("idle");

  // Redirect if not authenticated
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

  const subtotal = getCartTotal();
  const discount = promoDiscount;
  const tax = (subtotal - discount) * PAYMENT_CONSTANTS.TAX_RATE;
  const subtotalAfterTax = subtotal - discount + tax;
  const total = Math.max(0, subtotalAfterTax - creditsApplied);

  // Fetch user's available credits
  useEffect(() => {
    const fetchCredits = async () => {
      if (!user?.id) {
        setAvailableCredits(0);
        return;
      }

      try {
        const balance = await getUserCredits();
        setAvailableCredits(balance);
      } catch (err: any) {
        console.error("Error fetching credits:", err?.message || err);
        setAvailableCredits(0);
      }
    };

    fetchCredits();
  }, [user?.id, getUserCredits]);

  // Step progression helpers
  const getCurrentStepIndex = () => {
    const index = STEPS.findIndex((step) => step.id === currentStep);
    return index >= 0 ? index : 0;
  };
  const getProgress = () => ((getCurrentStepIndex() + 1) / STEPS.length) * 100;

  // Memoize metadata to prevent unnecessary re-renders of StripePaymentForm
  const paymentMetadata = useMemo(() => ({
    orderId: `order_${Date.now()}`,
    userEmail: user?.email || "",
    userName: user?.username || "",
  }), [user?.email, user?.username]);

  const canProceedFromStep = (step: CheckoutStep): boolean => {
    switch (step) {
      case "cart":
        return cartItems.length > 0;
      case "terms":
        return agreeToTerms;
      case "discounts":
        return true; // Always can proceed from discounts
      case "payment":
        return false; // Can't proceed beyond payment
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!canProceedFromStep(currentStep)) return;

    const currentIndex = getCurrentStepIndex();
    if (currentIndex < STEPS.length - 1) {
      const newCompleted = new Set(completedSteps);
      newCompleted.add(currentStep);
      setCompletedSteps(newCompleted);
      const nextStep = STEPS[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep.id as CheckoutStep);
      }
    }
  };

  const prevStep = () => {
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      const prevStepItem = STEPS[currentIndex - 1];
      if (prevStepItem) {
        setCurrentStep(prevStepItem.id as CheckoutStep);
      }
    }
  };

  const goToStep = (step: CheckoutStep) => {
    const stepIndex = STEPS.findIndex((s) => s.id === step);
    const currentIndex = getCurrentStepIndex();

    // Can only go backward or to completed steps
    if (stepIndex <= currentIndex || completedSteps.has(step)) {
      setCurrentStep(step);
    }
  };

  // Cart management
  const handleUpdateQuantity = (serviceId: string, change: number) => {
    const currentItem = cartItems.find((item) => item.service.id === serviceId);
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

  // Promo code validation
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

      const validation = data;

      if (!validation.valid) {
        setPromoCodeStatus("error");
        toast({
          title: "Invalid promo code",
          description: validation.error || "Please enter a valid promo code.",
          variant: "destructive",
        });
        setPromoDiscount(0);
        return;
      }

      const discountAmount = subtotal * REFERRAL_CONFIG.customerDiscount;
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

  const handleCreditsToggle = (checked: boolean) => {
    setUseAvailableCredits(checked);
    if (checked && availableCredits > 0) {
      const maxApplicable =
        subtotal -
        promoDiscount +
        (subtotal - promoDiscount) * PAYMENT_CONSTANTS.TAX_RATE;
      const creditsToApply = Math.min(availableCredits, maxApplicable);
      setCreditsApplied(creditsToApply);

      toast({
        title: "Credits applied!",
        description: `You saved $${creditsToApply.toFixed(2)} using your credits.`,
      });
    } else {
      setCreditsApplied(0);
    }
  };

  // Secure order processing with server-side verification
  const processOrder = async (paymentIntent?: any) => {
    setIsProcessing(true);

    try {
      // For credit-only payments, still use credits first
      if (useAvailableCredits && creditsApplied > 0) {
        const success = await useCredits(creditsApplied);
        if (!success) {
          throw new Error("Failed to use credits");
        }
      }

      // For payments with PaymentIntent (Stripe), use secure server-side verification
      if (paymentIntent?.id) {
        const orderData = await prepareOrderData();

        // Call secure server endpoint to verify payment and create order
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

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.details ||
              errorData.error ||
              "Server verification failed",
          );
        }

        const result = await response.json();

        toast({
          title: "Payment successful!",
          description: `Your order has been confirmed. Payment ID: ${paymentIntent.id}`,
        });

        // Redirect to order confirmation
        if (result.orderId) {
          router.push(
            `/order-confirmation?orderId=${result.orderId}&sendEmail=true&paymentId=${paymentIntent.id}`,
          );
        } else if (result.customOrderId) {
          router.push(
            `/order-confirmation?orderId=${result.customOrderId}&type=custom&sendEmail=true&paymentId=${paymentIntent.id}`,
          );
        } else {
          router.push("/account");
        }
      } else {
        // For credit-only payments, create order directly (already verified credits above)
        const orderData = await prepareOrderData();
        await createOrderDirectly(orderData);

        toast({
          title: "Order confirmed!",
          description: "Your order has been confirmed. Paid with credits.",
        });

        router.push("/account");
      }

      setTimeout(() => {
        clearCart();
      }, 100);
    } catch (error: any) {
      console.error("Error processing order:", error);

      let errorMessage = "Unknown error";
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (error?.code) {
        errorMessage = `Database error (${error.code}): ${error.message || "Unknown error"}`;
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

  // Helper function to prepare order data
  const prepareOrderData = async () => {
    const customOrderItems = cartItems.filter(
      (item) => item.service.customOrderData,
    );
    const regularOrderItems = cartItems.filter(
      (item) => !item.service.customOrderData,
    );

    const orderData: any = {
      userId: user?.id || null,
      customerEmail: user?.email || "",
      customerName: user?.username || "",
      services: regularOrderItems.map((item) => ({
        id: item.service.id,
        name: item.service.title,
        price: item.service.price,
        quantity: item.quantity,
      })),
      notes: orderNotes,
      referralCode: promoCode || undefined,
      referralDiscount: promoDiscount || undefined,
      referralCreditsUsed: creditsApplied || undefined,
    };

    // Add custom order data if present
    if (customOrderItems.length > 0) {
      const customOrderData = customOrderItems[0]?.service.customOrderData;
      if (customOrderData) {
        orderData.customOrderData = {
          items: customOrderData.items.map((item: any) => ({
            category: item.category,
            item_name: item.item_name,
            quantity: item.quantity,
            price_per_unit: item.price_per_unit,
            total_price: item.total_price,
            description: item.description,
          })),
          special_instructions:
            customOrderData.special_instructions || orderNotes,
          customer_discord: customOrderData.customer_discord,
        };
      }
    }

    return orderData;
  };

  // Fallback for credit-only orders (maintains existing functionality)
  const createOrderDirectly = async (orderData: any, paymentIntent?: any) => {
    const customOrderItems = cartItems.filter(
      (item) => item.service.customOrderData,
    );
    const regularOrderItems = cartItems.filter(
      (item) => !item.service.customOrderData,
    );

    if (regularOrderItems.length > 0) {
      await addOrder({
        userId: orderData.userId,
        customerEmail: orderData.customerEmail,
        customerName: orderData.customerName,
        services: orderData.services,
        status: "pending",
        totalAmount: regularOrderItems.reduce(
          (sum, item) => sum + item.service.price * item.quantity,
          0,
        ),
        paymentStatus: "paid",
        notes: orderData.notes,
        transactionId: `credits-${Date.now()}`,
        referralCode: orderData.referralCode,
        referralDiscount: orderData.referralDiscount,
        referralCreditsUsed: orderData.referralCreditsUsed,
      });
    }

    if (customOrderItems.length > 0 && orderData.customOrderData) {
      await createCustomOrder({
        items: orderData.customOrderData.items,
        special_instructions: orderData.customOrderData.special_instructions,
        customer_email: orderData.customerEmail,
        customer_name: orderData.customerName,
        customer_discord: orderData.customOrderData.customer_discord,
        userId: orderData.userId,
        referralCode: orderData.referralCode,
        referralDiscount: orderData.referralDiscount,
        paymentIntentId: paymentIntent?.id || `credits-${Date.now()}`, // Pass payment info
      });
    }
  };

  const handleStripePaymentSuccess = useCallback(async (paymentIntent: any) => {
    console.log("Stripe payment successful:", paymentIntent);
    await processOrder(paymentIntent);
  }, []);

  const handleCreditOnlyPayment = useCallback(async () => {
    console.log("Processing credit-only payment");
    await processOrder();
  }, []);

  const handleStripePaymentError = useCallback((error: string) => {
    console.error("Stripe payment error:", error);
    toast({
      title: "Payment failed",
      description: `There was an error processing your payment: ${error}`,
      variant: "destructive",
    });
  }, [toast]);

  if (cartItems.length === 0) {
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
              <Link href="/">
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

  // Animation variants
  const stepVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      scale: 0.95,
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
    exit: {
      opacity: 0,
      x: -50,
      scale: 0.95,
      transition: {
        duration: 0.3,
        ease: "easeIn" as const,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Services
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                  Animated Checkout
                </h1>
                <p className="text-muted-foreground">
                  Step-by-step checkout experience
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
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
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = completedSteps.has(step.id);
              const canAccess = index <= getCurrentStepIndex() || isCompleted;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() =>
                      canAccess ? goToStep(step.id as CheckoutStep) : undefined
                    }
                    disabled={!canAccess}
                    className={`flex items-center space-x-2 p-3 rounded-xl transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-lg scale-105"
                        : isCompleted
                          ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 cursor-pointer"
                          : canAccess
                            ? "bg-muted/50 hover:bg-muted cursor-pointer"
                            : "bg-muted/20 text-muted-foreground cursor-not-allowed"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isActive
                          ? "bg-white/20"
                          : isCompleted
                            ? "bg-green-500/20"
                            : "bg-background/50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className="font-medium text-sm hidden sm:block">
                      {step.title}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-8 mx-2 rounded-full ${
                        completedSteps.has(step.id)
                          ? "bg-green-500"
                          : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                variants={stepVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="space-y-6"
              >
                {/* Step 1: Cart Review */}
                {currentStep === "cart" && (
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center mr-4">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        Review Your Cart
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-primary/10 text-primary"
                        >
                          {cartItems.length} item
                          {cartItems.length !== 1 ? "s" : ""}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Manage quantities and review your selected boosting
                        services
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all duration-200"
                        >
                          <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                            <Zap className="w-8 h-8 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-lg">
                              {item.service.title}
                            </h4>
                            <div className="flex items-center space-x-3 mt-2">
                              <Badge
                                variant="outline"
                                className="text-xs bg-blue-500/10 border-blue-500/30"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {item.service.duration}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-purple-500/10 border-purple-500/30"
                              >
                                <Star className="w-3 h-3 mr-1" />
                                {item.service.difficulty}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-500/10 border-green-500/30"
                              >
                                <Trophy className="w-3 h-3 mr-1" />
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
                      ))}

                      {/* Order Notes */}
                      <div className="pt-6 border-t border-border/50">
                        <Label
                          htmlFor="order-notes"
                          className="text-base font-medium mb-3 block"
                        >
                          Order Notes (Optional)
                        </Label>
                        <Textarea
                          id="order-notes"
                          value={orderNotes}
                          onChange={(e) => setOrderNotes(e.target.value)}
                          placeholder="Include your Discord username, preferred gaming hours, or any specific requirements..."
                          rows={3}
                          className="resize-none border-border/50 focus:border-primary/50 bg-background/50"
                        />
                        <p className="text-sm text-muted-foreground mt-2">
                          💡 <strong>Tip:</strong> Include your Discord username
                          and preferred hours for better service
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Terms & Policy */}
                {currentStep === "terms" && (
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        Terms & Privacy Policy
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Please review and accept our terms to continue
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-6 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20">
                        <div className="flex items-center space-x-3 mb-4">
                          <Mail className="w-6 h-6 text-primary" />
                          <div>
                            <p className="font-semibold text-lg">
                              {user?.email}
                            </p>
                            <p className="text-muted-foreground">
                              Order confirmations and updates will be sent here
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="p-6 border border-border/50 rounded-xl bg-muted/20">
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
                                className="text-primary hover:underline inline-flex items-center"
                              >
                                Terms of Service
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Link>{" "}
                              and{" "}
                              <Link
                                href="/privacy"
                                target="_blank"
                                className="text-primary hover:underline inline-flex items-center"
                              >
                                Privacy Policy
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Link>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-2">
                              By continuing, you acknowledge that you've read
                              and understood our policies.
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Discounts & Credits */}
                {currentStep === "discounts" && (
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                          <Percent className="w-6 h-6 text-white" />
                        </div>
                        Discounts & Credits
                      </CardTitle>
                      <CardDescription className="text-lg">
                        Apply promo codes and use available credits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Promo Code */}
                      <div className="space-y-4">
                        <Label
                          htmlFor="promo-code"
                          className="text-lg font-medium"
                        >
                          Promo Code
                        </Label>
                        <div className="flex space-x-3">
                          <div className="flex-1 relative">
                            <Input
                              id="promo-code"
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
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>
                        {promoDiscount > 0 && (
                          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-green-400">
                                  Promo code applied!
                                </p>
                                <p className="text-sm text-green-300">
                                  You saved ${promoDiscount.toFixed(2)} with
                                  this promo code
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Credits */}
                      {availableCredits > 0 && (
                        <div className="space-y-4 pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center text-lg font-medium">
                              <DollarSign className="w-5 h-5 mr-2 text-primary" />
                              Available Credits
                            </Label>
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1">
                              ${availableCredits.toFixed(2)}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-3 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10">
                            <Checkbox
                              id="use-credits"
                              checked={useAvailableCredits}
                              onCheckedChange={handleCreditsToggle}
                              className="w-5 h-5"
                            />
                            <Label
                              htmlFor="use-credits"
                              className="flex-1 cursor-pointer text-base"
                            >
                              Use $
                              {Math.min(
                                availableCredits,
                                subtotalAfterTax,
                              ).toFixed(2)}{" "}
                              of your available credits
                            </Label>
                          </div>
                          {creditsApplied > 0 && (
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold text-blue-800 dark:text-blue-200">
                                    Credits applied!
                                  </p>
                                  <p className="text-sm text-blue-700 dark:text-blue-300">
                                    You're using ${creditsApplied.toFixed(2)}{" "}
                                    from your credit balance
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Payment */}
                {currentStep === "payment" && (
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-2xl">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        Complete Payment
                      </CardTitle>
                      <CardDescription className="text-lg">
                        {total <= 0
                          ? "Your order is covered by credits!"
                          : "Secure payment with Stripe"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {total <= 0 ? (
                        <div className="text-center py-8">
                          <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Gift className="w-10 h-10 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold mb-2">
                            Free Order!
                          </h3>
                          <p className="text-muted-foreground mb-6">
                            Your credits cover the entire order amount
                          </p>
                          <Button
                            onClick={handleCreditOnlyPayment}
                            disabled={isProcessing}
                            size="lg"
                            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                Processing Order...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-5 h-5 mr-2" />
                                Complete Order - Free!
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
                            <div className="flex items-center space-x-3">
                              <Shield className="w-6 h-6 text-purple-400" />
                              <div>
                                <p className="font-semibold text-purple-300">
                                  Secure Payment
                                </p>
                                <p className="text-sm text-purple-200">
                                  Your payment is protected by Stripe's advanced
                                  security
                                </p>
                              </div>
                            </div>
                          </div>
                          <StripePaymentForm
                            total={total}
                            cartItems={cartItems}
                            referralDiscount={promoDiscount}
                            creditsUsed={creditsApplied}
                            onPaymentSuccess={handleStripePaymentSuccess}
                            onPaymentError={handleStripePaymentError}
                            isProcessing={isProcessing}
                            disabled={false}
                            metadata={paymentMetadata}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={getCurrentStepIndex() === 0}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              {currentStep !== "payment" && (
                <Button
                  onClick={nextStep}
                  disabled={!canProceedFromStep(currentStep)}
                  className="flex items-center bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  {currentStep === "cart" && "Continue to Terms"}
                  {currentStep === "terms" && "Continue to Discounts"}
                  {currentStep === "discounts" && "Continue to Payment"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="space-y-6">
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm sticky top-6">
              <CardHeader>
                <CardTitle className="flex items-center text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
                    <Package className="w-4 h-4 text-white" />
                  </div>
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
                        <Sparkles className="w-4 h-4 mr-1" />
                        Promo Discount
                      </span>
                      <span className="font-semibold">
                        -${promoDiscount.toFixed(2)}
                      </span>
                    </div>
                  )}
                  {creditsApplied > 0 && (
                    <div className="flex justify-between items-center text-blue-600">
                      <span className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1" />
                        Credits Applied
                      </span>
                      <span className="font-semibold">
                        -${creditsApplied.toFixed(2)}
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
                    <span className="text-primary bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Progress Indicator */}
                <div className="pt-4 border-t border-border/50">
                  <div className="text-sm text-muted-foreground mb-2">
                    Step {getCurrentStepIndex() + 1} of {STEPS.length}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentStep === "cart" && "Review your selected services"}
                    {currentStep === "terms" &&
                      "Accept terms and privacy policy"}
                    {currentStep === "discounts" &&
                      "Apply discounts and credits"}
                    {currentStep === "payment" && "Complete your payment"}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Badge */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Shield className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-green-400">
                      Secure Checkout
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your data is protected
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Stripe Fraud Protection</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span>Account Safety Guaranteed</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
