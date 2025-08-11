import { Skeleton } from "@/components/ui/skeleton";

interface LoadingFallbackProps {
  variant?: 'page' | 'card' | 'list' | 'minimal';
}

export function LoadingFallback({ variant = 'page' }: LoadingFallbackProps) {
  switch (variant) {
    case 'minimal':
      return (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    
    case 'card':
      return (
        <div className="p-6 space-y-4">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-1/3" />
        </div>
      );
    
    case 'list':
      return (
        <div className="space-y-4 p-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    
    default: // 'page'
      return (
        <div className="min-h-screen bg-background">
          <div className="max-w-6xl mx-auto p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="border rounded-lg p-6 space-y-4">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-8 w-1/3" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
  }
}

// High-performance loading spinner for critical paths
export function OptimizedSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} border-2 border-primary border-t-transparent rounded-full animate-spin`}
      role="status" 
      aria-label="Loading"
    />
  );
}
