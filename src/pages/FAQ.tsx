import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  MessageSquare,
  Shield,
  Clock,
  CreditCard,
  HelpCircle,
} from "lucide-react";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const faqData: FAQItem[] = [
  {
    id: "1",
    question: "How does the boosting process work?",
    answer:
      "Once you place an order, our professional players will log into your account using secure methods and complete the requested service. You'll receive regular updates on progress, and we guarantee 100% account safety throughout the process.",
    category: "General",
  },
  {
    id: "2",
    question: "Is my account safe during boosting?",
    answer:
      "Absolutely! We use VPN protection, never change any account details, and our boosters are highly experienced professionals. We have a 100% safety record with thousands of completed orders.",
    category: "Security",
  },
  {
    id: "3",
    question: "How long does a typical boost take?",
    answer:
      "Delivery times vary by service type. Level boosts typically take 1-3 days, while more complex services like planet liberation can take 3-7 days. We always provide estimated completion times with each service.",
    category: "Delivery",
  },
  {
    id: "4",
    question: "What payment methods do you accept?",
    answer:
      "We accept all major payment methods through PayPal, including credit cards, debit cards, and PayPal balance. All transactions are secure and encrypted.",
    category: "Payment",
  },
  {
    id: "5",
    question: "Can I track my order progress?",
    answer:
      "Yes! You'll receive regular updates via email and can log into your account to see real-time progress updates. Our team also provides screenshots and progress reports for major milestones.",
    category: "General",
  },
  {
    id: "6",
    question: "What if I'm not satisfied with the service?",
    answer:
      "We offer a 100% satisfaction guarantee. If you're not happy with our service, we'll work to make it right or provide a full refund. Customer satisfaction is our top priority.",
    category: "General",
  },
  {
    id: "7",
    question: "Do you play during specific hours?",
    answer:
      "Our team operates 24/7 across multiple time zones, so your boost can be completed at any time. However, we can accommodate specific time preferences if requested.",
    category: "Delivery",
  },
  {
    id: "8",
    question: "Will other players know I used a boosting service?",
    answer:
      "No, we maintain complete discretion. Our boosters play naturally and don't discuss the service with other players. Your privacy is completely protected.",
    category: "Security",
  },
  {
    id: "9",
    question: "Can I pause or cancel my order?",
    answer:
      "You can pause or cancel your order before work begins. Once boosting has started, cancellation may result in partial charges based on progress completed.",
    category: "General",
  },
  {
    id: "10",
    question: "Do you provide support after completion?",
    answer:
      "Yes! We offer post-completion support for any questions or issues. Our customer service team is available 24/7 to assist you even after your order is complete.",
    category: "General",
  },
];

const categories = ["All", "General", "Security", "Delivery", "Payment"];

export default function FAQ() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const filteredFAQs =
    selectedCategory === "All"
      ? faqData
      : faqData.filter((item) => item.category === selectedCategory);

  const toggleExpanded = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

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
              <HelpCircle className="w-4 h-4 mr-2" />
              Frequently Asked Questions
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Got
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Questions?
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Find answers to the most common questions about our Helldivers 2
              boosting services
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-gradient-to-r from-primary to-blue-600"
                  : "border-primary/20 hover:bg-primary/10"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <Card
              key={faq.id}
              className="overflow-hidden border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-0">
                <button
                  className="w-full p-6 text-left hover:bg-primary/5 transition-colors flex items-center justify-between"
                  onClick={() => toggleExpanded(faq.id)}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {faq.question}
                    </h3>
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                      {faq.category}
                    </span>
                  </div>

                  <div className="ml-4">
                    {expandedItems.includes(faq.id) ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {expandedItems.includes(faq.id) && (
                  <div className="px-6 pb-6 border-t border-border/30">
                    <p className="text-muted-foreground leading-relaxed pt-4">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
            <CardContent className="p-8">
              <MessageSquare className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-muted-foreground mb-6">
                Our support team is available 24/7 to help you with any
                questions
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                  asChild
                >
                  <Link to="/contact">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Support
                  </Link>
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
                    Join Discord
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <Shield className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Security</h4>
              <p className="text-sm text-muted-foreground">
                Learn about our security measures
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Delivery Times</h4>
              <p className="text-sm text-muted-foreground">
                Estimated completion times
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/30 transition-colors">
            <CardContent className="p-6 text-center">
              <CreditCard className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-semibold mb-2">Payment</h4>
              <p className="text-sm text-muted-foreground">
                Secure payment options
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
