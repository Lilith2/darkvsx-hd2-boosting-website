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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
      return;
    }

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      const { data, error } = await supabase.rpc("validate_referral_code", {
        code: code.trim(),
        user_id: user?.id || null,
      });

      if (error) {
        console.error("Error validating promo code:", error);
        toast({
          title: "Error",
          description: "Could not validate promo code. Please try again.",
          variant: "destructive",
        });
        return;
      }

      const validation = data;

      if (!validation.valid) {
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
      toast({
        title: "Promo code applied!",
        description: `You saved $${discountAmount.toFixed(2)} with the promo code.`,
      });
    } catch (err) {
      console.error("Unexpected error validating promo code:", err);
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
      const maxApplicable = subtotal - promoDiscount + (subtotal - promoDiscount) * PAYMENT_CONSTANTS.TAX_RATE;
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
      if (useAvailableCredits && creditsApplied > 0) {
        const success = await useCredits(creditsApplied);
        if (!success) {
          throw new Error("Failed to use credits");
        }
      }

      const customOrderItems = cartItems.filter((item) => item.service.customOrderData);
      const regularOrderItems = cartItems.filter((item) => !item.service.customOrderData);

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
            special_instructions: customOrderData.special_instructions || orderNotes,
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
      description: "There was an error processing your PayPal payment. Please try again.",
      variant: "destructive",
    });
  };

  const handlePayPalCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
    toast({
      title: "Payment cancelled",
      description: "You cancelled the PayPal payment. Your order was not placed.",
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
      <div className="min-h-screen bg-background">
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
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card/80 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center space-x-4">
                <Link href="/cart" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Back to Cart
                </Link>
                <Separator orientation="vertical" className="h-6" />
                <div>
                  <h1 className="text-3xl font-bold">Checkout</h1>
                  <p className="text-muted-foreground">Complete your secure order</p>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure Checkout</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Column - Order Details */}
            <div className="space-y-8">
              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    Order Items
                    <Badge variant="secondary" className="ml-3">
                      {cartItems.length} item{cartItems.length !== 1 ? 's' : ''}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold">{item.service.title}</h4>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">${(item.service.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="w-5 h-5 mr-3" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="flex items-center">
                      <Mail className="w-4 h-4 mr-2" />
                      Email Address
                    </Label>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="font-medium">{user?.email}</p>
                      <p className="text-sm text-muted-foreground">Order updates will be sent here</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-3" />
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
                  />
                </CardContent>
              </Card>

              {/* Promo Code & Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Tag className="w-5 h-5 mr-3" />
                    Promo Code & Credits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Promo Code */}
                  <div className="space-y-3">
                    <Label htmlFor="promo-code">Promo Code</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="promo-code"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="flex-1"
                      />
                      <Button
                        onClick={() => validatePromoCode(promoCode)}
                        variant="outline"
                        disabled={!promoCode.trim()}
                      >
                        Apply
                      </Button>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-400">
                            Promo code applied! You saved ${promoDiscount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Credits */}
                  {availableCredits > 0 && (
                    <div className="space-y-3 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-2" />
                          Available Credits
                        </Label>
                        <span className="font-bold text-green-600">${availableCredits.toFixed(2)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="use-credits"
                          checked={useAvailableCredits}
                          onCheckedChange={handleCreditsToggle}
                        />
                        <Label htmlFor="use-credits">Use available credits</Label>
                      </div>
                      {creditsApplied > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-blue-600" />
                            <span className="text-sm text-blue-700 dark:text-blue-400">
                              Applied ${creditsApplied.toFixed(2)} in credits!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payment Summary */}
            <div className="space-y-6">
              {/* Order Summary */}
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-3" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span className="flex items-center">
                          <Sparkles className="w-4 h-4 mr-1" />
                          Promo Discount
                        </span>
                        <span>-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {creditsApplied > 0 && (
                      <div className="flex justify-between text-blue-600">
                        <span className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          Credits Applied
                        </span>
                        <span>-${creditsApplied.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="pt-4 space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      />
                      <div className="text-sm">
                        <label htmlFor="terms" className="cursor-pointer">
                          I agree to the{" "}
                          <Link href="/terms" className="text-primary hover:underline">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link href="/privacy" className="text-primary hover:underline">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                    </div>

                    {/* Payment Buttons */}
                    {agreeToTerms ? (
                      <div className="space-y-3">
                        {total <= 0 ? (
                          <Button
                            onClick={handleCreditOnlyPayment}
                            disabled={isProcessing}
                            className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                          >
                            {isProcessing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
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
                          <div className="space-y-3">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                              <div className="flex items-center space-x-2 text-sm">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700 dark:text-blue-300">
                                  Secure payment processed by PayPal
                                </span>
                              </div>
                            </div>
                            <PayPalButtons
                              style={{
                                layout: "vertical",
                                color: "blue",
                                shape: "rect",
                                label: "paypal",
                                height: 50,
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
                        )}
                      </div>
                    ) : (
                      <Button disabled className="w-full h-12">
                        Please accept the terms to continue
                      </Button>
                    )}

                    {isProcessing && (
                      <div className="text-center py-2">
                        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                          <span>Processing your order...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-green-500" />
                    Security & Trust
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3 text-sm">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                    <span>PayPal Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-3 text-sm">
                    <Shield className="w-4 h-4 text-yellow-600" />
                    <span>Account Safety Guaranteed</span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Trusted by thousands of customers</span>
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
