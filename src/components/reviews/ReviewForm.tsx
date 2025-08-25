import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Package,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { submitReview, getCompletedOrders } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReviewFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface CompletedOrder {
  id: string;
  order_number?: string;
  customer_name: string;
  services: any[];
  total_amount: number;
  completed_at: string;
  created_at: string;
  order_type: "regular" | "custom";
  has_review: boolean;
}

export function ReviewForm({ onSuccess, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<"orders" | "review">("orders");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrders, setCompletedOrders] = useState<CompletedOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CompletedOrder | null>(
    null,
  );

  // Guest user fields
  const [guestEmail, setGuestEmail] = useState("");
  const [isGuestEmailValid, setIsGuestEmailValid] = useState(false);

  // Review form fields
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState(user?.username || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load completed orders when component mounts
  useEffect(() => {
    loadCompletedOrders();
  }, [user, guestEmail, isGuestEmailValid]);

  const loadCompletedOrders = async () => {
    if (!user && (!guestEmail || !isGuestEmailValid)) {
      setLoading(false);
      setErrorMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await getCompletedOrders({
        user_id: user?.id,
        customer_email: user?.email || guestEmail,
      });

      if (result.success && result.orders) {
        const reviewableOrders = result.orders.filter(
          (order) => !order.has_review,
        );
        setCompletedOrders(reviewableOrders);

        if (reviewableOrders.length === 0 && result.orders.length > 0) {
          setErrorMessage(
            "All your completed orders have already been reviewed.",
          );
        }
      } else {
        const errorMsg = result.error || "Failed to load your orders";
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        setCompletedOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      const errorMsg =
        "Unable to connect to our servers. Please check your internet connection and try again.";
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      setCompletedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestEmailChange = (email: string) => {
    setGuestEmail(email);
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    setIsGuestEmailValid(isValid);
  };

  const handleOrderSelect = (order: CompletedOrder) => {
    setSelectedOrder(order);
    setCustomerName(order.customer_name);
    setStep("review");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedOrder) {
      toast.error("Please select an order to review");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Please provide your name");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine service name from selected order
      let serviceName = "";
      if (selectedOrder.services && selectedOrder.services.length > 0) {
        if (selectedOrder.order_type === "regular") {
          serviceName = selectedOrder.services
            .map((s) => s.service_name)
            .join(", ");
        } else {
          serviceName = selectedOrder.services
            .map((s) => s.item_name)
            .join(", ");
        }
      }

      const result = await submitReview({
        customer_name: customerName.trim(),
        customer_email: user?.email || guestEmail,
        user_id: user?.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        order_id: selectedOrder.id,
        service_name: serviceName,
      });

      if (result.success) {
        toast.success(
          "Review submitted successfully! It will be reviewed before appearing publicly.",
        );

        // Reset form
        setRating(0);
        setTitle("");
        setComment("");
        setSelectedOrder(null);
        setStep("orders");

        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatOrderDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatOrderServices = (services: any[], orderType: string) => {
    if (!services || services.length === 0) return "No services";

    if (orderType === "regular") {
      return services.map((s) => s.service_name).join(", ");
    } else {
      return services.map((s) => s.item_name).join(", ");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Write a Review
          {step === "review" && selectedOrder && (
            <Badge variant="outline" className="ml-2">
              Order #
              {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}
            </Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {step === "orders"
            ? "Select a completed order to review"
            : "Share your experience with our service"}
        </p>
      </CardHeader>
      <CardContent>
        {step === "orders" && (
          <>
            {/* Guest Email Input */}
            {!user && (
              <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
                <Label htmlFor="guestEmail">Your Email Address</Label>
                <Input
                  id="guestEmail"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => handleGuestEmailChange(e.target.value)}
                  placeholder="Enter the email used for your order"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  We'll use this to find your completed orders
                </p>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your orders...</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-red-700 dark:text-red-400">
                  Unable to Load Orders
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {errorMessage}
                </p>
                <div className="flex justify-center space-x-3">
                  <Button
                    variant="outline"
                    onClick={loadCompletedOrders}
                    disabled={loading}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Close
                    </Button>
                  )}
                </div>
              </div>
            ) : completedOrders.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No Reviewable Orders Found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {!user && (!guestEmail || !isGuestEmailValid)
                    ? "Please enter your email address to find your orders"
                    : "You don't have any completed orders that haven't been reviewed yet."}
                </p>
                <Button variant="outline" onClick={onCancel}>
                  Close
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold">Select an Order to Review:</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {completedOrders.map((order) => (
                    <div
                      key={order.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => handleOrderSelect(order)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            Order #{order.order_number || order.id.slice(0, 8)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Completed: {formatOrderDate(order.completed_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${order.total_amount.toFixed(2)}
                          </p>
                          <Badge variant="secondary" className="text-xs">
                            {order.order_type === "regular"
                              ? "Service"
                              : "Custom"}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {formatOrderServices(order.services, order.order_type)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {step === "review" && selectedOrder && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Back Button */}
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep("orders")}
              className="mb-4"
            >
              ← Back to Order Selection
            </Button>

            {/* Order Summary */}
            <div className="bg-muted/30 rounded-lg p-4">
              <h4 className="font-medium mb-2">Reviewing Order:</h4>
              <p className="text-sm text-muted-foreground">
                #{selectedOrder.order_number || selectedOrder.id.slice(0, 8)} -{" "}
                {formatOrderServices(
                  selectedOrder.services,
                  selectedOrder.order_type,
                )}
              </p>
              <p className="text-sm text-muted-foreground">
                Completed: {formatOrderDate(selectedOrder.completed_at)}
              </p>
            </div>

            {/* Customer Name */}
            <div className="space-y-2">
              <Label htmlFor="customerName">Your Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        star <= (hoverRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300 hover:text-yellow-300"
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 ? `${rating}/5 stars` : "Select a rating"}
                </span>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title (Optional)</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Brief summary of your experience"
                maxLength={255}
              />
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor="comment">Your Review</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={4}
                required
                maxLength={2000}
              />
              <div className="text-xs text-muted-foreground text-right">
                {comment.length}/2000 characters
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex space-x-4">
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0}
                className="flex-1"
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>

            <div className="flex items-start space-x-2 text-xs text-muted-foreground">
              <CheckCircle className="w-4 h-4 mt-0.5 text-green-600" />
              <p>
                Your review will be verified and moderated before appearing
                publicly. Only customers who have completed orders can write
                reviews.
              </p>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
