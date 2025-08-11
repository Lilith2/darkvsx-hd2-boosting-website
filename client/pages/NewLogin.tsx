import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { AuthContainer } from "@/components/auth/AuthContainer";
import { AnimatedInput } from "@/components/auth/AnimatedInput";
import { AnimatedButton } from "@/components/auth/AnimatedButton";
import { Mail, Lock, CheckCircle, AlertTriangle } from "lucide-react";
import { validateField, validationRules } from "@/lib/validation";

export default function NewLogin() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const { login, isAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (searchParams.get('confirmed') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const emailValidation = validateField(formData.email, validationRules.email);
    if (!emailValidation.isValid) {
      newErrors.email = emailValidation.errors[0];
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const success = await login(formData.email, formData.password);

      if (success) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
        navigate(isAdmin ? "/admin" : "/");
      } else {
        setGeneralError("Invalid email or password. Please try again.");
      }
    } catch (err) {
      setGeneralError("Login failed. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
    if (generalError) {
      setGeneralError("");
    }
  };

  return (
    <AuthContainer
      title="Welcome Back"
      subtitle="Sign in to continue your Helldivers journey"
    >
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm mb-6 flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Email confirmed! You can now sign in to your account.</span>
          </motion.div>
        )}

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

      <form onSubmit={handleSubmit} className="space-y-6">
        <AnimatedInput
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={formData.email}
          onChange={(value) => handleInputChange("email", value)}
          error={errors.email}
          icon={<Mail className="w-4 h-4" />}
        />

        <AnimatedInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(value) => handleInputChange("password", value)}
          error={errors.password}
          icon={<Lock className="w-4 h-4" />}
          showPasswordToggle
        />

        <div className="flex items-center justify-between">
          <motion.label
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center space-x-2 text-sm text-gray-300 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
              className="rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500/20"
            />
            <span>Remember me</span>
          </motion.label>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Link
              to="/forgot-password"
              className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
            >
              Forgot password?
            </Link>
          </motion.div>
        </div>

        <AnimatedButton
          type="submit"
          loading={isLoading}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </AnimatedButton>
      </form>

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
              New to HelldiversBoost?
            </span>
          </div>
        </div>

        <Link
          to="/register"
          className="mt-4 inline-flex items-center text-orange-400 hover:text-orange-300 transition-colors font-medium"
        >
          Create your account
          <motion.span
            className="ml-1"
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            →
          </motion.span>
        </Link>
      </motion.div>

      {/* Admin info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg"
      >
        <p className="text-xs text-gray-400 text-center">
          <span className="font-medium text-orange-400">Admin Access:</span> Use @helldivers.com email addresses for admin privileges
        </p>
      </motion.div>
    </AuthContainer>
  );
}
