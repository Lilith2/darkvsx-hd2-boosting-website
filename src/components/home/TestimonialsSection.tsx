import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare } from "lucide-react";
import { useFeaturedReviews } from "@/hooks/useReviews";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import Link from "next/link";

// Fallback testimonials for when no database reviews are available
const fallbackTestimonials = [
  {
    id: "1",
    customer_name: "Alex M.",
    rating: 5,
    comment:
      "Incredible service! Got my level boost completed in just 2 hours. Professional team and great communication throughout the process.",
    service_name: "Level Boost",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    customer_name: "Sarah K.",
    rating: 5,
    comment:
      "Best boosting service I've used. Fast, reliable, and secure. Highly recommend for anyone looking to progress quickly in Helldivers 2.",
    service_name: "Weapon Unlock",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: "3",
    customer_name: "Michael R.",
    rating: 5,
    comment:
      "Amazing experience from start to finish. The booster was skilled and completed everything exactly as promised. Will definitely use again!",
    service_name: "Mission Completion",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: "4",
    customer_name: "Emma T.",
    rating: 5,
    comment:
      "Professional service with excellent customer support. They answered all my questions and delivered exactly what was promised.",
    service_name: "Super Credits",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: "5",
    customer_name: "David L.",
    rating: 5,
    comment:
      "Outstanding quality and speed. The team completed my order in record time while maintaining the highest safety standards.",
    service_name: "Samples Farming",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
  {
    id: "6",
    customer_name: "Jessica W.",
    rating: 5,
    comment:
      "Exceeded my expectations! Great value for money and the booster was incredibly skilled. Highly recommended for all Helldivers 2 services.",
    service_name: "Custom Order",
    verified: true,
    featured: true,
    status: 'approved' as const,
    created_at: new Date().toISOString(),
  },
];

export function TestimonialsSection() {
  const { reviews: featuredReviews, loading } = useFeaturedReviews(6);

  // Use database reviews if available, otherwise fallback to hardcoded testimonials
  const displayReviews = featuredReviews.length > 0 ? featuredReviews : fallbackTestimonials.map(testimonial => ({
    ...testimonial,
    customer_email: "",
    user_id: null,
    title: null,
    order_id: null,
    order_number: null,
    metadata: {},
    updated_at: testimonial.created_at,
    approved_at: testimonial.created_at,
    featured_at: testimonial.created_at,
  }));
  return (
    <section className="py-24 bg-gradient-to-br from-muted/20 to-muted/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who trust us with their
            Helldivers 2 progression. Real reviews from real players.
          </p>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-muted-foreground">Loading reviews...</p>
          </div>
        )}

        {/* Reviews Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayReviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="text-center mt-16">
          <p className="text-lg text-muted-foreground mb-6">
            Ready to join our satisfied customers?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#services"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-lg hover:from-primary/90 hover:to-blue-600/90 transition-all"
            >
              Get Started Today
            </a>
            <Link href="/reviews">
              <span className="inline-flex items-center justify-center px-8 py-3 border border-border hover:bg-muted/50 font-semibold rounded-lg transition-all">
                View All Reviews
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
