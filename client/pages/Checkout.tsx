import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  User,
  Mail,
  MessageSquare,
  ArrowLeft,
  Lock,
  Wallet as Paypal,
  Package,
  Gift,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { REFERRAL_CONFIG } from "@/lib/config";
import { useEffect } from "react";

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID ||
  "AefD8SednJLcqfFDsiO9AetjGEsCMVPYSCp-gX-UmUyJsQvSUHgbhnl39ZJCB14Tq-eXM3kG2Q6aizB8";

export default function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [useReferralCredits, setUseReferralCredits] = useState(false);
  const [referralCreditsApplied, setReferralCreditsApplied] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
  });

  const subtotal = getCartTotal();
  const discount = referralDiscount + referralCreditsApplied;
  const tax = (subtotal - discount) * 0.08; // 8% tax on discounted amount
  const total = subtotal - discount + tax;

  // Fetch user's available referral credits
  useEffect(() => {
    const fetchReferralCredits = async () => {
      if (!user?.id) {
        setAvailableCredits(0);
        return;
      }

      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: referrals, error } = await supabase
          .from("referrals")
          .select("commission_amount")
          .eq("referrer_user_id", user.id)
          .eq("status", "completed");

        if (error) {
          if (
            error.code === "PGRST116" ||
            error.message?.includes("relation") ||
            error.message?.includes("does not exist")
          ) {
            console.warn("Referrals table not found");
            setAvailableCredits(0);
            return;
          }
          throw error;
        }

        const totalCredits = (referrals || []).reduce((sum, r) => {
          const amount = parseFloat(r.commission_amount) || 0;
          return sum + amount;
        }, 0);

        setAvailableCredits(parseFloat(totalCredits.toFixed(2)));
      } catch (err) {
        console.error("Error fetching referral credits:", err);
        setAvailableCredits(0);
      }
    };

    fetchReferralCredits();
  }, [user?.id]);

  const validateReferralCode = async (code: string) => {
    if (!code.trim()) {
      setReferralDiscount(0);
      return;
    }

    // Check if code format is valid (HD2BOOST-XXXXXX)
    if (!code.match(REFERRAL_CONFIG.codeFormat)) {
      toast({
        title: "Invalid referral code",
        description: "Please enter a valid referral code format.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is trying to use their own code (multiple methods for security)
    if (user?.id) {
      const userCodeFromId = `HD2BOOST-${user.id.slice(-6)}`;
      const userCodeFromIdUpper = `HD2BOOST-${user.id.slice(-6).toUpperCase()}`;

      if (code === userCodeFromId || code === userCodeFromIdUpper || code.includes(user.id.slice(-6))) {
        toast({
          title: "Invalid referral code",
          description: "You cannot use your own referral code.",
          variant: "destructive",
        });
        return;
      }

      // Also check by querying the database to find who owns this code
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const codeUserId = code.replace("HD2BOOST-", "");

        // Check if this code belongs to the current user
        const { data: users, error } = await supabase
          .from("auth.users")
          .select("id")
          .ilike("id", `%${codeUserId}`)
          .limit(1);

        if (!error && users && users.length > 0 && users[0].id === user.id) {
          toast({
            title: "Invalid referral code",
            description: "You cannot use your own referral code.",
            variant: "destructive",
          });
          return;
        }
      } catch (err) {
        console.warn("Could not verify code ownership:", err);
        // Continue with other checks
      }
    }

    // Check if user has already used a referral code before (if authenticated)
    if (user?.id) {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: existingReferrals, error } = await supabase
          .from("referrals")
          .select("id")
          .eq("referred_user_id", user.id)
          .limit(1);

        if (error) {
          // If it's a table not found error, continue with the referral
          if (
            error.code === "PGRST116" ||
            error.message?.includes("relation") ||
            error.message?.includes("does not exist") ||
            error.message?.includes("referrals")
          ) {
            console.warn("Referrals table not found, allowing referral to proceed");
          } else {
            console.error("Error checking existing referrals:", error);
            // Continue anyway for unknown errors
          }
        } else if (existingReferrals && existingReferrals.length > 0) {
          toast({
            title: "Already used referral",
            description: "You have already used a referral code before. Each user can only use one referral code.",
            variant: "destructive",
          });
          return;
        }
      } catch (err) {
        console.warn("Could not check referral history:", err);
        // Continue anyway if there's an error checking
      }
    }

    // Apply 10% discount for valid referral code
    const discountAmount = subtotal * REFERRAL_CONFIG.customerDiscount;
    setReferralDiscount(discountAmount);
    toast({
      title: "Referral code applied!",
      description: `You saved $${discountAmount.toFixed(2)} with the referral code.`,
    });
  };

  const handleReferralCreditsToggle = (checked: boolean) => {
    setUseReferralCredits(checked);
    if (checked && availableCredits > 0) {
      // Apply up to the subtotal amount or available credits, whichever is smaller
      const creditsToApply = Math.min(availableCredits, subtotal);
      setReferralCreditsApplied(creditsToApply);

      toast({
        title: "Referral credits applied!",
        description: `You saved $${creditsToApply.toFixed(2)} using your referral credits.`,
      });
    } else {
      setReferralCreditsApplied(0);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some services to your cart before proceeding to checkout.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePayPalSuccess = async (details: any, data: any) => {
    console.log("PayPal payment successful:", { details, data });
    setIsProcessing(true);

    try {
      // Create the order with paid status only after successful PayPal payment
      const orderId = await addOrder({
        userId: user?.id || "guest",
        customerEmail: user?.email || guestInfo.email,
        customerName: user?.username || guestInfo.name,
        services: cartItems.map((item) => ({
          id: item.service.id,
          name: item.service.title,
          price: item.service.price,
          quantity: item.quantity,
        })),
        status: "pending",
        totalAmount: total,
        paymentStatus: "paid", // Only set to paid after successful PayPal payment
        notes: orderNotes,
        transactionId: details.id || data.orderID, // Capture PayPal transaction ID
        referralCode: referralCode || undefined,
        referralDiscount: referralDiscount || undefined,
      });

      // Clear cart
      clearCart();

      toast({
        title: "Payment successful!",
        description: `Your order #${orderId.slice(-6)} has been confirmed. Payment ID: ${details.id}`,
      });

      // Redirect to order tracking
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Order creation failed",
        description:
          "Payment was successful but we couldn't create your order. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
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

  return (
    <PayPalScriptProvider
      options={{
        clientId: PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="bg-background py-12 min-h-[calc(100vh-8rem)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Link
                to="/cart"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Cart
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">
              Complete your order securely with PayPal
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.service.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(item.service.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {referralDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Referral Discount (10%)</span>
                        <span>-${referralDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    {referralCreditsApplied > 0 && (
                      <div className="flex justify-between text-sm text-blue-600">
                        <span>Referral Credits</span>
                        <span>-${referralCreditsApplied.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              {!isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      We'll send order updates to this email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="guestName">Full Name *</Label>
                      <Input
                        id="guestName"
                        value={guestInfo.name}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestEmail">Email Address *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, email: e.target.value })
                        }
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Referral Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    Referral Code
                  </CardTitle>
                  <CardDescription>
                    Have a referral code? Get 10% off your order!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-2">
                    <Input
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder="HD2BOOST-XXXXXX"
                      className="flex-1"
                    />
                    <Button
                      onClick={() => validateReferralCode(referralCode)}
                      variant="outline"
                      disabled={!referralCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                  {referralDiscount > 0 && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-700 dark:text-green-400">
                          Referral code applied! You saved ${referralDiscount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Referral Credits */}
              {isAuthenticated && availableCredits > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Use Referral Credits
                    </CardTitle>
                    <CardDescription>
                      You have ${availableCredits.toFixed(2)} in referral credits available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium">Apply Referral Credits</p>
                          <p className="text-sm text-muted-foreground">
                            Use ${Math.min(availableCredits, subtotal).toFixed(2)} of your ${availableCredits.toFixed(2)} available credits
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="useCredits"
                          checked={useReferralCredits}
                          onCheckedChange={handleReferralCreditsToggle}
                        />
                        <Label htmlFor="useCredits" className="cursor-pointer">
                          Use Credits
                        </Label>
                      </div>
                    </div>
                    {useReferralCredits && referralCreditsApplied > 0 && (
                      <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-700 dark:text-blue-400">
                            Applied ${referralCreditsApplied.toFixed(2)} in referral credits!
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
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
                    placeholder="e.g., Preferred gaming hours, account details, etc."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Payment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription>
                    Pay securely with PayPal. Your payment information is
                    encrypted and protected.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) =>
                        setAgreeToTerms(checked as boolean)
                      }
                    />
                    <div className="text-sm">
                      <label htmlFor="terms" className="cursor-pointer">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-primary hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </div>

                  {/* Guest validation */}
                  {!isAuthenticated &&
                    (!guestInfo.name || !guestInfo.email) && (
                      <div className="bg-muted/50 border border-border p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Please fill in your contact information above to
                          continue.
                        </p>
                      </div>
                    )}

                  {/* PayPal Payment Button */}
                  {agreeToTerms &&
                  (isAuthenticated || (guestInfo.name && guestInfo.email)) ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 border border-border p-4 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span>
                            Secured by PayPal • 256-bit SSL encryption
                          </span>
                        </div>
                      </div>

                      <PayPalButtons
                        style={{
                          layout: "vertical",
                          color: "blue",
                          shape: "rect",
                          label: "paypal",
                        }}
                        createOrder={createPayPalOrder}
                        onApprove={async (data, actions) => {
                          const details = await actions.order.capture();
                          handlePayPalSuccess(details, data);
                        }}
                        onError={handlePayPalError}
                        onCancel={handlePayPalCancel}
                        disabled={isProcessing}
                      />

                      {isProcessing && (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing your order...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/50 border border-border p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {!agreeToTerms
                          ? "Please agree to the terms and conditions to continue."
                          : "Please fill in your contact information to continue."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Choose PayPal?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Your financial data is never shared</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>PayPal Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span>256-bit SSL encryption</span>
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
