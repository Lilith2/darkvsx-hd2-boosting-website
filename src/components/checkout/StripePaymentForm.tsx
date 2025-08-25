import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, CheckCircle, Loader2 } from "lucide-react";
import { StripePaymentElement } from "./StripePaymentElement";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface CartItem {
  service: {
    id: string;
    title: string;
    price: number;
    customOrderData?: {
      items: Array<{
        category: string;
        item_name: string;
        quantity: number;
        price_per_unit: number;
        total_price: number;
        description?: string;
      }>;
      special_instructions?: string;
      customer_discord?: string;
    };
  };
  quantity: number;
}

interface StripePaymentFormProps {
  total: number;
  cartItems: CartItem[];
  referralDiscount?: number;
  creditsUsed?: number;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  metadata?: Record<string, string>;
}

export function StripePaymentForm({
  total,
  cartItems,
  referralDiscount = 0,
  creditsUsed = 0,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  disabled = false,
  metadata = {},
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const { toast } = useToast();

  // Memoize metadata to prevent unnecessary re-renders
  const memoizedMetadata = useMemo(() => metadata, [JSON.stringify(metadata)]);

  // Memoize error handler
  const handlePaymentError = useCallback((error: string) => {
    onPaymentError(error);
  }, [onPaymentError]);

  useEffect(() => {
    const initializePayment = async () => {
      // Prevent concurrent initialization
      if (isInitializing) return;

      try {
        setIsInitializing(true);
        setIsLoading(true);

        // Prepare secure payment data (server will calculate amounts)
        const services = cartItems
          .filter(item => !item.service.customOrderData)
          .map(item => ({
            id: item.service.id,
            quantity: item.quantity,
          }));

        const customOrderData = cartItems
          .find(item => item.service.customOrderData)?.service.customOrderData;

        // Create payment intent with secure server-side pricing
        const intentResponse = await fetch(
          "/api/stripe/create-payment-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              services,
              customOrderData,
              referralDiscount,
              creditsUsed,
              currency: "usd",
              metadata: memoizedMetadata,
            }),
          },
        );

        // Read the response body only once
        const responseData = await intentResponse.json();

        if (!intentResponse.ok) {
          if (intentResponse.status === 429) {
            throw new Error(
              "Too many requests. Please wait a moment and try again.",
            );
          }
          throw new Error(responseData.error || "Failed to create payment intent");
        }

        setClientSecret(responseData.clientSecret);
      } catch (error: any) {
        console.error("Error initializing payment:", error);
        onPaymentError(error.message || "Failed to initialize payment");
      } finally {
        setIsLoading(false);
        setIsInitializing(false);
      }
    };

    if (total > 0 && !disabled && !isInitializing) {
      // Add a small delay to avoid rate limits
      const timeoutId = setTimeout(initializePayment, 200);
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [total, disabled, isInitializing]);

  const handlePaymentSuccess = (paymentIntent: any) => {
    toast({
      title: "Payment Successful!",
      description: `Payment of $${total.toFixed(2)} processed successfully.`,
    });
    onPaymentSuccess(paymentIntent);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: "Payment Failed",
      description: error,
      variant: "destructive",
    });
    onPaymentError(error);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">
              Initializing secure payment...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <Shield className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Payment Initialization Failed
          </h3>
          <p className="text-muted-foreground">
            Unable to initialize secure payment. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "hsl(213, 93%, 68%)",
      colorBackground: "hsl(var(--background))",
      colorText: "hsl(var(--foreground))",
      colorDanger: "hsl(var(--destructive))",
      fontFamily: "Inter, system-ui, sans-serif",
      spacingUnit: "4px",
      borderRadius: "8px",
    },
  };

  const options = {
    clientSecret,
    appearance,
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <Card className="border-0 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Secure Payment with Stripe
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your payment is protected by Stripe's advanced security. We
                never store your payment information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lock className="w-5 h-5 mr-2 text-green-600" />
            Payment Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentElement
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
              isProcessing={isProcessing}
              disabled={disabled}
              total={total}
            />
          </Elements>
        </CardContent>
      </Card>

      {/* Security Features */}
      <Card className="border-0 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">256-bit SSL</span>
            </div>
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">PCI Compliant</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Fraud Protection</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
