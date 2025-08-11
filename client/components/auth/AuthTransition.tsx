import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AuthTransitionProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  useNewAuth?: boolean;
}

export function AuthTransition({ children, fallback, useNewAuth = true }: AuthTransitionProps) {
  const [showNew, setShowNew] = useState(useNewAuth);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleAuth = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setShowNew(!showNew);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative">
      <AnimatePresence mode="wait">
        {!isTransitioning && (
          <motion.div
            key={showNew ? "new" : "old"}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            {showNew ? children : fallback}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional toggle button for development */}
      {process.env.NODE_ENV === 'development' && (
        <motion.button
          onClick={toggleAuth}
          className="fixed bottom-4 right-4 bg-orange-500 text-white px-3 py-2 rounded-lg text-xs z-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showNew ? "Use Old Auth" : "Use New Auth"}
        </motion.button>
      )}

      {isTransitioning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </motion.div>
      )}
    </div>
  );
}
