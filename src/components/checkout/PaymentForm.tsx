import React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Shield, Lock, CheckCircle, ExternalLink } from "lucide-react";
import { PayPalButtons } from "@paypal/react-paypal-js";
import Link from "next/link";

interface PaymentFormProps {
  total: number;
  agreeToTerms: boolean;
  onAgreeToTermsChange: (agree: boolean) => void;
  onPayPalApprove: (data: any, actions: any) => Promise<void>;
  onPayPalError: (err: any) => void;
  isProcessing: boolean;
  disabled?: boolean;
}

export function PaymentForm({
  total,
  agreeToTerms,
  onAgreeToTermsChange,
  onPayPalApprove,
  onPayPalError,
  isProcessing,
  disabled = false,
}: PaymentFormProps) {
  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100">Secure Payment</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Your payment is protected by PayPal's advanced security. We never store your payment information.
            </p>
          </div>
        </div>
      </div>

      {/* Terms and Conditions */}
      <div className="space-y-4">
        <div className="p-4 border border-border/50 rounded-xl bg-muted/30">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={onAgreeToTermsChange}
              disabled={disabled}
              className="mt-1"
            />
            <div className="flex-1">
              <Label htmlFor="terms" className="text-base leading-6 cursor-pointer">
                I agree to the{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Terms of Service
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-primary hover:underline inline-flex items-center"
                >
                  Privacy Policy
                  <ExternalLink className="w-3 h-3 ml-1" />
                </Link>
              </Label>
              <p className="text-sm text-muted-foreground mt-2">
                By continuing, you acknowledge that you have read and agree to our terms.
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Payment Security Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Lock className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium">SSL Encrypted</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium">Buyer Protection</span>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
            <Shield className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium">Secure Processing</span>
          </div>
        </div>
      </div>

      {/* PayPal Payment Button */}
      <div className="space-y-4">
        {agreeToTerms && !disabled ? (
          <div className="paypal-button-container">
            <PayPalButtons
              style={{
                layout: "vertical",
                color: "blue",
                shape: "rect",
                label: "paypal",
                height: 50,
              }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  purchase_units: [
                    {
                      amount: {
                        value: total.toFixed(2),
                        currency_code: "USD",
                      },
                      description: `HelldiversBoost Order - Total: $${total.toFixed(2)}`,
                    },
                  ],
                  application_context: {
                    shipping_preference: "NO_SHIPPING",
                  },
                });
              }}
              onApprove={onPayPalApprove}
              onError={onPayPalError}
              disabled={isProcessing || disabled}
            />
          </div>
        ) : (
          <Button 
            disabled 
            className="w-full h-14 text-lg" 
            size="lg"
          >
            {!agreeToTerms ? "Please accept the terms to continue" : "Please complete required information"}
          </Button>
        )}
      </div>

      {isProcessing && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/20 dark:to-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
            <span className="text-base font-semibold">Processing your payment...</span>
          </div>
          <p className="text-sm text-center text-muted-foreground mt-2">
            Please do not close this window or refresh the page
          </p>
        </div>
      )}
    </div>
  );
}
