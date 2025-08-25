import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  CreditCard,
  AlertTriangle,
  Shield,
  CheckCircle,
  Smartphone,
  Wallet,
  DollarSign,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StripePaymentElementProps {
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  total: number;
}

export function StripePaymentElement({
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  disabled = false,
  total,
}: StripePaymentElementProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isElementReady, setIsElementReady] = useState(false);

  // Track element readiness
  useEffect(() => {
    if (elements) {
      const paymentElement = elements.getElement("payment");
      if (paymentElement) {
        paymentElement.on("ready", () => {
          setIsElementReady(true);
        });
      }
    }
  }, [elements]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing || disabled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Validate form before submitting
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(
          submitError.message || "Please complete all required fields.",
        );
        setIsSubmitting(false);
        return;
      }

      // Confirm the payment with enhanced configuration
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/order/success`,
          payment_method_data: {
            billing_details: {
              name: "HellDivers 2 Boosting Customer",
            },
          },
        },
        redirect: "if_required",
      });

      if (error) {
        console.error("Payment error:", error);
        let errorMsg = "An unexpected error occurred.";

        // Enhanced error messages based on error types
        switch (error.type) {
          case "card_error":
            errorMsg =
              error.message ||
              "Your card was declined. Please try a different payment method.";
            break;
          case "validation_error":
            errorMsg =
              error.message ||
              "Please check your payment information and try again.";
            break;
          case "api_connection_error":
            errorMsg =
              "Network error. Please check your connection and try again.";
            break;
          case "api_error":
            errorMsg =
              "Payment service temporarily unavailable. Please try again in a moment.";
            break;
          case "authentication_error":
            errorMsg = "Payment authentication failed. Please try again.";
            break;
          case "rate_limit_error":
            errorMsg =
              "Too many payment attempts. Please wait a moment and try again.";
            break;
          default:
            errorMsg = error.message || errorMsg;
        }

        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
      } else if (paymentIntent) {
        if (paymentIntent.status === "succeeded") {
          console.log("Payment succeeded:", paymentIntent);
          onPaymentSuccess(paymentIntent);
        } else if (paymentIntent.status === "processing") {
          console.log("Payment processing:", paymentIntent);
          // For some payment methods, the payment might be processing
          onPaymentSuccess(paymentIntent);
        } else if (paymentIntent.status === "requires_payment_method") {
          setErrorMessage(
            "Payment was not successful. Please try a different payment method.",
          );
          onPaymentError(
            "Payment was not successful. Please try a different payment method.",
          );
        } else {
          const errorMsg = `Payment status: ${paymentIntent.status}. Please contact support if this persists.`;
          setErrorMessage(errorMsg);
          onPaymentError(errorMsg);
        }
      }
    } catch (err: any) {
      console.error("Unexpected error during payment:", err);
      const errorMsg =
        err.message || "An unexpected error occurred during payment.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading =
    !stripe || !elements || isSubmitting || isProcessing || !isElementReady;

  return (
    <div className="space-y-6">
      {/* Payment Methods Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <CreditCard className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium">Cards</span>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <Smartphone className="w-5 h-5 text-green-600" />
          <span className="text-sm font-medium">Digital Wallets</span>
        </div>
        <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <Wallet className="w-5 h-5 text-purple-600" />
          <span className="text-sm font-medium">Buy Now, Pay Later</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element Container */}
        <div className="relative">
          <div className="p-6 border border-border/50 rounded-xl bg-background/50 backdrop-blur-sm">
            {!isElementReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-10">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span className="text-base font-medium">
                    Loading payment methods...
                  </span>
                </div>
              </div>
            )}

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
                  "us_bank_account",
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
                    address: {
                      line1: "never",
                      line2: "never",
                      city: "never",
                      state: "never",
                      postalCode: "never",
                      country: "never",
                    },
                  },
                },
                terms: {
                  card: "never",
                  auBankAccount: "never",
                  bancontact: "never",
                  eps: "never",
                  fpx: "never",
                  giropay: "never",
                  grabPay: "never",
                  ideal: "never",
                  p24: "never",
                  sepaDebit: "never",
                  sofort: "never",
                  usBankAccount: "never",
                },
                wallets: {
                  applePay: "auto",
                  googlePay: "auto",
                },
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="font-medium">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        {/* Payment Summary */}
        <div className="p-4 bg-gradient-to-r from-primary/5 to-blue-500/5 rounded-xl border border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">Secure Payment</p>
                <p className="text-sm text-muted-foreground">
                  Your payment is protected by Stripe
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-primary">
                ${total.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            type="submit"
            disabled={isLoading || disabled}
            className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg transition-all duration-200"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                {!isElementReady
                  ? "Loading Payment Methods..."
                  : "Processing Payment..."}
              </>
            ) : (
              <>
                <CheckCircle className="w-6 h-6 mr-3" />
                Complete Payment • ${total.toFixed(2)}
              </>
            )}
          </Button>

          {/* Processing Notice */}
          {(isSubmitting || isProcessing) && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                <div className="text-center">
                  <p className="font-semibold text-amber-800 dark:text-amber-200">
                    Processing your payment...
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Please do not close this window or refresh the page
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </form>

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
          <DollarSign className="w-4 h-4 text-purple-500" />
          <span>Fraud Protected</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Wallet className="w-4 h-4 text-orange-500" />
          <span>Multiple Methods</span>
        </div>
      </div>
    </div>
  );
}
