import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  Download,
  RefreshCw,
  Calendar,
  DollarSign,
  User,
  Package,
  Clock,
  ArrowUpDown,
  CheckSquare,
  Square,
  Grid3X3,
  List,
} from "lucide-react";

interface Order {
  id: string;
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  status: string;
  total_amount?: number;
  totalAmount?: number;
  created_at?: string;
  createdAt?: string;
  payment_status?: string;
  paymentStatus?: string;
  services?: any;
  items?: any;
  [key: string]: any;
}

interface EnhancedOrdersTableProps {
  orders: Order[];
  customOrders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

export function EnhancedOrdersTable({
  orders,
  customOrders,
  onUpdateOrderStatus,
  loading = false,
  onRefresh,
}: EnhancedOrdersTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [dateRange, setDateRange] = useState("all");
  const [amountRange, setAmountRange] = useState("all");

  // Modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrderType, setModalOrderType] = useState<"regular" | "custom">("regular");

  // Combine all orders
  const allOrders = useMemo(() => {
    const regularOrders = orders.map(order => ({ ...order, orderType: "regular" }));
    const customOrdersWithType = customOrders.map(order => ({ ...order, orderType: "custom" }));
    return [...regularOrders, ...customOrdersWithType];
  }, [orders, customOrders]);

  // Helper functions
  const getCustomerName = (order: Order) => order.customer_name || order.customerName || "N/A";
  const getCustomerEmail = (order: Order) => order.customer_email || order.customerEmail || "N/A";
  const getTotalAmount = (order: Order) => order.total_amount || order.totalAmount || 0;
  const getCreatedAt = (order: Order) => order.created_at || order.createdAt || "";
  const getPaymentStatus = (order: Order) => order.payment_status || order.paymentStatus || "unknown";

  // Advanced filtering and searching
  const filteredOrders = useMemo(() => {
    return allOrders.filter(order => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        order.id.toLowerCase().includes(searchLower) ||
        getCustomerName(order).toLowerCase().includes(searchLower) ||
        getCustomerEmail(order).toLowerCase().includes(searchLower) ||
        order.status.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;

      // Order type filter
      const matchesOrderType = orderTypeFilter === "all" || 
        (orderTypeFilter === "regular" && order.orderType === "regular") ||
        (orderTypeFilter === "custom" && order.orderType === "custom");

      // Date range filter
      const orderDate = new Date(getCreatedAt(order));
      const now = new Date();
      let matchesDate = true;
      
      if (dateRange === "today") {
        matchesDate = orderDate.toDateString() === now.toDateString();
      } else if (dateRange === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= weekAgo;
      } else if (dateRange === "month") {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDate = orderDate >= monthAgo;
      }

      // Amount range filter
      const amount = getTotalAmount(order);
      let matchesAmount = true;
      
      if (amountRange === "0-50") {
        matchesAmount = amount <= 50;
      } else if (amountRange === "50-100") {
        matchesAmount = amount > 50 && amount <= 100;
      } else if (amountRange === "100+") {
        matchesAmount = amount > 100;
      }

      return matchesSearch && matchesStatus && matchesOrderType && matchesDate && matchesAmount;
    });
  }, [allOrders, searchTerm, statusFilter, orderTypeFilter, dateRange, amountRange]);

