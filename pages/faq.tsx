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
    question: "Is this safe?",
    answer:
      "This service is about 75% safe, with a 25% uncertainty factor. However, as of now, there have been zero reports of any punishments for clients or boosters - no bans, no account wipes, nothing. While no method is 100% risk-free, the results so far speak for themselves.",
    category: "Security",
  },
  {
    id: "2",
    question: "How does this work?",
    answer:
      "It's simple: 1) Add me on Helldivers 2, 2) Join my session. That's it! No password sharing, no shady steps - just drop in and play together. Your account remains completely secure.",
    category: "General",
  },
  {
    id: "3",
    question: "What payment methods do you accept?",
    answer:
      "Currently, we only accept PayPal. We're still working on adding more payment options that don't take huge fees, so we can keep our prices low and fair for everyone.",
    category: "Payment",
  },
  {
    id: "4",
    question: "How do I purchase a service?",
    answer:
      "Here's the process: 1) Open a ticket in our Order channel, 2) Specify if you want a pre-made pack or would like a custom order, 3) After confirming everything looks good, we'll proceed to payment and fulfill your order.",
    category: "General",
  },
  {
    id: "5",
    question: "Why are your prices lower than others?",
    answer:
      "Honestly? They should be. I don't believe simple services should cost a fortune. I respect your time and money, so I keep prices competitive and fair. Boosting in Helldivers 2 shouldn't break the bank.",
    category: "Payment",
  },
  {
    id: "6",
    question: "Do I need to share my account credentials?",
    answer:
      "No! You never need to share passwords or any account information. We use a session-joining method where you simply add us in-game and we join your session. Your account stays completely secure.",
    category: "Security",
  },
  {
    id: "7",
    question: "How long does delivery take?",
    answer:
      "Delivery times depend on the specific service you've ordered. Simple boosts can often be completed quickly, while more complex custom orders may take longer. We'll give you an estimated timeframe when you place your order.",
    category: "Delivery",
  },
  {
    id: "8",
    question: "Can I get a custom order?",
    answer:
      "Absolutely! We offer both pre-made service packs and fully custom orders tailored to your specific needs. Just let us know what you're looking for when you open your ticket.",
    category: "General",
  },
  {
    id: "9",
    question: "What if something goes wrong?",
    answer:
      "While we've had zero issues so far, if anything unexpected happens, we'll work with you to resolve it. Customer satisfaction and account safety are our top priorities.",
    category: "General",
  },
  {
    id: "10",
    question: "Do you offer refunds?",
    answer:
      "We stand behind our service quality. If we can't deliver what was promised or if you're not satisfied, we'll work to make it right. Contact us through our support channels to discuss any concerns.",
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
