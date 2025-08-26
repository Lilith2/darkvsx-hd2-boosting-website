import React, { useState, useEffect } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CreditCard,
  AlertTriangle,
  Shield,
  CheckCircle,
  Smartphone,
  Wallet,
} from "lucide-react";

// Types
interface CartItem {
  service: {
    id: string;
    title: string;
    price: number;
  };
  quantity: number;
}

interface PaymentMetadata {
  orderId: string;
  userEmail: string;
  userName: string;
}

interface CustomOrderData {
  id: string;
  items: Array<{
    category: string;
    item_name: string;
    quantity: number;
    price_per_unit: number;
    total_price: number;
    description?: string;
  }>;
  notes: string;
  customer_email?: string;
  customer_discord?: string;
  special_instructions: string;
  total: number;
}

interface SimplePaymentFormProps {
  total: number;
  cartItems: CartItem[];
  customOrderData?: CustomOrderData | null;
  referralCode?: string;
  referralDiscount?: number;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  metadata: PaymentMetadata;
}

export function SimplePaymentForm({
  total,
  cartItems,
  customOrderData = null,
  referralCode = "",
  referralDiscount = 0,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  metadata,
}: SimplePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");

  // Initialize payment intent
  useEffect(() => {
    const initializePayment = async () => {
      if (!cartItems.length || total < 0.5) {
        setIsInitializing(false);
        return;
      }

      try {
        const requestBody = {
          services: cartItems.map((item) => ({
            id: item.service.id,
            quantity: item.quantity,
          })),
          customOrderData: customOrderData
            ? {
                items: customOrderData.items,
                special_instructions: customOrderData.special_instructions,
                customer_discord: customOrderData.customer_discord,
              }
            : undefined,
          referralCode: referralCode || "",
          referralDiscount: Math.max(0, referralDiscount || 0),
          creditsUsed: 0,
          currency: "usd",
          metadata: {
            ...metadata,
            timestamp: new Date().toISOString(),
            clientTotal: total.toFixed(2),
          },
        };

        console.log("Creating payment intent...");

        const response = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        let data;
        let responseText = "";
        try {
          responseText = await response.text();
          if (!responseText.trim()) {
            throw new Error("Empty response from server");
          }
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error("Failed to parse response:", {
            error:
              parseError instanceof Error
                ? parseError.message
                : JSON.stringify(parseError),
            responseText: responseText.substring(0, 500), // Log first 500 chars for debugging
            status: response.status,
            statusText: response.statusText,
          });

          // Try to provide a more helpful error message based on status
          if (response.status === 500) {
            throw new Error(
              "Server error occurred. Please try again or clear your cart if the issue persists.",
            );
          } else if (response.status === 400) {
            // Try to extract any error information from the response text
            let errorMessage =
              "Invalid cart data. Please clear your cart and try again.";
            if (
              responseText &&
              responseText.includes("payment_method_configuration")
            ) {
              errorMessage =
                "Payment configuration error. Please try again or contact support.";
            } else if (responseText && responseText.includes("Stripe")) {
              errorMessage = "Payment processor error. Please try again.";
            }
            throw new Error(errorMessage);
          } else {
            throw new Error(
              `Payment server error (${response.status}). Please try again.`,
            );
          }
        }

        if (!response.ok) {
          // Handle specific error cases
          if (data && data.action === "clear_cart") {
            console.log("Cart cleanup required:", data.details);
            // Redirect to cart cleanup
            window.location.href = "/cart-cleanup";
            return;
          }

          const errorMessage = data
            ? data.error || data.details || `Server error: ${response.status}`
            : `HTTP error: ${response.status} ${response.statusText}`;
          throw new Error(errorMessage);
        }

        if (!data.clientSecret) {
          throw new Error("Invalid payment response: missing client secret");
        }

        setClientSecret(data.clientSecret);
        console.log("Payment intent created successfully");
      } catch (error: any) {
        console.error("Error initializing payment:", error);
        let errorMsg = "Failed to initialize payment";

        if (error.message) {
          errorMsg = error.message;
        }

        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
      } finally {
        setIsInitializing(false);
      }
    };

    initializePayment();
  }, [total, cartItems.length, referralCode, referralDiscount, metadata]);

  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      const errorMsg =
        "Payment system not ready. Please refresh and try again.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
      return;
    }

    if (isProcessing || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      // Validate form
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(
          submitError.message || "Please complete all required payment fields",
        );
      }

      // Confirm payment
      const confirmResult = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order/success`,
          payment_method_data: {
            billing_details: {
              name: metadata.userName || "Customer",
              email: metadata.userEmail,
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
          case "authentication_error":
            errorMsg = "Payment authentication failed. Please try again.";
            break;
          case "rate_limit_error":
            errorMsg =
              "Too many payment attempts. Please wait a moment and try again.";
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

      switch (paymentIntent.status) {
        case "succeeded":
        case "processing":
          console.log("Payment successful:", paymentIntent.id);
          onPaymentSuccess(paymentIntent);
          break;
        case "requires_payment_method":
          throw new Error(
            "Payment failed. Please try a different payment method.",
          );
        case "requires_confirmation":
          throw new Error(
            "Payment requires additional confirmation. Please try again.",
          );
        case "requires_action":
          throw new Error(
            "Payment requires additional authentication. Please complete the verification and try again.",
          );
        case "canceled":
          throw new Error("Payment was canceled. Please try again.");
        default:
          throw new Error(
            `Payment status: ${paymentIntent.status}. Please contact support if this persists.`,
          );
      }
    } catch (err: any) {
      console.error("Payment error:", err);
      const errorMsg =
        err.message || "An unexpected error occurred during payment.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">
              Initializing secure payment...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (errorMessage && !clientSecret) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            {errorMessage}
          </AlertDescription>
        </Alert>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="w-full"
        >
          Retry Payment Setup
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Methods Info */}
      <Alert className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
        <Shield className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          <div className="flex items-center justify-between">
            <span>Secure payment with multiple options available</span>
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
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Element */}
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
              terms: {
                card: "never",
              },
              wallets: {
                applePay: "auto",
                googlePay: "auto",
              },
            }}
          />
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

        {/* Payment Button */}
        <div className="space-y-4">
          <Button
            type="submit"
            disabled={
              !stripe ||
              !elements ||
              isSubmitting ||
              isProcessing ||
              !clientSecret
            }
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
                Complete Payment • ${total.toFixed(2)}
              </>
            )}
          </Button>

          {/* Processing Notice */}
          {(isSubmitting || isProcessing) && (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
              <Loader2 className="h-4 w-4 animate-spin text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <div className="font-semibold">Processing your payment...</div>
                <div className="text-sm mt-1">
                  Please do not close this window or refresh the page
                </div>
              </AlertDescription>
            </Alert>
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
          <Shield className="w-4 h-4 text-purple-500" />
          <span>Fraud Protected</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Wallet className="w-4 h-4 text-orange-500" />
          <span>Multiple Options</span>
        </div>
      </div>
    </div>
  );
}
