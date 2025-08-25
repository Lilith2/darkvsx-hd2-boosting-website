import { useState } from "react";
import { SEOHead } from "../components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Plus, Filter, MessageSquare } from "lucide-react";
import { useApprovedReviews } from "@/hooks/useReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

type FilterType = "all" | "5" | "4" | "3" | "2" | "1";

export default function Reviews() {
  const { user } = useAuth();
  const { reviews, loading, error } = useApprovedReviews();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<FilterType>("all");

  // Filter reviews based on rating
  const filteredReviews = reviews.filter((review) => {
    if (ratingFilter === "all") return true;
    return review.rating === parseInt(ratingFilter);
  });

  // Calculate review statistics
  const reviewStats = {
    total: reviews.length,
    average:
      reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        : 0,
    distribution: {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    },
  };

  return (
    <>
      <SEOHead
        title="Customer Reviews - Helldivers 2 Boosting Services | HelldiversBoost"
        description="Read genuine customer reviews for our Helldivers 2 boosting services. See what our satisfied customers say about our fast, professional service."
      />

      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/80">
        {/* Hero Section */}
        <section className="py-24 bg-gradient-to-r from-primary/10 to-blue-600/10">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Customer Reviews
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed mb-8">
                Real feedback from real customers. See what our community says
                about our Helldivers 2 boosting services.
              </p>

              {/* Review Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">
                      {reviewStats.total}
                    </div>
                    <div className="text-muted-foreground">Total Reviews</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="flex items-center justify-center space-x-1 mb-2">
                      <span className="text-3xl font-bold text-primary">
                        {reviewStats.average.toFixed(1)}
                      </span>
                      <Star className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="text-muted-foreground">Average Rating</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6 text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {reviewStats.total > 0
                        ? Math.round(
                            (reviewStats.distribution[5] / reviewStats.total) *
                              100,
                          )
                        : 0}
                      %
                    </div>
                    <div className="text-muted-foreground">5-Star Reviews</div>
                  </CardContent>
                </Card>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => setShowReviewForm(true)}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Write a Review
                </Button>
                <Link href="/#services">
                  <Button size="lg" variant="outline">
                    Browse Services
                  </Button>
                </Link>
              </div>

              {/* Information about review requirements */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                  ✓ Only verified customers who have completed orders can write reviews
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Review Form Modal */}
        {showReviewForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <ReviewForm
                onSuccess={() => setShowReviewForm(false)}
                onCancel={() => setShowReviewForm(false)}
              />
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            {/* Filters */}
            <div className="flex flex-wrap items-center justify-between mb-8">
              <h2 className="text-2xl font-bold">
                All Reviews ({filteredReviews.length})
              </h2>

              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Filter by rating:
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant={ratingFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRatingFilter("all")}
                  >
                    All
                  </Button>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <Button
                      key={rating}
                      variant={
                        ratingFilter === rating.toString()
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() =>
                        setRatingFilter(rating.toString() as FilterType)
                      }
                      className="flex items-center space-x-1"
                    >
                      <span>{rating}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-muted-foreground">Loading reviews...</p>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Failed to load reviews. Please try again later.
                </p>
              </div>
            )}

            {/* No Reviews State */}
            {!loading && !error && filteredReviews.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">
                  {ratingFilter === "all"
                    ? "No reviews yet"
                    : `No ${ratingFilter}-star reviews`}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {ratingFilter === "all"
                    ? "Be the first to share your experience! Complete an order to write a review."
                    : `Try selecting a different rating filter.`}
                </p>
                {ratingFilter === "all" && (
                  <Button onClick={() => setShowReviewForm(true)}>
                    Write a Review
                  </Button>
                )}
              </div>
            )}

            {/* Reviews Grid */}
            {!loading && !error && filteredReviews.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
              </div>
            )}

            {/* Load More Button (for future pagination) */}
            {!loading && !error && filteredReviews.length > 0 && (
              <div className="text-center mt-12">
                <p className="text-muted-foreground">
                  Showing {filteredReviews.length} of {reviewStats.total}{" "}
                  reviews
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-blue-600/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Experience Our Service?
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of satisfied customers and boost your Helldivers 2
              experience today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/#services">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  Browse Our Services
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
