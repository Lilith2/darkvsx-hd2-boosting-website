import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useAuth } from "@/hooks/useAuth";
import { sendOrderConfirmationEmail } from "@/lib/emailService";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Clock,
  User,
  Mail,
  CreditCard,
  ArrowRight,
  Download,
  Share2,
  Home,
  Eye,
  Star,
  Trophy,
  Zap,
  Heart,
  Gift,
  MessageCircle,
  Bell,
  Calendar,
  Timer,
  Shield,
  Award,
  Sparkles,
  PartyPopper,
  ExternalLink,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, type, paymentId, sendEmail } = router.query as {
    orderId: string;
    type?: string;
    paymentId?: string;
    sendEmail?: string;
  };
  const { getOrder, orders, loading } = useOrders();
  const { orders: customOrders, loading: customLoading } = useCustomOrders();
  const { user } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailAttempted, setEmailAttempted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Determine if this is a custom order
  const isCustomOrder = type === "custom";

  useEffect(() => {
    console.log(
      "Order confirmation page - orderId:",
      orderId,
      "type:",
      type,
      "isCustomOrder:",
      isCustomOrder,
    );

    // Redirect to account page if no order ID provided
    if (!orderId && !isLoading) {
      console.log("No order ID provided, redirecting to account");
      router.push("/account");
      return;
    }

    if (orderId) {
      let foundOrder;
      if (isCustomOrder) {
        console.log(
          "Searching for custom order with ID:",
          orderId,
          "in",
          customOrders.length,
          "orders",
        );
        foundOrder = customOrders.find((o) => o.id === orderId) || null;
        console.log("Custom order found:", foundOrder);
      } else {
        console.log("Searching for regular order with ID:", orderId);
        foundOrder = getOrder(orderId);
        console.log("Regular order found:", foundOrder);
      }
      setOrder(foundOrder);

      // If we still haven't found the order and we're not loading, try direct database query
      const isLoading = isCustomOrder ? customLoading : loading;
      if (!foundOrder && !isLoading && !isInitialLoad) {
        console.log(
          "Order not found in hooks, trying direct database query...",
        );
        fetchOrderDirectly();
      } else if (
        foundOrder &&
        isInitialLoad &&
        !emailAttempted &&
        sendEmail === "true"
      ) {
        setIsInitialLoad(false);
        // Send confirmation email for new orders (only when explicitly requested)
        sendConfirmationEmail(foundOrder);
        // Show celebration animation
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else if (foundOrder && isInitialLoad) {
        setIsInitialLoad(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
  }, [
    orderId,
    isCustomOrder,
    getOrder,
    orders,
    customOrders,
    loading,
    customLoading,
    isInitialLoad,
  ]);

  const fetchOrderDirectly = async () => {
    if (!orderId) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");

      if (isCustomOrder) {
        const { data, error } = await supabase
          .from("custom_orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (data && !error) {
          console.log("Found custom order via direct query:", data);
          setOrder(data);
          setIsInitialLoad(false);
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (data && !error) {
          console.log("Found regular order via direct query:", data);
          // Transform the data to match the expected format
          const transformedOrder = {
            ...data,
            services: data.services || [],
            messages: [],
            tracking: [],
          };
          setOrder(transformedOrder);
          setIsInitialLoad(false);
          return;
        }
      }

      console.log("Order not found even with direct query");
      setIsInitialLoad(false);
    } catch (error) {
      console.error("Error with direct order query:", error);
      setIsInitialLoad(false);
    }
  };

  const sendConfirmationEmail = async (orderData: any) => {
    if (emailAttempted) return; // Prevent duplicate attempts

    try {
      setEmailAttempted(true);
      setEmailError(null);

      // Format order data for email
      const orderNumber = isCustomOrder
        ? orderData.order_number
        : `#${orderData.id.slice(-6)}`;
      const orderDate = isCustomOrder
        ? orderData.created_at
        : orderData.createdAt;
      const orderAmount = isCustomOrder
        ? orderData.total_amount
        : orderData.totalAmount;
      const customerEmail = isCustomOrder
        ? orderData.customer_email
        : orderData.customerEmail;
      const customerName = isCustomOrder
        ? orderData.customer_name
        : orderData.customerName;

      // Prepare order items for email
      let emailItems = [];
      if (isCustomOrder) {
        emailItems = (orderData.items || []).map((item: any) => ({
          name: item.item_name,
          quantity: item.quantity,
          price: item.price_per_unit,
          total: item.total_price,
        }));
      } else {
        emailItems = (orderData.services || []).map((service: any) => ({
          name: service.name,
          quantity: service.quantity,
          price: service.price,
          total: service.price * service.quantity,
        }));
      }

      await sendOrderConfirmationEmail({
        customerEmail,
        customerName: customerName || "Valued Customer",
        orderNumber,
        orderDate,
        orderTotal: orderAmount,
        items: emailItems,
        paymentId: paymentId as string,
        isCustomOrder,
      });

      setEmailSent(true);
      console.log("Order confirmation email sent successfully");
    } catch (error: any) {
      console.error("Failed to send confirmation email:", error);
      setEmailError(error.message || "Failed to send confirmation email");
    }
  };

  // Show loading state while orders are being fetched
  const isLoading = isCustomOrder ? customLoading : loading;
  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Processing Order...</h2>
            <p className="text-muted-foreground text-lg">
              Please wait while we confirm your order details.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if order not found
  if (!order && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Order Not Found</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              We couldn't find the order you're looking for. It may have been
              deleted or you may not have permission to view it.
            </p>
            <div className="space-y-3">
              <Link href="/account">
                <Button className="w-full bg-gradient-to-r from-primary to-blue-600">
                  <User className="w-5 h-5 mr-2" />
                  View My Orders
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) return null;

  // Format order data for display
  const orderNumber = isCustomOrder
    ? order.order_number
    : `#${order.id.slice(-6)}`;
  const orderDate = isCustomOrder ? order.created_at : order.createdAt;
  const orderAmount = isCustomOrder ? order.total_amount : order.totalAmount;
  const customerEmail = isCustomOrder
    ? order.customer_email
    : order.customerEmail;
  const customerName = isCustomOrder ? order.customer_name : order.customerName;
  const orderStatus = order.status;

  // Get order items for display
  let orderItems = [];
  if (isCustomOrder) {
    orderItems = order.items || [];
  } else {
    orderItems =
      order.services?.map((service: any) => ({
        name: service.name,
        quantity: service.quantity,
        price: service.price,
      })) || [];
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/20 dark:to-emerald-900/20 dark:text-green-200 border border-green-200 dark:border-green-800";
      case "processing":
      case "in-progress":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 dark:from-blue-900/20 dark:to-cyan-900/20 dark:text-blue-200 border border-blue-200 dark:border-blue-800";
      case "pending":
        return "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 dark:from-yellow-900/20 dark:to-orange-900/20 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 dark:from-gray-900/20 dark:to-slate-900/20 dark:text-gray-200 border border-gray-200 dark:border-gray-800";
    }
  };

  const shareOrder = async () => {
    const shareText = `I just placed my ${isCustomOrder ? "custom " : ""}order ${orderNumber}! Total: $${orderAmount?.toFixed(2)} 🎮`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order Confirmation",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
        alert("Order details copied to clipboard!");
      } catch (err) {
        console.log("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 relative overflow-hidden">
      {/* Celebratory Background Elements */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🎉</div>
          <div className="absolute top-20 right-20 text-4xl animate-bounce delay-100">⭐</div>
          <div className="absolute top-40 left-1/3 text-5xl animate-bounce delay-200">🎮</div>
          <div className="absolute top-60 right-1/3 text-3xl animate-bounce delay-300">🏆</div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">
        {/* Enhanced Breadcrumb Navigation */}
        <nav className="mb-8">
          <div className="flex items-center space-x-3 text-sm">
            <Link href="/" className="flex items-center text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4 mr-1" />
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link
              href="/cart"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Cart
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <Link
              href="/checkout"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Checkout
            </Link>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <span className="text-foreground font-medium">
              Order Confirmation
            </span>
          </div>
        </nav>

        {/* Enhanced Success Header */}
        <div className="text-center mb-12">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg animate-pulse">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent mb-4">
            Order Confirmed! 🎉
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thank you for choosing HellDivers 2 Boosting! We've received your order and our
            professional team will begin working on it shortly.
          </p>
          
          {/* Quick Stats */}
          <div className="flex items-center justify-center space-x-8 mt-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{orderItems.length}</div>
              <div className="text-sm text-muted-foreground">Services</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">${orderAmount?.toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">24h</div>
              <div className="text-sm text-muted-foreground">Est. Start</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enhanced Order Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Summary Card */}
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                      <Package className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">Order {orderNumber}</CardTitle>
                      <CardDescription className="text-base">
                        Placed on{" "}
                        {new Date(orderDate).toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={`text-base px-4 py-2 ${getStatusColor(orderStatus)}`}>
                    <Trophy className="w-4 h-4 mr-2" />
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {orderItems.map((item: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10 hover:from-muted/30 hover:to-muted/20 transition-all"
                    >
                      <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                        <Zap className="w-8 h-8 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">
                          {isCustomOrder ? item.item_name : item.name}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                            <Star className="w-3 h-3 mr-1" />
                            Quantity: {item.quantity}
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                            <Award className="w-3 h-3 mr-1" />
                            Premium Service
                          </Badge>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          $
                          {(isCustomOrder
                            ? item.total_price
                            : item.price * item.quantity
                          ).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${isCustomOrder ? item.price_per_unit : item.price} each
                        </p>
                      </div>
                    </div>
                  ))}
                  <Separator className="my-6" />
                  <div className="flex justify-between items-center bg-gradient-to-r from-primary/5 to-blue-600/5 p-4 rounded-xl border border-primary/20">
                    <span className="text-2xl font-bold">Total Amount</span>
                    <span className="text-3xl font-bold text-primary">
                      ${orderAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Payment Information */}
            {paymentId && (
              <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-green-800 dark:text-green-200">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    Payment Confirmation
                  </CardTitle>
                  <CardDescription className="text-green-700 dark:text-green-300">
                    Your payment has been successfully processed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Payment ID</span>
                      </div>
                      <p className="font-mono text-sm font-semibold">{paymentId}</p>
                    </div>
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Method</span>
                      </div>
                      <p className="font-semibold">PayPal</p>
                    </div>
                    <div className="p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">Status</span>
                      </div>
                      <Badge className="bg-green-500 text-white">
                        Paid Successfully
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What's Next Section */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-blue-800 dark:text-blue-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  What Happens Next?
                </CardTitle>
                <CardDescription className="text-blue-700 dark:text-blue-300">
                  Here's what you can expect in the coming hours
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      step: 1,
                      title: "Order Processing",
                      description: "We're reviewing your order details and requirements",
                      time: "Within 1 hour",
                      icon: Package,
                      status: "current"
                    },
                    {
                      step: 2,
                      title: "Booster Assignment",
                      description: "A skilled professional booster will be assigned to your order",
                      time: "Within 2-4 hours",
                      icon: User,
                      status: "upcoming"
                    },
                    {
                      step: 3,
                      title: "Service Begins",
                      description: "Your boost will start and you'll receive progress updates",
                      time: "Within 24 hours",
                      icon: Zap,
                      status: "upcoming"
                    },
                    {
                      step: 4,
                      title: "Completion",
                      description: "Your boost will be completed with guaranteed satisfaction",
                      time: "As scheduled",
                      icon: Trophy,
                      status: "upcoming"
                    }
                  ].map((step) => (
                    <div key={step.step} className="flex items-start space-x-4 p-4 bg-white/50 dark:bg-black/20 rounded-xl">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        step.status === 'current' 
                          ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        <step.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-base">{step.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {step.time}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Side Panel */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{customerEmail}</p>
                  </div>
                </div>
                {customerName && (
                  <div className="flex items-center space-x-3 p-3 bg-gradient-to-r from-muted/20 to-muted/10 rounded-lg">
                    <User className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{customerName}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href={`/order/${orderId}${isCustomOrder ? "?type=custom" : ""}`}
                >
                  <Button className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-base h-12">
                    <Eye className="w-5 h-5 mr-2" />
                    Track Your Order
                  </Button>
                </Link>

                <Link href="/account">
                  <Button variant="outline" className="w-full text-base h-12">
                    <User className="w-5 h-5 mr-2" />
                    View Dashboard
                  </Button>
                </Link>

                <Button variant="outline" className="w-full text-base h-12" onClick={shareOrder}>
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Order
                </Button>

                <Link href="/">
                  <Button variant="outline" className="w-full text-base h-12">
                    <Home className="w-5 h-5 mr-2" />
                    Continue Shopping
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Support Card */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50/50 to-yellow-50/50 dark:from-orange-950/20 dark:to-yellow-950/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center text-orange-800 dark:text-orange-200">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Need Help?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                  Our support team is available 24/7 to assist you with any questions about your order.
                </p>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/contact">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Contact Support
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="https://discord.gg/helldivers" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Join Discord
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Enhanced Email Confirmation Notice */}
        {sendEmail === "true" && (
          <Card className="mt-12 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-start space-x-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  emailSent 
                    ? "bg-gradient-to-br from-green-500 to-emerald-600" 
                    : emailError 
                      ? "bg-gradient-to-br from-red-500 to-pink-600" 
                      : "bg-gradient-to-br from-blue-500 to-purple-600"
                }`}>
                  {emailSent ? (
                    <CheckCircle className="w-8 h-8 text-white" />
                  ) : emailError ? (
                    <AlertCircle className="w-8 h-8 text-white" />
                  ) : (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">
                    {emailSent
                      ? "📧 Confirmation Email Sent!"
                      : emailError
                        ? "❌ Email Failed"
                        : "📤 Sending Confirmation Email..."}
                  </h3>
                  <p className="text-muted-foreground text-lg">
                    {emailSent ? (
                      <>
                        We've sent a detailed confirmation email to{" "}
                        <strong className="text-foreground">{customerEmail}</strong> with your order
                        details, timeline, and next steps. If you don't see it in your inbox, please check
                        your spam folder.
                      </>
                    ) : emailError ? (
                      <>
                        <span className="text-red-600 dark:text-red-400">Failed to send confirmation email: {emailError}</span>
                        <br />
                        <span className="text-sm">Don't worry - your order is still confirmed and being processed!</span>
                      </>
                    ) : (
                      <>
                        Sending your order confirmation to{" "}
                        <strong className="text-foreground">{customerEmail}</strong>...
                      </>
                    )}
                  </p>
                  {emailSent && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200 dark:border-green-800">
                      <div className="flex items-center space-x-2">
                        <Bell className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          We'll also send you updates as your order progresses!
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
