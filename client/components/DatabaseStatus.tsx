import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Database, X, ExternalLink } from "lucide-react";

export function DatabaseStatus() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasDbError, setHasDbError] = useState(false);

  useEffect(() => {
    // Listen for console warnings about missing tables
    const originalWarn = console.warn;
    const originalError = console.error;

    const checkForDbErrors = (message: string) => {
      if (
        message.includes('table not found') || 
        message.includes('relation') || 
        message.includes('does not exist') ||
        message.includes('Supabase connection test failed')
      ) {
        setHasDbError(true);
        setIsVisible(true);
      }
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      checkForDbErrors(message);
      originalWarn.apply(console, args);
    };

    console.error = (...args) => {
      const message = args.join(' ');
      checkForDbErrors(message);
      originalError.apply(console, args);
    };

    // Cleanup
    return () => {
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  if (!isVisible || !hasDbError) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                  Demo Mode Active
                </h4>
                <Badge variant="outline" className="text-xs border-yellow-300 text-yellow-700 dark:text-yellow-300">
                  <Database className="w-3 h-3 mr-1" />
                  No Database
                </Badge>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                The app is running in demo mode. Database features are disabled. 
                Connect a Supabase database to enable full functionality.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900"
                  asChild
                >
                  <a 
                    href="https://supabase.com/dashboard/new" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Setup Database
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsVisible(false)}
                  className="text-xs text-yellow-700 hover:bg-yellow-100 dark:text-yellow-300 dark:hover:bg-yellow-900"
                >
                  <X className="w-3 h-3 mr-1" />
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
