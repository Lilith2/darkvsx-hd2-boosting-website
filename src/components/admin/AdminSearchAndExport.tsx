import React, { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import {
  Search,
  Download,
  Filter,
  X,
  Calendar as CalendarIcon,
  FileText,
  FileSpreadsheet,
  FileJson,
  Settings,
  Save,
  Clock,
  DollarSign,
  User,
  Package,
  ChevronDown,
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

interface SearchFilter {
  field: string;
  operator:
    | "equals"
    | "contains"
    | "startsWith"
    | "endsWith"
    | "greaterThan"
    | "lessThan"
    | "between"
    | "in";
  value: any;
  label: string;
}

interface ExportOptions {
  format: "csv" | "json" | "excel";
  includeHeaders: boolean;
  dateRange?: { from: Date; to: Date };
  selectedFields: string[];
  filterBy?: string;
}

interface AdminSearchAndExportProps {
  data: any[];
  onSearch: (filters: SearchFilter[]) => void;
  onExport: (data: any[], options: ExportOptions) => void;
  searchFields: Array<{
    key: string;
    label: string;
    type: "text" | "number" | "date" | "select";
    options?: { value: string; label: string }[];
  }>;
  exportFields: Array<{
    key: string;
    label: string;
    default?: boolean;
  }>;
  className?: string;
}

export function AdminSearchAndExport({
  data,
  onSearch,
  onExport,
  searchFields,
  exportFields,
  className,
}: AdminSearchAndExportProps) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilter[]>([]);
  const [savedSearches, setSavedSearches] = useState<
    { name: string; filters: SearchFilter[] }[]
  >([]);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedField, setSelectedField] = useState(
    searchFields[0]?.key || "",
  );
  const [selectedOperator, setSelectedOperator] =
    useState<SearchFilter["operator"]>("contains");
  const [filterValue, setFilterValue] = useState("");
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Export state
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "csv",
    includeHeaders: true,
    selectedFields: exportFields.filter((f) => f.default).map((f) => f.key),
  });
  const [isExporting, setIsExporting] = useState(false);

  const { toast } = useToast();

  // Quick search presets
  const quickSearchPresets = [
    {
      name: "Today's Orders",
      filters: [
        {
          field: "created_at",
          operator: "greaterThan" as const,
          value: format(new Date(), "yyyy-MM-dd"),
          label: "Created today",
        },
      ],
    },
    {
      name: "This Week",
      filters: [
        {
          field: "created_at",
          operator: "greaterThan" as const,
          value: format(subDays(new Date(), 7), "yyyy-MM-dd"),
          label: "Created this week",
        },
      ],
    },
    {
      name: "This Month",
      filters: [
        {
          field: "created_at",
          operator: "between" as const,
          value: { from: startOfMonth(new Date()), to: endOfMonth(new Date()) },
          label: "Created this month",
        },
      ],
    },
    {
      name: "Pending Orders",
      filters: [
        {
          field: "status",
          operator: "equals" as const,
          value: "pending",
          label: "Status: Pending",
        },
      ],
    },
    {
      name: "High Value (>$100)",
      filters: [
        {
          field: "total_amount",
          operator: "greaterThan" as const,
          value: 100,
          label: "Amount > $100",
        },
      ],
    },
  ];

  // Export format options
  const exportFormats = [
    { value: "csv", label: "CSV", icon: FileSpreadsheet },
    { value: "json", label: "JSON", icon: FileJson },
    { value: "excel", label: "Excel", icon: FileText },
  ];

  // Operator options for each field type
  const getOperatorOptions = (fieldType: string) => {
    switch (fieldType) {
      case "text":
        return [
          { value: "contains", label: "Contains" },
          { value: "equals", label: "Equals" },
          { value: "startsWith", label: "Starts with" },
          { value: "endsWith", label: "Ends with" },
        ];
      case "number":
        return [
          { value: "equals", label: "Equals" },
          { value: "greaterThan", label: "Greater than" },
          { value: "lessThan", label: "Less than" },
          { value: "between", label: "Between" },
        ];
      case "date":
        return [
          { value: "equals", label: "On date" },
          { value: "greaterThan", label: "After" },
          { value: "lessThan", label: "Before" },
          { value: "between", label: "Between" },
        ];
      case "select":
        return [
          { value: "equals", label: "Equals" },
          { value: "in", label: "One of" },
        ];
      default:
        return [{ value: "contains", label: "Contains" }];
    }
  };

  // Add filter
  const addFilter = useCallback(() => {
    if (!selectedField || !filterValue) return;

    const field = searchFields.find((f) => f.key === selectedField);
    if (!field) return;

    const newFilter: SearchFilter = {
      field: selectedField,
      operator: selectedOperator,
      value: filterValue,
      label: `${field.label} ${selectedOperator} ${filterValue}`,
    };

    const updatedFilters = [...activeFilters, newFilter];
    setActiveFilters(updatedFilters);
    onSearch(updatedFilters);

    // Reset form
    setFilterValue("");

    toast({
      title: "Filter Added",
      description: `Added filter: ${newFilter.label}`,
    });
  }, [
    selectedField,
    selectedOperator,
    filterValue,
    activeFilters,
    onSearch,
    searchFields,
    toast,
  ]);

  // Remove filter
  const removeFilter = useCallback(
    (index: number) => {
      const updatedFilters = activeFilters.filter((_, i) => i !== index);
      setActiveFilters(updatedFilters);
      onSearch(updatedFilters);

      toast({
        title: "Filter Removed",
        description: "Filter has been removed.",
      });
    },
    [activeFilters, onSearch, toast],
  );

  // Apply quick search
  const applyQuickSearch = useCallback(
    (filters: SearchFilter[]) => {
      setActiveFilters(filters);
      onSearch(filters);
      setIsSearchOpen(false);

      toast({
        title: "Quick Search Applied",
        description: `Applied ${filters.length} filter(s).`,
      });
    },
    [onSearch, toast],
  );

  // Save current search
  const saveCurrentSearch = useCallback(() => {
    if (activeFilters.length === 0) return;

    const name = prompt("Enter a name for this search:");
    if (!name) return;

    const newSavedSearch = { name, filters: [...activeFilters] };
    setSavedSearches((prev) => [...prev, newSavedSearch]);

    toast({
      title: "Search Saved",
      description: `Saved search as "${name}".`,
    });
  }, [activeFilters, toast]);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setActiveFilters([]);
    onSearch([]);

    toast({
      title: "Filters Cleared",
      description: "All filters have been removed.",
    });
  }, [onSearch, toast]);

  // Handle export
  const handleExport = useCallback(async () => {
    if (exportOptions.selectedFields.length === 0) {
      toast({
        title: "Export Error",
        description: "Please select at least one field to export.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      await onExport(data, exportOptions);

      toast({
        title: "Export Successful",
        description: `Data exported as ${exportOptions.format.toUpperCase()} format.`,
      });

      setIsExportOpen(false);
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  }, [data, exportOptions, onExport, toast]);

  // Toggle field selection for export
  const toggleExportField = useCallback((fieldKey: string) => {
    setExportOptions((prev) => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldKey)
        ? prev.selectedFields.filter((key) => key !== fieldKey)
        : [...prev.selectedFields, fieldKey],
    }));
  }, []);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {activeFilters.map((filter, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => removeFilter(index)}
            >
              {filter.label}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-6 text-xs"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Advanced Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Search className="h-4 w-4 mr-2" />
            Advanced Search
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogDescription>
              Create complex search filters to find specific data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Search Presets */}
            <div>
              <Label className="text-sm font-medium">Quick Searches</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {quickSearchPresets.map((preset, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => applyQuickSearch(preset.filters)}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Add New Filter */}
            <div className="border rounded-lg p-4 space-y-4">
              <Label className="text-sm font-medium">Add Filter</Label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs">Field</Label>
                  <Select
                    value={selectedField}
                    onValueChange={setSelectedField}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {searchFields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Operator</Label>
                  <Select
                    value={selectedOperator}
                    onValueChange={(value: any) => setSelectedOperator(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorOptions(
                        searchFields.find((f) => f.key === selectedField)
                          ?.type || "text",
                      ).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Value</Label>
                  <Input
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    placeholder="Enter value..."
                  />
                </div>
              </div>

              <Button onClick={addFilter} size="sm">
                Add Filter
              </Button>
            </div>

            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Saved Searches</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {savedSearches.map((saved, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => applyQuickSearch(saved.filters)}
                    >
                      {saved.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={saveCurrentSearch}
              disabled={activeFilters.length === 0}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Search
            </Button>
            <Button onClick={() => setIsSearchOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export Data</DialogTitle>
            <DialogDescription>
              Configure export settings and download your data.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Export Format */}
            <div>
              <Label className="text-sm font-medium">Export Format</Label>
              <div className="grid grid-cols-3 gap-4 mt-2">
                {exportFormats.map((format) => (
                  <Button
                    key={format.value}
                    variant={
                      exportOptions.format === format.value
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setExportOptions((prev) => ({
                        ...prev,
                        format: format.value as any,
                      }))
                    }
                    className="h-16 flex-col"
                  >
                    <format.icon className="h-6 w-6 mb-1" />
                    {format.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Fields Selection */}
            <div>
              <Label className="text-sm font-medium">Select Fields</Label>
              <div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">
                {exportFields.map((field) => (
                  <div key={field.key} className="flex items-center space-x-2">
                    <Switch
                      checked={exportOptions.selectedFields.includes(field.key)}
                      onCheckedChange={() => toggleExportField(field.key)}
                    />
                    <Label className="text-sm">{field.label}</Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExportOptions((prev) => ({
                      ...prev,
                      selectedFields: exportFields.map((f) => f.key),
                    }))
                  }
                >
                  Select All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setExportOptions((prev) => ({
                      ...prev,
                      selectedFields: [],
                    }))
                  }
                >
                  Select None
                </Button>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={exportOptions.includeHeaders}
                  onCheckedChange={(checked) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      includeHeaders: checked,
                    }))
                  }
                />
                <Label className="text-sm">Include column headers</Label>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted p-3 rounded-lg">
              <div className="text-sm">
                <div>
                  Records to export:{" "}
                  <strong>{data.length.toLocaleString()}</strong>
                </div>
                <div>
                  Fields selected:{" "}
                  <strong>{exportOptions.selectedFields.length}</strong>
                </div>
                <div>
                  Format: <strong>{exportOptions.format.toUpperCase()}</strong>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting && <Clock className="h-4 w-4 mr-2 animate-spin" />}
              {isExporting ? "Exporting..." : "Export Data"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