  // Sorting
  const sortedOrders = useMemo(() => {
    return [...filteredOrders].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case "created_at":
          aValue = new Date(getCreatedAt(a));
          bValue = new Date(getCreatedAt(b));
          break;
        case "total_amount":
          aValue = getTotalAmount(a);
          bValue = getTotalAmount(b);
          break;
        case "customer_name":
          aValue = getCustomerName(a);
          bValue = getCustomerName(b);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedOrders.length / pageSize);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Selection handlers
  const handleSelectAll = () => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Bulk actions
  const handleBulkStatusUpdate = (status: string) => {
    selectedOrders.forEach(orderId => {
      onUpdateOrderStatus(orderId, status);
    });
    setSelectedOrders([]);
  };

  // Export functionality
  const handleExport = () => {
    const csvContent = [
      ["Order ID", "Customer", "Email", "Status", "Amount", "Date", "Type"].join(","),
      ...sortedOrders.map(order => [
        order.id.slice(-6),
        getCustomerName(order),
        getCustomerEmail(order),
        order.status,
        getTotalAmount(order),
        new Date(getCreatedAt(order)).toLocaleDateString(),
        order.orderType
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700";
      case "processing":
        return "bg-blue-500/20 text-blue-700";
      case "in-progress":
      case "in_progress":
        return "bg-purple-500/20 text-purple-700";
      case "completed":
        return "bg-green-500/20 text-green-700";
      case "cancelled":
        return "bg-red-500/20 text-red-700";
      default:
        return "bg-gray-500/20 text-gray-700";
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setModalOrderType(order.orderType === "custom" ? "custom" : "regular");
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <Badge variant="outline" className="text-sm">
            {sortedOrders.length} of {allOrders.length} orders
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers, emails..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
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

        <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Order Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="regular">Regular Orders</SelectItem>
            <SelectItem value="custom">Custom Orders</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger>
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 Days</SelectItem>
            <SelectItem value="month">Last 30 Days</SelectItem>
          </SelectContent>
        </Select>

        <Select value={amountRange} onValueChange={setAmountRange}>
          <SelectTrigger>
            <SelectValue placeholder="Amount Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Amounts</SelectItem>
            <SelectItem value="0-50">$0 - $50</SelectItem>
            <SelectItem value="50-100">$50 - $100</SelectItem>
            <SelectItem value="100+">$100+</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedOrders.length} order(s) selected
          </span>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Bulk Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("processing")}>
                  Mark as Processing
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("in-progress")}>
                  Mark as In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkStatusUpdate("completed")}>
                  Mark as Completed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrders([])}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSelectAll}
                    className="h-8 w-8 p-0"
                  >
                    {selectedOrders.length === paginatedOrders.length ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("id")}
                    className="h-auto p-0 font-semibold"
                  >
                    Order ID
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("customer_name")}
                    className="h-auto p-0 font-semibold"
                  >
                    Customer
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("total_amount")}
                    className="h-auto p-0 font-semibold"
                  >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("created_at")}
                    className="h-auto p-0 font-semibold"
                  >
                    Created
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order) => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSelectOrder(order.id)}
                      className="h-8 w-8 p-0"
                    >
                      {selectedOrders.includes(order.id) ? (
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                  <TableCell className="font-mono">
                    #{order.id.slice(-6)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{getCustomerName(order)}</div>
                      <div className="text-sm text-muted-foreground">
                        {getCustomerEmail(order)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {order.status.replace("_", " ").replace("-", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {order.orderType === "custom" ? "Custom" : "Regular"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-semibold">
                    {formatCurrency(getTotalAmount(order))}
                  </TableCell>
                  <TableCell>
                    {new Date(getCreatedAt(order)).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openOrderDetails(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onUpdateOrderStatus(order.id, "processing")}
                        >
                          Mark Processing
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onUpdateOrderStatus(order.id, "completed")}
                        >
                          Mark Completed
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-mono font-medium">#{order.id.slice(-6)}</div>
                  <Badge className={`${getStatusColor(order.status)} text-xs`}>
                    {order.status.replace("_", " ").replace("-", " ")}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openOrderDetails(order)}>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{getCustomerName(order)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold text-primary">
                    {formatCurrency(getTotalAmount(order))}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(getCreatedAt(order)).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, sortedOrders.length)} of{" "}
              {sortedOrders.length} orders
            </span>
            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setCurrentPage(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {totalPages > 5 && <PaginationEllipsis />}
              
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        orderType={modalOrderType}
      />
    </div>
  );
}
