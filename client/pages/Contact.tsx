import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  MessageSquare,
  Mail,
  Clock,
  Send,
  Phone,
  MapPin,
  Headphones,
  Shield,
  Zap,
  Users,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

const supportCategories = [
  { value: "order-inquiry", label: "Order Inquiry" },
  { value: "technical-issue", label: "Technical Issue" },
  { value: "payment-problem", label: "Payment Problem" },
  { value: "account-support", label: "Account Support" },
  { value: "general-question", label: "General Question" },
  { value: "feedback", label: "Feedback" },
];

const urgencyLevels = [
  {
    value: "low",
    label: "Low - General inquiry",
    color: "bg-green-500/20 text-green-700",
  },
  {
    value: "medium",
    label: "Medium - Need assistance",
    color: "bg-yellow-500/20 text-yellow-700",
  },
  {
    value: "high",
    label: "High - Order issue",
    color: "bg-orange-500/20 text-orange-700",
  },
  {
    value: "urgent",
    label: "Urgent - Payment/Security",
    color: "bg-red-500/20 text-red-700",
  },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "",
    urgency: "",
    orderId: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Support ticket created!",
      description: `Your ticket #${Date.now().toString().slice(-6)} has been submitted. We'll respond within 24 hours.`,
    });

    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "",
      urgency: "",
      orderId: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              <Headphones className="w-4 h-4 mr-2" />
              24/7 Support Available
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Contact
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Support
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Need help? Our expert support team is here to assist you 24/7
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          <Card className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Send us a detailed message
              </p>
              <Badge className="bg-blue-500/20 text-blue-700">
                Response within 24h
              </Badge>
            </CardContent>
          </Card>

          <Link to="/faq">
            <Card className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <HelpCircle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">FAQ</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Find answers to common questions
                </p>
                <Badge className="bg-purple-500/20 text-purple-700">
                  Instant answers
                </Badge>
              </CardContent>
            </Card>
          </Link>

          <a
            href="https://discord.gg/helldivers2boost"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="border border-border/50 hover:border-primary/30 transition-colors cursor-pointer group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Discord</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Join our community server
                </p>
                <Badge className="bg-indigo-500/20 text-indigo-700">
                  Active community
                </Badge>
              </CardContent>
            </Card>
          </a>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Send className="w-5 h-5 mr-2" />
                  Create Support Ticket
                </CardTitle>
                <CardDescription>
                  Submit a detailed support request and we'll get back to you
                  soon
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Your full name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          subject: e.target.value,
                        }))
                      }
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {supportCategories.map((category) => (
                            <SelectItem
                              key={category.value}
                              value={category.value}
                            >
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Urgency *</Label>
                      <Select
                        value={formData.urgency}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, urgency: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          {urgencyLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full mr-2 ${level.color.split(" ")[0]}`}
                                />
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="orderId">Order ID (Optional)</Label>
                    <Input
                      id="orderId"
                      value={formData.orderId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          orderId: e.target.value,
                        }))
                      }
                      placeholder="ORD-123456"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          message: e.target.value,
                        }))
                      }
                      placeholder="Please describe your issue in detail..."
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Submit Ticket
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Contact Information & FAQ */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>Get in Touch</CardTitle>
                <CardDescription>
                  Multiple ways to reach our support team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">
                      support@helldivers-boost.com
                    </p>
                  </div>
                </div>


                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">
                      Within 2-24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Discord Community</p>
                    <a
                      href="https://discord.gg/helldivers2boost"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Join our Discord server
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Support Features */}
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>Why Our Support?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Expert Team</p>
                    <p className="text-sm text-muted-foreground">
                      Experienced Helldivers players
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Fast Resolution</p>
                    <p className="text-sm text-muted-foreground">
                      Quick problem solving
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">24/7 Availability</p>
                    <p className="text-sm text-muted-foreground">
                      Round-the-clock assistance
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Multilingual</p>
                    <p className="text-sm text-muted-foreground">
                      Support in multiple languages
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-6 h-6 text-red-500 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">
                      Urgent Issues?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      For payment problems, security concerns, or account access
                      issues, contact us immediately via Discord or email.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/20 hover:bg-red-500/10"
                        onClick={() => window.open('https://discord.gg/helldivers2boost', '_blank')}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Discord Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
