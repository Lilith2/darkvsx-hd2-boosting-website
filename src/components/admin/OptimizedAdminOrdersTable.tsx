import React, { useState, useMemo, useCallback, memo } from "react";
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
} from "@/components/ui/dropdown-menu";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { OrderDetailsModal } from "@/components/OrderDetailsModal";
import {
  Search,
  RefreshCw,
  Download,
  MoreHorizontal,
  Eye,
  ArrowUpDown,
  CheckSquare,
  Square,
  Grid3X3,
  List,
  User,
  DollarSign,
  Clock,
} from "lucide-react";

// Import our optimized utilities
import {
  Order,
  orderHelpers,
  getStatusColor,
  formatCurrency,
  formatDate,
  useOrderFiltersAndSorting,
  performanceMonitor,
  exportToCSV,
} from "./utils";

interface OptimizedAdminOrdersTableProps {
  orders: Order[];
  customOrders: Order[];
  onUpdateOrderStatus: (orderId: string, status: string) => void;
  loading?: boolean;
  onRefresh?: () => void;
}

// Memoized order row component for performance
const OrderRow = memo(({ 
  order, 
  isSelected, 
  onSelect, 
  onStatusUpdate, 
  onViewDetails 
}: {
  order: Order;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onStatusUpdate: (id: string, status: string) => void;
  onViewDetails: (order: Order) => void;
}) => {
  const handleSelect = useCallback(() => onSelect(order.id), [onSelect, order.id]);
  const handleView = useCallback(() => onViewDetails(order), [onViewDetails, order]);
  
  const handleStatusUpdate = useCallback((status: string) => {
    onStatusUpdate(order.id, status);
  }, [onStatusUpdate, order.id]);

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelect}
          className="h-8 w-8 p-0"
        >
          {isSelected ? (
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
          <div className="font-medium">{orderHelpers.getCustomerName(order)}</div>
          <div className="text-sm text-muted-foreground">
            {orderHelpers.getCustomerEmail(order)}
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
        {formatCurrency(orderHelpers.getTotalAmount(order))}
      </TableCell>
      <TableCell>
        {formatDate(orderHelpers.getCreatedAt(order))}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleView}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleStatusUpdate("processing")}>
              Mark Processing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleStatusUpdate("completed")}>
              Mark Completed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
});

OrderRow.displayName = "OrderRow";

// Memoized order card component for performance
const OrderCard = memo(({ 
  order, 
  onViewDetails 
}: {
  order: Order;
  onViewDetails: (order: Order) => void;
}) => {
  const handleView = useCallback(() => onViewDetails(order), [onViewDetails, order]);

  return (
    <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
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
            <DropdownMenuItem onClick={handleView}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{orderHelpers.getCustomerName(order)}</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-primary">
            {formatCurrency(orderHelpers.getTotalAmount(order))}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>{formatDate(orderHelpers.getCreatedAt(order))}</span>
        </div>
      </div>
    </div>
  );
});

OrderCard.displayName = "OrderCard";

export function OptimizedAdminOrdersTable({
  orders,
  customOrders,
  onUpdateOrderStatus,
  loading = false,
  onRefresh,
}: OptimizedAdminOrdersTableProps) {
  // Performance monitoring
  const endMeasure = performanceMonitor.measureRender("OptimizedAdminOrdersTable");

  // Filter and sort state
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

  // Combine orders with orderType metadata
  const allOrders = useMemo(() => {
    const regularOrders = orders.map(order => ({ ...order, orderType: "regular" as const }));
    const customOrdersWithType = customOrders.map(order => ({ ...order, orderType: "custom" as const }));
    return [...regularOrders, ...customOrdersWithType];
  }, [orders, customOrders]);

  // Use optimized filtering and sorting hook
  const { applyFiltersAndSorting } = useOrderFiltersAndSorting(allOrders);

  // Apply filters and sorting with performance monitoring
  const filteredAndSortedOrders = useMemo(() => {
    return performanceMonitor.measureFunction("filterAndSort", () => {
      return applyFiltersAndSorting(
        searchTerm,
        statusFilter,
        orderTypeFilter,
        dateRange,
        amountRange,
        sortBy,
        sortOrder
      );
    });
  }, [applyFiltersAndSorting, searchTerm, statusFilter, orderTypeFilter, dateRange, amountRange, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / pageSize);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedOrders.slice(start, start + pageSize);
  }, [filteredAndSortedOrders, currentPage, pageSize]);

  // Event handlers - all memoized for performance
  const handleSort = useCallback((column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  }, [sortBy, sortOrder]);

  const handleSelectOrder = useCallback((orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedOrders.length === paginatedOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(paginatedOrders.map(order => order.id));
    }
  }, [selectedOrders.length, paginatedOrders]);

  const handleBulkStatusUpdate = useCallback((status: string) => {
    selectedOrders.forEach(orderId => {
      onUpdateOrderStatus(orderId, status);
    });
    setSelectedOrders([]);
  }, [selectedOrders, onUpdateOrderStatus]);

  const handleExport = useCallback(() => {
    exportToCSV(filteredAndSortedOrders, "admin-orders");
  }, [filteredAndSortedOrders]);

  const openOrderDetails = useCallback((order: Order) => {
    setSelectedOrder(order);
    setModalOrderType(order.orderType === "custom" ? "custom" : "regular");
    setIsModalOpen(true);
  }, []);

  // Cleanup performance monitoring
  React.useEffect(() => {
    return endMeasure;
  }, [endMeasure]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner className="w-8 h-8" />
        <span className="ml-2">Loading orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Stats and Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <Badge variant="outline" className="text-sm">
            {filteredAndSortedOrders.length} of {allOrders.length} orders
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

      {/* Optimized Search and Filters */}
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
                <OrderRow
                  key={order.id}
                  order={order}
                  isSelected={selectedOrders.includes(order.id)}
                  onSelect={handleSelectOrder}
                  onStatusUpdate={onUpdateOrderStatus}
                  onViewDetails={openOrderDetails}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Cards View */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onViewDetails={openOrderDetails}
            />
          ))}
        </div>
      )}

      {/* Simple Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredAndSortedOrders.length)} of{" "}
              {filteredAndSortedOrders.length} orders
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

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
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
