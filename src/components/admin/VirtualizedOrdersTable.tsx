import React, { memo, useMemo, useState, useCallback } from "react";
import { useOptimizedTable } from "@/hooks/useVirtualizedData";
import { orderHelpers, getStatusColor } from "./utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminTableSkeleton } from "./AdminTableSkeleton";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";

interface VirtualizedOrdersTableProps {
  orders: any[];
  customOrders: any[];
  isLoading?: boolean;
  onOrderSelect?: (order: any) => void;
  onStatusUpdate?: (orderId: string, status: string) => void;
}

const OrderRow = memo(
  ({
    order,
    onSelect,
    onStatusUpdate,
  }: {
    order: any;
    onSelect?: (order: any) => void;
    onStatusUpdate?: (orderId: string, status: string) => void;
  }) => {
    const handleStatusChange = useCallback(
      (newStatus: string) => {
        onStatusUpdate?.(order.id, newStatus);
      },
      [order.id, onStatusUpdate],
    );

    return (
      <TableRow
        className="h-[60px]"
        style={{
          transform: `translateY(${order.virtualStart}px)`,
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
        }}
      >
        <TableCell className="font-mono text-xs">
          {order.id.slice(-8)}
        </TableCell>
        <TableCell>
          <div>
            <div className="font-medium">
              {orderHelpers.getCustomerName(order)}
            </div>
            <div className="text-sm text-muted-foreground">
              {orderHelpers.getCustomerEmail(order)}
            </div>
          </div>
        </TableCell>
        <TableCell>
          <Select value={order.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-auto">
              <Badge className={getStatusColor(order.status)}>
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
        <TableCell className="font-mono">
          ${orderHelpers.getTotalAmount(order).toFixed(2)}
        </TableCell>
        <TableCell className="text-sm">
          {format(new Date(orderHelpers.getCreatedAt(order)), "MMM d, yyyy")}
        </TableCell>
        <TableCell>
          <Badge
            variant={order.orderType === "custom" ? "secondary" : "default"}
          >
            {order.orderType === "custom" ? "Custom" : "Standard"}
          </Badge>
        </TableCell>
        <TableCell>
          <Button variant="ghost" size="sm" onClick={() => onSelect?.(order)}>
            <Eye className="w-4 h-4" />
          </Button>
        </TableCell>
      </TableRow>
    );
  },
);

OrderRow.displayName = "OrderRow";

export default function VirtualizedOrdersTable({
  orders = [],
  customOrders = [],
  isLoading = false,
  onOrderSelect,
  onStatusUpdate,
}: VirtualizedOrdersTableProps) {
  // Combine and normalize order data
  const normalizedOrders = useMemo(() => {
    const regularOrders = orders.map((order) => ({
      ...order,
      orderType: "regular" as const,
    }));

    const normalizedCustomOrders = customOrders.map((order) => ({
      ...order,
      orderType: "custom" as const,
    }));

    return [...regularOrders, ...normalizedCustomOrders];
  }, [orders, customOrders]);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Set up virtualized table
  const {
    parentRef,
    virtualizer,
    visibleData,
    totalSize,
    searchTerm,
    setSearchTerm,
    addFilter,
    removeFilter,
    clearFilters,
    sorts,
    addSort,
    filteredCount,
    totalCount,
    shouldVirtualize,
  } = useOptimizedTable(normalizedOrders, {
    data: normalizedOrders,
    estimateSize: 60,
    overscan: 5,
  });

  // Handle status filter
  const handleStatusFilter = useCallback(
    (status: string) => {
      setStatusFilter(status);
      if (status === "all") {
        removeFilter("status");
      } else {
        addFilter({ field: "status", value: status });
      }
    },
    [addFilter, removeFilter],
  );

  // Handle type filter
  const handleTypeFilter = useCallback(
    (type: string) => {
      setTypeFilter(type);
      if (type === "all") {
        removeFilter("orderType");
      } else {
        addFilter({ field: "orderType", value: type });
      }
    },
    [addFilter, removeFilter],
  );

  // Handle sorting
  const handleSort = useCallback(
    (field: string) => {
      addSort({ field, direction: "asc" });
    },
    [addSort],
  );

  if (isLoading) {
    return <AdminTableSkeleton rows={10} columns={7} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Orders ({filteredCount.toLocaleString()})</span>
          {shouldVirtualize && <Badge variant="outline">Virtualized</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>

            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={handleTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="regular">Standard</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {(statusFilter !== "all" || typeFilter !== "all" || searchTerm) && (
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Virtualized Table */}
        {shouldVirtualize ? (
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("id")}
                      className="h-auto p-0 font-semibold"
                    >
                      Order ID
                      {sorts.find((s) => s.field === "id") &&
                        (sorts.find((s) => s.field === "id")?.direction ===
                        "asc" ? (
                          <SortAsc className="ml-1 w-3 h-3" />
                        ) : (
                          <SortDesc className="ml-1 w-3 h-3" />
                        ))}
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("customer_email")}
                      className="h-auto p-0 font-semibold"
                    >
                      Customer
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("total_amount")}
                      className="h-auto p-0 font-semibold"
                    >
                      Amount
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort("created_at")}
                      className="h-auto p-0 font-semibold"
                    >
                      Date
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
            </Table>

            <div ref={parentRef} className="h-[600px] overflow-auto">
              <div
                style={{
                  height: `${totalSize}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                <Table>
                  <TableBody>
                    {visibleData.map((order) => (
                      <OrderRow
                        key={order.virtualKey}
                        order={order}
                        onSelect={onOrderSelect}
                        onStatusUpdate={onStatusUpdate}
                      />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        ) : (
          // Fallback to regular table for smaller datasets
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleData.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onSelect={onOrderSelect}
                    onStatusUpdate={onStatusUpdate}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Statistics */}
        <div className="text-sm text-muted-foreground">
          Showing {filteredCount} of {totalCount} orders
          {shouldVirtualize && " (virtualized for performance)"}
        </div>
      </CardContent>
    </Card>
  );
}
