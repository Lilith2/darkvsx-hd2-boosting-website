import React, { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertTriangle } from "lucide-react";

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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Comprehensive validation before proceeding
    if (!stripe) {
      const errorMsg = "Stripe not loaded. Please refresh and try again.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
      return;
    }

    if (!elements) {
      const errorMsg = "Payment form not loaded. Please refresh and try again.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
      return;
    }

    if (isProcessing || disabled) {
      console.log("Payment already processing or disabled, ignoring submit");
      return;
    }

    if (total <= 0) {
      const errorMsg = "Invalid payment amount.";
      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    console.log(`Attempting payment confirmation for $${total.toFixed(2)}`);

    try {
      // Validate form completion before confirming
      const {error: submitError} = await elements.submit();
      if (submitError) {
        console.error("Form validation error:", submitError);
        const errorMsg = submitError.message || "Please complete all required payment fields.";
        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
        return;
      }

      // Confirm the payment with enhanced error handling
      const confirmResult = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
        confirmParams: {
          return_url: window.location.origin + "/checkout/success",
        },
      });

      const { error, paymentIntent } = confirmResult;

      if (error) {
        console.error("Payment confirmation error:", {
          type: error.type,
          code: error.code,
          message: error.message,
          declineCode: error.decline_code
        });

        let errorMsg = "Payment failed.";

        // Provide specific error messages based on error type
        switch (error.type) {
          case "card_error":
            errorMsg = error.message || "Your card was declined. Please try a different payment method.";
            break;
          case "validation_error":
            errorMsg = error.message || "Please check your payment information and try again.";
            break;
          case "api_connection_error":
            errorMsg = "Network error. Please check your connection and try again.";
            break;
          case "api_error":
            errorMsg = "Payment processing error. Please try again or contact support.";
            break;
          case "authentication_error":
            errorMsg = "Payment authentication failed. Please try again.";
            break;
          case "rate_limit_error":
            errorMsg = "Too many payment attempts. Please wait a moment and try again.";
            break;
          default:
            errorMsg = error.message || "An unexpected payment error occurred.";
        }

        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
        return;
      }

      // Validate payment intent status
      if (!paymentIntent) {
        const errorMsg = "Payment confirmation failed. Please try again.";
        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
        return;
      }

      switch (paymentIntent.status) {
        case "succeeded":
          console.log("Payment succeeded:", {
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            status: paymentIntent.status
          });
          onPaymentSuccess(paymentIntent);
          break;

        case "processing":
          console.log("Payment processing:", paymentIntent.id);
          // For some payment methods, the payment may still be processing
          onPaymentSuccess(paymentIntent);
          break;

        case "requires_payment_method":
          const errorMsg = "Payment failed. Please try a different payment method.";
          setErrorMessage(errorMsg);
          onPaymentError(errorMsg);
          break;

        case "requires_confirmation":
          const confirmErrorMsg = "Payment requires additional confirmation. Please try again.";
          setErrorMessage(confirmErrorMsg);
          onPaymentError(confirmErrorMsg);
          break;

        case "requires_action":
          const actionErrorMsg = "Payment requires additional authentication. Please complete the verification and try again.";
          setErrorMessage(actionErrorMsg);
          onPaymentError(actionErrorMsg);
          break;

        case "canceled":
          const cancelErrorMsg = "Payment was canceled. Please try again.";
          setErrorMessage(cancelErrorMsg);
          onPaymentError(cancelErrorMsg);
          break;

        default:
          const statusErrorMsg = `Payment status: ${paymentIntent.status}. Please contact support if this persists.`;
          setErrorMessage(statusErrorMsg);
          onPaymentError(statusErrorMsg);
          break;
      }

    } catch (err: any) {
      console.error("Unexpected error during payment confirmation:", {
        error: err.message,
        name: err.name,
        stack: err.stack
      });

      let errorMsg = "An unexpected error occurred during payment.";

      if (err.name === 'NetworkError') {
        errorMsg = "Network error. Please check your connection and try again.";
      } else if (err.message) {
        errorMsg = err.message;
      }

      setErrorMessage(errorMsg);
      onPaymentError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = !stripe || !elements || isSubmitting || isProcessing;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-4 border border-border/50 rounded-xl bg-background/50">
        <PaymentElement
          options={{
            layout: "tabs",
            paymentMethodOrder: [
              "card",
              "google_pay",
              "apple_pay",
              "amazon_pay",
              "us_bank_account",
              "link",
              "cashapp",
              "venmo",
              "klarna",
              "affirm",
            ],
          }}
        />
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-800 dark:text-red-200">
                Payment Error
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {errorMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment Button */}
      <div className="space-y-3">
        <Button
          type="submit"
          disabled={isLoading || disabled}
          className="w-full h-14 text-lg bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2" />
              Pay ${total.toFixed(2)}
            </>
          )}
        </Button>

        {isLoading && (
          <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
            <div className="flex items-center justify-center space-x-3">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-base font-semibold">
                Securing your payment...
              </span>
            </div>
            <p className="text-sm text-center text-muted-foreground mt-2">
              Please do not close this window or refresh the page
            </p>
          </div>
        )}
      </div>
    </form>
  );
}
