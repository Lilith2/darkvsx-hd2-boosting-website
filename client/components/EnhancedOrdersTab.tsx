import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Package,
  Search,
  Filter,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  MoreHorizontal,
  FileText,
  Send,
  Star,
  AlertCircle,
  CheckCircle,
  Eye,
  Edit,
  MessageSquare,
  UserCheck,
  RefreshCw,
  BarChart3,
  Target,
  Activity,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EnhancedOrdersTabProps {
  orders: any[];
  customOrders: any[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  onAssignBooster: (orderId: string, booster: string) => void;
  onAddOrderMessage: (orderId: string, message: any) => void;
}

export function EnhancedOrdersTab({ 
  orders = [], 
  customOrders = [], 
  onUpdateOrderStatus,
  onAssignBooster,
  onAddOrderMessage 
}: EnhancedOrdersTabProps) {
  const { toast } = useToast();
  
  // State for filters and search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  
  // Combine all orders
  const allOrders = useMemo(() => {
    const regularOrders = orders.filter(order => 
      !order.services?.some((s: any) => s.id === "support-ticket")
    );
    
    return [...regularOrders, ...customOrders].map(order => ({
      ...order,
      isCustom: customOrders.includes(order),
      searchableText: `${order.customerName} ${order.customerEmail} ${order.id} ${order.services?.map((s: any) => s.name).join(' ')}`.toLowerCase()
    }));
  }, [orders, customOrders]);

  // Advanced filtering and searching
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.searchableText.includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Order type filter
    if (orderTypeFilter === "regular") {
      filtered = filtered.filter(order => !order.isCustom);
    } else if (orderTypeFilter === "custom") {
      filtered = filtered.filter(order => order.isCustom);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDays = dateFilter === "today" ? 1 : 
                        dateFilter === "week" ? 7 : 
                        dateFilter === "month" ? 30 : 0;
      
      if (filterDays > 0) {
        const cutoffDate = new Date(now.getTime() - filterDays * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => 
          new Date(order.createdAt || order.created_at) >= cutoffDate
        );
      }
    }

    // Sort orders
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.createdAt || b.created_at).getTime() - new Date(a.createdAt || a.created_at).getTime());
        break;
      case "oldest":
        filtered.sort((a, b) => new Date(a.createdAt || a.created_at).getTime() - new Date(b.createdAt || b.created_at).getTime());
        break;
      case "value_high":
        filtered.sort((a, b) => (b.totalAmount || b.total_amount || 0) - (a.totalAmount || a.total_amount || 0));
        break;
      case "value_low":
        filtered.sort((a, b) => (a.totalAmount || a.total_amount || 0) - (b.totalAmount || b.total_amount || 0));
        break;
      case "status":
        filtered.sort((a, b) => a.status.localeCompare(b.status));
        break;
    }

    return filtered;
  }, [allOrders, searchTerm, statusFilter, orderTypeFilter, dateFilter, sortBy]);

  // Analytics calculations
  const analytics = useMemo(() => {
    const totalRevenue = filteredOrders.reduce((sum, order) => 
      sum + (order.totalAmount || order.total_amount || 0), 0
    );
    
    const statusCounts = filteredOrders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgOrderValue = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
    
    const completionRate = filteredOrders.length > 0 ? 
      ((statusCounts.completed || 0) / filteredOrders.length) * 100 : 0;

    return {
      totalRevenue,
      totalOrders: filteredOrders.length,
      avgOrderValue,
      completionRate,
      statusCounts
    };
  }, [filteredOrders]);

  // Bulk actions
  const handleBulkStatusUpdate = (newStatus: string) => {
    selectedOrders.forEach(orderId => onUpdateOrderStatus(orderId, newStatus));
    setSelectedOrders([]);
    toast({
      title: "Bulk update completed",
      description: `Updated ${selectedOrders.length} orders to ${newStatus}`,
    });
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map(order => order.id));
    }
  };

  // Export functionality
  const handleExportCSV = () => {
    const headers = ["Order ID", "Customer Name", "Email", "Status", "Total", "Created Date", "Type"];
    const csvData = filteredOrders.map(order => [
      order.id,
      order.customerName,
      order.customerEmail,
      order.status,
      `$${(order.totalAmount || order.total_amount || 0).toFixed(2)}`,
      new Date(order.createdAt || order.created_at).toLocaleDateString(),
      order.isCustom ? "Custom" : "Regular"
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export completed",
      description: "Orders have been exported to CSV",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "processing": return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case "in-progress": return <Activity className="w-4 h-4 text-purple-500" />;
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">
                  ${analytics.totalRevenue.toFixed(2)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ${analytics.avgOrderValue.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.completionRate.toFixed(1)}%
                </p>
                <Progress value={analytics.completionRate} className="mt-2 h-2" />
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters and Search */}
      <Card className="border border-border/50">
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center">
                <Package className="w-5 h-5 mr-2" />
                Enhanced Order Management ({filteredOrders.length})
              </CardTitle>
              <CardDescription>
                Advanced order management with search, filtering, and analytics
              </CardDescription>
            </div>

            {/* Bulk Actions */}
            {selectedOrders.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium">{selectedOrders.length} selected</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuLabel>Status Updates</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("processing")}>
                      Mark as Processing
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("in-progress")}>
                      Mark as In Progress
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkStatusUpdate("completed")}>
                      Mark as Completed
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setSelectedOrders([])}>
                      Clear Selection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>

          {/* Search and Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Order Type Filter */}
            <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Regular Orders</SelectItem>
                <SelectItem value="custom">Custom Orders</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="value_high">Highest Value</SelectItem>
                <SelectItem value="value_low">Lowest Value</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="flex items-center gap-2"
              >
                <Checkbox
                  checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                  className="w-4 h-4"
                />
                Select All
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <span className="text-sm text-muted-foreground">
                {filteredOrders.length} orders found
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredOrders.length === 0}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground">
                  {searchTerm ? "Try adjusting your search or filters" : "Orders will appear here when customers place them"}
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="border border-border/30 rounded-lg p-6 hover:border-primary/30 transition-all bg-card/50 hover:bg-card/80"
                >
                  <div className="space-y-4">
                    {/* Order Header with Checkbox */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedOrders.includes(order.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders([...selectedOrders, order.id]);
                            } else {
                              setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                            }
                          }}
                          className="mt-1"
                        />
                        <div>
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {order.isCustom ? "Custom " : ""}Order #{order.id.slice(-6)}
                            </h3>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(order.status)}
                              <Badge
                                className={`
                                  ${order.status === "pending" ? "bg-yellow-500/20 text-yellow-700" :
                                    order.status === "processing" ? "bg-blue-500/20 text-blue-700" :
                                    order.status === "in-progress" ? "bg-purple-500/20 text-purple-700" :
                                    order.status === "completed" ? "bg-green-500/20 text-green-700" :
                                    "bg-red-500/20 text-red-700"}
                                `}
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </div>
                            {order.isCustom && (
                              <Badge className="bg-purple-500/20 text-purple-700">
                                Custom Order
                              </Badge>
                            )}
                          </div>
                          
                          {/* Customer Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground mb-1">Customer</p>
                              <p className="font-medium">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Order Value</p>
                              <p className="font-bold text-lg text-primary">
                                ${(order.totalAmount || order.total_amount || 0).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground mb-1">Created</p>
                              <p className="font-medium">
                                {new Date(order.createdAt || order.created_at).toLocaleDateString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(order.createdAt || order.created_at).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <MessageSquare className="w-4 h-4 mr-2" />
                              Send Message
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <UserCheck className="w-4 h-4 mr-2" />
                              Assign Booster
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Status Updates</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onUpdateOrderStatus(order.id, "processing")}>
                              Mark Processing
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateOrderStatus(order.id, "in-progress")}>
                              Mark In Progress
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onUpdateOrderStatus(order.id, "completed")}>
                              Mark Completed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
