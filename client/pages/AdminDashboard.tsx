import React, { useState, useEffect } from "react";
import { useServices } from "@/hooks/useServices";
import { useBundles } from "@/hooks/useBundles";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useToast } from "@/hooks/use-toast";
import { ServiceModal } from "@/components/ServiceModal";
import { BundleModal } from "@/components/BundleModal";
import { TicketSystem } from "@/components/TicketSystem";
import { PricingModal } from "@/components/PricingModal";
import SimpleCustomOrders from "@/components/SimpleCustomOrders";
import { Button } from "@/components/ui/button";
import {
  sendTicketReplyEmail,
  generateTicketSubject,
} from "@/lib/emailService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  DollarSign,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  BarChart3,
  Star,
  Activity,
  MessageSquare,
  HelpCircle,
  Send,
  Clock,
  User,
  X,
  Filter,
} from "lucide-react";

export default function AdminDashboard() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices();
  const { bundles, addBundle, updateBundle, deleteBundle, toggleBundleStatus } =
    useBundles();
  const {
    orders,
    updateOrderStatus,
    addOrderMessage,
    assignBooster,
    updateOrderProgress,
    loading,
    error,
  } = useOrders();
  const {
    orders: customOrders,
    stats: customOrderStats,
    loading: customOrdersLoading,
    error: customOrdersError,
  } = useCustomOrders();
  const { toast } = useToast();

  // Fetch custom pricing data
  useEffect(() => {
    const fetchCustomPricing = async () => {
      try {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data, error } = await supabase
          .from("custom_pricing")
          .select("*")
          .order("category", { ascending: true });

        if (error) {
          console.error("Error fetching custom pricing:", error);
        } else {
          setCustomPricing(data || []);
        }
      } catch (err) {
        console.error("Error fetching custom pricing:", err);
      }
    };

    fetchCustomPricing();
  }, []);

  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [orderFilter, setOrderFilter] = useState<string>("all"); // all, pending, processing, in-progress, completed
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("regular"); // regular, custom
  const [customPricing, setCustomPricing] = useState<any[]>([]);
  const [isEditingPricing, setIsEditingPricing] = useState<any>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedOrderForResume, setSelectedOrderForResume] = useState<any>(null);
  const [isOrderResumeModalOpen, setIsOrderResumeModalOpen] = useState(false);

  // Analytics calculations - combine both regular orders and custom orders
  const regularOrdersRevenue = orders
    .filter(
      (order) =>
        order.paymentStatus === "paid" &&
        !order.services.some((s) => s.id === "support-ticket"),
    )
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const customOrdersRevenue = customOrders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.total_amount, 0);

  const totalRevenue = parseFloat(
    (regularOrdersRevenue + customOrdersRevenue).toFixed(2),
  );

  const regularPendingOrders = orders.filter(
    (order) =>
      order.status === "pending" &&
      !order.services.some((s) => s.id === "support-ticket"),
  ).length;

  const customPendingOrders = customOrders.filter(
    (order) => order.status === "pending",
  ).length;

  const pendingOrders = regularPendingOrders + customPendingOrders;

  const supportTickets = orders.filter((order) =>
    order.services.some((s) => s.id === "support-ticket"),
  );

  const pendingTickets = supportTickets.filter(
    (ticket) => ticket.status === "pending",
  ).length;

  const activeServices = services.filter((service) => service.active).length;

  // Combine customers from both regular orders and custom orders
  const regularOrderCustomers = new Set(orders.map((order) => order.userId));
  const customOrderCustomers = new Set(
    customOrders.map((order) => order.user_id),
  );
  const allCustomers = new Set([
    ...regularOrderCustomers,
    ...customOrderCustomers,
  ]);
  const totalCustomers = allCustomers.size;

  // Combine and sort recent orders from both types
  const allRecentOrders = [
    ...orders.map((order) => ({
      ...order,
      type: "regular" as const,
      createdAt: order.createdAt,
    })),
    ...customOrders.map((order) => ({
      id: order.id,
      customerName: order.customer_email || "Custom Order Customer",
      customerEmail: order.customer_email || "",
      totalAmount: order.total_amount,
      status: order.status,
      createdAt: order.created_at,
      type: "custom" as const,
      services: order.items.map((item) => ({
        id: item.id,
        name: item.item_name,
        price: item.price_per_unit,
        quantity: item.quantity,
      })),
    })),
  ];

  const recentOrders = allRecentOrders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  // Filter orders based on selected filter and type
  const getFilteredOrders = () => {
    if (orderTypeFilter === "custom") {
      return customOrders.filter((order) => {
        if (orderFilter === "all") return true;
        return order.status === orderFilter;
      }).sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    } else {
      return orders
        .filter((order) => !order.services.some((s) => s.id === "support-ticket"))
        .filter((order) => {
          if (orderFilter === "all") return true;
          return order.status === orderFilter;
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  };

  const filteredOrders = getFilteredOrders();

  // Calculate actual top performing services from both regular and custom orders
  const topServices = (() => {
    const serviceStats = new Map();

    // Count actual regular orders for each service
    orders.forEach((order) => {
      if (!order.services.some((s) => s.id === "support-ticket")) {
        order.services.forEach((service) => {
          const current = serviceStats.get(service.name) || {
            name: service.name,
            orders: 0,
            revenue: 0,
            id: service.id,
            type: "regular",
          };
          current.orders += service.quantity || 1;
          current.revenue += (service.price || 0) * (service.quantity || 1);
          serviceStats.set(service.name, current);
        });
      }
    });

    // Count custom orders as "custom order items"
    customOrders.forEach((order) => {
      order.items.forEach((item) => {
        const serviceName = `${item.category}: ${item.item_name}`;
        const current = serviceStats.get(serviceName) || {
          name: serviceName,
          orders: 0,
          revenue: 0,
          id: item.id,
          type: "custom",
        };
        current.orders += item.quantity;
        current.revenue += item.total_price;
        serviceStats.set(serviceName, current);
      });
    });

    return Array.from(serviceStats.values())
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);
  })();

  // Service management functions
  const handleAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (serviceData: any) => {
    if (editingService) {
      updateService(editingService.id, serviceData);
    } else {
      addService(serviceData);
    }
  };

  const handleDeleteService = (id: string) => {
    if (confirm("Are you sure you want to delete this service?")) {
      deleteService(id);
    }
  };

  // Bundle management functions
  const handleAddBundle = () => {
    setSelectedBundle(null);
    setIsBundleModalOpen(true);
  };

  const handleEditBundle = (bundle: any) => {
    setSelectedBundle(bundle);
    setIsBundleModalOpen(true);
  };

  const handleSaveBundle = (bundleData: any) => {
    if (selectedBundle) {
      updateBundle(selectedBundle.id, bundleData);
    } else {
      addBundle(bundleData);
    }
  };

  const handleDeleteBundle = (id: string) => {
    if (confirm("Are you sure you want to delete this bundle?")) {
      deleteBundle(id);
    }
  };

  // Ticket management functions
  const handleViewTicket = (ticket: any) => {
    setSelectedTicket(ticket);
    setIsTicketModalOpen(true);
  };

  const handleSendReply = async () => {
    if (!ticketReply.trim() || !selectedTicket) return;

    try {
      // Add message to database
      await addOrderMessage(selectedTicket.id, {
        from: "admin",
        message: ticketReply,
      });

      // Send email notification to customer
      try {
        const subject = generateTicketSubject(
          selectedTicket.services[0]?.name || "Support Request",
        );

        await sendTicketReplyEmail({
          to: selectedTicket.customerEmail,
          subject: subject,
          message: ticketReply,
          ticketId: selectedTicket.id,
          customerName: selectedTicket.customerName,
        });

        toast({
          title: "Reply sent successfully!",
          description: `Message sent to ${selectedTicket.customerEmail}`,
        });
      } catch (emailError) {
        console.error("Error sending email:", emailError);
        toast({
          title: "Reply saved but email failed",
          description:
            "The reply was saved to the ticket but email notification failed to send.",
          variant: "destructive",
        });
      }

      setTicketReply("");

      // Update ticket status to in-progress if it's still pending
      if (selectedTicket.status === "pending") {
        await updateOrderStatus(selectedTicket.id, "in-progress" as any);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error sending reply",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Custom pricing management functions
  const handleEditPricing = (pricing: any) => {
    setIsEditingPricing(pricing);
    setIsPricingModalOpen(true);
  };

  const handleAddPricing = () => {
    setIsEditingPricing(null);
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = async (pricingData: any) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");

      if (isEditingPricing) {
        const { error } = await supabase
          .from("custom_pricing")
          .update(pricingData)
          .eq("id", isEditingPricing.id);

        if (error) throw error;

        setCustomPricing((prev) =>
          prev.map((p) =>
            p.id === isEditingPricing.id ? { ...p, ...pricingData } : p,
          ),
        );

        toast({
          title: "Pricing Updated",
          description: "Custom pricing has been updated successfully.",
        });
      } else {
        const { data, error } = await supabase
          .from("custom_pricing")
          .insert([pricingData])
          .select()
          .single();

        if (error) throw error;

        setCustomPricing((prev) => [...prev, data]);

        toast({
          title: "Pricing Added",
          description: "New custom pricing has been added successfully.",
        });
      }

      setIsPricingModalOpen(false);
      setIsEditingPricing(null);
    } catch (error) {
      console.error("Error saving pricing:", error);
      toast({
        title: "Error",
        description: "Failed to save pricing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePricing = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pricing item?")) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("custom_pricing")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setCustomPricing((prev) => prev.filter((p) => p.id !== id));

      toast({
        title: "Pricing Deleted",
        description: "Custom pricing has been deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting pricing:", error);
      toast({
        title: "Error",
        description: "Failed to delete pricing. Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePricingStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("custom_pricing")
        .update({ is_active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setCustomPricing((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: !currentStatus } : p,
        ),
      );

      toast({
        title: "Status Updated",
        description: `Pricing item ${!currentStatus ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating pricing status:", error);
      toast({
        title: "Error",
        description: "Failed to update pricing status. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your Helldivers 2 boosting business
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        {(error || customOrdersError) && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h3 className="font-semibold text-red-600 mb-2">
              Database Connection Error
            </h3>
            {error && (
              <p className="text-sm text-red-600">Regular Orders: {error}</p>
            )}
            {customOrdersError && (
              <p className="text-sm text-red-600">
                Custom Orders: {customOrdersError}
              </p>
            )}
          </div>
        )}

        {(loading || customOrdersLoading) && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-600">
              Loading{" "}
              {loading && customOrdersLoading
                ? "all orders"
                : loading
                  ? "regular orders"
                  : "custom orders"}
              ...
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {pendingOrders}
              </div>
              <p className="text-xs text-muted-foreground">
                Requires immediate attention
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Services
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {activeServices}
              </div>
              <p className="text-xs text-muted-foreground">
                Available for purchase
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {totalCustomers}
              </div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                +8% new this week
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Support Tickets
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {pendingTickets}
              </div>
              <p className="text-xs text-muted-foreground">
                {supportTickets.length} total tickets
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Simplified Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="tickets">Support</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Services */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="w-5 h-5 mr-2" />
                    Top Performing Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {topServices.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No services available
                      </p>
                    ) : (
                      topServices.map((service, index) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.orders} orders
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ${service.revenue.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Total Revenue
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    Recent Orders
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentOrders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No recent orders
                      </p>
                    ) : (
                      recentOrders.map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-3 border border-border/30 rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <div
                              className={`w-2 h-2 rounded-full ${order.type === "custom" ? "bg-purple-500" : "bg-primary"}`}
                            ></div>
                            <div>
                              <p className="text-sm font-medium">
                                {order.type === "custom" ? "Custom " : ""}Order{" "}
                                {order.id.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge
                                className={
                                  order.status === "pending"
                                    ? "bg-yellow-500/20 text-yellow-700"
                                    : order.status === "completed"
                                      ? "bg-green-500/20 text-green-700"
                                      : "bg-blue-500/20 text-blue-700"
                                }
                              >
                                {order.status}
                              </Badge>
                              {order.type === "custom" && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-purple-100 text-purple-700"
                                >
                                  Custom
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm font-medium">
                              ${order.totalAmount}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Manage Services ({services.length})
                  </CardTitle>
                  <CardDescription>
                    Add, edit, or disable boosting services
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddService}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Button>
              </CardHeader>
              <CardContent>
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <Settings className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No services yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first boosting service to start accepting
                      orders from customers.
                    </p>
                    <Button
                      onClick={handleAddService}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map((service) => (
                      <Card
                        key={service.id}
                        className="border border-border/30 hover:border-primary/30 transition-colors"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {service.title}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.orders} orders • {service.category}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                variant={
                                  service.active ? "default" : "secondary"
                                }
                                className="cursor-pointer"
                                onClick={() => toggleServiceStatus(service.id)}
                              >
                                {service.active ? "Active" : "Inactive"}
                              </Badge>
                              {service.popular && (
                                <Badge variant="outline" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-primary">
                                ${service.price}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {service.difficulty}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {service.description}
                            </p>

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Duration: {service.duration}</span>
                              <span>{service.features.length} features</span>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditService(service)}
                                className="flex-1"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteService(service.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Manage Bundles ({bundles.length})
                  </CardTitle>
                  <CardDescription>
                    Create and manage service bundle packages
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddBundle}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Bundle
                </Button>
              </CardHeader>
              <CardContent>
                {bundles.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No bundles yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Create your first service bundle to offer discounted
                      packages to customers.
                    </p>
                    <Button
                      onClick={handleAddBundle}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Bundle
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {bundles.map((bundle) => (
                      <Card
                        key={bundle.id}
                        className="border border-border/30 hover:border-primary/30 transition-colors"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {bundle.name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {bundle.orders} orders • {bundle.discount}%
                                discount
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                variant={
                                  bundle.active ? "default" : "secondary"
                                }
                                className="cursor-pointer"
                                onClick={() => toggleBundleStatus(bundle.id)}
                              >
                                {bundle.active ? "Active" : "Inactive"}
                              </Badge>
                              {bundle.popular && (
                                <Badge variant="outline" className="text-xs">
                                  Popular
                                </Badge>
                              )}
                              {bundle.badge && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-primary/10"
                                >
                                  {bundle.badge}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-primary">
                                  ${bundle.discountedPrice}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ${bundle.originalPrice}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {bundle.duration}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {bundle.description}
                            </p>

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{bundle.services.length} services</span>
                              <span>{bundle.features.length} features</span>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBundle(bundle)}
                                className="flex-1"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBundle(bundle.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Custom Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <DollarSign className="w-5 h-5 mr-2" />
                    Custom Pricing Management ({customPricing.length})
                  </CardTitle>
                  <CardDescription>
                    Manage dynamic pricing for custom orders (medals, levels,
                    samples, super credits)
                  </CardDescription>
                </div>
                <Button
                  onClick={handleAddPricing}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pricing
                </Button>
              </CardHeader>
              <CardContent>
                {customPricing.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No custom pricing yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      Add pricing for custom order items to enable the custom
                      order system.
                    </p>
                    <Button
                      onClick={handleAddPricing}
                      className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Pricing
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customPricing.map((pricing) => (
                      <Card
                        key={pricing.id}
                        className="border border-border/30 hover:border-primary/30 transition-colors"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg capitalize">
                                {pricing.item_name}
                              </CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                {pricing.category.replace("_", " ")}
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                variant={
                                  pricing.is_active ? "default" : "secondary"
                                }
                                className="cursor-pointer"
                                onClick={() =>
                                  togglePricingStatus(
                                    pricing.id,
                                    pricing.is_active,
                                  )
                                }
                              >
                                {pricing.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-2xl font-bold text-primary">
                                ${pricing.price_per_unit}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                per unit
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {pricing.description}
                            </p>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div>
                                <span className="font-medium">Min:</span>{" "}
                                {pricing.minimum_quantity}
                              </div>
                              <div>
                                <span className="font-medium">Max:</span>{" "}
                                {pricing.maximum_quantity}
                              </div>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditPricing(pricing)}
                                className="flex-1"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeletePricing(pricing.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Order Management ({filteredOrders.length})
                    </CardTitle>
                    <CardDescription>
                      Manage both regular and custom orders from one place
                    </CardDescription>
                  </div>

                  {/* Order Type Filter */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="w-4 h-4" />
                      <span>Order Type:</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={orderTypeFilter === "regular" ? "default" : "outline"}
                        onClick={() => {
                          setOrderTypeFilter("regular");
                          setOrderFilter("all");
                        }}
                        className="text-xs"
                      >
                        Regular Orders ({orders.filter(order => !order.services.some(s => s.id === "support-ticket")).length})
                      </Button>
                      <Button
                        size="sm"
                        variant={orderTypeFilter === "custom" ? "default" : "outline"}
                        onClick={() => {
                          setOrderTypeFilter("custom");
                          setOrderFilter("all");
                        }}
                        className="text-xs"
                      >
                        Custom Orders ({customOrders.length})
                      </Button>
                    </div>
                  </div>

                  {/* Status Filter Section */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Filter className="w-4 h-4" />
                      <span>Filter by Status:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          value: "all",
                          label: "All Orders",
                          count: orders.filter(
                            (order) =>
                              !order.services.some(
                                (s) => s.id === "support-ticket",
                              ),
                          ).length,
                          color: "default",
                        },
                        {
                          value: "pending",
                          label: "Pending",
                          count: orders.filter(
                            (order) =>
                              !order.services.some(
                                (s) => s.id === "support-ticket",
                              ) && order.status === "pending",
                          ).length,
                          color: "yellow",
                        },
                        {
                          value: "processing",
                          label: "Processing",
                          count: orders.filter(
                            (order) =>
                              !order.services.some(
                                (s) => s.id === "support-ticket",
                              ) && order.status === "processing",
                          ).length,
                          color: "blue",
                        },
                        {
                          value: "in-progress",
                          label: "In Progress",
                          count: orders.filter(
                            (order) =>
                              !order.services.some(
                                (s) => s.id === "support-ticket",
                              ) && order.status === "in-progress",
                          ).length,
                          color: "purple",
                        },
                        {
                          value: "completed",
                          label: "Completed",
                          count: orders.filter(
                            (order) =>
                              !order.services.some(
                                (s) => s.id === "support-ticket",
                              ) && order.status === "completed",
                          ).length,
                          color: "green",
                        },
                      ].map((filter) => (
                        <Button
                          key={filter.value}
                          size="sm"
                          variant={
                            orderFilter === filter.value ? "default" : "outline"
                          }
                          onClick={() => setOrderFilter(filter.value)}
                          className={`text-xs ${
                            orderFilter === filter.value
                              ? ""
                              : filter.color === "yellow"
                                ? "hover:bg-yellow-50 hover:border-yellow-300"
                                : filter.color === "blue"
                                  ? "hover:bg-blue-50 hover:border-blue-300"
                                  : filter.color === "purple"
                                    ? "hover:bg-purple-50 hover:border-purple-300"
                                    : filter.color === "green"
                                      ? "hover:bg-green-50 hover:border-green-300"
                                      : ""
                          }`}
                        >
                          {filter.label}
                          {filter.count > 0 && (
                            <Badge
                              variant="secondary"
                              className={`ml-2 h-4 px-1 text-xs ${
                                filter.color === "yellow"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : filter.color === "blue"
                                    ? "bg-blue-100 text-blue-700"
                                    : filter.color === "purple"
                                      ? "bg-purple-100 text-purple-700"
                                      : filter.color === "green"
                                        ? "bg-green-100 text-green-700"
                                        : ""
                              }`}
                            >
                              {filter.count}
                            </Badge>
                          )}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">
                        {orderFilter === "all"
                          ? `No ${orderTypeFilter} orders yet`
                          : `No ${orderFilter} ${orderTypeFilter} orders`}
                      </h3>
                      <p className="text-muted-foreground">
                        {orderFilter === "all"
                          ? `When customers place ${orderTypeFilter} orders, they will appear here.`
                          : `No ${orderTypeFilter} orders with ${orderFilter} status found. Try selecting a different filter.`}
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border/30 rounded-lg p-6 hover:border-primary/30 transition-colors bg-card/50"
                      >
                        <div className="space-y-4">
                          {/* Order Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  Order #{order.id.slice(-6)}
                                </h3>
                                <Badge
                                  className={
                                    order.status === "pending"
                                      ? "bg-yellow-500/20 text-yellow-700"
                                      : order.status === "processing"
                                        ? "bg-blue-500/20 text-blue-700"
                                        : order.status === "in-progress"
                                          ? "bg-purple-500/20 text-purple-700"
                                          : order.status === "completed"
                                            ? "bg-green-500/20 text-green-700"
                                            : "bg-red-500/20 text-red-700"
                                  }
                                >
                                  <span className="capitalize">
                                    {order.status}
                                  </span>
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    order.paymentStatus === "paid"
                                      ? "border-green-500/50 text-green-600"
                                      : order.paymentStatus === "pending"
                                        ? "border-yellow-500/50 text-yellow-600"
                                        : "border-red-500/50 text-red-600"
                                  }
                                >
                                  {order.paymentStatus === "paid"
                                    ? "Paid"
                                    : "Payment " + order.paymentStatus}
                                </Badge>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Customer
                                  </p>
                                  <p className="font-medium">
                                    {order.customerName}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.customerEmail}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    IP: {order.ipAddress || "Not recorded"}
                                  </p>
                                  {order.referralCode && (
                                    <p className="text-xs text-green-600 mt-1">
                                      Referral: {order.referralCode} (-$
                                      {order.referralDiscount?.toFixed(2) ||
                                        "0.00"}
                                      )
                                    </p>
                                  )}
                                  {order.referralCreditsUsed &&
                                    order.referralCreditsUsed > 0 && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        Credits Used: -$
                                        {order.referralCreditsUsed.toFixed(2)}
                                      </p>
                                    )}
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Services
                                  </p>
                                  <p className="font-medium">
                                    {order.services.map((s, idx) => (
                                      <span key={s.id}>
                                        {s.name}
                                        {s.quantity > 1 && ` (x${s.quantity})`}
                                        {idx < order.services.length - 1 &&
                                          ", "}
                                      </span>
                                    ))}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.services.reduce(
                                      (sum, s) => sum + s.quantity,
                                      0,
                                    )}{" "}
                                    item(s)
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Payment
                                  </p>
                                  <p className="font-medium text-primary text-xl">
                                    ${order.totalAmount.toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    TX: {order.transactionId || "Not recorded"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Created
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleString()}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Updated:{" "}
                                    {new Date(order.updatedAt).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Progress Bar (if in progress) */}
                          {order.status === "in-progress" && (
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span>Progress</span>
                                <span>{order.progress || 0}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div
                                  className="bg-primary h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${order.progress || 0}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Assigned Booster */}
                          {order.assignedBooster && (
                            <div className="flex items-center space-x-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                Assigned to:
                              </span>
                              <span className="font-medium">
                                {order.assignedBooster}
                              </span>
                            </div>
                          )}

                          {/* Notes */}
                          {order.notes && (
                            <div className="bg-muted/50 p-3 rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">
                                Order Notes
                              </p>
                              <p className="text-sm whitespace-pre-wrap">
                                {order.notes}
                              </p>
                            </div>
                          )}

                          {/* Recent Messages */}
                          {order.messages && order.messages.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium flex items-center gap-2">
                                <MessageSquare className="w-4 h-4" />
                                Messages ({order.messages.length})
                                {order.messages.filter(
                                  (m) => !m.isRead && m.from === "customer",
                                ).length > 0 && (
                                  <Badge className="bg-red-500/20 text-red-700 text-xs">
                                    {
                                      order.messages.filter(
                                        (m) =>
                                          !m.isRead && m.from === "customer",
                                      ).length
                                    }{" "}
                                    new
                                  </Badge>
                                )}
                              </p>
                              <div className="max-h-40 overflow-y-auto space-y-2">
                                {order.messages
                                  .slice(-3)
                                  .map((message, idx) => (
                                    <div
                                      key={idx}
                                      className={`text-xs p-2 rounded ${
                                        message.from === "admin"
                                          ? "bg-primary/10 ml-4"
                                          : "bg-muted/70 mr-4"
                                      }`}
                                    >
                                      <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium capitalize">
                                          {message.from === "admin"
                                            ? "You"
                                            : message.from}
                                        </span>
                                        <span className="text-muted-foreground">
                                          {new Date(
                                            message.timestamp,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      <p className="whitespace-pre-wrap">
                                        {message.message}
                                      </p>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newStatus =
                                  order.status === "pending"
                                    ? "processing"
                                    : order.status === "processing"
                                      ? "in-progress"
                                      : order.status === "in-progress"
                                        ? "completed"
                                        : "pending";
                                updateOrderStatus(order.id, newStatus as any);
                              }}
                              className="text-xs"
                            >
                              {order.status === "pending" &&
                                "▶️ Start Processing"}
                              {order.status === "processing" && "🚀 Begin Work"}
                              {order.status === "in-progress" &&
                                "✅ Mark Complete"}
                              {order.status === "completed" && "🔄 Reopen"}
                            </Button>

                            {order.status !== "completed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const booster = prompt(
                                    "Assign booster:",
                                    order.assignedBooster || "",
                                  );
                                  if (booster !== null) {
                                    assignBooster(order.id, booster);
                                  }
                                }}
                                className="text-xs"
                              >
                                👤 {order.assignedBooster ? "Change" : "Assign"}{" "}
                                Booster
                              </Button>
                            )}

                            {order.status === "in-progress" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const progress = prompt(
                                    "Update progress (0-100):",
                                    String(order.progress || 0),
                                  );
                                  if (
                                    progress !== null &&
                                    !isNaN(Number(progress))
                                  ) {
                                    updateOrderProgress(
                                      order.id,
                                      Math.min(
                                        100,
                                        Math.max(0, Number(progress)),
                                      ),
                                    );
                                  }
                                }}
                                className="text-xs"
                              >
                                📊 Update Progress
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                const message = prompt(
                                  "Send message to customer:",
                                );
                                if (message) {
                                  try {
                                    // Add message to database
                                    await addOrderMessage(order.id, {
                                      from: "admin",
                                      message,
                                    });

                                    // Send email notification
                                    try {
                                      await sendTicketReplyEmail({
                                        to: order.customerEmail,
                                        subject: `Order Update #${order.id.slice(-6)}`,
                                        message: message,
                                        ticketId: order.id,
                                        customerName: order.customerName,
                                      });

                                      toast({
                                        title: "Message sent!",
                                        description: `Update sent to ${order.customerEmail}`,
                                      });
                                    } catch (emailError) {
                                      console.error("Email error:", emailError);
                                      toast({
                                        title: "Message saved but email failed",
                                        description:
                                          "Message was saved but email notification failed.",
                                        variant: "destructive",
                                      });
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error sending message:",
                                      error,
                                    );
                                    toast({
                                      title: "Error sending message",
                                      description:
                                        "Failed to send message. Please try again.",
                                      variant: "destructive",
                                    });
                                  }
                                }
                              }}
                              className="text-xs"
                            >
                              💬 Send Message
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForResume(order);
                                setIsOrderResumeModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              📋 Order Resume
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>


          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Support Tickets ({supportTickets.length})
                </CardTitle>
                <CardDescription>
                  Manage customer support requests and inquiries
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <div className="text-center py-12">
                      <HelpCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">
                        No support tickets
                      </h3>
                      <p className="text-muted-foreground">
                        Customer support requests will appear here when
                        submitted through the contact form.
                      </p>
                    </div>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h4 className="font-medium">
                                {ticket.services[0]?.name || "Support Request"}
                              </h4>
                              <Badge
                                className={
                                  ticket.status === "pending"
                                    ? "bg-orange-500/20 text-orange-700"
                                    : ticket.status === "in-progress"
                                      ? "bg-blue-500/20 text-blue-700"
                                      : ticket.status === "completed"
                                        ? "bg-green-500/20 text-green-700"
                                        : "bg-gray-500/20 text-gray-700"
                                }
                              >
                                {ticket.status === "pending" && "New"}
                                {ticket.status === "in-progress" &&
                                  "In Progress"}
                                {ticket.status === "completed" && "Resolved"}
                                {ticket.status === "cancelled" && "Closed"}
                              </Badge>
                              {ticket.messages &&
                                ticket.messages.filter(
                                  (m: any) =>
                                    !m.isRead && m.from === "customer",
                                ).length > 0 && (
                                  <Badge className="bg-red-500/20 text-red-700 text-xs">
                                    {
                                      ticket.messages.filter(
                                        (m: any) =>
                                          !m.isRead && m.from === "customer",
                                      ).length
                                    }{" "}
                                    new
                                  </Badge>
                                )}
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              <p>
                                <strong>From:</strong> {ticket.customerName} (
                                {ticket.customerEmail})
                              </p>
                              <p>
                                <strong>Created:</strong>{" "}
                                {new Date(ticket.createdAt).toLocaleString()}
                              </p>
                            </div>
                            {ticket.notes && (
                              <div className="bg-muted/50 p-3 rounded-md text-sm">
                                <div className="whitespace-pre-wrap">
                                  {ticket.notes}
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newStatus =
                                  ticket.status === "pending"
                                    ? "in-progress"
                                    : ticket.status === "in-progress"
                                      ? "completed"
                                      : "pending";
                                updateOrderStatus(ticket.id, newStatus as any);
                              }}
                            >
                              {ticket.status === "pending" && "Start Working"}
                              {ticket.status === "in-progress" &&
                                "Mark Resolved"}
                              {ticket.status === "completed" && "Reopen"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Reply
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Resume Modal */}
      <Dialog open={isOrderResumeModalOpen} onOpenChange={setIsOrderResumeModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Resume - #{selectedOrderForResume?.id?.slice(-6)}
            </DialogTitle>
            <DialogDescription>
              Complete order summary for {selectedOrderForResume?.customerName}
            </DialogDescription>
          </DialogHeader>

          {selectedOrderForResume && (
            <div className="space-y-6">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                    <p className="font-medium">{selectedOrderForResume.customerName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                    <p className="font-medium">{selectedOrderForResume.customerEmail}</p>
                  </div>
                  {selectedOrderForResume.ipAddress && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">IP Address</Label>
                      <p className="font-medium font-mono text-sm">{selectedOrderForResume.ipAddress}</p>
                    </div>
                  )}
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">User ID</Label>
                    <p className="font-medium font-mono text-sm">{selectedOrderForResume.userId || "Guest"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Order Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Order Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Order ID</Label>
                      <p className="font-medium font-mono">{selectedOrderForResume.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <Badge className={
                        selectedOrderForResume.status === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                        selectedOrderForResume.status === "processing" ? "bg-blue-500/20 text-blue-700" :
                        selectedOrderForResume.status === "in-progress" ? "bg-purple-500/20 text-purple-700" :
                        selectedOrderForResume.status === "completed" ? "bg-green-500/20 text-green-700" :
                        "bg-red-500/20 text-red-700"
                      }>
                        {selectedOrderForResume.status}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Payment Status</Label>
                      <Badge variant="outline" className={
                        selectedOrderForResume.paymentStatus === "paid" ? "border-green-500/50 text-green-600" :
                        selectedOrderForResume.paymentStatus === "pending" ? "border-yellow-500/50 text-yellow-600" :
                        "border-red-500/50 text-red-600"
                      }>
                        {selectedOrderForResume.paymentStatus}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Created At</Label>
                      <p className="font-medium">{new Date(selectedOrderForResume.createdAt).toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                      <p className="font-medium">{new Date(selectedOrderForResume.updatedAt).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedOrderForResume.transactionId && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Transaction ID</Label>
                      <p className="font-medium font-mono text-sm">{selectedOrderForResume.transactionId}</p>
                    </div>
                  )}

                  {selectedOrderForResume.assignedBooster && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Assigned Booster</Label>
                      <p className="font-medium">{selectedOrderForResume.assignedBooster}</p>
                    </div>
                  )}

                  {selectedOrderForResume.progress && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Progress</Label>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${selectedOrderForResume.progress}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{selectedOrderForResume.progress}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Services Purchased */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Services Purchased
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrderForResume.services.map((service: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{service.name}</p>
                          <p className="text-sm text-muted-foreground">Quantity: {service.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(service.price * service.quantity).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">${service.price} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Financial Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Subtotal</span>
                      <span className="font-medium">${selectedOrderForResume.services.reduce((sum: number, service: any) => sum + (service.price * service.quantity), 0).toFixed(2)}</span>
                    </div>

                    {selectedOrderForResume.referralDiscount > 0 && (
                      <div className="flex justify-between items-center text-green-600">
                        <span>Referral Discount</span>
                        <span className="font-medium">-${selectedOrderForResume.referralDiscount.toFixed(2)}</span>
                      </div>
                    )}

                    {selectedOrderForResume.referralCreditsUsed > 0 && (
                      <div className="flex justify-between items-center text-blue-600">
                        <span>Referral Credits Used</span>
                        <span className="font-medium">-${selectedOrderForResume.referralCreditsUsed.toFixed(2)}</span>
                      </div>
                    )}

                    <Separator />
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-primary">${selectedOrderForResume.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {selectedOrderForResume.referralCode && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                      <p className="text-sm text-green-700 dark:text-green-400">
                        <strong>Referral Code Used:</strong> {selectedOrderForResume.referralCode}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Order Notes */}
              {selectedOrderForResume.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Order Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedOrderForResume.notes}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Messages History */}
              {selectedOrderForResume.messages && selectedOrderForResume.messages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Messages History ({selectedOrderForResume.messages.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {selectedOrderForResume.messages.map((message: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            message.from === "admin"
                              ? "bg-primary/10 ml-4"
                              : "bg-muted/70 mr-4"
                          }`}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-sm capitalize">
                              {message.from === "admin" ? "You" : message.from}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderResumeModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ServiceModal
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        onSave={handleSaveService}
        service={editingService}
      />

      <BundleModal
        isOpen={isBundleModalOpen}
        onClose={() => setIsBundleModalOpen(false)}
        onSave={handleSaveBundle}
        bundle={selectedBundle}
      />

      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSave={handleSavePricing}
        pricing={isEditingPricing}
      />

      {/* Ticket Details Modal */}
      <Dialog open={isTicketModalOpen} onOpenChange={setIsTicketModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Support Ticket Details
            </DialogTitle>
            <DialogDescription>
              Ticket #{selectedTicket?.id?.slice(-6)} -{" "}
              {selectedTicket?.services[0]?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Name:</strong> {selectedTicket.customerName}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedTicket.customerEmail}
                    </p>
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Ticket Status</h4>
                  <div className="space-y-2">
                    <Badge
                      className={
                        selectedTicket.status === "pending"
                          ? "bg-orange-500/20 text-orange-700"
                          : selectedTicket.status === "in-progress"
                            ? "bg-blue-500/20 text-blue-700"
                            : selectedTicket.status === "completed"
                              ? "bg-green-500/20 text-green-700"
                              : "bg-gray-500/20 text-gray-700"
                      }
                    >
                      {selectedTicket.status === "pending" && "New"}
                      {selectedTicket.status === "in-progress" && "In Progress"}
                      {selectedTicket.status === "completed" && "Resolved"}
                      {selectedTicket.status === "cancelled" && "Closed"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newStatus =
                            selectedTicket.status === "pending"
                              ? "in-progress"
                              : selectedTicket.status === "in-progress"
                                ? "completed"
                                : "pending";
                          updateOrderStatus(
                            selectedTicket.id,
                            newStatus as any,
                          );
                        }}
                      >
                        {selectedTicket.status === "pending" && "Start Working"}
                        {selectedTicket.status === "in-progress" &&
                          "Mark Resolved"}
                        {selectedTicket.status === "completed" && "Reopen"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Original Message */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Original Message
                </h4>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <div className="whitespace-pre-wrap text-sm">
                    {selectedTicket.notes}
                  </div>
                </div>
              </div>

              {/* Messages/Conversation */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversation ({selectedTicket.messages?.length || 0} messages)
                </h4>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.messages &&
                  selectedTicket.messages.length > 0 ? (
                    selectedTicket.messages.map(
                      (message: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            message.from === "admin"
                              ? "bg-primary/10 ml-8 border-l-2 border-primary"
                              : "bg-muted/70 mr-8 border-l-2 border-muted-foreground"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium capitalize">
                              {message.from === "admin"
                                ? "You (Admin)"
                                : "Customer"}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">
                            {message.message}
                          </p>
                        </div>
                      ),
                    )
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet. Send the first reply below.
                    </p>
                  )}
                </div>
              </div>

              {/* Reply Section */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Send Reply
                </h4>
                <div className="space-y-3">
                  <Textarea
                    placeholder="Type your reply to the customer..."
                    value={ticketReply}
                    onChange={(e) => setTicketReply(e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                      This reply will be sent to {selectedTicket.customerEmail}
                    </p>
                    <Button
                      onClick={handleSendReply}
                      disabled={!ticketReply.trim()}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Send Reply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsTicketModalOpen(false);
                setSelectedTicket(null);
                setTicketReply("");
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
