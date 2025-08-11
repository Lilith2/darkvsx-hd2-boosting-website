import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnimatedInputProps {
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  success?: boolean;
  icon?: React.ReactNode;
  showPasswordToggle?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    pattern?: RegExp;
    customValidator?: (value: string) => string | null;
  };
}

export const AnimatedInput = forwardRef<HTMLInputElement, AnimatedInputProps>(
  ({ 
    label, 
    type = "text", 
    placeholder, 
    value, 
    onChange, 
    error, 
    success, 
    icon, 
    showPasswordToggle = false,
    validation,
    ...props 
  }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isDirty, setIsDirty] = useState(false);

    const inputType = showPasswordToggle ? (showPassword ? "text" : "password") : type;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);
      if (!isDirty && newValue) {
        setIsDirty(true);
      }
    };

    const getValidationState = () => {
      if (!isDirty || !value) return null;
      if (error) return "error";
      if (success) return "success";
      return null;
    };

    const validationState = getValidationState();

    return (
      <div className="space-y-2">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Label 
            className={`text-sm font-medium transition-colors duration-200 ${
              focused ? "text-orange-400" : "text-gray-300"
            }`}
          >
            {label}
          </Label>
          
          <div className="relative mt-1">
            {icon && (
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                {icon}
              </div>
            )}
            
            <Input
              ref={ref}
              type={inputType}
              placeholder={placeholder}
              value={value}
              onChange={handleChange}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              className={`
                ${icon ? "pl-10" : ""}
                ${showPasswordToggle ? "pr-20" : validationState ? "pr-10" : ""}
                bg-white/10 border-white/20 text-white placeholder:text-gray-400
                focus:border-orange-400 focus:ring-orange-400/20
                transition-all duration-200
                ${validationState === "error" ? "border-red-400 focus:border-red-400 focus:ring-red-400/20" : ""}
                ${validationState === "success" ? "border-green-400 focus:border-green-400 focus:ring-green-400/20" : ""}
              `}
              {...props}
            />

            {/* Validation icons */}
            {validationState && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                  showPasswordToggle ? "right-12" : "right-3"
                }`}
              >
                {validationState === "success" && (
                  <CheckCircle className="w-4 h-4 text-green-400" />
                )}
                {validationState === "error" && (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                )}
              </motion.div>
            )}

            {/* Password toggle */}
            {showPasswordToggle && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            )}
          </div>

          {/* Focus indicator */}
          <motion.div
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-orange-400 to-red-400"
            initial={{ width: 0 }}
            animate={{ width: focused ? "100%" : 0 }}
            transition={{ duration: 0.2 }}
          />
        </motion.div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-xs flex items-center space-x-1"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

AnimatedInput.displayName = "AnimatedInput";
