import { useState } from "react";
import Link from "next/link";
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
    question: "How safe is your boosting service?",
    answer:
      "Our service maintains a strong safety record with no reported punishments, bans, or account issues to date. While we cannot guarantee 100% risk-free operation (as no service can), our track record demonstrates consistent safety. We employ secure methods and maintain transparent communication about any potential risks.",
    category: "Security",
  },
  {
    id: "2",
    question: "How does the boosting process work?",
    answer:
      "Our process is straightforward and secure: you add our booster on Helldivers 2, then they join your gaming session. This method eliminates the need for password sharing or account access, ensuring your credentials remain completely private and secure throughout the entire process.",
    category: "General",
  },
  {
    id: "3",
    question: "Why are your prices more competitive than competitors?",
    answer:
      "We believe quality boosting services should be accessible and fairly priced. Our competitive pricing reflects our commitment to providing excellent value while maintaining professional service standards. We focus on fair pricing rather than inflated costs that can burden our customers.",
    category: "General",
  },
  {
    id: "4",
    question: "Do I need to share my account credentials?",
    answer:
      "Absolutely not. Our session-joining methodology means you never need to share passwords, account details, or any sensitive information. You simply add our booster in-game and they join your session, keeping your account completely secure and under your control.",
    category: "Security",
  },
  {
    id: "5",
    question: "What are typical delivery timeframes?",
    answer:
      "Delivery times vary based on service complexity and current demand. Simple boosting services are typically completed within hours, while more comprehensive orders may require additional time. We provide estimated completion times during the ordering process and keep you updated throughout.",
    category: "Delivery",
  },
  {
    id: "6",
    question: "Do you offer custom boosting services?",
    answer:
      "Yes, we provide both standardized service packages and fully customized boosting solutions tailored to your specific requirements. Our team can accommodate unique requests and specialized needs beyond our standard offerings.",
    category: "General",
  },
  {
    id: "7",
    question: "What happens if issues arise during service?",
    answer:
      "While our services maintain excellent reliability, should any unexpected issues occur, our team immediately works to resolve them. We prioritize customer satisfaction and account safety, providing prompt communication and solutions throughout the resolution process.",
    category: "General",
  },
  {
    id: "8",
    question: "What is your refund and satisfaction policy?",
    answer:
      "We stand behind our service quality and maintain a customer satisfaction guarantee. If we cannot deliver the promised service or if you experience issues, we work diligently to resolve concerns. Our support team handles each case individually to ensure fair resolution.",
    category: "General",
  },
  {
    id: "9",
    question: "How do you ensure service discretion?",
    answer:
      "Our boosters maintain complete professionalism and discretion during all gaming sessions. They operate naturally within the game environment without revealing the nature of our service to other players, ensuring your privacy is fully protected.",
    category: "Security",
  },
  {
    id: "10",
    question: "Is customer support available during service?",
    answer:
      "Yes, our customer support team provides ongoing assistance throughout your service period. We maintain communication channels for progress updates, questions, and any assistance you may need during the boosting process.",
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
            <Link href="/">
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
                  <Link href="/contact">
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
                    href="https://discord.gg/GqPTaWnfTG"
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
