import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { StepperCheckout } from "../src/components/checkout/StepperCheckout";

export default function UnifiedCheckoutPage() {
  const {
    items: cartItems,
    updateQuantity,
    removeItem,
    clearCart,
    validateAndCleanCart,
    refreshPricing,
    isHydrated,
    isLoading,
    error: cartError,
    subtotal,
    taxAmount,
    total,
  } = useUnifiedCart();
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);

  // Validate cart items when page loads and cart is hydrated
  useEffect(() => {
    if (isHydrated && cartItems.length > 0) {
      validateAndCleanCart();
    }
  }, [isHydrated, validateAndCleanCart]);

  // Show cart error if any
  useEffect(() => {
    if (cartError) {
      toast({
        title: "Cart Updated",
        description: cartError,
        variant: "destructive",
      });
    }
  }, [cartError, toast]);

  // Empty cart redirect
  useEffect(() => {
    if (isHydrated && cartItems.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Please add some items to your cart before checkout.",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [cartItems.length, router, toast, isHydrated]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent: any, stepData?: any) => {
    setIsProcessing(true);

    try {
      // Prepare order data for unified system
      const orderData = {
        userId: user?.id || null,
        customerEmail: user?.email || stepData?.guestEmail || "",
        customerName: user?.username || stepData?.guestName || "",
        customerDiscord: stepData?.discordUsername || "",
        orderNotes: stepData?.orderNotes || "",
        specialInstructions: stepData?.specialInstructions || "",
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          product_name: item.product.name,
          product_type: item.product.product_type,
          custom_options: item.custom_options || {},
        })),
        referralCode: stepData?.referralCode || "",
        referralDiscount: stepData?.referralDiscount || 0,
        creditsUsed: stepData?.creditsUsed || 0,
        ipAddress: stepData?.ipAddress || "",
      };

      // Call unified order creation endpoint
      const response = await fetch("/api/orders/create-unified", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          orderData: orderData,
        }),
      });

      let result;
      try {
        const responseText = await response.text();
        if (!responseText.trim()) {
          throw new Error("Empty response from server");
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse order response:", parseError);
        throw new Error(
          "Invalid response from order server. Please contact support with your payment ID: " +
            paymentIntent.id,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.details || result.error || "Server verification failed",
        );
      }

      toast({
        title: "Payment successful!",
        description: `Your order ${result.orderNumber} has been confirmed. Payment ID: ${paymentIntent.id}`,
      });

      // Clear cart and redirect
      clearCart();

      if (result.orderId) {
        router.push(
          `/order-confirmation?orderId=${result.orderId}&orderNumber=${result.orderNumber}&paymentId=${paymentIntent.id}`,
        );
      } else {
        router.push("/account");
      }
    } catch (error: any) {
      console.error("Error processing unified order:", error);

      let errorMessage = "Unknown error";
      if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Order processing failed",
        description: errorMessage.includes("Payment")
          ? errorMessage
          : `We couldn't process your order: ${errorMessage}. Please contact support.`,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setIsProcessing(false);
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  // Show loading while cart is hydrating
  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary mr-2" />
            <span>Loading checkout...</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state
  if (isHydrated && cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg text-center border-0 shadow-xl bg-card/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-3xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Add some amazing boosting services to your cart before proceeding
              to checkout.
            </p>
            <Button
              asChild
              size="lg"
              className="min-w-48 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
            >
              <Link href="/">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Browse Services
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Order
          </h1>
          <p className="text-muted-foreground">
            Review your items and complete your purchase
          </p>
        </div>

        {/* Cart Error Alert */}
        {cartError && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-yellow-800 text-sm">
                <strong>Cart Updated:</strong> {cartError}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPricing}
                className="ml-auto text-yellow-800"
              >
                Refresh Pricing
              </Button>
            </div>
          </div>
        )}

        <StepperCheckout
          cartItems={cartItems}
          updateQuantity={updateQuantity}
          removeFromCart={removeItem}
          subtotal={subtotal}
          taxAmount={taxAmount}
          total={total}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
          isProcessing={isProcessing}
          user={user}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
