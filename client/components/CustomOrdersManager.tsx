import { useState } from "react";
import { useCustomOrders, CustomOrder } from "@/hooks/useCustomOrders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  Calendar,
  DollarSign,
  User,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  BarChart3,
  Activity,
} from "lucide-react";

export default function CustomOrdersManager() {
  const {
    orders,
    stats,
    loading,
    error,
    updateOrderStatus,
    updateDeliveryStatus,
    updateAdminNotes,
    deleteOrder,
  } = useCustomOrders();

  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<string>("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      case "processing":
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
      case "completed":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-500/30";
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case "not_started":
        return "bg-gray-500/20 text-gray-700";
      case "in_progress":
        return "bg-blue-500/20 text-blue-700";
      case "completed":
        return "bg-green-500/20 text-green-700";
      case "failed":
        return "bg-red-500/20 text-red-700";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    const deliveryMatch = deliveryFilter === "all" || order.delivery_status === deliveryFilter;
    return statusMatch && deliveryMatch;
  });

  const handleViewOrder = (order: CustomOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || "");
    setIsOrderModalOpen(true);
  };

  const handleSaveNotes = async () => {
    if (selectedOrder) {
      await updateAdminNotes(selectedOrder.id, adminNotes);
      setSelectedOrder({ ...selectedOrder, admin_notes: adminNotes });
    }
  };

  const handleStatusChange = async (status: CustomOrder['status']) => {
    if (selectedOrder) {
      await updateOrderStatus(selectedOrder.id, status);
      setSelectedOrder({ ...selectedOrder, status });
    }
  };

  const handleDeliveryStatusChange = async (deliveryStatus: CustomOrder['delivery_status']) => {
    if (selectedOrder) {
      await updateDeliveryStatus(selectedOrder.id, deliveryStatus);
      setSelectedOrder({ ...selectedOrder, delivery_status: deliveryStatus });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading custom orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-500/20 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
              <h3 className="text-lg font-semibold mb-2 text-red-700">Error Loading Orders</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_revenue?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.avg_order_value?.toFixed(2) || '0.00'}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_orders}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed_orders}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            Custom Orders ({filteredOrders.length})
          </CardTitle>
          <div className="flex space-x-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by delivery" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery Status</SelectItem>
                <SelectItem value="not_started">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No Custom Orders</h3>
              <p className="text-muted-foreground">
                Custom orders will appear here when created through the order builder.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border/30 rounded-lg p-4 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="font-medium">Order #{order.order_number}</h4>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <Badge variant="outline" className={getDeliveryStatusColor(order.delivery_status)}>
                          {order.delivery_status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center">
                          <DollarSign className="w-4 h-4 mr-1" />
                          ${order.total_amount.toFixed(2)}
                        </div>
                        <div className="flex items-center">
                          <Package className="w-4 h-4 mr-1" />
                          {order.items.length} items
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {order.customer_email || 'Unknown'}
                        </div>
                      </div>
                      {order.special_instructions && (
                        <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                          <strong>Instructions:</strong> {order.special_instructions}
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewOrder(order)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={isOrderModalOpen} onOpenChange={setIsOrderModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order #{selectedOrder?.order_number}
            </DialogTitle>
            <DialogDescription>
              Created on {selectedOrder ? new Date(selectedOrder.created_at).toLocaleDateString() : ''}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Order Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-medium mb-2">Customer Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Email:</strong> {selectedOrder.customer_email || 'Not provided'}</p>
                    <p><strong>Discord:</strong> {selectedOrder.customer_discord || 'Not provided'}</p>
                    <p><strong>Total Amount:</strong> ${selectedOrder.total_amount.toFixed(2)}</p>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Order Status</h4>
                  <div className="space-y-2">
                    <Select
                      value={selectedOrder.status}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={selectedOrder.delivery_status}
                      onValueChange={handleDeliveryStatusChange}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border/30 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {item.quantity}x {item.item_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.total_price.toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">${item.price_per_unit} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.special_instructions && (
                <div>
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedOrder.special_instructions}
                  </div>
                </div>
              )}

              {/* Admin Notes */}
              <div>
                <h4 className="font-medium mb-2">Admin Notes</h4>
                <Textarea
                  placeholder="Add internal notes about this order..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                />
                <Button
                  onClick={handleSaveNotes}
                  className="mt-2"
                  size="sm"
                >
                  Save Notes
                </Button>
              </div>

              {/* Delivery Notes */}
              {selectedOrder.delivery_notes && (
                <div>
                  <h4 className="font-medium mb-2">Delivery Notes</h4>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedOrder.delivery_notes}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOrderModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
