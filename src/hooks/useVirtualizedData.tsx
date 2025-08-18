import { useMemo, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

interface VirtualizedDataOptions {
  data: any[];
  pageSize?: number;
  estimateSize?: number;
  overscan?: number;
  enableFilter?: boolean;
  enableSort?: boolean;
}

interface FilterConfig {
  field: string;
  value: any;
  operator?: "equals" | "contains" | "greaterThan" | "lessThan" | "between";
}

interface SortConfig {
  field: string;
  direction: "asc" | "desc";
}

export function useVirtualizedData({
  data,
  pageSize = 50,
  estimateSize = 60,
  overscan = 5,
  enableFilter = true,
  enableSort = true,
}: VirtualizedDataOptions) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<FilterConfig[]>([]);
  const [sorts, setSorts] = useState<SortConfig[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Apply filters and search
  const filteredData = useMemo(() => {
    if (!enableFilter && !searchTerm) return data;

    let filtered = [...data];

    // Apply search term across common fields
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        Object.values(item).some((value) =>
          String(value || "")
            .toLowerCase()
            .includes(searchLower),
        ),
      );
    }

    // Apply filters
    filters.forEach((filter) => {
      filtered = filtered.filter((item) => {
        const fieldValue = item[filter.field];
        const filterValue = filter.value;

        switch (filter.operator || "equals") {
          case "equals":
            return fieldValue === filterValue;
          case "contains":
            return String(fieldValue || "")
              .toLowerCase()
              .includes(String(filterValue).toLowerCase());
          case "greaterThan":
            return Number(fieldValue) > Number(filterValue);
          case "lessThan":
            return Number(fieldValue) < Number(filterValue);
          case "between":
            return (
              Number(fieldValue) >= Number(filterValue.min) &&
              Number(fieldValue) <= Number(filterValue.max)
            );
          default:
            return true;
        }
      });
    });

    return filtered;
  }, [data, filters, searchTerm, enableFilter]);

  // Apply sorting
  const sortedData = useMemo(() => {
    if (!enableSort || sorts.length === 0) return filteredData;

    return [...filteredData].sort((a, b) => {
      for (const sort of sorts) {
        const aVal = a[sort.field];
        const bVal = b[sort.field];

        let comparison = 0;

        if (aVal === null || aVal === undefined) comparison = 1;
        else if (bVal === null || bVal === undefined) comparison = -1;
        else if (typeof aVal === "string" && typeof bVal === "string") {
          comparison = aVal.localeCompare(bVal);
        } else if (typeof aVal === "number" && typeof bVal === "number") {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }

        if (comparison !== 0) {
          return sort.direction === "desc" ? -comparison : comparison;
        }
      }
      return 0;
    });
  }, [filteredData, sorts, enableSort]);

  // Virtualization
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimateSize,
    overscan,
  });

  // Get visible items
  const virtualItems = virtualizer.getVirtualItems();
  const visibleData = useMemo(() => {
    return virtualItems.map((virtualItem) => ({
      ...sortedData[virtualItem.index],
      virtualIndex: virtualItem.index,
      virtualKey: virtualItem.key,
      virtualStart: virtualItem.start,
      virtualSize: virtualItem.size,
    }));
  }, [virtualItems, sortedData]);

  // Filter management
  const addFilter = useCallback((filter: FilterConfig) => {
    setFilters((prev) => [
      ...prev.filter((f) => f.field !== filter.field),
      filter,
    ]);
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => prev.filter((f) => f.field !== field));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters([]);
    setSearchTerm("");
  }, []);

  // Sort management
  const addSort = useCallback((sort: SortConfig) => {
    setSorts((prev) => {
      const existing = prev.find((s) => s.field === sort.field);
      if (existing) {
        // Toggle direction or remove if already desc
        if (existing.direction === "asc") {
          return prev.map((s) =>
            s.field === sort.field ? { ...s, direction: "desc" } : s,
          );
        } else {
          return prev.filter((s) => s.field !== sort.field);
        }
      } else {
        return [...prev, sort];
      }
    });
  }, []);

  const clearSorts = useCallback(() => {
    setSorts([]);
  }, []);

  // Pagination for non-virtualized fallback
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  return {
    // Virtualization
    parentRef,
    virtualizer,
    visibleData,
    totalSize: virtualizer.getTotalSize(),

    // Data
    filteredData,
    sortedData,
    totalCount: data.length,
    filteredCount: filteredData.length,

    // Pagination fallback
    paginatedData,
    currentPage,
    totalPages,
    setCurrentPage,

    // Search
    searchTerm,
    setSearchTerm,

    // Filters
    filters,
    addFilter,
    removeFilter,
    clearFilters,

    // Sorting
    sorts,
    addSort,
    clearSorts,

    // Performance metrics
    isLargeDataset: data.length > 100,
    shouldVirtualize: data.length > 50,
  };
}

// Hook for optimized table operations
export function useOptimizedTable<T = any>(
  data: T[],
  options: VirtualizedDataOptions = {},
) {
  const virtualized = useVirtualizedData({ data, ...options });

  // Memoized table helpers
  const tableHelpers = useMemo(
    () => ({
      getRowKey: (item: any, index: number) => item.id || item.key || index,

      isSelected: (selectedItems: any[], item: any) =>
        selectedItems.some((selected) => selected.id === item.id),

      toggleSelection: (
        selectedItems: any[],
        item: any,
        setSelected: (items: any[]) => void,
      ) => {
        const isCurrentlySelected = selectedItems.some(
          (selected) => selected.id === item.id,
        );
        if (isCurrentlySelected) {
          setSelected(
            selectedItems.filter((selected) => selected.id !== item.id),
          );
        } else {
          setSelected([...selectedItems, item]);
        }
      },

      selectAll: (setSelected: (items: any[]) => void) => {
        setSelected([...virtualized.sortedData]);
      },

      clearSelection: (setSelected: (items: any[]) => void) => {
        setSelected([]);
      },
    }),
    [virtualized.sortedData],
  );

  return {
    ...virtualized,
    tableHelpers,
  };
}
