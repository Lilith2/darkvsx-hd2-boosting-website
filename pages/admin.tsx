import React, { useState, useEffect, useCallback } from "react";
import { useServices } from "@/hooks/useServices";
import { useBundles } from "@/hooks/useBundles";
import { useOptimizedAdminData } from "@/hooks/useOptimizedAdminData";
import { useToast } from "@/hooks/use-toast";
import dynamic from "next/dynamic";

// Import optimized admin components
import { OptimizedAdminStatsCards } from "@/components/admin/OptimizedAdminStatsCards";
import { OptimizedAdminOrdersTable } from "@/components/admin/OptimizedAdminOrdersTable";
import { TopServicesCard } from "@/components/admin/TopServicesCard";
import { RecentOrdersCard } from "@/components/admin/RecentOrdersCard";
// These are now lazy loaded above

import { LoadingSpinner } from "@/components/ui/loading";
import {
  AdminDashboardLoadingState,
  ServicesTabLoadingSkeleton,
  BundlesTabLoadingSkeleton,
  OrdersTableLoadingSkeleton,
  PricingTabLoadingSkeleton,
  OverviewCardsLoadingSkeleton,
} from "@/components/admin/AdminLoadingStates";

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

const AdminReviewsTabLazy = dynamic(
  () =>
    import("@/components/admin/AdminReviewsTab").then((mod) => ({
      default: mod.AdminReviewsTab,
    })),
  {
    loading: () => (
      <div className="p-8">
        <LoadingSpinner />
      </div>
    ),
  },
);

