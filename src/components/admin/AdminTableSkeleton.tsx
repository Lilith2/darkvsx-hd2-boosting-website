import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AdminTableSkeletonProps {
  rows?: number;
  columns?: number;
  showActions?: boolean;
}

export function AdminTableSkeleton({ 
  rows = 8, 
  columns = 6, 
  showActions = true 
}: AdminTableSkeletonProps) {
  return (
    <div className="space-y-4">
      {/* Search and filters skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {Array.from({ length: columns }, (_, i) => (
                <TableHead key={i}>
                  <Skeleton className="h-4 w-20" />
                </TableHead>
              ))}
              {showActions && (
                <TableHead>
                  <Skeleton className="h-4 w-16" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rows }, (_, rowIndex) => (
              <TableRow key={rowIndex}>
                {Array.from({ length: columns }, (_, colIndex) => (
                  <TableCell key={colIndex}>
                    <Skeleton 
                      className={cn(
                        "h-4",
                        colIndex === 0 ? "w-24" : // ID column
                        colIndex === 1 ? "w-32" : // Name/Email column
                        colIndex === 2 ? "w-20" : // Status column
                        colIndex === 3 ? "w-16" : // Amount column
                        "w-24" // Default
                      )}
                    />
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell>
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function AdminStatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-lg border bg-card p-6">
          <div className="flex items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="h-8 w-20 mt-2" />
          <Skeleton className="h-3 w-32 mt-1" />
        </div>
      ))}
    </div>
  );
}

export function AdminCardSkeleton({ 
  children, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="rounded-lg border bg-card p-6" {...props}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        {children}
      </div>
    </div>
  );
}

// Fix import
import { cn } from "@/lib/utils";
