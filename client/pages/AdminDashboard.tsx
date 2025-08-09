import { useState } from "react";
import { useServices, Service } from "@/hooks/useServices";
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
} from "lucide-react";

interface Order {
  id: string;
  customer: string;
  service: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  amount: number;
  date: string;
}

const mockOrders: Order[] = [];

export default function AdminDashboard() {
  const [orders] = useState<Order[]>(mockOrders);
  const {
    services,
    addService,
    updateService,
    deleteService,
    toggleServiceStatus,
  } = useServices();
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "in-progress":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
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

  const handleAddService = () => {
    setEditingService(null);
    setIsServiceModalOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setIsServiceModalOpen(true);
  };

  const handleSaveService = (
    serviceData: Omit<Service, "id" | "createdAt" | "orders">,
  ) => {
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

  const totalRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + order.amount, 0);

  const pendingOrders = orders.filter(
    (order) => order.status === "pending",
  ).length;
  const activeServices = services.filter((service) => service.active).length;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Manage your Helldivers 2 boosting business
        </p>
      </div>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${totalRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                +12.5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Orders
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingOrders}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Services
              </CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeServices}</div>
              <p className="text-xs text-muted-foreground">
                Available for purchase
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Customers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">+8% new this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>
                  Manage and track customer orders
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                      When customers place orders, they will appear here for you
                      to manage and process.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{order.id}</p>
                            <p className="text-sm text-muted-foreground">
                              {order.customer}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {order.service}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {order.date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">
                              {order.status}
                            </span>
                          </Badge>
                          <span className="font-medium">${order.amount}</span>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="ghost">
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
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Manage Services</CardTitle>
                  <CardDescription>
                    Add, edit, or disable boosting services
                  </CardDescription>
                </div>
                <Button onClick={handleAddService}>
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
                    <Button onClick={handleAddService}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="font-medium">{service.title}</p>
                            <p className="text-sm text-muted-foreground">
                              {service.orders} orders • {service.difficulty}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {service.duration}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {service.popular && (
                            <Badge variant="outline" className="text-xs">
                              Popular
                            </Badge>
                          )}
                          <Badge
                            variant={service.active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleServiceStatus(service.id)}
                          >
                            {service.active ? "Active" : "Inactive"}
                          </Badge>
                          <span className="font-medium">${service.price}</span>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="customers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Management</CardTitle>
                <CardDescription>
                  View and manage customer accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Customer management features coming soon</p>
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
