import { motion } from "framer-motion";
import { calculatePasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from "@/lib/validation";

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export function PasswordStrength({ password, className = "" }: PasswordStrengthProps) {
  const strength = calculatePasswordStrength(password);
  const label = getPasswordStrengthLabel(strength);
  const colorClass = getPasswordStrengthColor(strength);

  if (!password) return null;

  const requirements = [
    { text: "At least 8 characters", met: password.length >= 8 },
    { text: "Uppercase letter", met: /[A-Z]/.test(password) },
    { text: "Lowercase letter", met: /[a-z]/.test(password) },
    { text: "Number", met: /[0-9]/.test(password) },
    { text: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className={`space-y-3 ${className}`}
    >
      {/* Strength bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-300">Password strength</span>
          <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
        </div>
        
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors duration-300 ${
              strength < 30 ? "bg-red-400" :
              strength < 60 ? "bg-yellow-400" :
              strength < 80 ? "bg-blue-400" : "bg-green-400"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${strength}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Requirements checklist */}
      <div className="space-y-1">
        {requirements.map((req, index) => (
          <motion.div
            key={req.text}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-2 text-xs"
          >
            <motion.div
              className={`w-3 h-3 rounded-full flex items-center justify-center transition-colors duration-200 ${
                req.met ? "bg-green-400" : "bg-white/20"
              }`}
              animate={{ scale: req.met ? 1.1 : 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              {req.met && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-1.5 h-1.5 bg-white rounded-full"
                />
              )}
            </motion.div>
            <span className={req.met ? "text-green-300" : "text-gray-400"}>
              {req.text}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
