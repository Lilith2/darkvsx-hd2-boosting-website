// Date utilities with consistent formatting to prevent hydration mismatches

/**
 * Format date consistently across server and client
 * Uses a fixed format to prevent hydration mismatches
 */
export function formatDate(date: string | Date, options?: {
  includeTime?: boolean;
  short?: boolean;
}): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  const { includeTime = false, short = false } = options || {};

  if (short) {
    // Short format: "Jan 15, 2024"
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  if (includeTime) {
    // Full format with time: "January 15, 2024 at 3:30 PM"
    return dateObj.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  // Default format: "January 15, 2024"
  return dateObj.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date for display in UI components
 * Always uses en-US locale to prevent hydration mismatches
 */
export function formatDisplayDate(date: string | Date): string {
  return formatDate(date, { short: true });
}

/**
 * Format relative time (e.g., "2 days ago", "3 hours ago")
 * Safe for SSR as it doesn't depend on locale
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
}

/**
 * Safe date formatter that only runs on client to prevent hydration issues
 * Use this when you absolutely need locale-specific formatting
 */
export function useClientOnlyDate(date: string | Date): string | null {
  if (typeof window === 'undefined') {
    return null; // Return null on server
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString();
}

/**
 * Format date for API usage (ISO string)
 */
export function formatApiDate(date: Date): string {
  return date.toISOString();
}

/**
 * Parse and validate date strings
 */
export function parseDate(dateString: string): Date | null {
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Check if a date is valid
 */
export function isValidDate(date: any): date is Date {
  return date instanceof Date && !isNaN(date.getTime());
}
