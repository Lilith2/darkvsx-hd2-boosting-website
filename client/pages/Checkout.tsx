import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CreditCard,
  Shield,
  Clock,
  CheckCircle,
  User,
  Mail,
  MessageSquare,
  ArrowLeft,
  Lock,
  PaypalIcon as Paypal,
  Package,
} from "lucide-react";
import { Link } from "react-router-dom";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PAYPAL_CLIENT_ID =
  import.meta.env.VITE_PAYPAL_CLIENT_ID ||
  "AefD8SednJLcqfFDsiO9AetjGEsCMVPYSCp-gX-UmUyJsQvSUHgbhnl39ZJCB14Tq-eXM3kG2Q6aizB8";

export default function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [guestInfo, setGuestInfo] = useState({
    name: "",
    email: "",
  });

  const subtotal = getCartTotal();
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some services to your cart before proceeding to checkout.
          </p>
          <Button asChild>
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const handlePayPalSuccess = async (details: any, data: any) => {
    console.log("PayPal payment successful:", { details, data });
    setIsProcessing(true);

    try {
      // Create the order with paid status only after successful PayPal payment
      const orderId = addOrder({
        userId: user?.id || "guest",
        customerEmail: user?.email || guestInfo.email,
        customerName: user?.username || guestInfo.name,
        services: cartItems.map((item) => ({
          id: item.service.id,
          name: item.service.title,
          price: item.service.price,
          quantity: item.quantity,
        })),
        status: "pending",
        totalAmount: total,
        paymentStatus: "paid", // Only set to paid after successful PayPal payment
        notes: orderNotes,
      });

      // Clear cart
      clearCart();

      toast({
        title: "Payment successful!",
        description: `Your order #${orderId} has been confirmed. Payment ID: ${details.id}`,
      });

      // Redirect to order tracking
      navigate(`/order/${orderId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Order creation failed",
        description:
          "Payment was successful but we couldn't create your order. Please contact support.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayPalError = (error: any) => {
    console.error("PayPal payment error:", error);
    toast({
      title: "Payment failed",
      description:
        "There was an error processing your PayPal payment. Please try again.",
      variant: "destructive",
    });
  };

  const handlePayPalCancel = (data: any) => {
    console.log("PayPal payment cancelled:", data);
    toast({
      title: "Payment cancelled",
      description:
        "You cancelled the PayPal payment. Your order was not placed.",
    });
  };

  const createPayPalOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: total.toFixed(2),
            currency_code: "USD",
          },
          description: `HelldiversBoost Order - ${cartItems.length} service(s)`,
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
      },
    });
  };

  return (
    <PayPalScriptProvider
      options={{
        "client-id": PAYPAL_CLIENT_ID,
        currency: "USD",
        intent: "capture",
      }}
    >
      <div className="bg-background py-12 min-h-[calc(100vh-8rem)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Link
                to="/cart"
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Cart
              </Link>
            </div>
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-muted-foreground">
              Complete your order securely with PayPal
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Order Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between items-start"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.service.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${(item.service.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Tax (8%)</span>
                      <span>${tax.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Information */}
              {!isAuthenticated && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Contact Information
                    </CardTitle>
                    <CardDescription>
                      We'll send order updates to this email
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="guestName">Full Name *</Label>
                      <Input
                        id="guestName"
                        value={guestInfo.name}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="guestEmail">Email Address *</Label>
                      <Input
                        id="guestEmail"
                        type="email"
                        value={guestInfo.email}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, email: e.target.value })
                        }
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Order Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Order Notes
                  </CardTitle>
                  <CardDescription>
                    Any special instructions for your boosting service
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="e.g., Preferred gaming hours, account details, etc."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Payment */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lock className="w-5 h-5 mr-2" />
                    Secure Payment
                  </CardTitle>
                  <CardDescription>
                    Pay securely with PayPal. Your payment information is
                    encrypted and protected.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Terms Agreement */}
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="terms"
                      checked={agreeToTerms}
                      onCheckedChange={(checked) =>
                        setAgreeToTerms(checked as boolean)
                      }
                    />
                    <div className="text-sm">
                      <label htmlFor="terms" className="cursor-pointer">
                        I agree to the{" "}
                        <Link
                          to="/terms"
                          className="text-primary hover:underline"
                        >
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link
                          to="/privacy"
                          className="text-primary hover:underline"
                        >
                          Privacy Policy
                        </Link>
                      </label>
                    </div>
                  </div>

                  {/* Guest validation */}
                  {!isAuthenticated &&
                    (!guestInfo.name || !guestInfo.email) && (
                      <div className="bg-muted/50 border border-border p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Please fill in your contact information above to
                          continue.
                        </p>
                      </div>
                    )}

                  {/* PayPal Payment Button */}
                  {agreeToTerms &&
                  (isAuthenticated || (guestInfo.name && guestInfo.email)) ? (
                    <div className="space-y-4">
                      <div className="bg-muted/50 border border-border p-4 rounded-lg">
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <Shield className="w-4 h-4" />
                          <span>
                            Secured by PayPal • 256-bit SSL encryption
                          </span>
                        </div>
                      </div>

                      <PayPalButtons
                        style={{
                          layout: "vertical",
                          color: "blue",
                          shape: "rect",
                          label: "paypal",
                        }}
                        createOrder={createPayPalOrder}
                        onApprove={async (data, actions) => {
                          const details = await actions.order.capture();
                          handlePayPalSuccess(details, data);
                        }}
                        onError={handlePayPalError}
                        onCancel={handlePayPalCancel}
                        disabled={isProcessing}
                      />

                      {isProcessing && (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing your order...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-muted/50 border border-border p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {!agreeToTerms
                          ? "Please agree to the terms and conditions to continue."
                          : "Please fill in your contact information to continue."}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Features */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Why Choose PayPal?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <Shield className="w-4 h-4 text-green-600" />
                    <span>Your financial data is never shared</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>PayPal Buyer Protection</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Lock className="w-4 h-4 text-green-600" />
                    <span>256-bit SSL encryption</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </PayPalScriptProvider>
  );
}
