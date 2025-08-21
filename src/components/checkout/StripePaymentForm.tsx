import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  CreditCard,
  Banknote,
  Smartphone,
  Link2,
  Star,
  Shield,
  Lock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { StripePaymentElement } from './StripePaymentElement';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
}

interface StripePaymentFormProps {
  total: number;
  onPaymentSuccess: (paymentIntent: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  disabled?: boolean;
  metadata?: Record<string, string>;
}

const getPaymentIcon = (iconType: string) => {
  switch (iconType) {
    case 'credit-card':
      return <CreditCard className="w-5 h-5" />;
    case 'bank':
      return <Banknote className="w-5 h-5" />;
    case 'smartphone':
      return <Smartphone className="w-5 h-5" />;
    case 'link':
      return <Link2 className="w-5 h-5" />;
    case 'star':
      return <Star className="w-5 h-5" />;
    default:
      return <CreditCard className="w-5 h-5" />;
  }
};

export function StripePaymentForm({
  total,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  disabled = false,
  metadata = {},
}: StripePaymentFormProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('card');
  const { toast } = useToast();

  useEffect(() => {
    const initializePayment = async () => {
      try {
        setIsLoading(true);

        // Create payment intent
        const intentResponse = await fetch('/api/stripe/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            currency: 'usd',
            metadata,
          }),
        });

        if (!intentResponse.ok) {
          throw new Error('Failed to create payment intent');
        }

        const intentData = await intentResponse.json();
        setClientSecret(intentData.clientSecret);

        // Get available payment methods
        const methodsResponse = await fetch('/api/stripe/payment-methods');
        if (methodsResponse.ok) {
          const methodsData = await methodsResponse.json();
          setPaymentMethods(methodsData.paymentMethods);
        }
      } catch (error: any) {
        console.error('Error initializing payment:', error);
        onPaymentError(error.message || 'Failed to initialize payment');
      } finally {
        setIsLoading(false);
      }
    };

    if (total > 0 && !disabled) {
      initializePayment();
    }
  }, [total, disabled, metadata, onPaymentError]);

  const handlePaymentSuccess = (paymentIntent: any) => {
    toast({
      title: 'Payment Successful!',
      description: `Payment of $${total.toFixed(2)} processed successfully.`,
    });
    onPaymentSuccess(paymentIntent);
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: 'Payment Failed',
      description: error,
      variant: 'destructive',
    });
    onPaymentError(error);
  };

  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-3">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-lg font-medium">Initializing secure payment...</span>
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
          <h3 className="text-lg font-semibold mb-2">Payment Initialization Failed</h3>
          <p className="text-muted-foreground">
            Unable to initialize secure payment. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: 'hsl(213, 93%, 68%)',
      colorBackground: 'hsl(var(--background))',
      colorText: 'hsl(var(--foreground))',
      colorDanger: 'hsl(var(--destructive))',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px',
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
                Your payment is protected by Stripe's advanced security. We never store your payment information.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Payment Methods */}
      {paymentMethods.length > 0 && (
        <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="w-5 h-5 mr-2 text-primary" />
              Available Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`p-4 border rounded-xl transition-all cursor-pointer ${
                    selectedPaymentMethod === method.id
                      ? 'border-primary bg-primary/5 shadow-lg'
                      : 'border-border/50 hover:border-primary/50 bg-muted/20'
                  }`}
                  onClick={() => setSelectedPaymentMethod(method.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      selectedPaymentMethod === method.id 
                        ? 'bg-primary text-white' 
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {getPaymentIcon(method.icon)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{method.name}</h4>
                      <p className="text-xs text-muted-foreground">{method.description}</p>
                    </div>
                    {method.enabled && (
                      <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
                        Available
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
