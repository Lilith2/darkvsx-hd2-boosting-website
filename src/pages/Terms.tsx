import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Shield, AlertTriangle } from "lucide-react";

export default function Terms() {
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
              <FileText className="w-4 h-4 mr-2" />
              Legal Document
            </div>

            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Terms of
              </span>
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {" "}
                Service
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
          {/* Important Notice */}
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-6 h-6 text-yellow-500 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">
                    Important Notice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    By using our services, you agree to these terms. Please read
                    them carefully before placing an order.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terms Content */}
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>1. Service Description</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  Helldivers Boost provides professional gaming assistance
                  services for Helldivers 2. Our services include but are not
                  limited to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Character level boosting</li>
                  <li>Planet liberation missions</li>
                  <li>Difficulty unlock assistance</li>
                  <li>In-game currency and item farming</li>
                  <li>Achievement and progression completion</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>2. Account Security & Access</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">2.1 Account Access</h4>
                <p className="text-muted-foreground">
                  To provide our services, you grant us temporary access to your
                  gaming account. We use secure methods and VPN protection to
                  ensure your account safety.
                </p>

                <h4 className="font-semibold">2.2 Security Measures</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>We never change your account credentials</li>
                  <li>All sessions are protected with VPN technology</li>
                  <li>Your personal information is never accessed or stored</li>
                  <li>
                    We maintain detailed logs of all actions for transparency
                  </li>
                </ul>

                <h4 className="font-semibold">2.3 Account Responsibility</h4>
                <p className="text-muted-foreground">
                  You are responsible for ensuring your account is in good
                  standing and not subject to any restrictions or bans before
                  our service begins.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>3. Service Delivery & Completion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">3.1 Estimated Timeframes</h4>
                <p className="text-muted-foreground">
                  All delivery times are estimates based on typical completion
                  rates. Actual completion times may vary due to game updates,
                  server issues, or other unforeseen circumstances.
                </p>

                <h4 className="font-semibold">3.2 Progress Updates</h4>
                <p className="text-muted-foreground">
                  We provide regular progress updates through our tracking
                  system and direct communication channels.
                </p>

                <h4 className="font-semibold">3.3 Service Interruptions</h4>
                <p className="text-muted-foreground">
                  Service may be temporarily paused due to game maintenance,
                  your request, or technical issues. These interruptions do not
                  affect the final delivery timeframe.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>4. Payment & Refunds</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">4.1 Payment Processing</h4>
                <p className="text-muted-foreground">
                  All payments are processed securely through PayPal. Payment is
                  required before service begins.
                </p>

                <h4 className="font-semibold">4.2 Refund Policy</h4>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Full refunds available before service begins</li>
                  <li>
                    Partial refunds may be available based on completion
                    percentage
                  </li>
                  <li>Refunds are processed within 5-7 business days</li>
                  <li>Technical issues on our end qualify for full refunds</li>
                </ul>

                <h4 className="font-semibold">4.3 Pricing</h4>
                <p className="text-muted-foreground">
                  Prices are clearly displayed on our website and may change
                  without notice. The price you pay is the price displayed at
                  the time of purchase.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>5. User Responsibilities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <h4 className="font-semibold">5.1 Account Information</h4>
                <p className="text-muted-foreground">
                  You must provide accurate and current account information. Any
                  issues arising from incorrect information are your
                  responsibility.
                </p>

                <h4 className="font-semibold">5.2 Game Terms Compliance</h4>
                <p className="text-muted-foreground">
                  While we take every precaution to operate within game terms of
                  service, you acknowledge that boosting services may carry
                  inherent risks according to the game publisher's policies.
                </p>

                <h4 className="font-semibold">5.3 Communication</h4>
                <p className="text-muted-foreground">
                  You agree to maintain open communication and respond to our
                  requests for information or clarification in a timely manner.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>6. Limitation of Liability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Our liability is limited to the amount paid for services. We
                  are not responsible for any indirect, incidental, or
                  consequential damages.
                </p>

                <h4 className="font-semibold">6.1 Account Actions</h4>
                <p className="text-muted-foreground">
                  While we maintain the highest safety standards, we cannot
                  guarantee protection against all possible account actions by
                  game publishers.
                </p>

                <h4 className="font-semibold">6.2 Technical Issues</h4>
                <p className="text-muted-foreground">
                  We are not liable for issues caused by game updates, server
                  problems, or other technical issues beyond our control.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>7. Privacy & Data Protection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We collect and process only the minimum information necessary
                  to provide our services. See our Privacy Policy for detailed
                  information about data handling.
                </p>

                <h4 className="font-semibold">7.1 Information Security</h4>
                <p className="text-muted-foreground">
                  All customer information is encrypted and stored securely. We
                  never share your information with third parties except as
                  required to provide services.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>8. Changes to Terms</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  We reserve the right to modify these terms at any time.
                  Changes will be posted on this page with an updated date.
                  Continued use of our services constitutes acceptance of
                  modified terms.
                </p>
              </CardContent>
            </Card>

            <Card className="border border-border/50">
              <CardHeader>
                <CardTitle>9. Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  For questions about these terms or our services, please
                  contact us:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Email: support@helldivers-boost.com</li>
                  <li>Contact Form: Available on our contact page</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Contact CTA */}
          <Card className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20">
            <CardContent className="p-8 text-center">
              <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-4">
                Questions About Our Terms?
              </h3>
              <p className="text-muted-foreground mb-6">
                Our support team is available 24/7 to help clarify any terms or
                answer your questions.
              </p>
              <Link to="/contact">
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  Contact Support
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
