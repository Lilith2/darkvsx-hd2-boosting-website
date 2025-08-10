import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useBundles } from "@/hooks/useBundles";
import { useOrders } from "@/hooks/useOrders";
import { ServiceModal } from "@/components/ServiceModal";
import { BundleModal } from "@/components/BundleModal";
import { TicketSystem } from "@/components/TicketSystem";
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
} from "lucide-react";

export default function AdminDashboard() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices();
  const {
    bundles,
    addBundle,
    updateBundle,
    deleteBundle,
    toggleBundleStatus,
  } = useBundles();
  const { orders, updateOrderStatus, addOrderMessage } = useOrders();
  
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  // Analytics calculations
  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "paid" && !order.services.some(s => s.id === "support-ticket"))
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending" && !order.services.some(s => s.id === "support-ticket"),
  ).length;

  const supportTickets = orders.filter(
    (order) => order.services.some(s => s.id === "support-ticket")
  );

  const pendingTickets = supportTickets.filter(
    (ticket) => ticket.status === "pending"
  ).length;

  const activeServices = services.filter((service) => service.active).length;
  const totalCustomers = new Set(orders.map((order) => order.userId)).size;

  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  const topServices = services.sort((a, b) => b.orders - a.orders).slice(0, 5);

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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="bundles">Bundles</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
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
                              <p className="font-medium">{service.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {service.orders} orders
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">
                              ${service.price}
                            </p>
                            <Badge variant="outline" className="text-xs">
                              {service.active ? "Active" : "Inactive"}
                            </Badge>
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
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <div>
                              <p className="text-sm font-medium">
                                Order {order.id.slice(0, 8)}...
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={
                              order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                              order.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                              'bg-blue-500/20 text-blue-700'
                            }>
                              {order.status}
                            </Badge>
                            <p className="text-sm font-medium mt-1">
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
                      Create your first service bundle to offer discounted packages to customers.
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
                                {bundle.orders} orders • {bundle.discount}% discount
                              </p>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <Badge
                                variant={bundle.active ? "default" : "secondary"}
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
                                <Badge variant="outline" className="text-xs bg-primary/10">
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

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Management
                </CardTitle>
                <CardDescription>
                  Manage customer orders (excluding support tickets)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.filter(order => !order.services.some(s => s.id === "support-ticket")).length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                      <p className="text-muted-foreground">When customers place orders, they will appear here.</p>
                    </div>
                  ) : (
                    orders
                      .filter(order => !order.services.some(s => s.id === "support-ticket"))
                      .map((order) => (
                        <div
                          key={order.id}
                          className="border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div>
                                <p className="font-medium">Order {order.id.slice(0, 8)}...</p>
                                <p className="text-sm text-muted-foreground">{order.customerName}</p>
                                <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium">
                                  {order.services.map((s) => s.name).join(", ")}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-right">
                                <Badge className={
                                  order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-700' :
                                  order.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                                  'bg-blue-500/20 text-blue-700'
                                }>
                                  <span className="capitalize">{order.status}</span>
                                </Badge>
                                <p className="text-sm font-medium mt-1">${order.totalAmount}</p>
                              </div>
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
                      <h3 className="text-lg font-semibold mb-2">No support tickets</h3>
                      <p className="text-muted-foreground">
                        Customer support requests will appear here when submitted through the contact form.
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
                                {ticket.services[0]?.name || 'Support Request'}
                              </h4>
                              <Badge className={
                                ticket.status === 'pending' ? 'bg-orange-500/20 text-orange-700' :
                                ticket.status === 'in-progress' ? 'bg-blue-500/20 text-blue-700' :
                                ticket.status === 'completed' ? 'bg-green-500/20 text-green-700' :
                                'bg-gray-500/20 text-gray-700'
                              }>
                                {ticket.status === 'pending' && 'New'}
                                {ticket.status === 'in-progress' && 'In Progress'}
                                {ticket.status === 'completed' && 'Resolved'}
                                {ticket.status === 'cancelled' && 'Closed'}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              <p><strong>From:</strong> {ticket.customerName} ({ticket.customerEmail})</p>
                              <p><strong>Created:</strong> {new Date(ticket.createdAt).toLocaleString()}</p>
                            </div>
                            {ticket.notes && (
                              <div className="bg-muted/50 p-3 rounded-md text-sm">
                                <div className="whitespace-pre-wrap">{ticket.notes}</div>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const newStatus = ticket.status === 'pending' ? 'in-progress' :
                                                ticket.status === 'in-progress' ? 'completed' : 'pending';
                                updateOrderStatus(ticket.id, newStatus as any);
                              }}
                            >
                              {ticket.status === 'pending' && 'Start Working'}
                              {ticket.status === 'in-progress' && 'Mark Resolved'}
                              {ticket.status === 'completed' && 'Reopen'}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                // Handle viewing full ticket details
                              }}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              Details
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
    </div>
  );
}
