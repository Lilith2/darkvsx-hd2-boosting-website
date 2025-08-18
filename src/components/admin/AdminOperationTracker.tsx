import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  X,
  RotateCcw,
  Eye,
  EyeOff,
} from "lucide-react";

interface Operation {
  id: string;
  type: string;
  description: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'cancelled';
  progress: number;
  startTime: number;
  endTime?: number;
  error?: string;
  data?: any;
}

interface AdminOperationTrackerProps {
  operations: Operation[];
  onRetryOperation?: (operationId: string) => void;
  onCancelOperation?: (operationId: string) => void;
  className?: string;
}

export function AdminOperationTracker({ 
  operations, 
  onRetryOperation, 
  onCancelOperation,
  className 
}: AdminOperationTrackerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const { toast } = useToast();

  // Auto-show when there are running operations
  useEffect(() => {
    const hasRunningOps = operations.some(op => op.status === 'running' || op.status === 'pending');
    if (hasRunningOps && !isVisible) {
      setIsVisible(true);
    }
  }, [operations, isVisible]);

  // Filter operations
  const filteredOperations = operations.filter(op => {
    switch (filter) {
      case 'running':
        return op.status === 'running' || op.status === 'pending';
      case 'completed':
        return op.status === 'success';
      case 'failed':
        return op.status === 'error' || op.status === 'cancelled';
      default:
        return true;
    }
  });

  const getStatusIcon = (status: Operation['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: Operation['status']) => {
    const variants: Record<Operation['status'], any> = {
      pending: 'secondary',
      running: 'default',
      success: 'default',
      error: 'destructive',
      cancelled: 'outline',
    };

    const colors: Record<Operation['status'], string> = {
      pending: 'bg-yellow-500/20 text-yellow-700',
      running: 'bg-blue-500/20 text-blue-700',
      success: 'bg-green-500/20 text-green-700',
      error: 'bg-red-500/20 text-red-700',
      cancelled: 'bg-orange-500/20 text-orange-700',
    };

    return (
      <Badge className={colors[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getDuration = (operation: Operation) => {
    const end = operation.endTime || Date.now();
    const duration = end - operation.startTime;
    return `${(duration / 1000).toFixed(1)}s`;
  };

  const handleRetry = (operationId: string) => {
    onRetryOperation?.(operationId);
    toast({
      title: "Operation Retried",
      description: "The operation has been queued for retry.",
    });
  };

  const handleCancel = (operationId: string) => {
    onCancelOperation?.(operationId);
    toast({
      title: "Operation Cancelled",
      description: "The operation has been cancelled.",
    });
  };

  // Don't render if no operations and not manually opened
  if (operations.length === 0 && !isVisible) {
    return null;
  }

  // Floating toggle button when minimized
  if (!isVisible) {
    const runningCount = operations.filter(op => op.status === 'running' || op.status === 'pending').length;
    const failedCount = operations.filter(op => op.status === 'error').length;
    
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="fixed bottom-20 right-4 z-40 shadow-lg"
      >
        <Loader2 className={`h-4 w-4 mr-2 ${runningCount > 0 ? 'animate-spin' : ''}`} />
        {runningCount > 0 && <span className="mr-2">{runningCount}</span>}
        {failedCount > 0 && (
          <Badge variant="destructive" className="h-5 w-5 p-0 text-xs ml-1">
            {failedCount}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <div className={`fixed bottom-4 left-4 z-50 max-w-md w-full ${className}`}>
      <Card className="border border-border/50 bg-card/95 backdrop-blur shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4" />
              Operations ({filteredOperations.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-md overflow-hidden">
                {(['all', 'running', 'completed', 'failed'] as const).map((filterType) => (
                  <Button
                    key={filterType}
                    variant={filter === filterType ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(filterType)}
                    className="h-6 px-2 text-xs border-0 rounded-none"
                  >
                    {filterType}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 max-h-64 overflow-y-auto">
          {filteredOperations.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No {filter !== 'all' ? filter : ''} operations
              </p>
            </div>
          ) : (
            filteredOperations.slice(-10).reverse().map((operation) => (
              <div
                key={operation.id}
                className="border rounded-lg p-3 space-y-2 bg-card/50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    {getStatusIcon(operation.status)}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {operation.description}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {operation.type} • {getDuration(operation)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(operation.status)}
                    {operation.status === 'error' && onRetryOperation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRetry(operation.id)}
                        className="h-6 w-6 p-0"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                    )}
                    {(operation.status === 'running' || operation.status === 'pending') && onCancelOperation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancel(operation.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress bar for running operations */}
                {(operation.status === 'running' || operation.status === 'pending') && (
                  <div className="space-y-1">
                    <Progress value={operation.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">
                      {operation.progress}%
                    </p>
                  </div>
                )}

                {/* Error message */}
                {operation.status === 'error' && operation.error && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-600">
                    {operation.error}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Hook for managing operations
export function useAdminOperations() {
  const [operations, setOperations] = useState<Operation[]>([]);
  const { toast } = useToast();

  const addOperation = useCallback((operation: Omit<Operation, 'id' | 'startTime' | 'progress' | 'status'>) => {
    const newOperation: Operation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      progress: 0,
      status: 'pending',
    };

    setOperations(prev => [...prev, newOperation]);
    return newOperation.id;
  }, []);

  const updateOperation = useCallback((id: string, updates: Partial<Operation>) => {
    setOperations(prev => prev.map(op => 
      op.id === id 
        ? { 
            ...op, 
            ...updates,
            endTime: updates.status && ['success', 'error', 'cancelled'].includes(updates.status) 
              ? Date.now() 
              : op.endTime
          }
        : op
    ));
  }, []);

  const removeOperation = useCallback((id: string) => {
    setOperations(prev => prev.filter(op => op.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setOperations(prev => prev.filter(op => 
      !['success', 'error', 'cancelled'].includes(op.status)
    ));
  }, []);

  const retryOperation = useCallback((id: string) => {
    updateOperation(id, {
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      endTime: undefined,
      error: undefined,
    });
  }, [updateOperation]);

  const cancelOperation = useCallback((id: string) => {
    updateOperation(id, {
      status: 'cancelled',
      endTime: Date.now(),
    });
  }, [updateOperation]);

  return {
    operations,
    addOperation,
    updateOperation,
    removeOperation,
    clearCompleted,
    retryOperation,
    cancelOperation,
  };
}
