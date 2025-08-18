import React, { useState, useEffect, useCallback } from "react";
import { useServices } from "@/hooks/useServices";
import { useBundles } from "@/hooks/useBundles";
import { useOrders } from "@/hooks/useOrders";
import { useCustomOrders } from "@/hooks/useCustomOrders";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Import optimized admin components
import { OptimizedAdminStatsCards } from "@/components/admin/OptimizedAdminStatsCards";
import { OptimizedAdminOrdersTable } from "@/components/admin/OptimizedAdminOrdersTable";
import { TopServicesCard } from "@/components/admin/TopServicesCard";
import { RecentOrdersCard } from "@/components/admin/RecentOrdersCard";
// These are now lazy loaded above

import { LoadingSpinner } from "../components/LoadingSpinner";

// Lazy load components with better loading states
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

const OrderDetailsModal = dynamic(
  () =>
    import("@/components/OrderDetailsModal").then((mod) => ({
      default: mod.OrderDetailsModal,
    })),
  {
    loading: () => <LoadingSpinner className="p-4" />,
  },
);

// Lazy load tab content to improve initial page load
const AdminServicesTabLazy = dynamic(
  () =>
    import("@/components/admin/AdminServicesTab").then((mod) => ({
      default: mod.AdminServicesTab,
    })),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
  },
);

const AdminBundlesTabLazy = dynamic(
  () =>
    import("@/components/admin/AdminBundlesTab").then((mod) => ({
      default: mod.AdminBundlesTab,
    })),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
  },
);

const AdminPricingTabLazy = dynamic(
  () =>
    import("@/components/admin/AdminPricingTab").then((mod) => ({
      default: mod.AdminPricingTab,
    })),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
  },
);

const VirtualizedOrdersTable = dynamic(
  () => import("@/components/admin/VirtualizedOrdersTable"),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
  },
);

const SimpleCustomOrders = dynamic(
  () => import("@/components/SimpleCustomOrders"),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
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
  // Temporarily use legacy hooks to debug
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
  const [customPricing, setCustomPricing] = useState<any[]>([]);

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
  const [isEditingPricing, setIsEditingPricing] = useState<any>(null);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [selectedOrderForDetails, setSelectedOrderForDetails] =
    useState<any>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);
  const [orderDetailsType, setOrderDetailsType] = useState<
    "regular" | "custom"
  >("regular");

  // Analytics are now provided by optimized hook - no additional processing needed

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
        <div className="mb-8">
          <OptimizedAdminStatsCards
            totalRevenue={[...orders, ...customOrders].reduce((sum, order) => {
              const amount =
                "totalAmount" in order ? order.totalAmount : order.total_amount;
              return sum + (amount || 0);
            }, 0)}
            pendingOrdersCount={
              [...orders, ...customOrders].filter(
                (order) => order.status === "pending",
              ).length
            }
            activeServicesCount={
              services.filter((service) => service.active !== false).length
            }
            totalCustomersCount={
              new Set(
                [...orders, ...customOrders]
                  .map((order) => {
                    const email =
                      "customerEmail" in order
                        ? order.customerEmail
                        : order.customer_email;
                    return email;
                  })
                  .filter(Boolean),
              ).size
            }
            completedOrdersCount={
              [...orders, ...customOrders].filter(
                (order) => order.status === "completed",
              ).length
            }
            totalOrdersCount={orders.length + customOrders.length}
            avgOrderValue={
              orders.length + customOrders.length > 0
                ? [...orders, ...customOrders].reduce((sum, order) => {
                    const amount =
                      "totalAmount" in order
                        ? order.totalAmount
                        : order.total_amount;
                    return sum + (amount || 0);
                  }, 0) /
                  (orders.length + customOrders.length)
                : 0
            }
            isLoading={loading || customOrdersLoading}
          />
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
              <TopServicesCard
                topServices={services.slice(0, 5).map((service) => ({
                  id: service.id,
                  name: service.title,
                  revenue: service.price * (service.orders_count || 0),
                  orderCount: service.orders_count || 0,
                }))}
                isLoading={loading || customOrdersLoading}
              />
              <RecentOrdersCard
                recentOrders={[...orders, ...customOrders].slice(0, 5)}
                isLoading={loading || customOrdersLoading}
                onOrderClick={(order, type) => {
                  setSelectedOrderForDetails(order);
                  setOrderDetailsType(type);
                  setIsOrderDetailsModalOpen(true);
                }}
              />
            </div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <AdminServicesTab
              services={services}
              loading={loading}
              onAddService={handleAddService}
              onEditService={handleEditService}
              onDeleteService={handleDeleteService}
            />
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
                                {bundle.orders_count || 0} orders •{" "}
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
                                  {bundle.discounted_price?.toFixed(2) ||
                                    "0.00"}
                                </span>
                                <span className="text-sm text-muted-foreground line-through">
                                  ${bundle.original_price?.toFixed(2) || "0.00"}
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
          <TabsContent value="orders">
            <EnhancedOrdersTable
              orders={orders}
              customOrders={customOrders}
              onUpdateOrderStatus={(orderId: string, status: string) => {
                updateOrderStatus(
                  orderId,
                  status as
                    | "pending"
                    | "processing"
                    | "in-progress"
                    | "completed"
                    | "cancelled",
                );
              }}
              loading={loading || customOrdersLoading}
              onRefresh={() => window.location.reload()}
            />
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
