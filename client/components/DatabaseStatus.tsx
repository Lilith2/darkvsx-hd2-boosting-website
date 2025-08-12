import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Database, RefreshCw } from "lucide-react";

export function DatabaseStatus() {
  const [status, setStatus] = useState<{
    connected: boolean;
    tablesExist: boolean;
    userCanRead: boolean;
    error: string | null;
    environment: string;
    url: string;
  }>({
    connected: false,
    tablesExist: false,
    userCanRead: false,
    error: null,
    environment: "unknown",
    url: "",
  });
  const [loading, setLoading] = useState(true);

  const checkDatabaseStatus = async () => {
    setLoading(true);
    try {
      // Check environment variables
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL ||
        "https://ahqqptrclqtwqjgmtesv.supabase.co";
      const supabaseKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocXFwdHJjbHF0d3FqZ210ZXN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDM3NTMsImV4cCI6MjA2OTkxOTc1M30.FRFHf-XvnBLzZvcGseS82HJIORQXs_8OEEVq0RpabN0";

      const environment = import.meta.env.MODE || "unknown";

      console.log("Environment:", environment);
      console.log("Supabase URL:", supabaseUrl);
      console.log(
        "Supabase Key (first 20 chars):",
        supabaseKey.substring(0, 20) + "...",
      );

      // Test basic connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from("profiles")
        .select("count", { count: "exact", head: true });

      if (connectionError) {
        if (
          connectionError.code === "PGRST116" ||
          connectionError.message?.includes("relation") ||
          connectionError.message?.includes("does not exist")
        ) {
          setStatus({
            connected: true,
            tablesExist: false,
            userCanRead: false,
            error: "Tables do not exist. Database needs to be set up.",
            environment,
            url: supabaseUrl,
          });
          return;
        }
        throw connectionError;
      }

      // Test if we can read from profiles table
      const { data: profilesTest, error: profilesError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (profilesError) {
        throw profilesError;
      }

      // Test if we can read from orders table
      const { data: ordersTest, error: ordersError } = await supabase
        .from("orders")
        .select("id")
        .limit(1);

      setStatus({
        connected: true,
        tablesExist: true,
        userCanRead: !ordersError,
        error: ordersError
          ? `Orders table error: ${ordersError.message}`
          : null,
        environment,
        url: supabaseUrl,
      });
    } catch (error: any) {
      console.error("Database status check error:", error);
      setStatus({
        connected: false,
        tablesExist: false,
        userCanRead: false,
        error: error.message || "Unknown database error",
        environment: import.meta.env.MODE || "unknown",
        url:
          import.meta.env.VITE_SUPABASE_URL ||
          "https://ahqqptrclqtwqjgmtesv.supabase.co",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = () => {
    if (loading) return <RefreshCw className="w-5 h-5 animate-spin" />;
    if (status.connected && status.tablesExist && status.userCanRead) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-600" />;
  };

  const getStatusText = () => {
    if (loading) return "Checking...";
    if (status.connected && status.tablesExist && status.userCanRead) {
      return "Connected";
    }
    if (status.connected && status.tablesExist) {
      return "Tables exist but read issues";
    }
    if (status.connected) {
      return "Connected but tables missing";
    }
    return "Connection failed";
  };

  const getStatusColor = () => {
    if (loading) return "secondary";
    if (status.connected && status.tablesExist && status.userCanRead) {
      return "default";
    }
    return "destructive";
  };

  return (
    <Card className="border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Database Status
        </CardTitle>
        <CardDescription>
          Current database connection and environment information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Status:</span>
          <Badge variant={getStatusColor()} className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Environment:</span>
            <span className="font-mono">{status.environment}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Supabase URL:</span>
            <span className="font-mono text-xs">
              {status.url.substring(0, 30)}...
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Connection:</span>
            <Badge variant={status.connected ? "default" : "destructive"}>
              {status.connected ? "Connected" : "Failed"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tables:</span>
            <Badge variant={status.tablesExist ? "default" : "destructive"}>
              {status.tablesExist ? "Exist" : "Missing"}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Read Access:</span>
            <Badge variant={status.userCanRead ? "default" : "destructive"}>
              {status.userCanRead ? "Working" : "Failed"}
            </Badge>
          </div>
        </div>

        {status.error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive font-medium">
              Error Details:
            </p>
            <p className="text-xs text-destructive/80 mt-1 font-mono">
              {status.error}
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            onClick={checkDatabaseStatus}
            size="sm"
            variant="outline"
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Status
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
