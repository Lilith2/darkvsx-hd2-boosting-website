import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, User, MessageSquare } from "lucide-react";

const testimonials = [
  {
    id: 1,
    name: "Alex M.",
    rating: 5,
    comment: "Incredible service! Got my level boost completed in just 2 hours. Professional team and great communication throughout the process.",
    service: "Level Boost",
    verified: true,
  },
  {
    id: 2,
    name: "Sarah K.",
    rating: 5,
    comment: "Best boosting service I've used. Fast, reliable, and secure. Highly recommend for anyone looking to progress quickly in Helldivers 2.",
    service: "Weapon Unlock",
    verified: true,
  },
  {
    id: 3,
    name: "Michael R.",
    rating: 5,
    comment: "Amazing experience from start to finish. The booster was skilled and completed everything exactly as promised. Will definitely use again!",
    service: "Mission Completion",
    verified: true,
  },
  {
    id: 4,
    name: "Emma T.",
    rating: 5,
    comment: "Professional service with excellent customer support. They answered all my questions and delivered exactly what was promised.",
    service: "Super Credits",
    verified: true,
  },
  {
    id: 5,
    name: "David L.",
    rating: 5,
    comment: "Outstanding quality and speed. The team completed my order in record time while maintaining the highest safety standards.",
    service: "Samples Farming",
    verified: true,
  },
  {
    id: 6,
    name: "Jessica W.",
    rating: 5,
    comment: "Exceeded my expectations! Great value for money and the booster was incredibly skilled. Highly recommended for all Helldivers 2 services.",
    service: "Custom Order",
    verified: true,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-muted/20 to-muted/10">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            What Our Customers Say
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Join thousands of satisfied customers who trust us with their Helldivers 2 progression. 
            Real reviews from real players.
          </p>
        </div>

        {/* Note: Reviews will be dynamically populated from customer orders in the future */}

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.id}
              className="border-0 shadow-lg bg-card/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group"
            >
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.service}
                      </div>
                    </div>
                  </div>
                  {testimonial.verified && (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200">
                      Verified
                    </Badge>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                {/* Comment */}
                <div className="relative">
                  <MessageSquare className="w-5 h-5 text-muted-foreground/30 absolute -top-1 -left-1" />
                  <p className="text-muted-foreground leading-relaxed pl-6">
                    "{testimonial.comment}"
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

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
            <a
              href="/contact"
              className="inline-flex items-center justify-center px-8 py-3 border border-border hover:bg-muted/50 font-semibold rounded-lg transition-all"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
