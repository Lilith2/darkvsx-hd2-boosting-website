import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard, AlertTriangle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || isProcessing || disabled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        console.error('Payment error:', error);
        const errorMsg = error.message || 'An unexpected error occurred.';
        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('Payment succeeded:', paymentIntent);
        onPaymentSuccess(paymentIntent);
      } else {
        const errorMsg = 'Payment was not completed successfully.';
        setErrorMessage(errorMsg);
        onPaymentError(errorMsg);
      }
    } catch (err: any) {
      console.error('Unexpected error during payment:', err);
      const errorMsg = err.message || 'An unexpected error occurred during payment.';
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
            layout: 'tabs',
            paymentMethodOrder: ['card', 'us_bank_account', 'link'],
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
