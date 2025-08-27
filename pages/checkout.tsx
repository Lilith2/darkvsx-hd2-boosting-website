import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { useCustomOrderCart } from "@/hooks/useCustomOrderCart";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Package, Loader2 } from "lucide-react";
import Link from "next/link";
import { StepperCheckout } from "../src/components/checkout/StepperCheckout";

export default function CheckoutPage() {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    clearCart,
    validateAndCleanCart,
    isHydrated,
  } = useCart();
  const { customOrder, clearCustomOrder } = useCustomOrderCart();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Form states
  const [isProcessing, setIsProcessing] = useState(false);

  // Note: Removed authentication requirement here to allow guest checkout
  // Authentication will be handled in the payment step if needed

  // Validate cart items when page loads and cart is hydrated
  useEffect(() => {
    if (isHydrated && cartItems.length > 0) {
      validateAndCleanCart();
    }
  }, [isHydrated, validateAndCleanCart]);

  // Empty cart redirect
  useEffect(() => {
    if (isHydrated && cartItems.length === 0 && !customOrder) {
      toast({
        title: "Cart is empty",
        description: "Please add some services to your cart before checkout.",
        variant: "destructive",
      });
      router.push("/bundles");
    }
  }, [cartItems.length, customOrder, router, toast, isHydrated]);

  // Handle payment success
  const handlePaymentSuccess = async (paymentIntent: any, stepData?: any) => {
    setIsProcessing(true);

    try {
      // Call secure server endpoint to verify payment and create order
      const orderData = {
        userId: user?.id || null,
        customerEmail: user?.email || "",
        customerName: user?.username || "",
        customerDiscord: stepData?.discordUsername || "",
        orderNotes: stepData?.orderNotes || "",
        services: cartItems.map((item) => ({
          id: item.service.id,
          name: item.service.title,
          price: item.service.price,
          quantity: item.quantity,
        })),
        customOrderData: customOrder
          ? {
              items: customOrder.items,
              special_instructions:
                customOrder.special_instructions || stepData?.orderNotes || "",
              customer_discord:
                stepData?.discordUsername || customOrder.customer_discord,
            }
          : undefined,
      };

      const response = await fetch("/api/orders/verify-and-create", {
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
        console.error(
          "Failed to parse order verification response:",
          parseError,
        );
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
        description: `Your order has been confirmed. Payment ID: ${paymentIntent.id}`,
      });

      // Clear cart and custom order, then redirect
      clearCart();
      clearCustomOrder();

      if (result.orderId) {
        router.push(
          `/order-confirmation?orderId=${result.orderId}&sendEmail=true&paymentId=${paymentIntent.id}`,
        );
      } else {
        router.push("/account");
      }
    } catch (error: any) {
      console.error("Error processing order:", error);

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

  // Loading state while authentication is being checked
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking authentication...</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty cart state with better styling
  if (isHydrated && cartItems.length === 0 && !customOrder) {
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
              <Link href="/bundles">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Browse Services
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while cart is hydrating
  if (!isHydrated) {
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

  // Main stepper checkout
  return (
    <StepperCheckout
      cartItems={cartItems}
      customOrder={customOrder}
      user={user}
      onPaymentSuccess={handlePaymentSuccess}
      onPaymentError={handlePaymentError}
      isProcessing={isProcessing}
      updateQuantity={updateQuantity}
      removeFromCart={removeFromCart}
      getCartTotal={getCartTotal}
    />
  );
}
