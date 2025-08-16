import React, { useState, useEffect } from "react";
import { useServices } from "@/hooks/useServices";
import { useBundles } from "@/hooks/useBundles";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

import { LoadingSpinner } from "../components/LoadingSpinner";

// Dynamically import heavy components
const ServiceModal = dynamic(
  () =>
    import("@/components/ServiceModal").then((mod) => ({
      default: mod.ServiceModal,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
const BundleModal = dynamic(
  () =>
    import("@/components/BundleModal").then((mod) => ({
      default: mod.BundleModal,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
const PricingModal = dynamic(
  () =>
    import("@/components/PricingModal").then((mod) => ({
      default: mod.PricingModal,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
const SimpleCustomOrders = dynamic(
  () => import("@/components/SimpleCustomOrders"),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
const OrderDetailsModal = dynamic(
  () =>
    import("@/components/OrderDetailsModal").then((mod) => ({
      default: mod.OrderDetailsModal,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
const EnhancedOrdersTable = dynamic(
  () =>
    import("@/components/admin/EnhancedOrdersTable").then((mod) => ({
      default: mod.EnhancedOrdersTable,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);
import { Button } from "@/components/ui/button";
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
  Send,
  Clock,
  User,
  X,
  Filter,
  Info,
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
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);
  const [orderFilter, setOrderFilter] = useState<string>("all"); // all, pending, processing, in-progress, completed
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>("regular"); // regular, custom
  const [customPricing, setCustomPricing] = useState<any[]>([]);
  const [isEditingPricing, setIsEditingPricing] = useState<any>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedOrderForResume, setSelectedOrderForResume] =
    useState<any>(null);
  const [isOrderResumeModalOpen, setIsOrderResumeModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState<any>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [orderDetailsType, setOrderDetailsType] = useState<"regular" | "custom">("regular");

  // Analytics calculations - combine both regular orders and custom orders
  const regularOrdersRevenue = orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const customOrdersRevenue = customOrders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.total_amount, 0);

  const totalRevenue = parseFloat(
    (regularOrdersRevenue + customOrdersRevenue).toFixed(2),
  );

  const regularPendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;

  const customPendingOrders = customOrders.filter(
    (order) => order.status === "pending",
  ).length;

  const pendingOrders = regularPendingOrders + customPendingOrders;

  const activeServices = services.filter((service) => service.active).length;

  // Combine customers from both regular orders and custom orders
  const regularOrderCustomers = new Set(orders.map((order) => order.userId));
  const customOrderCustomers = new Set(
    customOrders.map((order) => order.user_id),
  );
  const allCustomers = new Set([
    ...Array.from(regularOrderCustomers),
    ...Array.from(customOrderCustomers),
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
      return customOrders
        .filter((order) => {
          if (orderFilter === "all") return true;
          return order.status === orderFilter;
        })
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    } else {
      return orders
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
        </div>

        {/* Main Content - Simplified Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
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
                                {bundle.orders || 0} orders •{" "}
                                {bundle.discount || 0}% discount
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
                                  $
                                  {bundle.discountedPrice?.toFixed(2) || "0.00"}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ${bundle.originalPrice?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {bundle.duration || "N/A"}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {bundle.description}
                            </p>

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                {bundle.services?.length || 0} services
                              </span>
                              <span>
                                {bundle.features?.length || 0} features
                              </span>
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
                        variant={
                          orderTypeFilter === "regular" ? "default" : "outline"
                        }
                        onClick={() => {
                          setOrderTypeFilter("regular");
                          setOrderFilter("all");
                        }}
                        className="text-xs"
                      >
                        Regular Orders ({orders.length})
                      </Button>
                      <Button
                        size="sm"
                        variant={
                          orderTypeFilter === "custom" ? "default" : "outline"
                        }
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
                          count: orders.length,
                          color: "default",
                        },
                        {
                          value: "pending",
                          label: "Pending",
                          count: orders.filter(
                            (order) => order.status === "pending",
                          ).length,
                          color: "yellow",
                        },
                        {
                          value: "processing",
                          label: "Processing",
                          count: orders.filter(
                            (order) => order.status === "processing",
                          ).length,
                          color: "blue",
                        },
                        {
                          value: "in-progress",
                          label: "In Progress",
                          count: orders.filter(
                            (order) => order.status === "in-progress",
                          ).length,
                          color: "purple",
                        },
                        {
                          value: "completed",
                          label: "Completed",
                          count: orders.filter(
                            (order) => order.status === "completed",
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
                                {orderTypeFilter === "regular" &&
                                  "paymentStatus" in order && (
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
                                  )}
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-muted-foreground">
                                    Customer
                                  </p>
                                  <p className="font-medium">
                                    {orderTypeFilter === "custom" &&
                                    "customer_email" in order
                                      ? order.customer_email || "N/A"
                                      : "customerName" in order
                                        ? order.customerName
                                        : "N/A"}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {orderTypeFilter === "custom" &&
                                    "customer_email" in order
                                      ? order.customer_email || "N/A"
                                      : "customerEmail" in order
                                        ? order.customerEmail
                                        : "N/A"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Services
                                  </p>
                                  <div className="font-medium">
                                    {orderTypeFilter === "custom" &&
                                    "items" in order
                                      ? order.items?.map((item, idx) => (
                                          <span key={item.id}>
                                            {item.item_name} ({item.quantity})
                                            {idx < order.items.length - 1 &&
                                              ", "}
                                          </span>
                                        ))
                                      : "services" in order
                                        ? order.services?.map((s, idx) => (
                                            <span key={s.id}>
                                              {s.name}
                                              {s.quantity > 1 &&
                                                ` (x${s.quantity})`}
                                              {idx <
                                                order.services.length - 1 &&
                                                ", "}
                                            </span>
                                          ))
                                        : "No services"}
                                  </div>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Payment
                                  </p>
                                  <p className="font-medium text-primary text-xl">
                                    $
                                    {orderTypeFilter === "custom" &&
                                    "total_amount" in order
                                      ? order.total_amount?.toFixed(2)
                                      : "totalAmount" in order
                                        ? order.totalAmount?.toFixed(2)
                                        : "0.00"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">
                                    Created
                                  </p>
                                  <p className="font-medium">
                                    {new Date(
                                      orderTypeFilter === "custom" &&
                                      "created_at" in order
                                        ? order.created_at
                                        : "createdAt" in order
                                          ? order.createdAt
                                          : new Date().toISOString(),
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Actions */}
                          <div className="flex items-center gap-2 pt-4 border-t border-border/30">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrderForDetails(order);
                                setOrderDetailsType(orderTypeFilter === "custom" ? "custom" : "regular");
                                setIsOrderDetailsModalOpen(true);
                              }}
                              className="text-xs"
                            >
                              <Info className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
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
                              {order.status === "pending" && "Start Processing"}
                              {order.status === "processing" &&
                                "Mark In Progress"}
                              {order.status === "in-progress" &&
                                "Mark Completed"}
                              {order.status === "completed" &&
                                "Reset to Pending"}
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

        {/* Modals */}
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

        <OrderDetailsModal
          isOpen={isOrderDetailsModalOpen}
          onClose={() => setIsOrderDetailsModalOpen(false)}
          order={selectedOrderForDetails}
          orderType={orderDetailsType}
        />
      </div>
    </div>
  );
}
