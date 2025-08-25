import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useOptimizedCart as useCart } from "@/hooks/useOptimizedCart";
import { AlertTriangle, Trash2, ShoppingCart, ArrowRight } from "lucide-react";

export default function CartCleanup() {
  const { cartItems, clearCart, removeFromCart } = useCart();
  const [isClearing, setIsClearing] = useState(false);
  const router = useRouter();

  const handleClearCart = async () => {
    setIsClearing(true);
    try {
      clearCart();
      // Small delay to show the action
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push("/bundles");
    } catch (error) {
      console.error("Error clearing cart:", error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleGoToServices = () => {
    router.push("/bundles");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Cart Items Issue</h1>
          <p className="text-muted-foreground text-lg">
            Some items in your cart are no longer available
          </p>
        </div>

        {/* Alert */}
        <Alert className="mb-8 border-orange-500/30 bg-orange-500/5">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <AlertDescription className="text-base">
            Your cart contains services that are no longer available or have
            been updated. Please clear your cart and add current services to
            continue with checkout.
          </AlertDescription>
        </Alert>

        {/* Current Cart Items */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Current Cart Items ({cartItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Your cart is empty. Ready to add new services!
              </p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-border/50 rounded-lg bg-muted/20"
                  >
                    <div>
                      <h4 className="font-semibold">{item.service.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${item.service.price} × {item.quantity}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFromCart(item.service.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {cartItems.length > 0 && (
            <Button
              onClick={handleClearCart}
              disabled={isClearing}
              variant="destructive"
              size="lg"
              className="flex items-center"
            >
              {isClearing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Clearing Cart...
                </>
              ) : (
                <>
                  <Trash2 className="w-5 h-5 mr-2" />
                  Clear Entire Cart
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleGoToServices}
            size="lg"
            className="flex items-center bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
          >
            Browse Available Services
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>

        {/* Available Services Info */}
        <Card className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
              Available Services
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="text-green-700 dark:text-green-300">
                • Level Boost (1-50) - $5.00
              </div>
              <div className="text-green-700 dark:text-green-300">
                • Level Boost (50-100) - $10.00
              </div>
              <div className="text-green-700 dark:text-green-300">
                • Level Boost (100-150) - $20.00
              </div>
              <div className="text-green-700 dark:text-green-300">
                • Ship Module Unlock - $30.00
              </div>
              <div className="text-green-700 dark:text-green-300">
                • Weapon Mastery - $35.00
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
