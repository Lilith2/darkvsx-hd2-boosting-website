import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Database, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function DatabaseTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const { toast } = useToast();

  const runTests = async () => {
    setTesting(true);
    setResults([]);
    const testResults: any[] = [];

    try {
      // Test 1: Check if custom_orders table exists
      try {
        const { data, error } = await supabase
          .from("custom_orders")
          .select("count", { count: "exact" })
          .limit(0);

        testResults.push({
          test: "Custom Orders Table",
          status: error ? "error" : "success",
          message: error
            ? error.message
            : `Table exists (${data?.length || 0} records)`,
          details: error || data,
        });
      } catch (err: any) {
        testResults.push({
          test: "Custom Orders Table",
          status: "error",
          message: err.message,
          details: err,
        });
      }

      // Test 2: Check if custom_order_items table exists
      try {
        const { data, error } = await supabase
          .from("custom_order_items")
          .select("count", { count: "exact" })
          .limit(0);

        testResults.push({
          test: "Custom Order Items Table",
          status: error ? "error" : "success",
          message: error
            ? error.message
            : `Table exists (${data?.length || 0} records)`,
          details: error || data,
        });
      } catch (err: any) {
        testResults.push({
          test: "Custom Order Items Table",
          status: "error",
          message: err.message,
          details: err,
        });
      }

      // Test 3: Check if custom_pricing table exists
      try {
        const { data, error } = await supabase
          .from("custom_pricing")
          .select("*")
          .limit(5);

        testResults.push({
          test: "Custom Pricing Table",
          status: error ? "error" : "success",
          message: error
            ? error.message
            : `Found ${data?.length || 0} pricing items`,
          details: error || data,
        });
      } catch (err: any) {
        testResults.push({
          test: "Custom Pricing Table",
          status: "error",
          message: err.message,
          details: err,
        });
      }

      // Test 4: Test order creation (if logged in)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const testOrder = {
            total_amount: 25.5,
            special_instructions: "Database test order",
            customer_email: user.email || "test@example.com",
          };

          const { data, error } = await supabase
            .from("custom_orders")
            .insert(testOrder)
            .select()
            .single();

          if (!error && data) {
            // Clean up - delete the test order
            await supabase.from("custom_orders").delete().eq("id", data.id);

            testResults.push({
              test: "Order Creation",
              status: "success",
              message: `Successfully created and deleted test order ${data.order_number}`,
              details: data,
            });
          } else {
            testResults.push({
              test: "Order Creation",
              status: "error",
              message: error?.message || "Unknown error",
              details: error,
            });
          }
        } else {
          testResults.push({
            test: "Order Creation",
            status: "warning",
            message: "Not logged in - skipping order creation test",
            details: null,
          });
        }
      } catch (err: any) {
        testResults.push({
          test: "Order Creation",
          status: "error",
          message: err.message,
          details: err,
        });
      }

      // Test 5: Check permissions
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        const isAdmin = user?.user_metadata?.is_admin === "true";

        testResults.push({
          test: "User Permissions",
          status: "info",
          message: `User: ${user?.email || "Not logged in"}, Admin: ${isAdmin ? "Yes" : "No"}`,
          details: { user: user?.email, isAdmin, userId: user?.id },
        });
      } catch (err: any) {
        testResults.push({
          test: "User Permissions",
          status: "error",
          message: err.message,
          details: err,
        });
      }
    } catch (globalErr: any) {
      testResults.push({
        test: "Global Test",
        status: "error",
        message: globalErr.message,
        details: globalErr,
      });
    }

    setResults(testResults);
    setTesting(false);

    // Show summary toast
    const successCount = testResults.filter(
      (r) => r.status === "success",
    ).length;
    const errorCount = testResults.filter((r) => r.status === "error").length;

    toast({
      title: "Database Tests Complete",
      description: `${successCount} passed, ${errorCount} failed`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500/20 text-green-700 border-green-500/30";
      case "error":
        return "bg-red-500/20 text-red-700 border-red-500/30";
      case "warning":
        return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
      default:
        return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Custom Orders Database Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTests} disabled={testing} className="w-full">
          {testing ? "Running Tests..." : "Run Database Tests"}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {result.message}
                </p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
