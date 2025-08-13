import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User,
  Package,
  Star,
  TrendingUp,
  Calendar,
  Filter,
  Search,
  Eye,
  Edit,
  Trash2,
  UserCheck
} from "lucide-react";

interface TicketSystemProps {
  isAdmin?: boolean;
}

export function TicketSystem({ isAdmin = false }: TicketSystemProps) {
  const { orders, updateOrderStatus, addOrderMessage, assignBooster, updateOrderProgress, loading } = useOrders();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [newProgress, setNewProgress] = useState(0);
  const [newBooster, setNewBooster] = useState("");

  // Filter orders based on user role
  const filteredOrders = orders.filter(order => {
    if (!isAdmin && order.userId !== user?.id) return false;
    
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const selectedOrderData = selectedOrder ? orders.find(o => o.id === selectedOrder) : null;

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
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Package className="w-4 h-4" />;
      case "in-progress":
        return <AlertCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <Trash2 className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedOrderData) return;
    
    try {
      await addOrderMessage(selectedOrderData.id, {
        from: isAdmin ? "admin" : "customer",
        message: newMessage
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: any) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAssignBooster = async () => {
    if (!selectedOrderData || !newBooster.trim()) return;
    
    try {
      await assignBooster(selectedOrderData.id, newBooster);
      setNewBooster("");
    } catch (error) {
      console.error("Error assigning booster:", error);
    }
  };

  const handleProgressUpdate = async () => {
    if (!selectedOrderData) return;
    
    try {
      await updateOrderProgress(selectedOrderData.id, newProgress);
    } catch (error) {
      console.error("Error updating progress:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{isAdmin ? "Order Management" : "My Orders"}</h2>
          <p className="text-muted-foreground">
            {isAdmin ? "Manage customer orders and support tickets" : "Track your orders and communicate with support"}
          </p>
        </div>
        
        {isAdmin && (
          <div className="flex items-center space-x-2 text-sm">
            <Badge variant="outline" className="text-green-600 border-green-200">
              {orders.filter(o => o.status === 'completed').length} Completed
            </Badge>
            <Badge variant="outline" className="text-yellow-600 border-yellow-200">
              {orders.filter(o => o.status === 'pending').length} Pending
            </Badge>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
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
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No orders found</p>
                </CardContent>
              </Card>
            ) : (
              filteredOrders.map((order) => (
                <Card 
                  key={order.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedOrder === order.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">#{order.id.slice(-8)}</p>
                        <p className="text-xs text-muted-foreground">{order.customerName}</p>
                      </div>
                      <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{order.status}</span>
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">${order.totalAmount}</span>
                      <div className="flex items-center space-x-2">
                        {order.messages.filter(m => !m.isRead && (isAdmin ? m.from === 'customer' : m.from !== 'customer')).length > 0 && (
                          <Badge className="bg-red-500/20 text-red-700 text-xs">
                            {order.messages.filter(m => !m.isRead && (isAdmin ? m.from === 'customer' : m.from !== 'customer')).length} new
                          </Badge>
                        )}
                        <MessageSquare className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{order.messages.length}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="lg:col-span-2">
          {selectedOrderData ? (
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Order Details</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                {isAdmin && <TabsTrigger value="admin">Admin Actions</TabsTrigger>}
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Order #{selectedOrderData.id.slice(-8)}
                      <Badge className={getStatusColor(selectedOrderData.status)}>
                        {getStatusIcon(selectedOrderData.status)}
                        <span className="ml-2">{selectedOrderData.status}</span>
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Placed on {formatDate(selectedOrderData.createdAt)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Customer Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Customer</p>
                        <p className="font-medium">{selectedOrderData.customerName}</p>
                        <p className="text-sm text-muted-foreground">{selectedOrderData.customerEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="font-medium text-lg">${selectedOrderData.totalAmount}</p>
                        <Badge className={selectedOrderData.paymentStatus === 'paid' ? 'text-green-700 border-green-200' : 'text-yellow-700 border-yellow-200'}>
                          {selectedOrderData.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* Progress */}
                    {selectedOrderData.progress !== undefined && (
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Progress</span>
                          <span className="text-sm text-muted-foreground">{selectedOrderData.progress}%</span>
                        </div>
                        <Progress value={selectedOrderData.progress} className="h-2" />
                      </div>
                    )}

                    {/* Booster Info */}
                    {selectedOrderData.assignedBooster && (
                      <div>
                        <p className="text-sm text-muted-foreground">Assigned Booster</p>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2 text-primary" />
                          <span className="font-medium">{selectedOrderData.assignedBooster}</span>
                        </div>
                      </div>
                    )}

                    {/* Services */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Services</p>
                      <div className="space-y-2">
                        {selectedOrderData.services.map((service, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded">
                            <span className="font-medium">{service.name}</span>
                            <div className="text-right">
                              <span className="font-medium">${service.price}</span>
                              <span className="text-xs text-muted-foreground ml-2">x{service.quantity}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Timeline */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Timeline</p>
                      <div className="space-y-3">
                        {selectedOrderData.tracking.map((event, index) => (
                          <div key={index} className="flex items-start space-x-3">
                            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                            <div>
                              <p className="font-medium text-sm">{event.status}</p>
                              <p className="text-xs text-muted-foreground">{event.description}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(event.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="messages" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Messages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-64 overflow-y-auto mb-4">
                      {selectedOrderData.messages.length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          No messages yet. Start a conversation!
                        </p>
                      ) : (
                        selectedOrderData.messages.map((message) => (
                          <div
                            key={message.id}
                            className={`p-3 rounded-lg ${
                              (isAdmin && message.from === 'admin') || (!isAdmin && message.from === 'customer')
                                ? "bg-primary/10 ml-8"
                                : "bg-muted mr-8"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium capitalize">
                                {message.from === 'customer' && isAdmin ? 'Customer' : 
                                 message.from === 'admin' && !isAdmin ? 'Support' : 
                                 message.from === 'customer' && !isAdmin ? 'You' : 
                                 'Admin'}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(message.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="space-y-3">
                      <Textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                      />
                      <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {isAdmin && (
                <TabsContent value="admin" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Status Update */}
                      <div>
                        <label className="text-sm font-medium">Update Status</label>
                        <Select 
                          value={selectedOrderData.status} 
                          onValueChange={(value) => handleStatusUpdate(selectedOrderData.id, value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Assign Booster */}
                      <div>
                        <label className="text-sm font-medium">Assign Booster</label>
                        <div className="flex space-x-2 mt-1">
                          <Input
                            value={newBooster}
                            onChange={(e) => setNewBooster(e.target.value)}
                            placeholder="Booster name"
                          />
                          <Button onClick={handleAssignBooster} disabled={!newBooster.trim()}>
                            <UserCheck className="w-4 h-4 mr-2" />
                            Assign
                          </Button>
                        </div>
                      </div>

                      {/* Update Progress */}
                      <div>
                        <label className="text-sm font-medium">Update Progress ({newProgress}%)</label>
                        <div className="flex space-x-2 mt-1">
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={newProgress}
                              onChange={(e) => setNewProgress(parseInt(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <Button onClick={handleProgressUpdate}>
                            Update
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Select an Order</h3>
                <p className="text-muted-foreground">
                  Choose an order from the list to view details and messages
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}