import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  Target,
  Shield,
  Users,
  Trophy,
  Clock,
  Star,
  Award,
  Gamepad2,
  HeartHandshake,
  Zap,
  CheckCircle,
  MessageSquare,
} from "lucide-react";

const stats = [
  { label: "Orders Completed", value: "10,000+", icon: CheckCircle },
  { label: "Happy Customers", value: "5,000+", icon: Users },
  { label: "Success Rate", value: "99.9%", icon: Trophy },
  { label: "Average Rating", value: "4.9/5", icon: Star },
];

const values = [
  {
    icon: Shield,
    title: "Security First",
    description:
      "Your account safety is our absolute priority. We use advanced security measures and never compromise on protection.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "We pride ourselves on quick delivery times without sacrificing quality. Most orders completed within 24-48 hours.",
  },
  {
    icon: HeartHandshake,
    title: "Customer Focus",
    description:
      "Every customer matters to us. We provide personalized service and support throughout your entire experience.",
  },
  {
    icon: Award,
    title: "Elite Quality",
    description:
      "Our team consists of top-tier players who deliver exceptional results that exceed expectations.",
  },
];

const team = [
  {
    name: "Alex Chen",
    role: "Founder & Lead Booster",
    description:
      "10+ years in gaming industry, Helldivers veteran with 1000+ hours",
    achievements: ["#1 Global Leaderboard", "Beta Tester", "Community Leader"],
  },
  {
    name: "Sarah Johnson",
    role: "Operations Manager",
    description: "Ensures smooth operations and customer satisfaction",
    achievements: [
      "Customer Service Excellence",
      "Process Optimization",
      "Team Leadership",
    ],
  },
  {
    name: "Mike Rodriguez",
    role: "Security Specialist",
    description: "Cybersecurity expert ensuring account protection",
    achievements: [
      "Certified Security Expert",
      "Zero Breach Record",
      "VPN Specialist",
    ],
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center mb-6">
            <Link to="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Users className="w-4 h-4 mr-2" />
              About Our Company
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Elite
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Helldivers
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We're passionate gamers dedicated to helping fellow Helldivers
              achieve their goals through professional boosting services
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Mission Statement */}
        <div className="text-center mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
            <CardContent className="p-8">
              <Target className="w-16 h-16 text-primary mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                To provide the most reliable, secure, and efficient Helldivers 2
                boosting services while maintaining the highest standards of
                customer satisfaction and account safety. We believe every
                player deserves to experience the full potential of their gaming
                journey.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card
              key={index}
              className="text-center border border-border/50 hover:border-primary/30 transition-colors"
            >
              <CardContent className="p-6">
                <stat.icon className="w-8 h-8 text-primary mx-auto mb-3" />
                <div className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Our
            </span>
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              {" "}
              Story
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <Card className="border border-border/50">
                <CardContent className="p-8">
                  <Gamepad2 className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-semibold mb-4">
                    Founded by Gamers, for Gamers
                  </h3>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    Started in 2024 by a group of passionate Helldivers players
                    who understood the challenges of progressing in the game
                    while managing busy real-world schedules.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    What began as helping friends with difficult missions has
                    evolved into a trusted service used by thousands of players
                    worldwide.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">1</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">The Beginning</h4>
                      <p className="text-sm text-muted-foreground">
                        Started as a small team of elite players helping the
                        community
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">2</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Growing Trust</h4>
                      <p className="text-sm text-muted-foreground">
                        Built reputation through consistent quality and security
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-bold">3</span>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Industry Leaders</h4>
                      <p className="text-sm text-muted-foreground">
                        Now serving thousands with the highest standards
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Our Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Our
            </span>
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              {" "}
              Values
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card
                key={index}
                className="border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mb-4">
                    <value.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {value.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Meet the
            </span>
            <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
              {" "}
              Team
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <Card
                key={index}
                className="text-center border border-border/50 hover:border-primary/30 transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-8">
                  <div className="w-16 h-16 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">
                      {member.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                  <p className="text-primary font-medium mb-3">{member.role}</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {member.description}
                  </p>
                  <div className="space-y-1">
                    {member.achievements.map((achievement, i) => (
                      <div
                        key={i}
                        className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full inline-block mr-1"
                      >
                        {achievement}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Why Choose Us */}
        <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
          <CardContent className="p-8 text-center">
            <Trophy className="w-16 h-16 text-primary mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-4">Why Choose Us?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex flex-col items-center">
                <Clock className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-medium">24/7 Support</p>
              </div>
              <div className="flex flex-col items-center">
                <Shield className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-medium">100% Safe</p>
              </div>
              <div className="flex flex-col items-center">
                <Zap className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-medium">Fast Delivery</p>
              </div>
              <div className="flex flex-col items-center">
                <Star className="w-8 h-8 text-primary mb-2" />
                <p className="text-sm font-medium">Top Rated</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                asChild
              >
                <Link to="/">Start Your Journey</Link>
              </Button>
              <Button
                variant="outline"
                className="border-primary/20 hover:bg-primary/10"
                asChild
              >
                <a
                  href="https://discord.gg/helldivers2boost"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Join Discord Community
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
