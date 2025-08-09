import { useState } from "react";
import { useServices } from "@/hooks/useServices";
import { useOrders } from "@/hooks/useOrders";
import { ServiceModal } from "@/components/ServiceModal";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Package,
  DollarSign,
  Users,
  Settings,
  Plus,
  Edit,
  Trash2,
  Eye,
  MessageSquare,
  CheckCircle,
  Clock,
  AlertCircle,
  TrendingUp,
  BarChart3,
  Star,
  Search,
  Filter,
  Download,
  Send,
  UserCheck,
  Activity,
} from "lucide-react";

export default function EnhancedAdminDashboard() {
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices();
  const { orders, updateOrderStatus, addOrderMessage, assignBooster } =
    useOrders();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Analytics calculations
  const totalRevenue = orders
    .filter((order) => order.paymentStatus === "paid")
    .reduce((sum, order) => sum + order.totalAmount, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;
  const activeServices = services.filter((service) => service.active).length;
  const totalCustomers = new Set(orders.map((order) => order.userId)).size;

  const recentOrders = orders
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 10);

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

  // Order management functions
  const handleUpdateOrderStatus = (orderId: string, status: any) => {
    updateOrderStatus(orderId, status);
    setSelectedOrder(null);
  };

  const handleSendMessage = (orderId: string) => {
    if (!newMessage.trim()) return;
    addOrderMessage(orderId, "admin", newMessage);
    setNewMessage("");
  };

  const handleAssignBooster = (orderId: string, boosterName: string) => {
    assignBooster(orderId, boosterName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "processing":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "in-progress":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400";
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "processing":
        return <Package className="w-3 h-3" />;
      case "in-progress":
        return <AlertCircle className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <Trash2 className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Enhanced Header */}
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

            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <Button
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Data
              </Button>
              <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                <Plus className="w-4 h-4 mr-2" />
                Quick Actions
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Stats Grid */}
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

        {/* Enhanced Main Content */}
        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Chart Placeholder */}
              <Card className="border border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Revenue Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-gradient-to-t from-primary/10 to-transparent rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-16 h-16 text-primary mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        Revenue chart would be displayed here
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
            </div>

            {/* Recent Activity */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentOrders.slice(0, 5).map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border border-border/30 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-primary rounded-full"></div>
                        <div>
                          <p className="text-sm font-medium">
                            Order {order.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.customerName}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                        <p className="text-sm font-medium mt-1">
                          ${order.totalAmount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            {/* Order Filters */}
            <Card className="border border-border/50">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search orders by ID or customer name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Orders List */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Orders Management ({filteredOrders.length})
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary/20 hover:bg-primary/10"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No orders found
                    </h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all"
                        ? "Try adjusting your search or filter criteria"
                        : "When customers place orders, they will appear here for you to manage and process."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div>
                              <p className="font-medium">{order.id}</p>
                              <p className="text-sm text-muted-foreground">
                                {order.customerName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {order.customerEmail}
                              </p>
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
                              <Badge className={getStatusColor(order.status)}>
                                {getStatusIcon(order.status)}
                                <span className="ml-1 capitalize">
                                  {order.status}
                                </span>
                              </Badge>
                              <p className="text-sm font-medium mt-1">
                                ${order.totalAmount}
                              </p>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedOrder(order)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <MessageSquare className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Order Details Modal */}
                        {selectedOrder?.id === order.id && (
                          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">
                                  Order Actions
                                </h4>
                                <div className="space-y-2">
                                  <Select
                                    value={order.status}
                                    onValueChange={(value) =>
                                      handleUpdateOrderStatus(order.id, value)
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">
                                        Pending
                                      </SelectItem>
                                      <SelectItem value="processing">
                                        Processing
                                      </SelectItem>
                                      <SelectItem value="in-progress">
                                        In Progress
                                      </SelectItem>
                                      <SelectItem value="completed">
                                        Completed
                                      </SelectItem>
                                      <SelectItem value="cancelled">
                                        Cancelled
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>

                                  <Input
                                    placeholder="Assign booster..."
                                    onBlur={(e) =>
                                      e.target.value &&
                                      handleAssignBooster(
                                        order.id,
                                        e.target.value,
                                      )
                                    }
                                  />
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">
                                  Send Message
                                </h4>
                                <div className="space-y-2">
                                  <Textarea
                                    placeholder="Type your message..."
                                    value={newMessage}
                                    onChange={(e) =>
                                      setNewMessage(e.target.value)
                                    }
                                    rows={2}
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => handleSendMessage(order.id)}
                                    className="w-full"
                                  >
                                    <Send className="w-4 h-4 mr-2" />
                                    Send Message
                                  </Button>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedOrder(null)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Enhanced Services Tab */}
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
                                {service.orders} orders
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

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Customer Management
                </CardTitle>
                <CardDescription>
                  View and manage customer accounts and their order history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    Customer management
                  </h3>
                  <p className="text-muted-foreground">
                    Advanced customer management features will be available here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Business Reports
                </CardTitle>
                <CardDescription>
                  Generate detailed reports and analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">
                    Advanced reporting
                  </h3>
                  <p className="text-muted-foreground">
                    Detailed business reports and analytics will be available
                    here
                  </p>
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
    </div>
  );
}