// VirtualizedOrdersTable removed - component was deleted

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
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS

  // Use optimized hooks for better performance
  const {
    orders,
    customOrders,
    services,
    bundles,
    customPricing,
    analytics,
    isLoading,
    hasErrors,
    errors,
    updateOrderStatus,
    invalidateAll,
  } = useOptimizedAdminData();

  // Legacy hooks for service and bundle management (still needed for CRUD operations)
  const { addService, updateService, deleteService, toggleServiceStatus } =
    useServices();
  const { addBundle, updateBundle, deleteBundle, toggleBundleStatus } =
    useBundles();
  const { toast } = useToast();

  // Performance and loading state management
  const [currentTab, setCurrentTab] = useState("overview");
  const [loadingStates, setLoadingStates] = useState({
    services: false,
    bundles: false,
    orders: false,
    pricing: false,
  });

  // Custom pricing data - use local state for CRUD operations
  const [localCustomPricing, setLocalCustomPricing] = useState<any[]>([]);

  // Modal state management
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

  // Sync optimized data with local state - only sync when data is first loaded
  useEffect(() => {
    // Only sync when customPricing has data and localCustomPricing is empty (initial load)
    if (customPricing.length > 0 && localCustomPricing.length === 0) {
      setLocalCustomPricing([...customPricing]); // Create a copy to avoid reference issues
    }
  }, [customPricing.length]); // Only depend on length to avoid infinite loops

  // Fallback: if customPricing is available but localCustomPricing is still empty after loading
  useEffect(() => {
    if (
      !isLoading &&
      customPricing.length > 0 &&
      localCustomPricing.length === 0
    ) {
      setLocalCustomPricing([...customPricing]);
    }
  }, [isLoading]); // Only run when loading state changes

  // Track tab changes for loading optimization
  const handleTabChange = useCallback(
    (value: string) => {
      setCurrentTab(value);

      // Preload data for the selected tab if needed
      switch (value) {
        case "services":
          if (services.length === 0) {
            setLoadingStates((prev) => ({ ...prev, services: true }));
          }
          break;
        case "bundles":
          if (bundles.length === 0) {
            setLoadingStates((prev) => ({ ...prev, bundles: true }));
          }
          break;
        case "orders":
          if (orders.length === 0 && customOrders.length === 0) {
            setLoadingStates((prev) => ({ ...prev, orders: true }));
          }
          break;
        case "pricing":
          if (localCustomPricing.length === 0) {
            setLoadingStates((prev) => ({ ...prev, pricing: true }));
          }
          break;
        case "reviews":
          // Reviews tab manages its own data loading
          break;
      }
    },
    [
      services.length,
      bundles.length,
      orders.length,
      customOrders.length,
      localCustomPricing.length,
    ],
  );

  // EARLY RETURN AFTER ALL HOOKS - Show full loading dashboard for initial load
  if (isLoading && orders.length === 0 && services.length === 0) {
    return <AdminDashboardLoadingState />;
  }

  // Analytics are now provided by optimized hook - no additional processing needed

  // Service management functions with operation tracking
  const handleAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: any) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (serviceData: any) => {
    try {
      if (editingService) {
        await updateService(editingService.id, serviceData);
      } else {
        await addService(serviceData);
      }

      // Invalidate React Query cache to trigger real-time updates
      invalidateAll();

      toast({
        title: "Success",
        description: `Service ${editingService ? "updated" : "created"} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingService ? "update" : "create"} service.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;

    try {
      await deleteService(id);

      // Invalidate React Query cache to trigger real-time updates
      invalidateAll();

      toast({
        title: "Success",
        description: "Service deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete service.",
        variant: "destructive",
      });
    }
  };

  // Bundle management functions with operation tracking
  const handleAddBundle = () => {
    setSelectedBundle(null);
    setIsBundleModalOpen(true);
  };

  const handleEditBundle = (bundle: any) => {
    setSelectedBundle(bundle);
    setIsBundleModalOpen(true);
  };

  const handleSaveBundle = async (bundleData: any) => {
    try {
      if (selectedBundle) {
        await updateBundle(selectedBundle.id, bundleData);
      } else {
        await addBundle(bundleData);
      }

      // Invalidate React Query cache to trigger real-time updates
      invalidateAll();

      toast({
        title: "Success",
        description: `Bundle ${selectedBundle ? "updated" : "created"} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${selectedBundle ? "update" : "create"} bundle.`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteBundle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bundle?")) return;

    try {
      await deleteBundle(id);

      // Invalidate React Query cache to trigger real-time updates
      invalidateAll();

      toast({
        title: "Success",
        description: "Bundle deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bundle.",
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

        setLocalCustomPricing((prev) =>
          prev.map((p) =>
            p.id === isEditingPricing.id ? { ...p, ...pricingData } : p,
          ),
        );

        // Invalidate the optimized cache
        invalidateAll();

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

        setLocalCustomPricing((prev) => [...prev, data]);

        // Invalidate the optimized cache
        invalidateAll();

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
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase
        .from("custom_pricing")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setLocalCustomPricing((prev) => prev.filter((p) => p.id !== id));

      // Invalidate the optimized cache
      invalidateAll();

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

      setLocalCustomPricing((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, is_active: !currentStatus } : p,
        ),
      );

      // Invalidate the optimized cache
      invalidateAll();

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
        {hasErrors && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <h3 className="font-semibold text-red-600 mb-2">
              Database Connection Error
            </h3>
            {errors.orders && (
              <p className="text-sm text-red-600">Orders: {errors.orders}</p>
            )}
            {errors.customOrders && (
              <p className="text-sm text-red-600">
                Custom Orders: {errors.customOrders}
              </p>
            )}
            {errors.services && (
              <p className="text-sm text-red-600">
                Services: {errors.services}
              </p>
            )}
            {errors.bundles && (
              <p className="text-sm text-red-600">Bundles: {errors.bundles}</p>
            )}
          </div>
        )}

        {isLoading && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-blue-600">Loading admin dashboard data...</p>
          </div>
        )}

        {/* Stats Grid - Using optimized analytics */}
        <div className="mb-8">
          <OptimizedAdminStatsCards
            totalRevenue={analytics.totalRevenue}
            pendingOrdersCount={analytics.pendingOrdersCount}
            activeServicesCount={analytics.activeServicesCount}
            totalCustomersCount={analytics.totalCustomersCount}
            completedOrdersCount={analytics.completedOrdersCount}
            totalOrdersCount={analytics.totalOrdersCount}
            avgOrderValue={analytics.avgOrderValue}
            isLoading={analytics.isLoading}
          />
        </div>

        {/* Main Content - Simplified Tabs */}
        <Tabs
          defaultValue="overview"
          className="space-y-6"
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {isLoading ? (
              <OverviewCardsLoadingSkeleton />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopServicesCard
                  topServices={services.slice(0, 5).map((service) => ({
                    id: service.id,
                    name: service.title,
                    revenue: service.price * (service.orders_count || 0),
                    orderCount: service.orders_count || 0,
                  }))}
                  isLoading={isLoading}
                />
                <RecentOrdersCard
                  recentOrders={[
                    // Transform raw orders to OrderData format
                    ...orders.map(
                      (order) =>
                        ({
                          id: order.id,
                          userId: order.user_id,
                          customerEmail: order.customer_email || "",
                          customerName: order.customer_name || "",
                          services: Array.isArray(order.services)
                            ? (order.services as any[])
                            : [],
                          status: order.status as any,
                          totalAmount: order.total_amount || 0,
                          paymentStatus: order.payment_status as any,
                          createdAt: order.created_at || "",
                          updatedAt: order.updated_at || "",
                          progress: order.progress,
                          assignedBooster: order.assigned_booster,
                          estimatedCompletion: order.estimated_completion,
                          notes: order.notes,
                          transactionId: order.transaction_id,
                          ipAddress: order.ip_address,
                          referralCode: order.referral_code,
                          referralDiscount: order.referral_discount,
                          referralCreditsUsed:
                            (order as any).referral_credits_used || 0,
                          referredByUserId:
                            (order as any).referred_by_user_id || undefined,
                          messages: [],
                          tracking: [],
                        }) as any,
                    ),
                    // Transform raw custom orders to CustomOrder format
                    ...customOrders.map(
                      (order) =>
                        ({
                          id: order.id,
                          user_id: order.user_id,
                          order_number: order.order_number || "",
                          status: order.status,
                          total_amount: order.total_amount || 0,
                          currency: order.currency || "USD",
                          items: Array.isArray(order.items)
                            ? (order.items as any[])
                            : [],
                          special_instructions: order.special_instructions,
                          customer_email: order.customer_email,
                          customer_name:
                            (order as any).customer_name ||
                            order.customer_email ||
                            "Unknown",
                          customer_discord: order.customer_discord,
                          payment_intent_id: order.payment_intent_id,
                          delivery_status:
                            (order.delivery_status as any) || "not_started",
                          delivery_notes: order.delivery_notes,
                          admin_notes: order.admin_notes,
                          created_at: order.created_at,
                          updated_at: order.updated_at,
                          completed_at: order.completed_at,
                        }) as any,
                    ),
                  ].slice(0, 5)}
                  isLoading={isLoading}
                  onOrderClick={(order, type) => {
                    setSelectedOrderForDetails(order);
                    setOrderDetailsType(type);
                    setIsOrderDetailsModalOpen(true);
                  }}
                />
              </div>
            )}
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            {isLoading && currentTab === "services" ? (
              <ServicesTabLoadingSkeleton />
            ) : (
              <AdminServicesTabLazy
                services={services.map((service: any) => ({
                  ...service,
                  createdAt: service.created_at,
                  originalPrice: service.original_price,
                  features: service.features || [],
                }))}
                loading={isLoading}
                onAddService={handleAddService}
                onEditService={handleEditService}
                onDeleteService={handleDeleteService}
              />
            )}
          </TabsContent>

          {/* Bundles Tab */}
          <TabsContent value="bundles" className="space-y-6">
            {isLoading && currentTab === "bundles" ? (
              <BundlesTabLoadingSkeleton />
            ) : (
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
                                  onClick={async () => {
                                    await toggleBundleStatus(bundle.id);
                                    invalidateAll();
                                  }}
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
                                    $
                                    {bundle.original_price?.toFixed(2) ||
                                      "0.00"}
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
            )}
          </TabsContent>

          {/* Custom Pricing Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {isLoading && currentTab === "pricing" ? (
              <PricingTabLoadingSkeleton />
            ) : (
              <Card className="border border-border/50">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Custom Pricing Management ({localCustomPricing.length})
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
                  {localCustomPricing.length === 0 ? (
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
                      {localCustomPricing.map((pricing) => (
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
                                  onClick={() =>
                                    handleDeletePricing(pricing.id)
                                  }
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
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            {isLoading && currentTab === "orders" ? (
              <OrdersTableLoadingSkeleton />
            ) : (
              <OptimizedAdminOrdersTable
                orders={orders.map((order: any) => ({
                  ...order,
                  created_at: order.created_at || order.createdAt,
                  updated_at: order.updated_at || order.updatedAt,
                }))}
                customOrders={customOrders.map((order: any) => ({
                  ...order,
                  customer_email: order.customer_email || "",
                  created_at: order.created_at || order.createdAt,
                  updated_at: order.updated_at || order.updatedAt,
                }))}
                onUpdateOrderStatus={updateOrderStatus}
                loading={isLoading}
                onRefresh={() => invalidateAll()}
              />
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            <AdminReviewsTabLazy
              loading={isLoading}
              onInvalidateAll={invalidateAll}
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

// Ensure this page is server-side rendered for proper MPA behavior
export async function getServerSideProps() {
  return {
    props: {}, // Return empty props, data is fetched client-side via hooks
  };
}
