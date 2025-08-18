import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export default function TestCustomOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);

  const addTestResult = (test: string, result: any) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runTests = async () => {
    setLoading(true);
    setError(null);
    setTestResults([]);

    // Test 1: Check Supabase client initialization
    addTestResult("Supabase Client", supabase ? "✅ Initialized" : "❌ Not initialized");

    // Test 2: Check authentication
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      addTestResult("Authentication", user ? `✅ User: ${user.email}` : `❌ Not authenticated: ${authError?.message}`);
    } catch (err: any) {
      addTestResult("Authentication", `❌ Error: ${err.message}`);
    }

    // Test 3: Test simple connection
    try {
      const response = await fetch('/api/ping');
      addTestResult("API Connection", response.ok ? "✅ API reachable" : "❌ API unreachable");
    } catch (err: any) {
      addTestResult("API Connection", `❌ Error: ${err.message}`);
    }

    // Test 4: Test direct Supabase query with minimal data
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('id, status, created_at')
        .limit(1);
      
      addTestResult("Basic Query", error ? `❌ Error: ${error.message}` : `✅ Success: ${data?.length || 0} records`);
    } catch (err: any) {
      addTestResult("Basic Query", `❌ Network Error: ${err.message}`);
    }

    // Test 5: Test full query
    try {
      const { data, error } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        addTestResult("Full Query", `❌ Error: ${error.message}`);
        setError(error.message);
      } else {
        addTestResult("Full Query", `✅ Success: ${data?.length || 0} records`);
        setOrders(data || []);
      }
    } catch (err: any) {
      addTestResult("Full Query", `❌ Network Error: ${err.message}`);
      setError(err.message);
    }

    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Custom Orders Debug Test</h1>
      
      <div className="mb-6">
        <button 
          onClick={runTests}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Running Tests...' : 'Re-run Tests'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Results */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Test Results</h2>
          <div className="space-y-2">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm">
                <strong>{result.test}:</strong> {result.result}
              </div>
            ))}
          </div>
        </div>

        {/* Orders Data */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Orders Data</h2>
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {!loading && !error && (
            <div className="space-y-2">
              <p>Found {orders.length} custom orders</p>
              {orders.slice(0, 3).map((order: any) => (
                <div key={order.id} className="text-sm bg-white p-2 rounded">
                  <div><strong>ID:</strong> {order.id}</div>
                  <div><strong>Email:</strong> {order.customer_email}</div>
                  <div><strong>Amount:</strong> ${order.total_amount}</div>
                  <div><strong>Status:</strong> {order.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
