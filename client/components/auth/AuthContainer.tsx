import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface AuthContainerProps {
  children: ReactNode;
  title: string;
  subtitle: string;
  showLogo?: boolean;
}

export function AuthContainer({
  children,
  title,
  subtitle,
  showLogo = true,
}: AuthContainerProps) {
  return (
    <div className="flex items-center justify-center bg-gradient-to-br from-background via-background to-muted p-4 min-h-[calc(100vh-8rem)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardContent>
            {showLogo && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="text-center mb-6"
              >
                <div className="flex items-center justify-center space-x-2 mb-4">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2F140080265ae84fed81345db6d679ba75%2F0ba66a9961654e799d47f40a907b95dc?format=webp&width=64"
                    alt="HelldiversBoost Logo"
                    className="w-8 h-8"
                  />
                  <span className="text-xl font-bold text-foreground">
                    HelldiversBoost
                  </span>
                </div>
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground">{subtitle}</p>
              </motion.div>
            )}
            {children}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
