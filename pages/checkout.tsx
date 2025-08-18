import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/hooks/useCart";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingCart,
  ArrowLeft,
  Shield,
  CheckCircle,
  Clock,
  Package,
  Star,
  Lock,
  CreditCard,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { OrderSummary } from "@/components/checkout/OrderSummary";
import { GuestInfo } from "@/components/checkout/GuestInfo";
import { ReferralSection } from "@/components/checkout/ReferralSection";
import { PaymentForm } from "@/components/checkout/PaymentForm";

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
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [useReferralCredits, setUseReferralCredits] = useState(false);
  const [referralCreditsApplied, setReferralCreditsApplied] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);

  // Redirect to login if not authenticated
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
  const discount = referralDiscount;
  const tax = (subtotal - discount) * PAYMENT_CONSTANTS.TAX_RATE;
  const subtotalAfterTax = subtotal - discount + tax;
  const total = Math.max(0, subtotalAfterTax - referralCreditsApplied);

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

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralDiscount(0);
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      const { data, error } = await supabase.rpc("validate_referral_code", {
        code: code.trim(),
        user_id: user?.id || null,
      });

      if (error) {
        console.error("Error validating referral code:", error);
        toast({
          title: "Error",
          description: "Could not validate referral code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const validation = data;

      if (!validation.valid) {
        toast({
          title: "Invalid referral code",
          description:
            validation.error || "Please enter a valid referral code.",
          variant: "destructive",
        });
        setReferralDiscount(0);
        return;
      }

      const discountAmount = subtotal * REFERRAL_CONFIG.customerDiscount;
      setReferralDiscount(discountAmount);
      toast({
        title: "Referral code applied!",
        description: `You saved $${discountAmount.toFixed(2)} with the referral code.`,
      });
    } catch (err) {
      console.error("Unexpected error validating referral code:", err);
      toast({
        title: "Error",
        description: "Could not validate referral code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreditsToggle = (checked: boolean) => {
    setUseReferralCredits(checked);
    if (checked && availableCredits > 0) {
      const maxApplicable =
        subtotal -
        referralDiscount +
        (subtotal - referralDiscount) * PAYMENT_CONSTANTS.TAX_RATE;
      const creditsToApply = Math.min(availableCredits, maxApplicable);
      setReferralCreditsApplied(creditsToApply);

      toast({
        title: "Credits applied!",
        description: `You saved $${creditsToApply.toFixed(2)} using your credits.`,
      });
    } else {
      setReferralCreditsApplied(0);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Package className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Add some services to your cart before proceeding to checkout.
          </p>
          <Button asChild size="lg" className="min-w-48">
            <Link href="/">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const processOrder = async (paymentDetails?: any, paymentData?: any) => {
    setIsProcessing(true);

    try {
      if (useReferralCredits && referralCreditsApplied > 0) {
        const success = await useCredits(referralCreditsApplied);
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
          referralCode: referralCode || undefined,
          referralDiscount: referralDiscount || undefined,
          referralCreditsUsed: referralCreditsApplied || undefined,
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
            referralCode: referralCode || undefined,
            referralDiscount: referralDiscount || undefined,
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
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
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        {/* Header */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link
                  href="/cart"
                  className="flex items-center text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <ArrowLeft className="w-5 h-5 mr-2 transition-transform group-hover:-translate-x-1" />
                  Back to Cart
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-2xl font-bold">Secure Checkout</h1>
                  <p className="text-sm text-muted-foreground">
                    Complete your order safely and securely
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>256-bit SSL Encrypted</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary Card */}
              <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <ShoppingCart className="w-6 h-6 mr-3 text-primary" />
                    Order Summary
                    <Badge variant="secondary" className="ml-3">
                      {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Review your selected services before checkout
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div key={item.id}>
                      <div className="flex items-start space-x-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                          <Star className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg mb-1">
                            {item.service.title}
                          </h4>
                          <div className="flex items-center space-x-3 mb-2">
                            <Badge variant="outline" className="text-xs">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.service.duration || "24-48h"}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {item.service.difficulty || "Professional"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary">
                            ${(item.service.price * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            ${item.service.price} each
                          </p>
                        </div>
                      </div>
                      {index < cartItems.length - 1 && (
                        <Separator className="my-4" />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Guest Information */}
              <GuestInfo
                guestInfo={guestInfo}
                onGuestInfoChange={setGuestInfo}
                orderNotes={orderNotes}
                onOrderNotesChange={setOrderNotes}
                isAuthenticated={isAuthenticated}
                userEmail={user?.email}
                disabled={isProcessing}
              />

              {/* Referral Section */}
              <ReferralSection
                referralCode={referralCode}
                onReferralCodeChange={(code) =>
                  setReferralCode(code.toUpperCase())
                }
                onValidateReferral={validateReferralCode}
                useReferralCredits={useReferralCredits}
                onUseReferralCreditsChange={handleCreditsToggle}
                availableCredits={availableCredits}
                referralCreditsApplied={referralCreditsApplied}
                onCreditsAppliedChange={setReferralCreditsApplied}
                isAuthenticated={isAuthenticated}
                disabled={isProcessing}
              />
            </div>

            {/* Right Column - Payment */}
            <div className="space-y-6">
              {/* Order Total Card */}
              <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm sticky top-8">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center text-xl">
                    <CreditCard className="w-6 h-6 mr-3 text-primary" />
                    Order Total
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between text-base">
                      <span>Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {referralDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Referral Discount (10%)
                        </span>
                        <span className="font-medium">
                          -${referralDiscount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {referralCreditsApplied > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Credits Applied
                        </span>
                        <span className="font-medium">
                          -${referralCreditsApplied.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between text-2xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Payment Section */}
                  <div className="pt-6 space-y-4">
                    {total <= 0 ? (
                      <div className="space-y-4">
                        <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-xl">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <span className="text-green-700 dark:text-green-400 font-semibold">
                              Order fully covered by credits!
                            </span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                            No additional payment required. Click below to
                            confirm your order.
                          </p>
                        </div>

                        <Button
                          onClick={handleCreditOnlyPayment}
                          disabled={isProcessing || !agreeToTerms}
                          className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg font-semibold"
                        >
                          {isProcessing ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Processing Order...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-5 h-5 mr-2" />
                              Confirm Order
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      <PaymentForm
                        total={total}
                        agreeToTerms={agreeToTerms}
                        onAgreeToTermsChange={setAgreeToTerms}
                        onPayPalApprove={async (data, actions) => {
                          if (actions.order) {
                            const details = await actions.order.capture();
                            handlePayPalSuccess(details, data);
                          }
                        }}
                        onPayPalError={handlePayPalError}
                        isProcessing={isProcessing}
                        disabled={
                          !agreeToTerms ||
                          (!isAuthenticated &&
                            (!guestInfo.name || !guestInfo.email))
                        }
                      />
                    )}

                    {isProcessing && total > 0 && (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing your order...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card className="border-0 shadow-sm bg-card/30 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-500" />
                    Security & Protection
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                      <Lock className="w-4 h-4 text-green-600" />
                    </div>
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <span>PayPal Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <span>Account Safety Guaranteed</span>
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
