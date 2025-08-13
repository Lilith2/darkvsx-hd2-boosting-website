import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";

export default function EmailConfirmation() {
  const router = useRouter();
  const { toast } = useToast();

  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const email = (router.query.email as string) || "";
  const isSignUp = router.query.type === "signup";

  // Timer for resend cooldown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timeLeft > 0 && !canResend) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 60;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timeLeft, canResend]);

  // Auto-check for confirmation
  useEffect(() => {
    const checkConfirmation = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && user.email_confirmed_at) {
          setIsConfirmed(true);
          toast({
            title: "Email Confirmed!",
            description: "Your account has been verified successfully.",
          });
          setTimeout(() => {
            router.push("/login?confirmed=true");
          }, 2000);
        }
      } catch (error) {
        console.error("Error checking confirmation:", error);
      }
    };

    // Check immediately and then every 5 seconds
    checkConfirmation();
    const interval = setInterval(checkConfirmation, 5000);

    return () => clearInterval(interval);
  }, [router, toast]);

  const handleResendEmail = async () => {
    if (!email || !canResend) return;

    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
      });

      if (error) {
        toast({
          title: "Resend Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setResendCount((prev) => prev + 1);
        setCanResend(false);
        setTimeLeft(60);
        toast({
          title: "Email Sent!",
          description: "Confirmation email has been resent to your inbox.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      await supabase.auth.refreshSession();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && user.email_confirmed_at) {
        setIsConfirmed(true);
        toast({
          title: "Email Confirmed!",
          description: "Your account has been verified successfully.",
        });
        setTimeout(() => {
          router.push("/login?confirmed=true");
        }, 2000);
      } else {
        toast({
          title: "Not Confirmed Yet",
          description:
            "Please check your email and click the confirmation link.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Unable to verify confirmation status.",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getEmailProvider = (email: string) => {
    const domain = email.split("@")[1]?.toLowerCase();
    switch (domain) {
      case "gmail.com":
        return { name: "Gmail", url: "https://mail.google.com" };
      case "yahoo.com":
        return { name: "Yahoo Mail", url: "https://mail.yahoo.com" };
      case "outlook.com":
      case "hotmail.com":
      case "live.com":
        return { name: "Outlook", url: "https://outlook.live.com" };
      default:
        return { name: "Email", url: null };
    }
  };

  const emailProvider = getEmailProvider(email);

  if (isConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
        <div className="w-full max-w-md">

          <Card className="border-border/50 shadow-xl">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">
                Email Confirmed!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your account has been successfully verified. Redirecting to
                login...
              </p>
              <Progress value={100} className="h-2" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
          <p className="text-muted-foreground">
            We've sent a confirmation link to <strong>{email}</strong>
          </p>
        </div>

        <Card className="border-border/50 shadow-xl">
          <CardContent className="p-6 space-y-6">
            {/* Progress indicator */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Email sent</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Waiting for confirmation</span>
                <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Account activated</span>
                <div className="w-4 h-4 border-2 border-muted rounded-full" />
              </div>
              <Progress value={50} className="h-2" />
            </div>

            {/* Instructions */}
            <Alert>
              <Inbox className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">What to do next:</div>
                  <ol className="text-sm space-y-1 list-decimal list-inside">
                    <li>Check your email inbox</li>
                    <li>Look for email from HelldiversBoost</li>
                    <li>Click the confirmation link</li>
                    <li>Return here to continue</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>

            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">
                <Mail className="w-3 h-3 mr-1" />
                Email sent
              </Badge>
              {resendCount > 0 && (
                <Badge variant="outline">
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Resent {resendCount}x
                </Badge>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {emailProvider.url && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={emailProvider.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Open {emailProvider.name}
                  </a>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={handleManualCheck}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Check Status
                </Button>

                <Button
                  variant="outline"
                  onClick={handleResendEmail}
                  disabled={!canResend || isResending}
                >
                  {isResending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  {canResend ? "Resend" : `Wait ${timeLeft}s`}
                </Button>
              </div>
            </div>

            {/* Troubleshooting */}
            <details className="group border-t pt-4">
              <summary className="flex items-center cursor-pointer text-sm font-medium">
                <AlertCircle className="w-4 h-4 mr-2" />
                Having trouble?
              </summary>
              <div className="mt-3 text-sm text-muted-foreground space-y-2">
                <p>• Check your spam/junk folder</p>
                <p>• Emails can take up to 10 minutes to arrive</p>
                <p>• Try adding noreply@supabase.co to your contacts</p>
                <p>• Contact support if you still don't receive it</p>
              </div>
            </details>

            {/* Back to login */}
            <div className="border-t pt-4 text-center">
              <Link
                href="/login"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-primary"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
