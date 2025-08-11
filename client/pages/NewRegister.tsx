import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { StepIndicator } from "@/components/auth/StepIndicator";
import { User, Mail, Lock, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { validateField, validationRules } from "@/lib/validation";

const steps = [
  { id: "info", title: "Info", description: "Basic details" },
  { id: "security", title: "Security", description: "Password setup" },
  { id: "verify", title: "Verify", description: "Email confirmation" },
];

export default function NewRegister() {
  const [currentStep, setCurrentStep] = useState("info");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    if (currentStep === "info") {
      const usernameValidation = validateField(formData.username, validationRules.username);
      if (!usernameValidation.isValid) {
        newErrors.username = usernameValidation.errors[0];
      }

      const emailValidation = validateField(formData.email, validationRules.email);
      if (!emailValidation.isValid) {
        newErrors.email = emailValidation.errors[0];
      }
    }

    if (currentStep === "security") {
      const passwordValidation = validateField(formData.password, validationRules.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }

      const confirmPasswordValidation = validateField(
        formData.confirmPassword, 
        validationRules.confirmPassword(formData.password)
      );
      if (!confirmPasswordValidation.isValid) {
        newErrors.confirmPassword = confirmPasswordValidation.errors[0];
      }

      if (!formData.agreeToTerms) {
        newErrors.terms = "You must agree to the terms and conditions";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStep === "info") {
      setCompletedSteps(prev => [...prev, "info"]);
      setCurrentStep("security");
    } else if (currentStep === "security") {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep === "security") {
      setCurrentStep("info");
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setGeneralError("");

    try {
      const success = await register(formData.email, formData.password, formData.username);

      if (success) {
        setCompletedSteps(prev => [...prev, "security"]);
        setCurrentStep("verify");
        
        setTimeout(() => {
          navigate(`/email-confirmation?email=${encodeURIComponent(formData.email)}&type=signup`);
        }, 2000);
      } else {
        setGeneralError("Registration failed. This email may already be in use.");
      }
    } catch (err) {
      setGeneralError("Registration failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  const canProceed = () => {
    if (currentStep === "info") {
      return formData.username && formData.email && !errors.username && !errors.email;
    }
    if (currentStep === "security") {
      return formData.password && formData.confirmPassword && formData.agreeToTerms && 
             !errors.password && !errors.confirmPassword;
    }
    return false;
  };

  return (
    <AuthContainer
      title="Join HelldiversBoost"
      subtitle="Create your account and start your elite journey"
    >
      <StepIndicator 
        steps={steps} 
        currentStep={currentStep} 
        completedSteps={completedSteps} 
      />

      <AnimatePresence>
        {generalError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm mb-6 flex items-center space-x-2"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{generalError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {currentStep === "info" && (
          <motion.div
            key="info"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <AnimatedInput
              label="Username"
              type="text"
              placeholder="Choose a unique username"
              value={formData.username}
              onChange={(value) => handleInputChange("username", value)}
              error={errors.username}
              success={formData.username && !errors.username}
              icon={<User className="w-4 h-4" />}
            />

            <AnimatedInput
              label="Email Address"
              type="email"
              placeholder="Enter your email address"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              error={errors.email}
              success={formData.email && !errors.email}
              icon={<Mail className="w-4 h-4" />}
            />

            <div className="flex space-x-3 pt-4">
              <AnimatedButton
                onClick={handleNext}
                disabled={!canProceed()}
                className="flex-1"
              >
                Continue
              </AnimatedButton>
            </div>
          </motion.div>
        )}

        {currentStep === "security" && (
          <motion.div
            key="security"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <AnimatedInput
              label="Password"
              type="password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={(value) => handleInputChange("password", value)}
              error={errors.password}
              icon={<Lock className="w-4 h-4" />}
              showPasswordToggle
            />

            <PasswordStrength password={formData.password} />

            <AnimatedInput
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={(value) => handleInputChange("confirmPassword", value)}
              error={errors.confirmPassword}
              success={formData.confirmPassword && formData.password === formData.confirmPassword}
              icon={<Shield className="w-4 h-4" />}
              showPasswordToggle
            />

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="space-y-4"
            >
              <label className="flex items-start space-x-3 text-sm text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreeToTerms}
                  onChange={(e) => handleInputChange("agreeToTerms", e.target.checked)}
                  className="mt-1 rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/20"
                />
                <span className="leading-relaxed">
                  I agree to the{" "}
                  <Link to="/terms" className="text-orange-400 hover:text-orange-300 underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-orange-400 hover:text-orange-300 underline">
                    Privacy Policy
                  </Link>
                </span>
              </label>

              {errors.terms && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs flex items-center space-x-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>{errors.terms}</span>
                </motion.div>
              )}
            </motion.div>

            <div className="flex space-x-3 pt-4">
              <AnimatedButton
                variant="outline"
                onClick={handleBack}
                disabled={isLoading}
                className="flex-1"
              >
                Back
              </AnimatedButton>
              <AnimatedButton
                type="submit"
                loading={isLoading}
                disabled={!canProceed() || isLoading}
                onClick={handleNext}
                className="flex-1"
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </AnimatedButton>
            </div>
          </motion.div>
        )}

        {currentStep === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="text-center space-y-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-green-500/20 rounded-full flex items-center justify-center"
            >
              <CheckCircle className="w-8 h-8 text-green-400" />
            </motion.div>

            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Account Created!</h3>
              <p className="text-gray-300 text-sm">
                We've sent a confirmation email to <strong>{formData.email}</strong>
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-sm text-gray-300">
              <p>Redirecting to email verification...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {currentStep !== "verify" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-gray-400">
                Already have an account?
              </span>
            </div>
          </div>

          <Link
            to="/login"
            className="mt-4 inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors font-medium"
          >
            Sign in here
            <motion.span
              className="ml-1"
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </Link>
        </motion.div>
      )}
    </AuthContainer>
  );
}
