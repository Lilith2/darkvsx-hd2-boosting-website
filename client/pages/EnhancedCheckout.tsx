import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useAuth } from "@/hooks/useAuth";
import { useReferrals } from "@/hooks/useReferrals";
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
  Wallet,
  Package,
  Gift,
  DollarSign,
  ShoppingBag,
  Tag,
  Zap,
  Star,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { REFERRAL_CONFIG } from "@/lib/config";
import { motion, AnimatePresence } from "framer-motion";

const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
  "AefD8SednJLcqfFDsiO9AetjGEsCMVPYSCp-gX-UmUyJsQvSUHgbhnl39ZJCB14Tq-eXM3kG2Q6aizB8";

export default function EnhancedCheckout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { createOrder: createCustomOrder } = useCustomOrders();
  const { user, isAuthenticated } = useAuth();
  const { getUserCredits, useCredits, verifyReferralCode } = useReferrals();
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [guestInfo, setGuestInfo] = useState({ name: "", email: "" });
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Referral & Credits states
  const [referralCode, setReferralCode] = useState("");
  const [referralDiscount, setReferralDiscount] = useState(0);
  const [useReferralCredits, setUseReferralCredits] = useState(false);
  const [referralCreditsApplied, setReferralCreditsApplied] = useState(0);
  const [availableCredits, setAvailableCredits] = useState(0);
  const [referralCodeStatus, setReferralCodeStatus] = useState<{
    isValid: boolean;
    message: string;
    isLoading: boolean;
  }>({ isValid: false, message: "", isLoading: false });

  // Enhanced checkout states
  const [currentStep, setCurrentStep] = useState(1);
  const [showOrderSummary, setShowOrderSummary] = useState(false);

  // Calculations
  const subtotal = getCartTotal();
  const discount = referralDiscount;
  const amountAfterDiscount = subtotal - discount;
  
  // Enhanced tax logic - no tax if fully paid with credits
  const willBeFullyPaidWithCredits = useReferralCredits && referralCreditsApplied >= amountAfterDiscount;
  const tax = willBeFullyPaidWithCredits ? 0 : amountAfterDiscount * PAYMENT_CONSTANTS.TAX_RATE;
  const subtotalAfterTax = amountAfterDiscount + tax;
  const total = Math.max(0, subtotalAfterTax - referralCreditsApplied);

  // Enhanced credit fetching
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

  // Enhanced referral code verification
  const handleReferralCodeSubmit = async () => {
    if (!referralCode.trim()) return;

    setReferralCodeStatus({ isValid: false, message: "", isLoading: true });

    try {
      const result = await verifyReferralCode(referralCode);
      if (result.isValid) {
        const discountAmount = subtotal * REFERRAL_CONFIG.CUSTOMER_DISCOUNT;
        setReferralDiscount(discountAmount);
        setReferralCodeStatus({
          isValid: true,
          message: `Discount applied! You saved $${discountAmount.toFixed(2)}`,
          isLoading: false,
        });
      } else {
        setReferralCodeStatus({
          isValid: false,
          message: result.message || "Invalid referral code",
          isLoading: false,
        });
      }
    } catch (error) {
      setReferralCodeStatus({
        isValid: false,
        message: "Failed to verify code. Please try again.",
        isLoading: false,
      });
    }
  };

  // Enhanced credit toggle
  const handleCreditsToggle = (checked: boolean) => {
    setUseReferralCredits(checked);
    if (checked && availableCredits > 0) {
      const maxApplicable = availableCredits >= amountAfterDiscount 
        ? amountAfterDiscount 
        : amountAfterDiscount + (amountAfterDiscount * PAYMENT_CONSTANTS.TAX_RATE);
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

  // Payment handlers
  const handleCreditOnlyPayment = async () => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      if (useReferralCredits && referralCreditsApplied > 0) {
        const success = await useCredits(referralCreditsApplied);
        if (!success) {
          throw new Error("Failed to use credits");
        }
      }

      // Process order creation logic here...
      
      toast({
        title: "Order Confirmed!",
        description: "Your order has been confirmed and paid with credits.",
      });

      clearCart();
      router.push("/account");
    } catch (error: any) {
      console.error("Credit payment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const createPayPalOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [{
        amount: { value: total.toFixed(2) },
        description: `Order for ${cartItems.length} item(s)`,
      }],
    });
  };

  const onPayPalApprove = async (data: any, actions: any) => {
    setIsProcessing(true);
    try {
      const details = await actions.order.capture();
      // Handle successful PayPal payment
      
      toast({
        title: "Payment Successful!",
        description: "Your order has been confirmed.",
      });

      clearCart();
      router.push("/account");
    } catch (error: any) {
      console.error("PayPal payment error:", error);
      toast({
        title: "Payment Error",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
          <p className="text-muted-foreground mb-6">Add some items to your cart to continue</p>
          <Button asChild>
            <Link href="/services">Browse Services</Link>
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <PayPalScriptProvider
      options={{
        "client-id": PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/10 to-background">
        {/* Enhanced Header */}
        <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/cart">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Cart
                  </Link>
                </Button>
                <Separator orientation="vertical" className="h-6" />
                <h1 className="text-xl font-bold">Secure Checkout</h1>
                <Badge variant="outline" className="text-xs">
                  <Shield className="w-3 h-3 mr-1" />
                  SSL Secured
                </Badge>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOrderSummary(!showOrderSummary)}
                className="md:hidden"
              >
                <Package className="w-4 h-4 mr-2" />
                Order Summary
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Progress Steps */}
              <Card className="border-2 border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <motion.div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            currentStep >= step
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {currentStep > step ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            step
                          )}
                        </motion.div>
                        {step < 3 && (
                          <div className={`w-20 h-0.5 mx-2 ${
                            currentStep > step ? "bg-primary" : "bg-muted"
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Information</span>
                    <span>Discounts</span>
                    <span>Payment</span>
                  </div>
                </CardContent>
              </Card>

              {/* Step 1: Customer Information */}
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <User className="w-5 h-5 mr-2" />
                          Contact Information
                        </CardTitle>
                        <CardDescription>
                          {isAuthenticated
                            ? "Your account details"
                            : "Please provide your contact information"}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {isAuthenticated ? (
                          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                Logged in as {user?.email}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="guestName">Full Name *</Label>
                              <Input
                                id="guestName"
                                value={guestInfo.name}
                                onChange={(e) =>
                                  setGuestInfo({ ...guestInfo, name: e.target.value })
                                }
                                placeholder="John Doe"
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
                                placeholder="john@example.com"
                                required
                              />
                            </div>
                          </div>
                        )}

                        {/* Order Notes */}
                        <div>
                          <Label htmlFor="orderNotes">
                            Special Instructions (Optional)
                          </Label>
                          <Textarea
                            id="orderNotes"
                            value={orderNotes}
                            onChange={(e) => setOrderNotes(e.target.value)}
                            placeholder="Any special requests or notes for your order..."
                            rows={3}
                          />
                        </div>

                        <div className="flex justify-end">
                          <Button
                            onClick={() => setCurrentStep(2)}
                            disabled={!isAuthenticated && (!guestInfo.name || !guestInfo.email)}
                            className="bg-gradient-to-r from-primary to-blue-600"
                          >
                            Continue to Discounts
                            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Step 2: Discounts & Credits */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Referral Code */}
                    <Card className="border-l-4 border-l-yellow-500">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Gift className="w-5 h-5 mr-2" />
                          Referral Code
                        </CardTitle>
                        <CardDescription>
                          Enter a referral code to get {(REFERRAL_CONFIG.CUSTOMER_DISCOUNT * 100)}% off your order
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex space-x-2">
                          <Input
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                            placeholder="HD2BOOST-XXXXXX"
                            className="flex-1"
                          />
                          <Button
                            onClick={handleReferralCodeSubmit}
                            disabled={!referralCode.trim() || referralCodeStatus.isLoading}
                            variant="outline"
                          >
                            {referralCodeStatus.isLoading ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              "Apply"
                            )}
                          </Button>
                        </div>

                        {referralCodeStatus.message && (
                          <div className={`p-3 rounded-lg text-sm ${
                            referralCodeStatus.isValid
                              ? "bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
                              : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400"
                          }`}>
                            {referralCodeStatus.message}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Credits */}
                    {isAuthenticated && availableCredits > 0 && (
                      <Card className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <CardTitle className="flex items-center">
                            <DollarSign className="w-5 h-5 mr-2" />
                            Use Credits
                          </CardTitle>
                          <CardDescription>
                            You have ${availableCredits.toFixed(2)} available in credits
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">Apply Credits</p>
                              <p className="text-sm text-muted-foreground">
                                Use up to ${Math.min(availableCredits, subtotalAfterTax).toFixed(2)} 
                                {" "}of your ${availableCredits.toFixed(2)} available credits
                              </p>
                            </div>
                            <Checkbox
                              id="useCredits"
                              checked={useReferralCredits}
                              onCheckedChange={handleCreditsToggle}
                            />
                          </div>

                          {useReferralCredits && referralCreditsApplied > 0 && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg"
                            >
                              <div className="flex items-center space-x-2">
                                <Zap className="w-4 h-4 text-blue-600" />
                                <span className="text-sm text-blue-700 dark:text-blue-400">
                                  Applied ${referralCreditsApplied.toFixed(2)} in credits!
                                </span>
                              </div>
                            </motion.div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    <div className="flex justify-between">
                      <Button variant="outline" onClick={() => setCurrentStep(1)}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                      </Button>
                      <Button
                        onClick={() => setCurrentStep(3)}
                        className="bg-gradient-to-r from-primary to-blue-600"
                      >
                        Continue to Payment
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Payment */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <Lock className="w-5 h-5 mr-2" />
                          Secure Payment
                        </CardTitle>
                        <CardDescription>
                          Complete your order securely
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {/* Terms Agreement */}
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

                        {agreeToTerms && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="space-y-4"
                          >
                            {total <= 0 ? (
                              // Credit-only payment
                              <div className="space-y-4">
                                <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700 dark:text-green-400 font-medium">
                                      Order total covered by credits!
                                    </span>
                                  </div>
                                  <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                    No payment required. Click below to confirm your order.
                                  </p>
                                </div>

                                <Button
                                  onClick={handleCreditOnlyPayment}
                                  disabled={isProcessing}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  size="lg"
                                >
                                  {isProcessing ? (
                                    <>
                                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                      Processing Order...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Confirm Order (Paid with Credits)
                                    </>
                                  )}
                                </Button>
                              </div>
                            ) : (
                              // PayPal payment
                              <div className="space-y-4">
                                <div className="bg-muted/50 border border-border p-4 rounded-lg">
                                  <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                                    <div className="flex items-center space-x-1">
                                      <Shield className="w-4 h-4" />
                                      <span>256-bit SSL</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="flex items-center space-x-1">
                                      <Lock className="w-4 h-4" />
                                      <span>Secure Payment</span>
                                    </div>
                                    <Separator orientation="vertical" className="h-4" />
                                    <div className="flex items-center space-x-1">
                                      <Wallet className="w-4 h-4" />
                                      <span>PayPal Protected</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                                    Why PayPal?
                                  </h4>
                                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Industry-leading security and fraud protection</li>
                                    <li>• Pay with PayPal balance, bank account, or credit card</li>
                                    <li>• Instant payment processing and order confirmation</li>
                                    <li>• Buyer protection for eligible purchases</li>
                                  </ul>
                                </div>

                                <PayPalButtons
                                  style={{
                                    layout: "vertical",
                                    color: "blue",
                                    shape: "rect",
                                    label: "paypal",
                                    height: 45,
                                  }}
                                  createOrder={createPayPalOrder}
                                  onApprove={onPayPalApprove}
                                  onError={(error) => {
                                    console.error("PayPal error:", error);
                                    toast({
                                      title: "Payment Error",
                                      description: "There was an issue with PayPal. Please try again.",
                                      variant: "destructive",
                                    });
                                  }}
                                />
                              </div>
                            )}
                          </motion.div>
                        )}

                        <div className="flex justify-start">
                          <Button variant="outline" onClick={() => setCurrentStep(2)}>
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Discounts
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Order Summary */}
            <div className={`lg:block ${showOrderSummary ? "block" : "hidden"}`}>
              <div className="sticky top-24 space-y-6">
                <Card className="border-2 border-primary/20 shadow-lg">
                  <CardHeader className="bg-gradient-to-r from-primary/5 to-blue-500/5">
                    <CardTitle className="flex items-center">
                      <ShoppingBag className="w-5 h-5 mr-2" />
                      Order Summary
                    </CardTitle>
                    <CardDescription>
                      {cartItems.length} item{cartItems.length > 1 ? "s" : ""} in your cart
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {/* Cart Items */}
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {cartItems.map((item, index) => (
                        <motion.div
                          key={`${item.service.id}-${index}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30"
                        >
                          <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                            <Package className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm leading-tight">
                              {item.service.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(item.service.price * item.quantity).toFixed(2)}</p>
                            {item.service.originalPrice && item.service.originalPrice > item.service.price && (
                              <p className="text-xs text-muted-foreground line-through">
                                ${(item.service.originalPrice * item.quantity).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <Separator />

                    {/* Price Breakdown */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>

                      {referralDiscount > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex justify-between text-sm text-green-600"
                        >
                          <span className="flex items-center">
                            <Gift className="w-3 h-3 mr-1" />
                            Referral Discount
                          </span>
                          <span>-${referralDiscount.toFixed(2)}</span>
                        </motion.div>
                      )}

                      {referralCreditsApplied > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="flex justify-between text-sm text-blue-600"
                        >
                          <span className="flex items-center">
                            <DollarSign className="w-3 h-3 mr-1" />
                            Credits Applied
                          </span>
                          <span>-${referralCreditsApplied.toFixed(2)}</span>
                        </motion.div>
                      )}

                      <div className="flex justify-between text-sm">
                        <span className="flex items-center">
                          {PAYMENT_CONSTANTS.TAX_LABEL}
                          {willBeFullyPaidWithCredits && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Waived
                            </Badge>
                          )}
                        </span>
                        <span>${tax.toFixed(2)}</span>
                      </div>

                      <Separator />

                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-primary">${total.toFixed(2)}</span>
                      </div>

                      {total <= 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 p-3 rounded-lg text-center"
                        >
                          <Star className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <p className="text-sm font-medium text-green-700 dark:text-green-400">
                            Fully Covered!
                          </p>
                          <p className="text-xs text-green-600 dark:text-green-500">
                            Your order is paid for with credits
                          </p>
                        </motion.div>
                      )}
                    </div>

                    <Separator />

                    {/* Trust Signals */}
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="flex flex-col items-center space-y-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">24-48h delivery</span>
                      </div>
                      <div className="flex flex-col items-center space-y-1">
                        <Shield className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Secure payment</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <Card>
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Trusted by 10,000+ players</span>
                      </div>
                      <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
                        <span>✓ 99.9% Success Rate</span>
                        <span>✓ 5-Star Reviews</span>
                        <span>✓ 24/7 Support</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
