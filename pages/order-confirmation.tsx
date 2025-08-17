import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useAuth } from "@/hooks/useAuth";
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
} from "lucide-react";

export default function OrderConfirmation() {
  const router = useRouter();
  const { orderId, type, paymentId } = router.query as { 
    orderId: string; 
    type?: string; 
    paymentId?: string;
  };
  const { getOrder, orders, loading } = useOrders();
  const { orders: customOrders, loading: customLoading } = useCustomOrders();
  const { user } = useAuth();

  const [order, setOrder] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Determine if this is a custom order
  const isCustomOrder = type === "custom";

  useEffect(() => {
    if (orderId) {
      let foundOrder;
      if (isCustomOrder) {
        foundOrder = customOrders.find((o) => o.id === orderId) || null;
      } else {
        foundOrder = getOrder(orderId);
      }
      setOrder(foundOrder);

      // If we still haven't found the order and we're not loading, mark as not found
      const isLoading = isCustomOrder ? customLoading : loading;
      if (!foundOrder && !isLoading && !isInitialLoad) {
        setIsInitialLoad(false);
      } else if (foundOrder && isInitialLoad) {
        setIsInitialLoad(false);
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

  // Show loading state while orders are being fetched
  const isLoading = isCustomOrder ? customLoading : loading;
  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processing Order...</h2>
            <p className="text-muted-foreground">
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
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-6">
              We couldn't find the order you're looking for. It may have been deleted or you may not have permission to view it.
            </p>
            <div className="space-y-2">
              <Link href="/account">
                <Button className="w-full">View My Orders</Button>
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
  const orderNumber = isCustomOrder ? order.order_number : `#${order.id.slice(-6)}`;
  const orderDate = isCustomOrder ? order.created_at : order.createdAt;
  const orderAmount = isCustomOrder ? order.total_amount : order.totalAmount;
  const customerEmail = isCustomOrder ? order.customer_email : order.customerEmail;
  const orderStatus = order.status;

  // Get order items for display
  let orderItems = [];
  if (isCustomOrder) {
    orderItems = order.items || [];
  } else {
    orderItems = order.services?.map(service => ({
      name: service.name,
      quantity: service.quantity,
      price: service.price,
    })) || [];
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "processing":
      case "in-progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const shareOrder = async () => {
    const shareText = `My ${isCustomOrder ? 'custom ' : ''}order ${orderNumber} has been confirmed! Total: $${orderAmount?.toFixed(2)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Order Confirmation',
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Order details copied to clipboard!');
      } catch (err) {
        console.log('Error copying to clipboard:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Order Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground">
            Thank you for your purchase. We've received your order and will begin processing it shortly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Order {orderNumber}
                    </CardTitle>
                    <CardDescription>
                      Placed on {new Date(orderDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(orderStatus)}>
                    {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orderItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-2">
                      <div>
                        <p className="font-medium">
                          {isCustomOrder ? item.item_name : item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold">
                        ${(isCustomOrder ? item.total_price : (item.price * item.quantity)).toFixed(2)}
                      </p>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span>${orderAmount?.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Information */}
            {paymentId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="w-5 h-5 mr-2" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment ID:</span>
                      <span className="font-mono text-sm">{paymentId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Method:</span>
                      <span>PayPal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge className="bg-green-100 text-green-800">Paid</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{customerEmail}</span>
                </div>
                {user?.username && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{user.username}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">1</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Order Processing</p>
                      <p className="text-xs text-muted-foreground">
                        We're reviewing your order details
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">2</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Assignment</p>
                      <p className="text-xs text-muted-foreground">
                        A booster will be assigned to your order
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-muted-foreground">3</span>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Completion</p>
                      <p className="text-xs text-muted-foreground">
                        Your boost will be completed
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-3">
              <Link href={`/order/${orderId}${isCustomOrder ? '?type=custom' : ''}`}>
                <Button className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  Track Order
                </Button>
              </Link>
              
              <Link href="/account">
                <Button variant="outline" className="w-full">
                  <User className="w-4 h-4 mr-2" />
                  View My Dashboard
                </Button>
              </Link>

              <Button variant="outline" className="w-full" onClick={shareOrder}>
                <Share2 className="w-4 h-4 mr-2" />
                Share Order
              </Button>

              <Link href="/">
                <Button variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <Card className="mt-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Mail className="w-8 h-8 text-primary" />
              <div>
                <h3 className="font-semibold">Confirmation Email Sent</h3>
                <p className="text-sm text-muted-foreground">
                  We've sent a confirmation email to <strong>{customerEmail}</strong> with your order details.
                  If you don't see it in your inbox, please check your spam folder.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
