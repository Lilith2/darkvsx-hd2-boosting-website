import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  MessageSquare,
  ExternalLink,
  Users,
  Zap,
  Shield,
  CheckCircle,
  Clock,
  Globe,
} from "lucide-react";

export default function Contact() {
  const handleDiscordClick = () => {
    window.open('https://discord.gg/GqPTaWnfTG', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <MessageSquare className="w-4 h-4 mr-2" />
              Discord Support Available
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Join Our
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Discord
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get instant support, place orders, connect with our community, and receive real-time updates on your boosting services
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Discord CTA */}
        <div className="text-center mb-16">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 overflow-hidden">
            <CardContent className="p-12">
              <div className="w-24 h-24 bg-gradient-to-r from-primary to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                <MessageSquare className="w-12 h-12 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join our active Discord community where you can place orders, get instant support from our team,
                track your boost progress, and connect with fellow Helldivers.
              </p>

              <Button
                size="lg"
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-lg px-8 py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleDiscordClick}
              >
                <MessageSquare className="w-5 h-5 mr-3" />
                Join Discord Server
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>

              <p className="text-sm text-muted-foreground mt-4">
                Click to open Discord in a new tab
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Support</h3>
              <p className="text-sm text-muted-foreground">
                Get help immediately from our active support team and community members
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Active Community</h3>
              <p className="text-sm text-muted-foreground">
                Connect with thousands of Helldivers players and boosting customers
              </p>
            </CardContent>
          </Card>

          <Card className="border border-border/50 hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Verified Safe</h3>
              <p className="text-sm text-muted-foreground">
                Official server with verified staff and secure communication
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">2,500+</div>
              <div className="text-muted-foreground">Discord Members</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">&lt;5min</div>
              <div className="text-muted-foreground">Average Response</div>
            </CardContent>
          </Card>
          <Card className="text-center border-0 shadow-lg bg-gradient-to-br from-card to-card/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-muted-foreground">Support Available</div>
            </CardContent>
          </Card>
        </div>

        {/* What You Get */}
        <Card className="mb-12 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl">What You'll Find in Our Discord</CardTitle>
            <CardDescription className="text-center text-lg">
              Your one-stop destination for all Helldivers 2 boosting needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Order Placement & Support</p>
                    <p className="text-sm text-muted-foreground">
                      Place orders directly in Discord and get instant support from our team
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Live Progress Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      Get real-time updates and screenshots of your boost progress
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Community Events</p>
                    <p className="text-sm text-muted-foreground">
                      Special events, giveaways, and community challenges
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Game Tips & Strategies</p>
                    <p className="text-sm text-muted-foreground">
                      Learn from experienced players and improve your gameplay
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Exclusive Discord Pricing</p>
                    <p className="text-sm text-muted-foreground">
                      Access to Discord-only discounts and member-exclusive offers
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Booster Communication</p>
                    <p className="text-sm text-muted-foreground">
                      Chat directly with your assigned booster during service
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">News & Updates</p>
                    <p className="text-sm text-muted-foreground">
                      Be first to know about new services and features
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Multilingual Support</p>
                    <p className="text-sm text-muted-foreground">
                      Support available in multiple languages
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Response Time</h3>
                  <p className="text-sm text-muted-foreground">Usually within minutes</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Our support team and community are active around the clock to help you with any questions or issues.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/10"
                onClick={handleDiscordClick}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Get Support Now
              </Button>
            </CardContent>
          </Card>

          <Card className="border border-border/50">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Alternative Contact</h3>
                  <p className="text-sm text-muted-foreground">Need help with Discord?</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                If you need help accessing Discord or have any other concerns, check our FAQ section.
              </p>
              <Button 
                variant="outline" 
                className="w-full border-primary/20 hover:bg-primary/10"
                asChild
              >
                <Link href="/faq">
                  View FAQ
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
