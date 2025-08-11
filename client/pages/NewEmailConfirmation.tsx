import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { StepIndicator } from "@/components/auth/StepIndicator";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  Inbox,
  ArrowLeft,
  ExternalLink,
  Zap,
  Shield,
} from "lucide-react";

const steps = [
  { id: "sent", title: "Sent", description: "Email dispatched" },
  { id: "waiting", title: "Waiting", description: "Check your inbox" },
  { id: "confirmed", title: "Confirmed", description: "Account verified" },
];

export default function NewEmailConfirmation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState("sent");
  const [completedSteps, setCompletedSteps] = useState<string[]>(["sent"]);
  const [isResending, setIsResending] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const email = searchParams.get("email") || "";
  const isSignUp = searchParams.get("type") === "signup";

  // Auto progress to waiting step
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentStep("waiting");
      setCompletedSteps((prev) => [...prev, "waiting"]);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

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
          setCurrentStep("confirmed");
          setCompletedSteps(["sent", "waiting", "confirmed"]);

          toast({
            title: "Email Confirmed!",
            description: "Your account has been verified successfully.",
          });

          setTimeout(() => {
            navigate("/login?confirmed=true");
          }, 3000);
        }
      } catch (error) {
        console.error("Error checking confirmation:", error);
      }
    };

    if (currentStep === "waiting") {
      // Check immediately and then every 5 seconds
      checkConfirmation();
      const interval = setInterval(checkConfirmation, 5000);
      return () => clearInterval(interval);
    }
  }, [navigate, toast, currentStep]);

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
        setCurrentStep("confirmed");
        setCompletedSteps(["sent", "waiting", "confirmed"]);

        toast({
          title: "Email Confirmed!",
          description: "Your account has been verified successfully.",
        });

        setTimeout(() => {
          navigate("/login?confirmed=true");
        }, 3000);
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
        return {
          name: "Gmail",
          url: "https://mail.google.com",
          color: "text-red-400",
        };
      case "yahoo.com":
        return {
          name: "Yahoo Mail",
          url: "https://mail.yahoo.com",
          color: "text-purple-400",
        };
      case "outlook.com":
      case "hotmail.com":
      case "live.com":
        return {
          name: "Outlook",
          url: "https://outlook.live.com",
          color: "text-blue-400",
        };
      default:
        return { name: "Email", url: null, color: "text-gray-400" };
    }
  };

  const emailProvider = getEmailProvider(email);

  return (
    <AuthContainer
      title="Verify Your Email"
      subtitle={`We sent a confirmation link to ${email}`}
      showLogo={false}
    >
      <StepIndicator
        steps={steps}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      <AnimatePresence mode="wait">
        {currentStep === "sent" && (
          <motion.div
            key="sent"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-6"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
              }}
              className="w-20 h-20 mx-auto bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center"
            >
              <Mail className="w-10 h-10 text-white" />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Email Sent!
              </h3>
              <p className="text-gray-300">Check your inbox and spam folder</p>
            </div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 2 }}
              className="h-1 bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
            />
          </motion.div>
        )}

        {currentStep === "waiting" && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Status indicator */}
            <div className="text-center">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-4"
              >
                <Clock className="w-8 h-8 text-blue-400" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Waiting for Confirmation
              </h3>
              <p className="text-gray-300 text-sm">
                Click the link in your email to verify your account
              </p>
            </div>

            {/* Email provider quick access */}
            {emailProvider.url && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatedButton
                  variant="outline"
                  className="w-full border-white/30 hover:border-white/50"
                  onClick={() => window.open(emailProvider.url, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  <span className={emailProvider.color}>
                    Open {emailProvider.name}
                  </span>
                  <Zap className="w-4 h-4 ml-2 text-yellow-400" />
                </AnimatedButton>
              </motion.div>
            )}

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3">
              <AnimatedButton
                variant="outline"
                onClick={handleManualCheck}
                disabled={isChecking}
                className="border-green-500/30 hover:border-green-500/50"
              >
                {isChecking ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Check Now
              </AnimatedButton>

              <AnimatedButton
                variant="outline"
                onClick={handleResendEmail}
                disabled={!canResend || isResending}
                className="border-orange-500/30 hover:border-orange-500/50"
              >
                {isResending ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                {canResend ? "Resend" : `${timeLeft}s`}
              </AnimatedButton>
            </div>

            {/* Resend counter */}
            {resendCount > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-xs text-gray-400"
              >
                Email resent {resendCount} time{resendCount > 1 ? "s" : ""}
              </motion.div>
            )}

            {/* Help section */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4"
            >
              <details className="group">
                <summary className="flex items-center cursor-pointer text-sm font-medium text-orange-400">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Having trouble?
                  <motion.div
                    className="ml-auto"
                    animate={{ rotate: 0 }}
                    whileHover={{ rotate: 90 }}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </motion.div>
                </summary>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="mt-3 text-sm text-gray-300 space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <Inbox className="w-4 h-4 text-blue-400" />
                    <span>Check your spam/junk folder</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <span>Emails can take up to 10 minutes</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-green-400" />
                    <span>Add noreply@supabase.co to contacts</span>
                  </div>
                </motion.div>
              </details>
            </motion.div>
          </motion.div>
        )}

        {currentStep === "confirmed" && (
          <motion.div
            key="confirmed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                delay: 0.2,
              }}
              className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className="text-2xl font-bold text-green-400 mb-2">
                Verified!
              </h3>
              <p className="text-gray-300">
                Your account has been successfully verified
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-300"
            >
              <p>Redirecting to login in 3 seconds...</p>
            </motion.div>

            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 3 }}
              className="h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {currentStep !== "confirmed" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-8 text-center"
        >
          <Link
            to="/login"
            className="inline-flex items-center text-sm text-gray-400 hover:text-orange-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </motion.div>
      )}
    </AuthContainer>
  );
}
