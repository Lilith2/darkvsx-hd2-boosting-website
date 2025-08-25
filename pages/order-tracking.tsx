import { useState, useEffect } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  Gamepad2,
  Target,
  Trophy,
  Star,
  Eye,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Zap,
  PlayCircle,
  RefreshCw,
  Download,
  Share2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Activity,
  TrendingUp,
  Award,
  Timer,
  MapPin,
  Users,
} from "lucide-react";

export default function OrderTracking() {
  const router = useRouter();
  const { orderId, type } = router.query as { orderId: string; type?: string };
  const { getOrder, addOrderMessage, orders, loading } = useOrders();
  const { orders: customOrders, loading: customLoading } = useCustomOrders();
  const { user } = useAuth();

  // Determine if this is a custom order
  const isCustomOrder = type === "custom";

  // Get the appropriate order
  const [order, setOrder] = useState(() => {
    if (isCustomOrder) {
      return customOrders.find((o) => o.id === orderId) || null;
    }
    return getOrder(orderId || "");
  });
  const [newMessage, setNewMessage] = useState("");
  const [showMessages, setShowMessages] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'messages'>('overview');

  useEffect(() => {
    if (orderId) {
      let foundOrder;
      if (isCustomOrder) {
        foundOrder = customOrders.find((o) => o.id === orderId) || null;
      } else {
        foundOrder = getOrder(orderId);
      }

      // SECURITY CHECK: Verify user has permission to view this order
      if (foundOrder && user) {
        let hasPermission = false;

        if (isCustomOrder) {
          // For custom orders
          const customOrder = foundOrder as any;
          hasPermission = customOrder.user_id === user.id ||
                         customOrder.customer_email === user.email;
        } else {
          // For regular orders
          const regularOrder = foundOrder as any;
          hasPermission = regularOrder.userId === user.id ||
                         regularOrder.customerEmail === user.email;
        }

        if (!hasPermission) {
          // User doesn't have permission to view this order
          setOrder(null);
          setIsInitialLoad(false);
          return;
        }
      } else if (foundOrder && !user) {
        // Guest users cannot access order tracking without authentication
        setOrder(null);
        setIsInitialLoad(false);
        return;
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
    user,
  ]);

  // Show loading state while orders are being fetched
  const isLoading = isCustomOrder ? customLoading : loading;
  if (isLoading && isInitialLoad) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-3">Loading Order...</h2>
            <p className="text-muted-foreground text-lg">
              Please wait while we retrieve your order information.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-3">Order Not Found</h2>
            <p className="text-muted-foreground mb-8 text-lg">
              The order ID you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <Link href="/">
              <Button size="lg" className="bg-gradient-to-r from-primary to-blue-600">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "processing":
        return "bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30";
      case "in-progress":
        return "bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30";
      case "completed":
        return "bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-700 dark:text-green-400 border-green-500/30";
      case "cancelled":
        return "bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-700 dark:text-red-400 border-red-500/30";
      default:
        return "bg-gradient-to-r from-gray-500/20 to-slate-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "processing":
        return <RefreshCw className="w-5 h-5" />;
      case "in-progress":
        return <PlayCircle className="w-5 h-5" />;
      case "completed":
        return <Trophy className="w-5 h-5" />;
      case "cancelled":
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  // Helper function to normalize order data for display
  const normalizeOrder = (orderData: any) => {
    if (!orderData) return null;

    if (isCustomOrder) {
      // Custom order - normalize to match regular order structure
      return {
        ...orderData,
        createdAt: orderData.created_at || new Date().toISOString(),
        totalAmount: orderData.total_amount || 0,
        customerName: orderData.customer_name || "Unknown Customer",
        customerEmail: orderData.customer_email || "Unknown Email",
        services:
          orderData.items?.map((item: any) => ({
            id: item.id || `item-${item.item_name}`,
            name: `${item.quantity || 1}x ${item.item_name || "Unknown Item"}`,
            price: item.total_price || 0,
            quantity: item.quantity || 1,
          })) || [],
        messages: [], // Custom orders don't have messages yet
        tracking: [], // Custom orders don't have tracking yet
        assignedBooster: null, // Custom orders don't have assigned boosters
        progress: 0, // Custom orders don't track progress the same way
        paymentStatus: "paid", // Custom orders are considered paid when created
        notes: orderData.special_instructions || orderData.notes || null,
      };
    }

    // Regular order - ensure required properties exist
    return {
      ...orderData,
      services: orderData.services || [],
      messages: orderData.messages || [],
      tracking: orderData.tracking || [],
      customerName: orderData.customerName || "Unknown Customer",
      customerEmail: orderData.customerEmail || "Unknown Email",
      paymentStatus: orderData.paymentStatus || "unknown",
    };
  };

  const normalizedOrder = normalizeOrder(order);

  // If we couldn't normalize the order data, show error
  if (!normalizedOrder) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Invalid Order Data</h2>
            <p className="text-muted-foreground mb-6">
              Unable to load order information. Please try again or contact
              support.
            </p>
            <Link href="/account">
              <Button variant="outline" className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Account
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    if (isCustomOrder) {
      // For custom orders, show a message that messaging isn't supported yet
      console.log("Messaging not yet supported for custom orders");
      return;
    }

    try {
      await addOrderMessage(order.id, {
        from: "customer",
        message: newMessage,
      });
      setNewMessage("");
      // Update local order state after message is sent
      const updatedOrder = getOrder(order.id);
      if (updatedOrder) {
        setOrder(updatedOrder);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProgressPercentage = () => {
    if (!normalizedOrder) return 0;

    switch (normalizedOrder.status) {
      case "pending":
        return 15;
      case "processing":
        return 35;
      case "in-progress":
        return normalizedOrder.progress || 65;
      case "completed":
        return 100;
      case "cancelled":
        return 0;
      default:
        return 0;
    }
  };

  const getEstimatedTimeRemaining = () => {
    const progress = getProgressPercentage();
    if (progress >= 100) return "Completed";
    if (progress <= 0) return "Not started";
    
    // Estimate based on typical service duration
    const remainingPercent = 100 - progress;
    const estimatedHours = Math.ceil((remainingPercent / 100) * 24); // Assume 24h max
    
    if (estimatedHours <= 1) return "Less than 1 hour";
    if (estimatedHours <= 24) return `~${estimatedHours} hours`;
    const days = Math.ceil(estimatedHours / 24);
    return `~${days} day${days > 1 ? 's' : ''}`;
  };

  const shareOrder = async () => {
    const orderNumber = isCustomOrder
      ? normalizedOrder?.order_number || `Order #${order.id}`
      : `Order #${order.id.slice(-6)}`;
    
    const shareText = `Check out my ${isCustomOrder ? "custom " : ""}boosting order: ${orderNumber}. Progress: ${getProgressPercentage()}%`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order Status",
          text: shareText,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Error sharing:", err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
        alert("Order link copied to clipboard!");
      } catch (err) {
        console.log("Error copying to clipboard:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-card/95 to-card/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center mb-6">
            <Link href="/account">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10 group">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-0.5 transition-transform" />
                Back to Account
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center">
                <Package className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {isCustomOrder
                    ? normalizedOrder?.order_number || `Order #${order.id}`
                    : `Order #${order.id.slice(-6)}`}
                </h1>
                <p className="text-muted-foreground text-lg">
                  Placed on {formatDate(normalizedOrder?.createdAt || "")}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                className={`text-base px-4 py-2 border ${getStatusColor(normalizedOrder?.status || "")}`}
              >
                {getStatusIcon(normalizedOrder?.status || "")}
                <span className="ml-2 capitalize font-semibold">
                  {normalizedOrder?.status}
                </span>
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                onClick={shareOrder}
                className="hidden sm:flex"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Progress Overview */}
          <div className="mt-8 p-6 bg-gradient-to-r from-muted/20 to-muted/10 rounded-2xl border border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-xl font-semibold">Order Progress</h3>
                  <p className="text-muted-foreground">
                    {getProgressPercentage()}% complete • {getEstimatedTimeRemaining()} remaining
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{getProgressPercentage()}%</div>
                <div className="text-sm text-muted-foreground">Complete</div>
              </div>
            </div>
            <Progress value={getProgressPercentage()} className="h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 mb-8 bg-muted/20 p-1 rounded-xl border border-border/50">
          {[
            { id: 'overview', label: 'Overview', icon: Target },
            { id: 'timeline', label: 'Timeline', icon: Clock },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === id
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              {id === 'messages' && (normalizedOrder.messages || []).filter((m: any) => !m.isRead && m.from !== 'customer').length > 0 && (
                <Badge className="bg-red-500 text-white text-xs px-2 py-0.5">
                  {(normalizedOrder.messages || []).filter((m: any) => !m.isRead && m.from !== 'customer').length}
                </Badge>
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'overview' && (
              <>
                {/* Service Details */}
                <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-3">
                        <Gamepad2 className="w-5 h-5 text-white" />
                      </div>
                      Service Details
                    </CardTitle>
                    <CardDescription>
                      Your selected boosting services and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(normalizedOrder.services || []).map((service: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center space-x-4 p-4 border border-border/50 rounded-xl bg-gradient-to-r from-muted/20 to-muted/10"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                          <Zap className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-lg">{service.name}</h4>
                          <div className="flex items-center space-x-3 mt-1">
                            <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/20">
                              <Trophy className="w-3 h-3 mr-1" />
                              Quantity: {service.quantity}
                            </Badge>
                            <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/20">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${(service.price * service.quantity).toFixed(2)}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Team Assignment */}
                {normalizedOrder.assignedBooster && (
                  <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center text-xl">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        Assigned Team
                      </CardTitle>
                      <CardDescription>
                        Professional booster assigned to your order
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-full flex items-center justify-center">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg text-blue-800 dark:text-blue-200">
                            {normalizedOrder.assignedBooster}
                          </h4>
                          <p className="text-sm text-blue-600 dark:text-blue-400">
                            Professional Booster • 5 ⭐ Rating
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                              <Activity className="w-3 h-3 mr-1" />
                              Online
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Award className="w-3 h-3 mr-1" />
                              Expert
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Breakdown */}
                <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      Progress Breakdown
                    </CardTitle>
                    <CardDescription>
                      Detailed view of your order completion status
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { label: "Order Confirmed", progress: 100, status: "completed" },
                      { label: "Booster Assigned", progress: normalizedOrder.status === 'pending' ? 0 : 100, status: normalizedOrder.status === 'pending' ? 'pending' : 'completed' },
                      { label: "Service In Progress", progress: ['in-progress', 'completed'].includes(normalizedOrder.status) ? 100 : normalizedOrder.status === 'processing' ? 50 : 0, status: normalizedOrder.status },
                      { label: "Order Completed", progress: normalizedOrder.status === 'completed' ? 100 : 0, status: normalizedOrder.status === 'completed' ? 'completed' : 'pending' },
                    ].map((step, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              step.progress === 100 
                                ? 'bg-green-100 dark:bg-green-900/20' 
                                : step.progress > 0 
                                  ? 'bg-blue-100 dark:bg-blue-900/20'
                                  : 'bg-muted'
                            }`}>
                              {step.progress === 100 ? (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              ) : step.progress > 0 ? (
                                <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                              ) : (
                                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                              )}
                            </div>
                            <span className="font-medium">{step.label}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {step.progress}%
                          </span>
                        </div>
                        <Progress value={step.progress} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </>
            )}

            {activeTab === 'timeline' && (
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center mr-3">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    Order Timeline
                  </CardTitle>
                  <CardDescription>
                    Detailed tracking of your order progress and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Default timeline if no tracking events */}
                    {(!normalizedOrder.tracking || normalizedOrder.tracking.length === 0) && (
                      <div className="space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0" />
                          <div className="flex-1 min-w-0 pb-6 border-l border-border/50 ml-1.5 pl-6">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-lg">Order Placed</p>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(normalizedOrder.createdAt)}
                              </span>
                            </div>
                            <p className="text-muted-foreground mt-1">
                              Your order has been successfully placed and is awaiting processing.
                            </p>
                          </div>
                        </div>
                        
                        {normalizedOrder.status !== 'pending' && (
                          <div className="flex items-start space-x-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pb-6 border-l border-border/50 ml-1.5 pl-6">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-lg">Processing Started</p>
                                <span className="text-sm text-muted-foreground">
                                  Recently
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1">
                                Your order is being reviewed and a booster will be assigned soon.
                              </p>
                            </div>
                          </div>
                        )}

                        {['in-progress', 'completed'].includes(normalizedOrder.status) && (
                          <div className="flex items-start space-x-4">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0 pb-6 border-l border-border/50 ml-1.5 pl-6">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-lg">Service In Progress</p>
                                <span className="text-sm text-muted-foreground">
                                  In progress
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1">
                                Your boost is currently being completed by our professional team.
                              </p>
                            </div>
                          </div>
                        )}

                        {normalizedOrder.status === 'completed' && (
                          <div className="flex items-start space-x-4">
                            <div className="w-3 h-3 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold text-lg">Order Completed</p>
                                <span className="text-sm text-muted-foreground">
                                  Recently
                                </span>
                              </div>
                              <p className="text-muted-foreground mt-1">
                                Your boost has been successfully completed! Enjoy your achievements.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actual tracking events if they exist */}
                    {(normalizedOrder.tracking || []).map((event: any, index: number) => (
                      <div key={index} className="flex items-start space-x-4">
                        <div className="w-3 h-3 bg-primary rounded-full mt-2 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-lg">{event.status}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatDate(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {activeTab === 'messages' && (
              <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-xl">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <MessageSquare className="w-5 h-5 text-white" />
                      </div>
                      Messages
                      {(normalizedOrder.messages || []).filter(
                        (m: any) => !m.isRead && m.from !== "customer",
                      ).length > 0 && (
                        <Badge className="ml-3 bg-red-500/20 text-red-700">
                          {
                            (normalizedOrder.messages || []).filter(
                              (m: any) => !m.isRead && m.from !== "customer",
                            ).length
                          }{" "}
                          new
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Communicate with our support team about your order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                    {(normalizedOrder.messages || []).length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <MessageSquare className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          No messages yet. Start a conversation with our support team!
                        </p>
                      </div>
                    ) : (
                      (normalizedOrder.messages || []).map((message: any) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-xl ${
                            message.from === "customer"
                              ? "bg-gradient-to-r from-primary/10 to-blue-600/10 ml-8 border border-primary/20"
                              : "bg-gradient-to-r from-muted/50 to-muted/30 mr-8 border border-border/50"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-semibold capitalize">
                                {message.from === "customer" ? "You" : message.from}
                              </span>
                              {message.from !== "customer" && (
                                <Badge variant="outline" className="text-xs">
                                  Support
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{message.message}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <Separator className="mb-6" />

                  <div className="space-y-4">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={
                        isCustomOrder
                          ? "Messaging not available for custom orders yet..."
                          : "Type your message to our support team..."
                      }
                      rows={4}
                      disabled={isCustomOrder}
                      className="resize-none border-border/50 focus:border-primary/50"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || isCustomOrder}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 h-12 text-base"
                    >
                      <Send className="w-5 h-5 mr-2" />
                      {isCustomOrder ? "Not Available for Custom Orders" : "Send Message"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <DollarSign className="w-5 h-5 mr-2 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(normalizedOrder.services || []).map((service: any, index: number) => (
                  <div
                    key={index}
                    className="flex justify-between items-start p-3 bg-muted/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{service.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty: {service.quantity}
                      </p>
                    </div>
                    <span className="font-semibold">
                      ${(service.price * service.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                <Separator />

                <div className="flex justify-between items-center font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">
                    ${(normalizedOrder.totalAmount || 0).toFixed(2)}
                  </span>
                </div>

                <div className="pt-2">
                  <Badge
                    variant="outline"
                    className={
                      normalizedOrder.paymentStatus === "paid"
                        ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400"
                        : "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400"
                    }
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Payment: {normalizedOrder.paymentStatus || "Unknown"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-primary" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-lg">
                  <Mail className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{normalizedOrder.customerName}</p>
                    <p className="text-sm text-muted-foreground">{normalizedOrder.customerEmail}</p>
                  </div>
                </div>
                {normalizedOrder.notes && (
                  <div className="p-3 bg-muted/20 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Special Notes</p>
                    <p className="font-medium text-sm">
                      {normalizedOrder.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/contact">
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Contact Support
                  </Link>
                </Button>

                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/faq">
                    <HelpCircle className="w-4 h-4 mr-3" />
                    View FAQ
                  </Link>
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={shareOrder}
                >
                  <Share2 className="w-4 h-4 mr-3" />
                  Share Order
                </Button>

                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/account">
                    <User className="w-4 h-4 mr-3" />
                    My Orders
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Estimated Completion */}
            {normalizedOrder.status !== 'completed' && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50/50 to-cyan-50/50 dark:from-blue-950/20 dark:to-cyan-950/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center text-blue-800 dark:text-blue-200">
                    <Timer className="w-5 h-5 mr-2" />
                    Estimated Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                      {getEstimatedTimeRemaining()}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Based on current progress and service complexity
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
