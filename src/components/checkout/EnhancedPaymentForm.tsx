import React, { useState, useEffect } from "react";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  CreditCard,
  Shield,
  CheckCircle,
  Loader2,
  AlertTriangle,
  Smartphone,
  Wallet,
  Coins,
} from "lucide-react";

// Initialize Stripe
const stripePromise = loadStripe("pk_live_51RvPHJK2UdqUm5lUJBDOFvP4HCpMaLNlQVnZCBg7frTXkCHYeTSPKGFzmTHHudVvCdMofdqiRepwYRiyr2PpWFWo00NKBQrZVm");

interface CartItem {
  id: string;
  product: {
    id: string;
    name: string;
    base_price: number;
    sale_price?: number;
    product_type: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  custom_options?: any;
}

interface EnhancedPaymentFormProps {
  cartItems: CartItem[];
  subtotal: number;
  taxAmount: number;
  total: number;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  customerInfo: {
    name: string;
    email: string;
    discord: string;
    notes?: string;
    specialInstructions?: string;
  };
}

function PaymentForm({ 
  cartItems, 
  subtotal, 
  taxAmount, 
  total, 
  onPaymentSuccess, 
  onPaymentError, 
  isProcessing,
  customerInfo 
}: EnhancedPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [creditsToUse, setCreditsToUse] = useState<number>(0);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [canPayWithCreditsOnly, setCanPayWithCreditsOnly] = useState(false);
  const [finalAmount, setFinalAmount] = useState(total);

  // Fetch user's credit balance
  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("credit_balance")
          .eq("id", user.id)
          .single();
          
        if (error) {
          console.error("Error fetching user credits:", error);
          return;
        }
        
        setUserCredits(profile?.credit_balance || 0);
      } catch (error) {
        console.error("Error fetching user credits:", error);
      }
    };

    fetchUserCredits();
  }, [user]);

  // Calculate final amount when credits change
  useEffect(() => {
    const creditsUsed = Math.min(creditsToUse, subtotal);
    const amountAfterCredits = Math.max(0, subtotal - creditsUsed);
    const taxOnRemainder = amountAfterCredits * 0.08;
    const newFinalAmount = amountAfterCredits + taxOnRemainder;
    
    setFinalAmount(newFinalAmount);
    setCanPayWithCreditsOnly(creditsUsed >= subtotal);
  }, [creditsToUse, subtotal]);

  // Initialize payment intent
  useEffect(() => {
    const initializePayment = async () => {
      if (cartItems.length === 0) {
        setIsInitializing(false);
        return;
      }

      // If can pay with credits only, skip payment intent creation
      if (canPayWithCreditsOnly) {
        setIsInitializing(false);
        return;
      }

      try {
        const items = cartItems.map(item => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          product_name: item.product.name,
          product_type: item.product.product_type,
        }));

        const { data, error } = await supabase.functions.invoke('create-payment-intent', {
          body: {
            items,
            customerEmail: customerInfo.email,
            customerName: customerInfo.name,
            customerDiscord: customerInfo.discord,
            creditsUsed: creditsToUse,
            metadata: {
              order_notes: customerInfo.notes || "",
              special_instructions: customerInfo.specialInstructions || "",
            }
          }
        });

        if (error) {
          throw new Error(error.message);
        }

        if (data.canPayWithCreditsOnly) {
          setCanPayWithCreditsOnly(true);
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          throw new Error("Invalid payment response");
        }
      } catch (error: any) {
        console.error("Error initializing payment:", error);
        setErrorMessage(error.message || "Failed to initialize payment");
        onPaymentError(error.message || "Failed to initialize payment");
      } finally {
        setIsInitializing(false);
      }
    };

    if (!isProcessing) {
      initializePayment();
    }
  }, [cartItems, creditsToUse, canPayWithCreditsOnly, customerInfo, isProcessing]);

  const handleCreditsPayment = async () => {
    if (!user || creditsToUse < subtotal) {
      toast({
        title: "Error",
        description: "Insufficient credits for this order",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const items = cartItems.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        product_name: item.product.name,
        product_type: item.product.product_type,
      }));

      const { data, error } = await supabase.functions.invoke('process-credits-payment', {
        body: {
          items,
          customerEmail: customerInfo.email,
          customerName: customerInfo.name,
          customerDiscord: customerInfo.discord,
          creditsToUse: subtotal,
          notes: customerInfo.notes || "",
          specialInstructions: customerInfo.specialInstructions || "",
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      // Create synthetic payment intent for success handler
      const syntheticPaymentIntent = {
        id: data.transactionId,
        status: "succeeded",
        metadata: {
          orderId: data.orderId,
          orderNumber: data.orderNumber,
        }
      };

      onPaymentSuccess(syntheticPaymentIntent);
    } catch (error: any) {
      console.error("Credits payment error:", error);
      setErrorMessage(error.message || "Failed to process credits payment");
      onPaymentError(error.message || "Failed to process credits payment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStripePayment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setErrorMessage("Payment system not ready. Please refresh and try again.");
      return;
    }

    if (isProcessing || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || "Please complete all required payment fields");
      }

      const confirmResult = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-confirmation`,
          payment_method_data: {
            billing_details: {
              name: customerInfo.name,
              email: customerInfo.email,
            },
          },
        },
        redirect: "if_required",
      });

      const { error, paymentIntent } = confirmResult;

      if (error) {
        console.error("Payment confirmation error:", error);
        let errorMsg = "Payment failed.";

        switch (error.type) {
          case "card_error":
            errorMsg = error.message || "Your card was declined. Please try a different payment method.";
            break;
          case "validation_error":
            errorMsg = error.message || "Please check your payment information and try again.";
            break;
          default:
            errorMsg = error.message || "An unexpected payment error occurred.";
        }

        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
        return;
      }

      if (!paymentIntent) {
        throw new Error("Payment confirmation failed");
      }

      if (paymentIntent.status === "succeeded" || paymentIntent.status === "processing") {
        onPaymentSuccess(paymentIntent);
      } else {
        throw new Error(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      const errorMsg = err.message || "An unexpected error occurred during payment.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="text-lg font-medium">Initializing secure payment...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Credits Section */}
      {user && userCredits > 0 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Coins className="w-5 h-5 mr-2 text-amber-600" />
              Use Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Available Credits:</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                ${userCredits.toFixed(2)}
              </Badge>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="credits">Credits to Use</Label>
              <div className="flex space-x-2">
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  max={Math.min(userCredits, subtotal)}
                  step="0.01"
                  value={creditsToUse}
                  onChange={(e) => setCreditsToUse(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCreditsToUse(Math.min(userCredits, subtotal))}
                >
                  Max
                </Button>
              </div>
            </div>

            {creditsToUse > 0 && (
              <div className="p-3 bg-white/60 rounded-lg border">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-green-600">
                  <span>Credits Applied:</span>
                  <span>-${Math.min(creditsToUse, subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Tax (8%):</span>
                  <span>${(Math.max(0, subtotal - creditsToUse) * 0.08).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                  <span>Final Total:</span>
                  <span>${finalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Payment Method Selection */}
      {canPayWithCreditsOnly ? (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardHeader>
            <CardTitle className="flex items-center text-xl">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              Pay with Credits
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your available credits cover the full order amount. Complete your purchase without a card.
              </AlertDescription>
            </Alert>
            
            <Button
              onClick={handleCreditsPayment}
              disabled={isSubmitting || isProcessing}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Complete Order with Credits
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-xl">
              <div className="flex items-center">
                <CreditCard className="w-6 h-6 mr-3" />
                Payment Details
              </div>
              <div className="text-xl text-primary font-bold">
                ${finalAmount.toFixed(2)}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Methods Info */}
            <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20">
              <Shield className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                <div className="flex items-center justify-between">
                  <span>Secure payment with multiple options</span>
                  <div className="flex items-center space-x-3 text-xs">
                    <div className="flex items-center">
                      <Smartphone className="w-3 h-3 mr-1" />
                      Digital Wallets
                    </div>
                    <div className="flex items-center">
                      <Wallet className="w-3 h-3 mr-1" />
                      BNPL
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="w-3 h-3 mr-1" />
                      Cards
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {/* Payment Form */}
            <form onSubmit={handleStripePayment} className="space-y-6">
              {clientSecret && (
                <div className="p-6 border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm">
                  <PaymentElement
                    options={{
                      layout: "tabs",
                      paymentMethodOrder: [
                        "card",
                        "apple_pay",
                        "google_pay",
                        "link",
                        "venmo",
                        "cashapp",
                        "amazon_pay",
                        "klarna",
                        "affirm",
                        "afterpay_clearpay",
                      ],
                      business: {
                        name: "HellDivers 2 Boosting",
                      },
                      fields: {
                        billingDetails: {
                          name: "auto",
                          email: "auto",
                          phone: "never",
                          address: "never",
                        },
                      },
                      wallets: {
                        applePay: "auto",
                        googlePay: "auto",
                      },
                    }}
                  />
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="font-medium">
                    {errorMessage}
                  </AlertDescription>
                </Alert>
              )}

              {/* Payment Button */}
              <Button
                type="submit"
                disabled={!stripe || !elements || isSubmitting || isProcessing || !clientSecret}
                className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
              >
                {isSubmitting || isProcessing ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-6 h-6 mr-3" />
                    Complete Payment • ${finalAmount.toFixed(2)}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Features */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-border/50">
        <div className="flex items-center space-x-2 text-sm">
          <Shield className="w-4 h-4 text-green-500" />
          <span>SSL Secured</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <CheckCircle className="w-4 h-4 text-blue-500" />
          <span>PCI Compliant</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Shield className="w-4 h-4 text-purple-500" />
          <span>Fraud Protected</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Wallet className="w-4 h-4 text-orange-500" />
          <span>Venmo Enabled</span>
        </div>
      </div>
    </div>
  );
}

export function EnhancedPaymentForm(props: EnhancedPaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  );
}