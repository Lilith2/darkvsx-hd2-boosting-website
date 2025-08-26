import dynamic from "next/dynamic";
import { ComponentType } from "react";

// Dynamically import the navbar with no SSR to prevent router issues during build
const ClientOnlyNavbar = dynamic(
  () => import("./EnhancedNavbar").then((mod) => mod.EnhancedNavbar),
  {
    ssr: false,
    loading: () => (
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-md border-b border-border transition-colors">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 bg-primary/20 rounded animate-pulse" />
            <div className="w-32 h-6 bg-muted/50 rounded animate-pulse" />
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-muted/30 rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted/30 rounded animate-pulse" />
            <div className="w-8 h-8 bg-muted/30 rounded animate-pulse" />
          </div>
        </div>
      </nav>
    ),
  },
);

export { ClientOnlyNavbar };
