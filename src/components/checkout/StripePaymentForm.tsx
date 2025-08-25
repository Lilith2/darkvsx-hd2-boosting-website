import React, { useState, useEffect, useRef } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Shield,
  Lock,
  CheckCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
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
  const [initError, setInitError] = useState<string>("");
  const [supportedMethods, setSupportedMethods] = useState<string[]>([]);
  const { toast } = useToast();
  const initializingRef = useRef(false);

  useEffect(() => {
    const initializePayment = async () => {
      // Prevent multiple concurrent initializations
      if (initializingRef.current || disabled) {
        setIsLoading(false);
        return;
      }

      // Check for valid cart and total
      if (total <= 0 || cartItems.length === 0) {
        setIsLoading(false);
        setInitError(
          "Your cart is empty or the total amount is too low for payment processing.",
        );
        return;
      }

      initializingRef.current = true;
      setIsLoading(true);
      setInitError("");

      try {
        // Prepare payment data
        const services = cartItems
          .filter((item) => !item.service.customOrderData)
          .map((item) => ({
            id: item.service.id,
            quantity: item.quantity,
          }));

        const customOrderData = cartItems.find(
          (item) => item.service.customOrderData,
        )?.service.customOrderData;

        console.log("Creating payment intent with data:", {
          services,
          customOrderData,
          referralDiscount,
          creditsUsed,
          total,
        });

        // Create payment intent
        const response = await fetch("/api/stripe/create-payment-intent", {
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
            metadata,
          }),
        });

        // Check if response is ok first, then parse once
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = {
              error: `HTTP ${response.status}: ${response.statusText}`,
            };
          }
          throw new Error(
            errorData.error ||
              errorData.details ||
              `Payment server error (${response.status})`,
          );
        }

        // Parse successful response
        const data = await response.json();

        console.log("Payment intent created successfully:", {
          clientSecret: data.clientSecret ? "✓" : "✗",
          amount: data.amount,
          supportedMethods: data.supportedPaymentMethods,
        });

        if (!data.clientSecret) {
          throw new Error("Invalid payment response - missing client secret");
        }

        setClientSecret(data.clientSecret);
        setSupportedMethods(data.supportedPaymentMethods || []);

        // Show success toast
        toast({
          title: "Payment initialized",
          description: `Ready to process payment of $${data.amount.toFixed(2)}`,
        });
      } catch (error: any) {
        console.error("Error initializing payment:", error);
        const errorMessage = error.message || "Failed to initialize payment";
        setInitError(errorMessage);
        onPaymentError(errorMessage);

        // Show error toast
        toast({
          title: "Payment initialization failed",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        initializingRef.current = false;
      }
    };

    initializePayment();
  }, [
    total,
    cartItems,
    referralDiscount,
    creditsUsed,
    disabled,
    metadata,
    onPaymentError,
    toast,
  ]);

  const handlePaymentSuccess = (paymentIntent: any) => {
    toast({
      title: "Payment Successful! 🎉",
      description: `Payment of $${total.toFixed(2)} processed successfully.`,
    });
    onPaymentSuccess(paymentIntent);
  };

  const handlePaymentErrorInternal = (error: string) => {
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
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              Setting up all available payment methods including cards, digital
              wallets, and buy-now-pay-later options
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (initError || !clientSecret) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            Payment Initialization Failed
          </h3>
          <p className="text-muted-foreground mb-4">
            {initError ||
              "Unable to initialize secure payment. Please try again."}
          </p>
          {initError.includes("cart is empty") && (
            <p className="text-sm text-blue-600 dark:text-blue-400">
              Please add items to your cart before proceeding to payment.
            </p>
          )}
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
      spacingUnit: "6px",
      borderRadius: "12px",
      focusBoxShadow: "0 0 0 3px hsla(213, 93%, 68%, 0.2)",
    },
    rules: {
      ".Tab": {
        padding: "12px 16px",
        border: "1px solid hsl(var(--border))",
        borderRadius: "8px",
        backgroundColor: "hsl(var(--background))",
        color: "hsl(var(--foreground))",
        transition: "all 0.2s ease",
      },
      ".Tab:hover": {
        backgroundColor: "hsl(var(--muted))",
        borderColor: "hsl(var(--primary))",
      },
      ".Tab--selected": {
        backgroundColor: "hsl(var(--primary))",
        color: "hsl(var(--primary-foreground))",
        borderColor: "hsl(var(--primary))",
      },
      ".Input": {
        borderRadius: "8px",
        border: "1px solid hsl(var(--border))",
        backgroundColor: "hsl(var(--background))",
        padding: "12px 16px",
        fontSize: "16px",
      },
      ".Input:focus": {
        borderColor: "hsl(var(--primary))",
        boxShadow: "0 0 0 3px hsla(213, 93%, 68%, 0.1)",
      },
    },
  };

  const options = {
    clientSecret,
    appearance,
    loader: "auto" as const,
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
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                Secure Payment with Stripe
              </h4>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Your payment is protected by Stripe's advanced security. We
                never store your payment information.
              </p>
              {supportedMethods.length > 0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                  {supportedMethods.length} payment methods available including
                  cards, digital wallets, and BNPL options
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Lock className="w-5 h-5 mr-2 text-green-600" />
            Complete Your Payment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Elements stripe={stripePromise} options={options}>
            <StripePaymentElement
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentErrorInternal}
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              <span className="text-sm font-medium">Multiple Methods</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
