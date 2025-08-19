import { useState, useEffect } from "react";
import { useRouter } from "next/router";
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
  ShoppingCart,
  User,
  Mail,
  MessageSquare,
  CreditCard,
  Shield,
  CheckCircle,
  Package,
  Tag,
  DollarSign,
  Lock,
  Sparkles,
  Clock,
  Star,
  Gift,
  Zap,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "AefD8SednJLcqfFDsiO9AetjGEsCMVPYSCp-gX-UmUyJsQvSUHgbhnl39ZJCB14Tq-eXM3kG2Q6aizB8";

export default function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { createOrder: createCustomOrder } = useCustomOrders();
  const { user, isAuthenticated } = useAuth();
  const { getUserCredits, useCredits } = useReferrals();
  const { toast } = useToast();
  const router = useRouter();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [useAvailableCredits, setUseAvailableCredits] = useState(false);
  const [creditsApplied, setCreditsApplied] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [currentStep, setCurrentStep] = useState(1);
  const [promoCodeStatus, setPromoCodeStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');

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

  const validatePromoCode = async (code: string) => {
    if (!code.trim()) {
      setPromoDiscount(0);
      setPromoCodeStatus('idle');
      return;
    }

    setPromoCodeStatus('loading');

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      const { data, error } = await supabase.rpc("validate_referral_code", {
        code: code.trim(),
        user_id: user?.id || null,
      });

      if (error) {
        console.error("Error validating promo code:", error);
        setPromoCodeStatus('error');
        toast({
          title: "Error",
          description: "Could not validate promo code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const validation = data;

      if (!validation.valid) {
        setPromoCodeStatus('error');
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
      setPromoCodeStatus('applied');
      toast({
        title: "Promo code applied!",
        description: `You saved $${discountAmount.toFixed(2)} with the promo code.`,
      });
    } catch (err) {
      console.error("Unexpected error validating promo code:", err);
      setPromoCodeStatus('error');
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
              Add some amazing boosting services to your cart before proceeding to checkout.
            </p>
            <Button asChild size="lg" className="min-w-48 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
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

  const processOrder = async (paymentDetails?: any, paymentData?: any) => {
    setIsProcessing(true);

    try {
      if (useAvailableCredits && creditsApplied > 0) {
        const success = await useCredits(creditsApplied);
        if (!success) {
          throw new Error("Failed to use credits");
        }
      }

      const customOrderItems = cartItems.filter(
        (item) => item.service.customOrderData,
      );
      const regularOrderItems = cartItems.filter(
        (item) => !item.service.customOrderData,
      );

      let orderId = null;

      if (regularOrderItems.length > 0) {
        orderId = await addOrder({
          userId: user?.id || null,
          customerEmail: user?.email || guestInfo.email,
          customerName: user?.username || guestInfo.name,
          services: regularOrderItems.map((item) => ({
            id: item.service.id,
            name: item.service.title,
            price: item.service.price,
            quantity: item.quantity,
          })),
          status: "pending",
          totalAmount: regularOrderItems.reduce(
            (sum, item) => sum + item.service.price * item.quantity,
            0,
          ),
          paymentStatus: "paid",
          notes: orderNotes,
          transactionId:
            paymentDetails?.purchase_units?.[0]?.payments?.captures?.[0]?.id ||
            paymentDetails?.id ||
            paymentData?.orderID ||
            `credits-${Date.now()}`,
          referralCode: promoCode || undefined,
          referralDiscount: promoDiscount || undefined,
          referralCreditsUsed: creditsApplied || undefined,
        });
      }

      let customOrderId = null;
      if (customOrderItems.length > 0) {
        for (const cartItem of customOrderItems) {
          const customOrderData = cartItem.service.customOrderData;
          if (!customOrderData) continue;

          const customOrderResult = await createCustomOrder({
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
            customer_email: user?.email || guestInfo.email,
            customer_name: user?.username || guestInfo.name,
            customer_discord: customOrderData.customer_discord,
            userId: user?.id || null,
            referralCode: promoCode || undefined,
            referralDiscount: promoDiscount || undefined,
          });

          if (!customOrderId && customOrderResult) {
            customOrderId = customOrderResult.id;
          }
        }
      }

      const orderMessage =
        customOrderItems.length > 0 && regularOrderItems.length > 0
          ? "Your orders have been confirmed"
          : customOrderItems.length > 0
            ? "Your custom order has been confirmed"
            : `Your order #${orderId?.slice(-6)} has been confirmed`;

      const paymentMessage =
        total <= 0
          ? "Paid with credits"
          : `Payment ID: ${paymentDetails?.id || "Credits + PayPal"}`;

      toast({
        title: total <= 0 ? "Order confirmed!" : "Payment successful!",
        description: `${orderMessage}. ${paymentMessage}`,
      });

      if (regularOrderItems.length > 0) {
        router.push(
          `/order-confirmation?orderId=${orderId}&sendEmail=true${paymentDetails?.id ? `&paymentId=${paymentDetails.id}` : ""}`,
        );
      } else if (customOrderId) {
        router.push(
          `/order-confirmation?orderId=${customOrderId}&type=custom&sendEmail=true${paymentDetails?.id ? `&paymentId=${paymentDetails.id}` : ""}`,
        );
      } else {
        router.push("/account");
      }

      setTimeout(() => {
        clearCart();
      }, 100);
    } catch (error: any) {
      console.error("Error creating order:", error);

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
        title: "Order creation failed",
        description:
          total <= 0
            ? `We couldn't create your order: ${errorMessage}. Please contact support.`
            : `Payment was successful but we couldn't create your order: ${errorMessage}. Please contact support.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalSuccess = async (details: any, data: any) => {
    console.log("PayPal payment successful:", { details, data });
    await processOrder(details, data);
  };

  const handleCreditOnlyPayment = async () => {
    console.log("Processing credit-only payment");
    await processOrder();
  };

  const handlePayPalError = (error: any) => {
    console.error("PayPal payment error:", error);
    toast({
      title: "Payment failed",
      description:
        "There was an error processing your PayPal payment. Please try again.",
      variant: "destructive",
    });
  };

  const handlePayPalCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
    toast({
      title: "Payment cancelled",
      description:
        "You cancelled the PayPal payment. Your order was not placed.",
    });
  };

  const createPayPalOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
            currency_code: "USD",
          },
          description: `HelldiversBoost Order - ${cartItems.length} service(s)`,
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
    });
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return true; // Info step - always available
      case 2:
        return true; // Order review step
      case 3:
        return agreeToTerms; // Payment step
      default:
        return false;
    }
  };

  const canProceedToPayment = () => {
    return agreeToTerms && (total <= 0 || true); // Can always proceed if terms agreed
  };

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
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-sm border-b border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <Link
                  href="/cart"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                  Back to Cart
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Secure Checkout
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Complete your order safely and securely
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                  <Shield className="w-3 h-3 mr-1 text-green-600" />
                  <span className="text-green-700 dark:text-green-400 text-xs">SSL Secured</span>
                </Badge>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="pb-4">
              <div className="flex items-center justify-center space-x-8">
                {[
                  { number: 1, label: "Review Order", icon: ShoppingCart },
                  { number: 2, label: "Order Details", icon: User },
                  { number: 3, label: "Payment", icon: CreditCard },
                ].map(({ number, label, icon: Icon }) => (
                  <div key={number} className="flex items-center">
                    <div className={`flex items-center space-x-2 ${
                      currentStep >= number ? 'text-primary' : 'text-muted-foreground'
                    }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                        currentStep >= number 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {currentStep > number ? <CheckCircle className="w-4 h-4" /> : number}
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    {number < 3 && (
                      <ArrowRight className={`w-4 h-4 mx-4 ${
                        currentStep > number ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Order Items Card */}
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <ShoppingCart className="w-5 h-5 text-white" />
                    </div>
                    Your Order
                    <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary">
                      {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Review your selected boosting services
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all duration-200"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg">{item.service.title}</h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.service.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/20">
                            <Star className="w-3 h-3 mr-1" />
                            {item.service.difficulty}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                            Qty: {item.quantity}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-xl text-primary">
                          ${(item.service.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${item.service.price} each
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                      <User className="w-5 h-5 text-white" />
                    </div>
                    Customer Information
                  </CardTitle>
                  <CardDescription>
                    Your account details for this order
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-semibold text-base">{user?.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Order confirmations and updates will be sent here
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    Order Notes
                  </CardTitle>
                  <CardDescription>
                    Any special instructions for your boosting service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Include your Discord username, preferred gaming hours, or any specific requirements..."
                    rows={4}
                    className="resize-none border-border/50 focus:border-primary/50 bg-background/50"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 <strong>Tip:</strong> Include your Discord username and preferred hours for better service
                  </p>
                </CardContent>
              </Card>

              {/* Promo Code & Credits */}
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                      <Gift className="w-5 h-5 text-white" />
                    </div>
                    Discounts & Credits
                  </CardTitle>
                  <CardDescription>
                    Apply promo codes and use available credits
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Promo Code */}
                  <div className="space-y-3">
                    <Label htmlFor="promo-code" className="text-base font-medium">
                      Promo Code
                    </Label>
                    <div className="flex space-x-2">
                      <div className="flex-1 relative">
                        <Input
                          id="promo-code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Enter promo code"
                          className="h-12 pr-10 border-border/50 focus:border-primary/50"
                          disabled={promoCodeStatus === 'loading'}
                        />
                        {promoCodeStatus === 'applied' && (
                          <CheckCircle className="w-5 h-5 text-green-600 absolute right-3 top-3.5" />
                        )}
                      </div>
                      <Button
                        onClick={() => validatePromoCode(promoCode)}
                        disabled={!promoCode.trim() || promoCodeStatus === 'loading'}
                        className="h-12 px-6"
                      >
                        {promoCodeStatus === 'loading' ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </Button>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-green-800 dark:text-green-200">
                              Promo code applied!
                            </p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              You saved ${promoDiscount.toFixed(2)} with this promo code
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  {availableCredits > 0 && (
                    <div className="space-y-3 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center text-base font-medium">
                          <DollarSign className="w-5 h-5 mr-2 text-primary" />
                          Available Credits
                        </Label>
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm px-3 py-1">
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
                        <Label htmlFor="use-credits" className="flex-1 cursor-pointer">
                          Use ${Math.min(availableCredits, subtotalAfterTax).toFixed(2)} of your available credits
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
                                You're using ${creditsApplied.toFixed(2)} from your credit balance
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Sidebar */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base">Subtotal</span>
                      <span className="font-semibold text-lg">${subtotal.toFixed(2)}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Promo Discount
                        </span>
                        <span className="font-semibold">-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {creditsApplied > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Credits Applied
                        </span>
                        <span className="font-semibold">-${creditsApplied.toFixed(2)}</span>
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

                  {/* Terms Agreement */}
                  <div className="pt-6 space-y-4 border-t border-border/50">
                    <div className="p-4 border border-border/50 rounded-xl bg-muted/20">
                      <div className="flex items-start space-x-3">
                        <Checkbox
                          id="terms"
                          checked={agreeToTerms}
                          onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label htmlFor="terms" className="text-sm leading-6 cursor-pointer">
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
                        </div>
                      </div>
                    </div>

                    {/* Payment Buttons */}
                    {agreeToTerms ? (
                      <div className="space-y-4">
                        {total <= 0 ? (
                          <Button
                            onClick={handleCreditOnlyPayment}
                            disabled={isProcessing}
                            className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg"
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
                        ) : (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                              <div className="flex items-center space-x-3 text-sm">
                                <Shield className="w-5 h-5 text-blue-600" />
                                <span className="text-blue-700 dark:text-blue-300 font-medium">
                                  Secure payment processed by PayPal
                                </span>
                              </div>
                            </div>
                            <div className="paypal-container">
                              <PayPalButtons
                                style={{
                                  layout: "vertical",
                                  color: "blue",
                                  shape: "rect",
                                  label: "paypal",
                                  height: 55,
                                }}
                                createOrder={createPayPalOrder}
                                onApprove={async (data, actions) => {
                                  if (actions.order) {
                                    const details = await actions.order.capture();
                                    handlePayPalSuccess(details, data);
                                  }
                                }}
                                onError={handlePayPalError}
                                onCancel={handlePayPalCancel}
                                disabled={isProcessing}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Button disabled className="w-full h-14 text-lg">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Please accept the terms to continue
                      </Button>
                    )}

                    {isProcessing && (
                      <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                        <div className="flex items-center justify-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
                          <span className="text-base font-semibold">
                            Processing your payment...
                          </span>
                        </div>
                        <p className="text-sm text-center text-muted-foreground mt-2">
                          Please do not close this window or refresh the page
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Enhanced Security Features */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-green-800 dark:text-green-200">
                    <Shield className="w-5 h-5 mr-2 text-green-600" />
                    Security & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <Lock className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">256-bit SSL encryption</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <span className="text-sm font-medium">PayPal Buyer Protection</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                      <Shield className="w-5 h-5 text-purple-600" />
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
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
