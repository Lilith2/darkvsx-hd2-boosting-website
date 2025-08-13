import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, Eye, Lock, Database, Globe } from "lucide-react";

export default function Privacy() {
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
              <Shield className="w-4 h-4 mr-2" />
              Privacy Protection
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Privacy
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Policy
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Last updated: January 15, 2024
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Privacy Commitment */}
          <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">
                    Our Privacy Commitment
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    We are committed to protecting your privacy and ensuring the
                    security of your personal information. This policy explains
                    how we collect, use, and protect your data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  1. Information We Collect
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">1.1 Personal Information</h4>
                <p className="text-muted-foreground">
                  When you use our services, we may collect:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Name and email address</li>
                  <li>
                    Account credentials for gaming platforms (temporarily and
                    securely)
                  </li>
                  <li>
                    Payment information (processed through PayPal, not stored by
                    us)
                  </li>
                  <li>
                    Communication records (support tickets, email messages)
                  </li>
                </ul>

                <h4 className="font-semibold">1.2 Technical Information</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>IP address and device information</li>
                  <li>Browser type and version</li>
                  <li>Usage data and website interactions</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>

                <h4 className="font-semibold">
                  1.3 Service-Related Information
                </h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Order history and service preferences</li>
                  <li>Progress updates and completion records</li>
                  <li>Customer support interactions</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  2. How We Use Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">2.1 Service Delivery</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Providing requested boosting services</li>
                  <li>Communicating progress and updates</li>
                  <li>Processing payments and managing orders</li>
                  <li>Providing customer support</li>
                </ul>

                <h4 className="font-semibold">2.2 Service Improvement</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Analyzing usage patterns to improve our services</li>
                  <li>Developing new features and services</li>
                  <li>Ensuring platform security and stability</li>
                </ul>

                <h4 className="font-semibold">2.3 Communication</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Sending order confirmations and updates</li>
                  <li>Responding to inquiries and support requests</li>
                  <li>Sending important service announcements</li>
                  <li>Marketing communications (with your consent)</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  3. Information Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">3.1 Data Protection Measures</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>
                    Industry-standard encryption for all data transmission
                  </li>
                  <li>Secure servers with restricted access</li>
                  <li>Regular security audits and updates</li>
                  <li>Staff training on data protection practices</li>
                </ul>

                <h4 className="font-semibold">3.2 Gaming Account Security</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>VPN protection during all gaming sessions</li>
                  <li>Temporary access only for service duration</li>
                  <li>
                    No storage of gaming credentials after service completion
                  </li>
                  <li>Detailed activity logs for transparency</li>
                </ul>

                <h4 className="font-semibold">3.3 Payment Security</h4>
                <p className="text-muted-foreground">
                  All payment processing is handled by PayPal. We do not store
                  credit card information or payment details on our servers.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  4. Information Sharing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">4.1 Third-Party Services</h4>
                <p className="text-muted-foreground">
                  We may share limited information with trusted third-party
                  services:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>PayPal for payment processing</li>
                  <li>Email service providers for communications</li>
                  <li>Analytics services for website improvement</li>
                  <li>Cloud storage providers for data backup</li>
                </ul>

                <h4 className="font-semibold">4.2 Legal Requirements</h4>
                <p className="text-muted-foreground">
                  We may disclose information when required by law, such as:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Responding to legal requests or court orders</li>
                  <li>Investigating fraud or security issues</li>
                  <li>Protecting our rights and property</li>
                  <li>Ensuring user safety</li>
                </ul>

                <h4 className="font-semibold">4.3 Business Transfers</h4>
                <p className="text-muted-foreground">
                  In the event of a merger, acquisition, or sale of assets, your
                  information may be transferred as part of the business assets.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>5. Data Retention</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">5.1 Retention Periods</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Account information: Retained while account is active</li>
                  <li>
                    Order records: Retained for 7 years for business purposes
                  </li>
                  <li>
                    Gaming credentials: Deleted immediately after service
                    completion
                  </li>
                  <li>Support communications: Retained for 3 years</li>
                </ul>

                <h4 className="font-semibold">5.2 Data Deletion</h4>
                <p className="text-muted-foreground">
                  You can request deletion of your personal data at any time,
                  subject to legal and business requirements. We will respond to
                  deletion requests within 30 days.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>6. Your Rights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">6.1 Access and Control</h4>
                <p className="text-muted-foreground">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request data deletion</li>
                  <li>Restrict processing in certain circumstances</li>
                  <li>Data portability where applicable</li>
                </ul>

                <h4 className="font-semibold">6.2 Marketing Communications</h4>
                <p className="text-muted-foreground">
                  You can opt out of marketing communications at any time by
                  clicking the unsubscribe link in emails or contacting our
                  support team.
                </p>

                <h4 className="font-semibold">6.3 Cookies</h4>
                <p className="text-muted-foreground">
                  You can control cookie preferences through your browser
                  settings. Note that disabling certain cookies may affect
                  website functionality.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>7. International Data Transfers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Your information may be transferred to and processed in
                  countries other than your own. We ensure appropriate
                  safeguards are in place to protect your data during
                  international transfers.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>8. Children's Privacy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Our services are not intended for children under 18. We do not
                  knowingly collect personal information from children. If you
                  believe we have collected information from a child, please
                  contact us immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>9. Policy Updates</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We may update this privacy policy from time to time. Changes
                  will be posted on this page with an updated date. We encourage
                  you to review this policy periodically.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>10. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  For questions about this privacy policy or to exercise your
                  rights, contact us:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Email: privacy@helldivers-boost.com</li>
                  <li>Support Email: support@helldivers-boost.com</li>
                  <li>Contact Form: Available on our contact page</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
            <CardContent className="p-8 text-center">
              <Lock className="w-16 h-16 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">Privacy Questions?</h3>
              <p className="text-muted-foreground mb-6">
                We're committed to transparency about how we handle your data.
                Contact us with any privacy-related questions.
              </p>
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  Contact Us
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
