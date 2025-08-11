import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface AnimatedButtonProps {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export function AnimatedButton({
  children,
  loading = false,
  disabled = false,
  variant = "default",
  size = "default",
  className = "",
  onClick,
  type = "button",
  ...props
}: AnimatedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Button
        type={type}
        variant={variant}
        size={size}
        disabled={isDisabled}
        onClick={onClick}
        className={`
          relative overflow-hidden
          ${variant === "default" ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 border-0" : ""}
          ${className}
        `}
        {...props}
      >
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
          </motion.div>
        )}

        <motion.span
          animate={{ opacity: loading ? 0 : 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.span>

        {/* Ripple effect */}
        <motion.div
          className="absolute inset-0 bg-white/20 rounded-md"
          initial={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.1 }}
        />
      </Button>
    </motion.div>
  );
}
