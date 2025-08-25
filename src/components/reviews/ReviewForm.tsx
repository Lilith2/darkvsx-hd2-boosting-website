import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star } from "lucide-react";
import { submitReview } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface ReviewFormProps {
  orderId?: string;
  orderNumber?: string;
  serviceName?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ 
  orderId, 
  orderNumber, 
  serviceName, 
  onSuccess, 
  onCancel 
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState(user?.username || "");
  const [customerEmail, setCustomerEmail] = useState(user?.email || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please write a comment");
      return;
    }

    if (!customerName.trim() || !customerEmail.trim()) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitReview({
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim(),
        user_id: user?.id,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        order_id: orderId,
        order_number: orderNumber,
        service_name: serviceName,
      });

      if (result.success) {
        toast.success("Review submitted successfully! It will be reviewed before appearing publicly.");
        
        // Reset form
        setRating(0);
        setTitle("");
        setComment("");
        if (!user) {
          setCustomerName("");
          setCustomerEmail("");
        }
        
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        {serviceName && (
          <p className="text-sm text-muted-foreground">
            Reviewing: {serviceName}
            {orderNumber && ` (Order #${orderNumber})`}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Information (only if not logged in) */}
          {!user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="space-y-2">
                <Label htmlFor="customerEmail">Your Email</Label>
                <Input
                  id="customerEmail"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>
          )}

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

          <p className="text-xs text-muted-foreground">
            Reviews are moderated and will appear publicly after approval.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
