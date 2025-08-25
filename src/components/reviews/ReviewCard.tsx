import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare } from "lucide-react";
import type { Review } from "@/hooks/useReviews";

interface ReviewCardProps {
  review: Review;
  showActions?: boolean;
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export function ReviewCard({
  review,
  showActions = false,
  onEdit,
  onDelete,
}: ReviewCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-semibold">{review.customer_name}</div>
              {review.service_name && (
                <div className="text-sm text-muted-foreground">
                  {review.service_name}
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {formatDate(review.created_at)}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end space-y-1">
            {review.verified && (
              <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                Verified
              </Badge>
            )}
            {review.featured && (
              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                Featured
              </Badge>
            )}
            {review.status !== "approved" && (
              <Badge variant="outline" className="text-xs">
                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </Badge>
            )}
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="font-semibold text-lg mb-2">{review.title}</h4>
        )}

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < review.rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          ))}
          <span className="text-sm text-muted-foreground ml-2">
            ({review.rating}/5)
          </span>
        </div>

        {/* Comment */}
        <div className="relative">
          <MessageSquare className="w-5 h-5 text-muted-foreground/30 absolute -top-1 -left-1" />
          <p className="text-muted-foreground leading-relaxed pl-6">
            "{review.comment}"
          </p>
        </div>

        {/* Order Information */}
        {review.order_number && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Order: #{review.order_number}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="mt-4 pt-4 border-t border-border flex space-x-2">
            {onEdit && (
              <button
                onClick={() => onEdit(review)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(review.id)}
                className="text-sm text-destructive hover:text-destructive/80 transition-colors"
              >
                Delete
              </button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
