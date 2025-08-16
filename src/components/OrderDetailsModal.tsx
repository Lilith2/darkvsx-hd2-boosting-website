import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Mail,
  CreditCard,
  Package,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Clock,
  Hash,
} from "lucide-react";
// Define flexible order types that handle both database and transformed formats
interface FlexibleOrder {
  id: string;
  // Handle both naming conventions
  customer_name?: string;
  customerName?: string;
  customer_email?: string;
  customerEmail?: string;
  customer_discord?: string;
  status: string;
  total_amount?: number;
  totalAmount?: number;
  services?: any;
  items?: any;
  notes?: string;
  special_instructions?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  completed_at?: string;
  // Payment related
  paymentStatus?: string;
  payment_status?: string;
  transactionId?: string;
  transaction_id?: string;
  // Referral related
  referralCode?: string;
  referral_code?: string;
  referralDiscount?: number;
  referral_discount?: number;
  creditsUsed?: number;
  credits_used?: number;
  // IP and other
  ipAddress?: string;
  ip_address?: string;
  [key: string]: any; // Allow additional properties
}

interface OrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: FlexibleOrder | null;
  orderType: "regular" | "custom";
}

export function OrderDetailsModal({
  isOpen,
  onClose,
  order,
  orderType,
}: OrderDetailsModalProps) {
  if (!order) return null;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number | string) => {
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numAmount);
  };

  // Helper functions to safely get property values
  const getCustomerName = (order: FlexibleOrder) => {
    return order.customer_name || order.customerName || "N/A";
  };

  const getCustomerEmail = (order: FlexibleOrder) => {
    return order.customer_email || order.customerEmail || "N/A";
  };

  const getTotalAmount = (order: FlexibleOrder) => {
    return order.total_amount || order.totalAmount || 0;
  };

  const getCreatedAt = (order: FlexibleOrder) => {
    return order.created_at || order.createdAt || "";
  };

  const getUpdatedAt = (order: FlexibleOrder) => {
    return order.updated_at || order.updatedAt;
  };

  const getPaymentStatus = (order: FlexibleOrder) => {
    return order.paymentStatus || order.payment_status;
  };

  const getTransactionId = (order: FlexibleOrder) => {
    return order.transactionId || order.transaction_id;
  };

  const getReferralCode = (order: FlexibleOrder) => {
    return order.referralCode || order.referral_code;
  };

  const getReferralDiscount = (order: FlexibleOrder) => {
    return order.referralDiscount || order.referral_discount;
  };

  const getCreditsUsed = (order: FlexibleOrder) => {
    return order.creditsUsed || order.credits_used;
  };

  const getIpAddress = (order: FlexibleOrder) => {
    return order.ipAddress || order.ip_address;
  };

  const getNotes = (order: FlexibleOrder) => {
    return orderType === "regular" ? order.notes : order.special_instructions;
  };

  // Type guards to check if it's a regular order or custom order
  const isRegularOrder = () => orderType === "regular" || "services" in order;
  const isCustomOrder = () => orderType === "custom" || "items" in order;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {orderType === "regular" ? "Order" : "Custom Order"} Details
          </DialogTitle>
          <DialogDescription>
            Comprehensive information for {orderType} order #{order.id.slice(-6)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <div className="space-y-6">
            {/* Order Status & Basic Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Order Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-mono text-sm">#{order.id.slice(-6)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    className={
                      order.status === "pending"
                        ? "bg-yellow-500/20 text-yellow-700"
                        : order.status === "processing"
                        ? "bg-blue-500/20 text-blue-700"
                        : order.status === "in-progress" || order.status === "in_progress"
                        ? "bg-purple-500/20 text-purple-700"
                        : order.status === "completed"
                        ? "bg-green-500/20 text-green-700"
                        : "bg-red-500/20 text-red-700"
                    }
                  >
                    <span className="capitalize">{order.status.replace("_", " ")}</span>
                  </Badge>
                </div>
                {isRegularOrder() && getPaymentStatus(order) && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge
                      variant="outline"
                      className={
                        getPaymentStatus(order) === "paid"
                          ? "border-green-500/50 text-green-600"
                          : getPaymentStatus(order) === "pending"
                          ? "border-yellow-500/50 text-yellow-600"
                          : "border-red-500/50 text-red-600"
                      }
                    >
                      {getPaymentStatus(order) === "paid"
                        ? "Paid"
                        : "Payment " + getPaymentStatus(order)}
                    </Badge>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(getTotalAmount(order))}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Customer Information
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p>{getCustomerName(order)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p>{getCustomerEmail(order)}</p>
                  </div>
                </div>
                {isCustomOrder() && order.customer_discord && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Discord</p>
                      <p>{order.customer_discord}</p>
                    </div>
                  </div>
                )}
                {isRegularOrder() && getIpAddress(order) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">IP Address</p>
                      <p className="font-mono text-sm">{getIpAddress(order)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Services/Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Package className="h-4 w-4" />
                {orderType === "regular" ? "Services" : "Items"}
              </h3>
              <div className="space-y-2">
                {isRegularOrder() && order.services && (
                  <div className="space-y-2">
                    {Array.isArray(order.services)
                      ? order.services.map((service: any, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-muted/50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{service.name || service.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {service.quantity || 1}
                                </p>
                              </div>
                              <p className="font-semibold">
                                {formatCurrency(service.price)}
                              </p>
                            </div>
                          </div>
                        ))
                      : typeof order.services === "string"
                      ? JSON.parse(order.services).map((service: any, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-muted/50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{service.name || service.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {service.quantity || 1}
                                </p>
                              </div>
                              <p className="font-semibold">
                                {formatCurrency(service.price)}
                              </p>
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                )}

                {isCustomOrder() && order.items && (
                  <div className="space-y-2">
                    {Array.isArray(order.items)
                      ? order.items.map((item: any, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-muted/50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.item_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Category: {item.category}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(item.price_per_unit)} each
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(item.total_price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      : typeof order.items === "string"
                      ? JSON.parse(order.items).map((item: any, index: number) => (
                          <div
                            key={index}
                            className="border rounded-lg p-3 bg-muted/50"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">{item.item_name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Category: {item.category}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Quantity: {item.quantity}
                                </p>
                                {item.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">
                                  {formatCurrency(item.price_per_unit)} each
                                </p>
                                <p className="font-semibold">
                                  {formatCurrency(item.total_price)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      : null}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Payment Information */}
            {isRegularOrder() && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {getTransactionId(order) && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Transaction ID</p>
                        <p className="font-mono text-sm">{getTransactionId(order)}</p>
                      </div>
                    )}
                    {getReferralCode(order) && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Referral Code</p>
                        <p className="font-mono text-sm">{getReferralCode(order)}</p>
                      </div>
                    )}
                    {getReferralDiscount(order) && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Referral Discount</p>
                        <p className="text-green-600">
                          -{formatCurrency(getReferralDiscount(order))}
                        </p>
                      </div>
                    )}
                    {getCreditsUsed(order) && (
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Credits Used</p>
                        <p className="text-blue-600">
                          {formatCurrency(getCreditsUsed(order))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Notes and Additional Info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Additional Information
              </h3>
              <div className="space-y-4">
                {((isRegularOrder(order) && order.notes) ||
                  (isCustomOrder(order) && order.special_instructions)) && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {orderType === "regular" ? "Notes" : "Special Instructions"}
                    </p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm">
                        {isRegularOrder(order) ? order.notes : order.special_instructions}
                      </p>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created At
                    </p>
                    <p className="text-sm">{formatDate(order.created_at || order.createdAt || "")}</p>
                  </div>
                  {order.updated_at && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Last Updated
                      </p>
                      <p className="text-sm">{formatDate(order.updated_at)}</p>
                    </div>
                  )}
                  {isCustomOrder(order) && order.completed_at && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Completed At
                      </p>
                      <p className="text-sm">{formatDate(order.completed_at)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
