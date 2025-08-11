import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  const currentIndex = steps.findIndex((step) => step.id === currentStep);

  return (
    <div className="flex justify-between mb-8">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = step.id === currentStep;
        const isUpcoming = index > currentIndex;

        return (
          <div key={step.id} className="flex flex-col items-center flex-1">
            {/* Step circle */}
            <motion.div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 mb-2
                ${isCompleted ? "bg-green-500 border-green-500" : ""}
                ${isCurrent ? "bg-orange-500 border-orange-500" : ""}
                ${isUpcoming ? "bg-white/10 border-white/30" : ""}
              `}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4 text-white" />
              ) : (
                <span className="text-xs font-semibold text-white">
                  {index + 1}
                </span>
              )}
            </motion.div>

            {/* Step label */}
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
            >
              <p
                className={`text-xs font-medium ${
                  isCompleted || isCurrent ? "text-white" : "text-gray-400"
                }`}
              >
                {step.title}
              </p>
              {step.description && (
                <p className="text-xs text-gray-500 mt-1">{step.description}</p>
              )}
            </motion.div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="absolute top-4 left-1/2 w-full h-0.5 bg-white/20 -translate-y-1/2 -z-10">
                <motion.div
                  className="h-full bg-gradient-to-r from-orange-500 to-green-500"
                  initial={{ width: 0 }}
                  animate={{
                    width:
                      index < currentIndex
                        ? "100%"
                        : index === currentIndex
                          ? "50%"
                          : "0%",
                  }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
