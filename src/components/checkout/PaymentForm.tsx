import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CreditCard, Shield, Lock, CheckCircle } from "lucide-react";
import { PayPalButtons } from "@paypal/react-paypal-js";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <CreditCard className="w-5 h-5 mr-2" />
          Payment Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Security Notice */}
        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Secure Payment</h4>
            <p className="text-sm text-blue-700">
              Your payment is processed securely through PayPal. We never store your payment information.
            </p>
          </div>
        </div>

        {/* Order Total */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-lg font-medium">Total Amount</span>
            <span className="text-2xl font-bold text-primary">${total.toFixed(2)}</span>
          </div>
        </div>

        {/* Terms and Conditions */}
        <div className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={agreeToTerms}
              onCheckedChange={onAgreeToTermsChange}
              disabled={disabled}
            />
            <Label htmlFor="terms" className="text-sm leading-5 cursor-pointer">
              I agree to the{" "}
              <a
                href="/terms"
                target="_blank"
                className="text-primary hover:underline"
              >
                Terms of Service
              </a>{" "}
              and{" "}
              <a
                href="/privacy"
                target="_blank"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
            </Label>
          </div>

          {/* Payment Security Features */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL encryption</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <CheckCircle className="w-4 h-4" />
              <span>PayPal Buyer Protection</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>No card details stored</span>
            </div>
          </div>
        </div>

        {/* PayPal Payment Button */}
        <div className="space-y-4">
          {agreeToTerms ? (
            <div className="paypal-button-container">
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "paypal",
                }}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          value: total.toFixed(2),
                        },
                      },
                    ],
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
              className="w-full" 
              size="lg"
            >
              Please accept the terms to continue
            </Button>
          )}
        </div>

        {isProcessing && (
          <div className="flex items-center justify-center space-x-2 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm font-medium">Processing your payment...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
