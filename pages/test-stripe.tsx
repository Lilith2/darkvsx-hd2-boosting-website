import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestStripe() {
  const [amount, setAmount] = useState("10.50");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const testPaymentIntent = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: "usd",
          metadata: { test: "true" },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment intent");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testPaymentMethods = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/stripe/payment-methods");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch payment methods");
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Stripe Integration Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Test Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10.50"
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={testPaymentIntent}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Testing..." : "Test Payment Intent"}
              </Button>
              <Button
                onClick={testPaymentMethods}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? "Testing..." : "Show Available Payment Methods"}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-semibold text-red-800">Error:</h4>
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-semibold text-green-800">Success:</h4>
                <pre className="text-sm text-green-700 overflow-auto mt-2">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
