import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShoppingCart,
  User,
  CreditCard,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Package,
  Loader2,
} from "lucide-react";
import { EnhancedPaymentForm } from "./EnhancedPaymentForm";
import { CartReviewStep } from "./steps/CartReviewStep";
import { OrderDetailsStep } from "./steps/OrderDetailsStep";

interface UnifiedCartItem {
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
  service: {
    id: string;
    title: string;
    price: number;
  };
}

interface NewStepperCheckoutProps {
  cartItems: UnifiedCartItem[];
  updateQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  subtotal: number;
  taxAmount: number;
  total: number;
  onPaymentSuccess: (result: any) => void;
  onPaymentError: (error: string) => void;
  isProcessing: boolean;
  user: any;
  isAuthenticated: boolean;
}

const steps = [
  { id: 1, name: "Cart Review", icon: ShoppingCart },
  { id: 2, name: "Order Details", icon: User },
  { id: 3, name: "Payment", icon: CreditCard },
];

export function NewStepperCheckout({
  cartItems,
  updateQuantity,
  removeFromCart,
  subtotal,
  taxAmount,
  total,
  onPaymentSuccess,
  onPaymentError,
  isProcessing,
  user,
  isAuthenticated,
}: NewStepperCheckoutProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [stepData, setStepData] = useState({
    // Guest info (if not authenticated)
    guestName: "",
    guestEmail: "",
    
    // Order details
    discordUsername: "",
    orderNotes: "",
    specialInstructions: "",
    agreeToTerms: false,
    
    // Promo/referral
    promoCode: "",
    promoDiscount: 0,
  });

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return cartItems.length > 0;
      case 2:
        if (!isAuthenticated) {
          return (
            stepData.guestName.trim() &&
            stepData.guestEmail.trim() &&
            stepData.discordUsername.trim() &&
            stepData.agreeToTerms
          );
        }
        return stepData.discordUsername.trim() && stepData.agreeToTerms;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceedToNextStep() && currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateStepData = (updates: Partial<typeof stepData>) => {
    setStepData(prev => ({ ...prev, ...updates }));
  };

  const getCustomerInfo = () => {
    return {
      name: isAuthenticated ? (user?.username || user?.email || "Customer") : stepData.guestName,
      email: isAuthenticated ? user?.email : stepData.guestEmail,
      discord: stepData.discordUsername,
      notes: stepData.orderNotes,
      specialInstructions: stepData.specialInstructions,
    };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Progress Steps */}
      <div className="relative">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            const isNext = currentStep + 1 === step.id;

            return (
              <motion.div
                key={step.id}
                className="flex flex-col items-center space-y-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${
                      isComplete
                        ? "bg-green-500 border-green-500 text-white"
                        : isActive
                        ? "bg-primary border-primary text-white shadow-lg shadow-primary/30"
                        : isNext
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-muted-foreground/20 text-muted-foreground"
                    }
                  `}
                >
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-center">
                  <p
                    className={`
                      text-sm font-medium transition-colors duration-300
                      ${
                        isActive
                          ? "text-primary"
                          : isComplete
                          ? "text-green-600"
                          : "text-muted-foreground"
                      }
                    `}
                  >
                    {step.name}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Progress Line */}
        <div className="absolute top-6 left-6 right-6 h-0.5 bg-muted -z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-green-500"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <CartReviewStep
              cartItems={cartItems}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              subtotal={subtotal}
              taxAmount={taxAmount}
              total={total}
            />
          )}

          {currentStep === 2 && (
            <OrderDetailsStep
              stepData={stepData}
              updateStepData={updateStepData}
              isAuthenticated={isAuthenticated}
              user={user}
            />
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Complete Payment</h2>
                  <p className="text-muted-foreground text-lg">
                    Secure payment with credits support and multiple payment options
                  </p>
                </div>
              </motion.div>

              <EnhancedPaymentForm
                cartItems={cartItems}
                subtotal={subtotal}
                taxAmount={taxAmount}
                total={total}
                onPaymentSuccess={onPaymentSuccess}
                onPaymentError={onPaymentError}
                isProcessing={isProcessing}
                customerInfo={getCustomerInfo()}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < 3 && (
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Previous</span>
          </Button>

          <Button
            onClick={nextStep}
            disabled={!canProceedToNextStep()}
            className="flex items-center space-x-2 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          >
            <span>Next</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Order Summary Sidebar */}
      <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Package className="w-5 h-5 mr-2" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Items ({cartItems.length}):</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Tax (8%):</span>
              <span>${taxAmount.toFixed(2)}</span>
            </div>
            {stepData.promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-${stepData.promoDiscount.toFixed(2)}</span>
              </div>
            )}
          </div>
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          {stepData.promoCode && (
            <Badge variant="secondary" className="w-full justify-center">
              Code: {stepData.promoCode}
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
