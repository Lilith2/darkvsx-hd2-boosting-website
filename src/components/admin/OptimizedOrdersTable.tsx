import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
  Package,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Info,
  RefreshCw,
} from "lucide-react";
import { useOptimizedOrders } from "@/hooks/useOptimizedOrders";
import { OrderData } from "@/hooks/useOrders";

interface OptimizedOrdersTableProps {
  onOrderDetailsClick?: (order: OrderData, type: "regular" | "custom") => void;
  onRefresh?: () => void;
}

export function OptimizedOrdersTable({
  onOrderDetailsClick,
  onRefresh,
}: OptimizedOrdersTableProps) {
  const {
    orders,
    loading,
    pagination,
    filters,
    fetchOrders,
    setFilters,
    setPage,
    setPageSize,
    updateOrderStatus,
    refreshCurrentPage,
  } = useOptimizedOrders();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);

  // Load initial data
  useEffect(() => {
    fetchOrders();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const newFilters: any = {};
    
    if (statusFilter !== "all") {
      newFilters.status = statusFilter;
    }
    
    if (searchTerm.trim()) {
      newFilters.search = searchTerm.trim();
    }
    
    if (dateRange) {
      newFilters.dateRange = dateRange;
    }

    setFilters(newFilters);
  }, [searchTerm, statusFilter, dateRange, setFilters]);

  // Fetch data when filters or pagination change
  useEffect(() => {
    fetchOrders();
  }, [filters, pagination.currentPage, pagination.pageSize, fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: OrderData["status"]) => {
    try {
      await updateOrderStatus(orderId, newStatus);
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const handleRefresh = () => {
    refreshCurrentPage();
    onRefresh?.();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-300";
      case "processing":
        return "bg-blue-500/20 text-blue-700 border-blue-300";
      case "in-progress":
        return "bg-purple-500/20 text-purple-700 border-purple-300";
      case "completed":
        return "bg-green-500/20 text-green-700 border-green-300";
      case "cancelled":
        return "bg-red-500/20 text-red-700 border-red-300";
      default:
        return "bg-gray-500/20 text-gray-700 border-gray-300";
    }
  };

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "in-progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const pageSizeOptions = [10, 20, 50, 100];

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Orders ({pagination.totalCount})
            </CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders, customers, emails..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading orders...</span>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No orders found</p>
            <p className="text-sm">
              {Object.keys(filters).length > 0
                ? "Try adjusting your filters to see more results."
                : "Orders will appear here once customers place them."}
            </p>
          </div>
        ) : (
          <>
            {/* Orders Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Services</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        #{order.id.slice(-8)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.customerEmail}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          {order.services.slice(0, 2).map((service, idx) => (
                            <div key={idx} className="text-sm">
                              {service.name} x{service.quantity}
                            </div>
                          ))}
                          {order.services.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{order.services.length - 2} more
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${order.totalAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={order.status}
                          onValueChange={(value) => 
                            handleStatusChange(order.id, value as OrderData["status"])
                          }
                        >
                          <SelectTrigger className="w-32">
                            <Badge
                              variant="outline"
                              className={`${getStatusColor(order.status)} border-0`}
                            >
                              {order.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOrderDetailsClick?.(order, "regular")}
                        >
                          <Info className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Rows per page:</span>
                <Select
                  value={pagination.pageSize.toString()}
                  onValueChange={(value) => setPageSize(Number(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {pageSizeOptions.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Page {pagination.currentPage} of {pagination.totalPages} 
                  ({pagination.totalCount} total)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage - 1)}
                  disabled={pagination.currentPage <= 1 || loading}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages || loading}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
