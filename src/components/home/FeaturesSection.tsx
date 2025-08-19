import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Zap, Award, Target, Users, Clock, MessageSquare, Trophy } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "100% Account Safety",
    description: "We use secure methods and never ask for your account credentials. Your account safety is our top priority.",
    color: "text-green-500",
    bgColor: "bg-green-500/20",
  },
  {
    icon: Zap,
    title: "Lightning Fast Delivery",
    description: "Most orders completed within 24 hours. Our expert team works around the clock to deliver results quickly.",
    color: "text-yellow-500", 
    bgColor: "bg-yellow-500/20",
  },
  {
    icon: Award,
    title: "Professional Boosters",
    description: "Our team consists of top-tier players with extensive Helldivers 2 experience and proven track records.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
  },
  {
    icon: Target,
    title: "99.9% Success Rate",
    description: "We guarantee successful completion of your order with our proven methods and experienced team.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
  },
  {
    icon: Users,
    title: "1,200+ Happy Customers",
    description: "Join thousands of satisfied customers who trust us with their Helldivers 2 progression needs.",
    color: "text-pink-500",
    bgColor: "bg-pink-500/20",
  },
  {
    icon: Clock,
    title: "24/7 Customer Support",
    description: "Our support team is available around the clock to answer questions and provide assistance.",
    color: "text-indigo-500",
    bgColor: "bg-indigo-500/20",
  },
  {
    icon: MessageSquare,
    title: "Real-Time Updates",
    description: "Stay informed with live progress updates and direct communication with your assigned booster.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/20",
  },
  {
    icon: Trophy,
    title: "Competitive Pricing",
    description: "Get the best value for your money with our competitive rates and frequent promotional offers.",
    color: "text-orange-500",
    bgColor: "bg-orange-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            Why Choose HelldiversBoost?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            We're the most trusted Helldivers 2 boosting service with a proven track record 
            of delivering exceptional results while maintaining the highest safety standards.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="group border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-card to-card/80 backdrop-blur-sm hover:scale-105"
            >
              <CardHeader className="pb-4">
                <div className={`w-16 h-16 ${feature.bgColor} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Process Steps */}
        <div className="mt-24">
          <div className="text-center mb-16">
            <h3 className="text-3xl lg:text-4xl font-bold mb-6">
              How It Works
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Getting started with our services is simple and straightforward
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Choose Service",
                description: "Select the boosting service that fits your needs from our comprehensive catalog.",
              },
              {
                step: "02", 
                title: "Place Order",
                description: "Complete your order with our secure checkout process and provide any special requirements.",
              },
              {
                step: "03",
                title: "Get Matched",
                description: "We assign a professional booster who specializes in your selected service type.",
              },
              {
                step: "04",
                title: "Track Progress",
                description: "Monitor your order in real-time and communicate directly with your booster.",
              },
            ].map((step, index) => (
              <div key={step.step} className="text-center">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <span className="text-2xl font-bold text-white">{step.step}</span>
                  </div>
                  {index < 3 && (
                    <div className="hidden md:block absolute top-10 left-full w-full h-px bg-gradient-to-r from-primary/50 to-transparent" />
                  )}
                </div>
                <h4 className="text-xl font-semibold mb-3">{step.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
