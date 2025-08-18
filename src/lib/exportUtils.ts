import { format } from "date-fns";

export interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeHeaders: boolean;
  selectedFields: string[];
  filename?: string;
}

export interface ExportField {
  key: string;
  label: string;
  default?: boolean;
  transform?: (value: any) => string;
}

/**
 * Export data to CSV format
 */
export function exportToCSV(data: any[], options: ExportOptions, fields: ExportField[]): void {
  const selectedFieldObjects = fields.filter(field => options.selectedFields.includes(field.key));
  
  let csvContent = '';
  
  // Add headers if enabled
  if (options.includeHeaders) {
    const headers = selectedFieldObjects.map(field => `"${field.label}"`).join(',');
    csvContent += headers + '\n';
  }
  
  // Add data rows
  data.forEach(row => {
    const values = selectedFieldObjects.map(field => {
      let value = row[field.key];
      
      // Apply field transformation if available
      if (field.transform && value !== null && value !== undefined) {
        value = field.transform(value);
      }
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '""';
      } else if (typeof value === 'object') {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      } else if (typeof value === 'string') {
        return `"${value.replace(/"/g, '""')}"`;
      } else {
        return `"${String(value)}"`;
      }
    });
    
    csvContent += values.join(',') + '\n';
  });
  
  downloadFile(csvContent, `${options.filename || 'export'}.csv`, 'text/csv');
}

/**
 * Export data to JSON format
 */
export function exportToJSON(data: any[], options: ExportOptions, fields: ExportField[]): void {
  const selectedFieldObjects = fields.filter(field => options.selectedFields.includes(field.key));
  
  const exportData = data.map(row => {
    const exportRow: any = {};
    
    selectedFieldObjects.forEach(field => {
      let value = row[field.key];
      
      // Apply field transformation if available
      if (field.transform && value !== null && value !== undefined) {
        value = field.transform(value);
      }
      
      exportRow[field.label] = value;
    });
    
    return exportRow;
  });
  
  const jsonContent = JSON.stringify({
    metadata: {
      exportDate: new Date().toISOString(),
      totalRecords: data.length,
      fields: selectedFieldObjects.map(f => f.label),
      includeHeaders: options.includeHeaders,
    },
    data: exportData,
  }, null, 2);
  
  downloadFile(jsonContent, `${options.filename || 'export'}.json`, 'application/json');
}

/**
 * Export data to Excel format (CSV with .xlsx extension for simplicity)
 */
export function exportToExcel(data: any[], options: ExportOptions, fields: ExportField[]): void {
  // For now, we'll use CSV format with Excel-compatible formatting
  const selectedFieldObjects = fields.filter(field => options.selectedFields.includes(field.key));
  
  let content = '';
  
  // Add headers
  if (options.includeHeaders) {
    const headers = selectedFieldObjects.map(field => field.label).join('\t');
    content += headers + '\n';
  }
  
  // Add data rows (using tab separation for better Excel compatibility)
  data.forEach(row => {
    const values = selectedFieldObjects.map(field => {
      let value = row[field.key];
      
      // Apply field transformation if available
      if (field.transform && value !== null && value !== undefined) {
        value = field.transform(value);
      }
      
      // Handle different data types for Excel
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'object') {
        return JSON.stringify(value);
      } else {
        return String(value);
      }
    });
    
    content += values.join('\t') + '\n';
  });
  
  // Use CSV mime type but .xlsx extension
  downloadFile(content, `${options.filename || 'export'}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * Main export function that handles all formats
 */
export function exportData(data: any[], options: ExportOptions, fields: ExportField[]): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }
  
  if (!options.selectedFields || options.selectedFields.length === 0) {
    throw new Error('No fields selected for export');
  }
  
  switch (options.format) {
    case 'csv':
      exportToCSV(data, options, fields);
      break;
    case 'json':
      exportToJSON(data, options, fields);
      break;
    case 'excel':
      exportToExcel(data, options, fields);
      break;
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Common field transformations
 */
export const fieldTransforms = {
  // Format dates
  date: (value: any) => {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? String(value) : format(date, 'yyyy-MM-dd HH:mm:ss');
  },
  
  // Format currency
  currency: (value: any) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(value));
  },
  
  // Format percentage
  percentage: (value: any) => {
    if (value === null || value === undefined || isNaN(Number(value))) return '0%';
    return `${(Number(value) * 100).toFixed(2)}%`;
  },
  
  // Format boolean
  boolean: (value: any) => {
    if (value === null || value === undefined) return '';
    return value ? 'Yes' : 'No';
  },
  
  // Format status
  status: (value: any) => {
    if (!value) return '';
    return String(value).charAt(0).toUpperCase() + String(value).slice(1).replace(/[_-]/g, ' ');
  },
  
  // Truncate long text
  truncate: (maxLength: number = 100) => (value: any) => {
    if (!value) return '';
    const str = String(value);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
  },
  
  // Format JSON objects
  json: (value: any) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  },
  
  // Format arrays
  array: (separator: string = ', ') => (value: any) => {
    if (!Array.isArray(value)) return String(value || '');
    return value.join(separator);
  },
};

/**
 * Get standard export fields for orders
 */
export function getOrderExportFields(): ExportField[] {
  return [
    { key: 'id', label: 'Order ID', default: true },
    { key: 'customer_name', label: 'Customer Name', default: true },
    { key: 'customer_email', label: 'Customer Email', default: true },
    { key: 'status', label: 'Status', default: true, transform: fieldTransforms.status },
    { key: 'total_amount', label: 'Total Amount', default: true, transform: fieldTransforms.currency },
    { key: 'payment_status', label: 'Payment Status', default: true, transform: fieldTransforms.status },
    { key: 'created_at', label: 'Created Date', default: true, transform: fieldTransforms.date },
    { key: 'updated_at', label: 'Updated Date', default: false, transform: fieldTransforms.date },
    { key: 'orderType', label: 'Order Type', default: true },
    { key: 'services', label: 'Services', default: false, transform: fieldTransforms.json },
    { key: 'items', label: 'Items', default: false, transform: fieldTransforms.json },
    { key: 'notes', label: 'Notes', default: false, transform: fieldTransforms.truncate(200) },
  ];
}

/**
 * Get standard search fields for orders
 */
export function getOrderSearchFields() {
  return [
    { key: 'id', label: 'Order ID', type: 'text' as const },
    { key: 'customer_name', label: 'Customer Name', type: 'text' as const },
    { key: 'customer_email', label: 'Customer Email', type: 'text' as const },
    { 
      key: 'status', 
      label: 'Status', 
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
      ]
    },
    { key: 'total_amount', label: 'Total Amount', type: 'number' as const },
    { 
      key: 'payment_status', 
      label: 'Payment Status', 
      type: 'select' as const,
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'paid', label: 'Paid' },
        { value: 'failed', label: 'Failed' },
        { value: 'refunded', label: 'Refunded' },
      ]
    },
    { key: 'created_at', label: 'Created Date', type: 'date' as const },
    { 
      key: 'orderType', 
      label: 'Order Type', 
      type: 'select' as const,
      options: [
        { value: 'regular', label: 'Regular' },
        { value: 'custom', label: 'Custom' },
      ]
    },
  ];
}
