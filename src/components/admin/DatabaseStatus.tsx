import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface DatabaseTest {
  name: string;
  status: 'success' | 'error' | 'testing';
  message: string;
  count?: number;
}

export function DatabaseStatus() {
  const [tests, setTests] = useState<DatabaseTest[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDatabaseTests = async () => {
    setIsRunning(true);
    const testResults: DatabaseTest[] = [];

    // Test 1: Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      testResults.push({
        name: 'Database Connection',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connected successfully',
      });
    } catch (err: any) {
      testResults.push({
        name: 'Database Connection',
        status: 'error',
        message: err.message || 'Connection failed',
      });
    }

    // Test 2: Orders table
    try {
      const { data, error, count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      testResults.push({
        name: 'Orders Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Accessible (${count || 0} records)`,
        count: count || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: 'Orders Table',
        status: 'error',
        message: err.message || 'Failed to access',
      });
    }

    // Test 3: Custom Orders table
    try {
      const { data, error, count } = await supabase
        .from('custom_orders')
        .select('*', { count: 'exact', head: true });
      testResults.push({
        name: 'Custom Orders Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Accessible (${count || 0} records)`,
        count: count || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: 'Custom Orders Table',
        status: 'error',
        message: err.message || 'Failed to access',
      });
    }

    // Test 4: Services table
    try {
      const { data, error, count } = await supabase
        .from('services')
        .select('*', { count: 'exact', head: true });
      testResults.push({
        name: 'Services Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Accessible (${count || 0} records)`,
        count: count || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: 'Services Table',
        status: 'error',
        message: err.message || 'Failed to access',
      });
    }

    // Test 5: Bundles table
    try {
      const { data, error, count } = await supabase
        .from('bundles')
        .select('*', { count: 'exact', head: true });
      testResults.push({
        name: 'Bundles Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Accessible (${count || 0} records)`,
        count: count || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: 'Bundles Table',
        status: 'error',
        message: err.message || 'Failed to access',
      });
    }

    // Test 6: Custom Pricing table
    try {
      const { data, error, count } = await supabase
        .from('custom_pricing')
        .select('*', { count: 'exact', head: true });
      testResults.push({
        name: 'Custom Pricing Table',
        status: error ? 'error' : 'success',
        message: error ? error.message : `Accessible (${count || 0} records)`,
        count: count || 0,
      });
    } catch (err: any) {
      testResults.push({
        name: 'Custom Pricing Table',
        status: 'error',
        message: err.message || 'Failed to access',
      });
    }

    setTests(testResults);
    setIsRunning(false);
  };

  useEffect(() => {
    runDatabaseTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Testing</Badge>;
    }
  };

  const successCount = tests.filter(t => t.status === 'success').length;
  const errorCount = tests.filter(t => t.status === 'error').length;

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Database Connectivity Status
            {tests.length > 0 && (
              <Badge variant={errorCount > 0 ? "destructive" : "default"}>
                {successCount}/{tests.length} passing
              </Badge>
            )}
          </CardTitle>
        </div>
        <Button
          onClick={runDatabaseTests}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Test Again
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tests.map((test, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getStatusIcon(test.status)}
                <div>
                  <div className="font-medium">{test.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {test.message}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {typeof test.count === 'number' && (
                  <span className="text-sm text-muted-foreground">
                    {test.count} records
                  </span>
                )}
                {getStatusBadge(test.status)}
              </div>
            </div>
          ))}
          
          {tests.length === 0 && isRunning && (
            <div className="text-center py-4">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">Running database tests...</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
