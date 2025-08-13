import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "../integrations/supabase/client";

export interface UserActivity {
  id: string;
  user_id: string;
  activity_type:
    | "login"
    | "logout"
    | "order_created"
    | "order_updated"
    | "payment_completed"
    | "profile_updated"
    | "password_changed"
    | "email_verified"
    | "page_view"
    | "custom";
  description: string | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
}

export interface ActivityFilters {
  userId?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface DailyAnalytics {
  id: string;
  date: string;
  total_users: number;
  new_users: number;
  active_users: number;
  total_orders: number;
  total_revenue: number;
  avg_order_value: number;
  conversion_rate: number;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsFilters {
  startDate?: string;
  endDate?: string;
  granularity?: "daily" | "weekly" | "monthly";
}

interface UserActivitiesContextType {
  activities: UserActivity[];
  analytics: DailyAnalytics[];
  loading: boolean;
  error: string | null;

  // Activity Logging
  logActivity: (activityData: Partial<UserActivity>) => Promise<void>;
  logUserLogin: (
    userId: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  logUserLogout: (userId: string, sessionId?: string) => Promise<void>;
  logOrderActivity: (
    userId: string,
    orderId: string,
    type: "created" | "updated",
    metadata?: Record<string, any>,
  ) => Promise<void>;
  logPaymentActivity: (
    userId: string,
    orderId: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;
  logPageView: (
    userId: string,
    page: string,
    metadata?: Record<string, any>,
  ) => Promise<void>;

  // Activity Fetching
  getUserActivities: (
    userId: string,
    filters?: ActivityFilters,
  ) => Promise<UserActivity[]>;
  getRecentActivities: (limit?: number) => Promise<UserActivity[]>;
  getActivitiesByType: (
    activityType: string,
    filters?: ActivityFilters,
  ) => Promise<UserActivity[]>;
  getActivitiesByDateRange: (
    startDate: string,
    endDate: string,
    userId?: string,
  ) => Promise<UserActivity[]>;

  // Analytics
  getDailyAnalytics: (filters?: AnalyticsFilters) => Promise<DailyAnalytics[]>;
  getUserStats: (userId: string) => Promise<{
    total_activities: number;
    last_login: string | null;
    total_orders: number;
    total_spent: number;
    account_age_days: number;
  }>;
  getSystemStats: () => Promise<{
    total_users: number;
    active_users_today: number;
    total_orders: number;
    total_revenue: number;
    avg_order_value: number;
  }>;

  // Utility
  refreshActivities: () => Promise<void>;
  refreshAnalytics: () => Promise<void>;
  clearError: () => void;
}

const UserActivitiesContext = createContext<
  UserActivitiesContextType | undefined
>(undefined);

export const useUserActivities = () => {
  const context = useContext(UserActivitiesContext);
  if (context === undefined) {
    throw new Error(
      "useUserActivities must be used within a UserActivitiesProvider",
    );
  }
  return context;
};

interface UserActivitiesProviderProps {
  children: ReactNode;
}

export const UserActivitiesProvider = ({
  children,
}: UserActivitiesProviderProps) => {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper function to handle errors
  const handleError = (error: any, operation: string) => {
    console.error(`Error in ${operation}:`, error);
    setError(error?.message || `Failed to ${operation}`);
    throw error;
  };

  // Helper to get current session info
  const getCurrentSessionInfo = () => {
    return {
      ip_address: null, // Would be populated by backend
      user_agent: navigator.userAgent,
      session_id: sessionStorage.getItem("session_id") || crypto.randomUUID(),
    };
  };

  // Log a general activity
  const logActivity = async (
    activityData: Partial<UserActivity>,
  ): Promise<void> => {
    try {
      setError(null);
      const sessionInfo = getCurrentSessionInfo();

      const { error } = await supabase.from("user_activities").insert([
        {
          ...activityData,
          ...sessionInfo,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;
    } catch (error) {
      handleError(error, "log activity");
    }
  };

  // Log user login
  const logUserLogin = async (
    userId: string,
    metadata?: Record<string, any>,
  ): Promise<void> => {
    await logActivity({
      user_id: userId,
      activity_type: "login",
      description: "User logged in",
      metadata: metadata || {},
    });
  };

  // Log user logout
  const logUserLogout = async (
    userId: string,
    sessionId?: string,
  ): Promise<void> => {
    await logActivity({
      user_id: userId,
      activity_type: "logout",
      description: "User logged out",
      session_id: sessionId,
    });
  };

  // Log order-related activity
  const logOrderActivity = async (
    userId: string,
    orderId: string,
    type: "created" | "updated",
    metadata?: Record<string, any>,
  ): Promise<void> => {
    await logActivity({
      user_id: userId,
      activity_type: type === "created" ? "order_created" : "order_updated",
      description: `Order ${type}`,
      related_entity_type: "order",
      related_entity_id: orderId,
      metadata: metadata || {},
    });
  };

  // Log payment completion
  const logPaymentActivity = async (
    userId: string,
    orderId: string,
    metadata?: Record<string, any>,
  ): Promise<void> => {
    await logActivity({
      user_id: userId,
      activity_type: "payment_completed",
      description: "Payment completed successfully",
      related_entity_type: "order",
      related_entity_id: orderId,
      metadata: metadata || {},
    });
  };

  // Log page view
  const logPageView = async (
    userId: string,
    page: string,
    metadata?: Record<string, any>,
  ): Promise<void> => {
    await logActivity({
      user_id: userId,
      activity_type: "page_view",
      description: `Viewed page: ${page}`,
      metadata: { page, ...metadata },
    });
  };

  // Get user activities
  const getUserActivities = async (
    userId: string,
    filters?: ActivityFilters,
  ): Promise<UserActivity[]> => {
    try {
      setError(null);

      let query = supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", userId);

      if (filters?.activityType) {
        query = query.eq("activity_type", filters.activityType);
      }
      if (filters?.startDate) {
        query = query.gte("created_at", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("created_at", filters.endDate);
      }
      if (filters?.relatedEntityType) {
        query = query.eq("related_entity_type", filters.relatedEntityType);
      }
      if (filters?.relatedEntityId) {
        query = query.eq("related_entity_id", filters.relatedEntityId);
      }

      query = query.order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "get user activities");
      return [];
    }
  };

  // Get recent activities across all users
  const getRecentActivities = async (limit = 50): Promise<UserActivity[]> => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "get recent activities");
      return [];
    }
  };

  // Get activities by type
  const getActivitiesByType = async (
    activityType: string,
    filters?: ActivityFilters,
  ): Promise<UserActivity[]> => {
    return getUserActivities("", { ...filters, activityType });
  };

  // Get activities by date range
  const getActivitiesByDateRange = async (
    startDate: string,
    endDate: string,
    userId?: string,
  ): Promise<UserActivity[]> => {
    const filters: ActivityFilters = { startDate, endDate };
    if (userId) {
      return getUserActivities(userId, filters);
    }

    try {
      setError(null);

      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "get activities by date range");
      return [];
    }
  };

  // Get daily analytics
  const getDailyAnalytics = async (
    filters?: AnalyticsFilters,
  ): Promise<DailyAnalytics[]> => {
    try {
      setError(null);

      let query = supabase.from("analytics_daily").select("*");

      if (filters?.startDate) {
        query = query.gte("date", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("date", filters.endDate);
      }

      query = query.order("date", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      handleError(error, "get daily analytics");
      return [];
    }
  };

  // Get user statistics
  const getUserStats = async (userId: string) => {
    try {
      setError(null);

      // Get user activity stats
      const { data: activityStats, error: activityError } = await supabase
        .from("user_activities")
        .select("*")
        .eq("user_id", userId);

      if (activityError) throw activityError;

      // Get user's orders from unified_orders
      const { data: orderStats, error: orderError } = await supabase
        .from("unified_orders")
        .select("total_amount, created_at")
        .eq("customer_id", userId)
        .eq("status", "completed");

      if (orderError) throw orderError;

      // Get user creation date from auth.users (if accessible) or first activity
      const firstActivity = activityStats?.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      )[0];

      const lastLogin = activityStats?.find((a) => a.activity_type === "login");

      const accountCreated =
        firstActivity?.created_at || new Date().toISOString();
      const accountAgeMs = Date.now() - new Date(accountCreated).getTime();
      const accountAgeDays = Math.floor(accountAgeMs / (1000 * 60 * 60 * 24));

      return {
        total_activities: activityStats?.length || 0,
        last_login: lastLogin?.created_at || null,
        total_orders: orderStats?.length || 0,
        total_spent:
          orderStats?.reduce(
            (sum, order) => sum + (order.total_amount || 0),
            0,
          ) || 0,
        account_age_days: accountAgeDays,
      };
    } catch (error) {
      handleError(error, "get user stats");
      return {
        total_activities: 0,
        last_login: null,
        total_orders: 0,
        total_spent: 0,
        account_age_days: 0,
      };
    }
  };

  // Get system-wide statistics
  const getSystemStats = async () => {
    try {
      setError(null);

      // Get latest analytics data
      const { data: latestAnalytics, error: analyticsError } = await supabase
        .from("analytics_daily")
        .select("*")
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (analyticsError && analyticsError.code !== "PGRST116") {
        throw analyticsError;
      }

      // Get total users count
      const { count: totalUsers, error: usersError } = await supabase
        .from("user_activities")
        .select("user_id", { count: "exact", head: true })
        .not("user_id", "is", null);

      if (usersError) throw usersError;

      // Get active users today
      const today = new Date().toISOString().split("T")[0];
      const { count: activeUsersToday, error: activeError } = await supabase
        .from("user_activities")
        .select("user_id", { count: "exact", head: true })
        .gte("created_at", today);

      if (activeError) throw activeError;

      return {
        total_users: totalUsers || 0,
        active_users_today: activeUsersToday || 0,
        total_orders: latestAnalytics?.total_orders || 0,
        total_revenue: latestAnalytics?.total_revenue || 0,
        avg_order_value: latestAnalytics?.avg_order_value || 0,
      };
    } catch (error) {
      handleError(error, "get system stats");
      return {
        total_users: 0,
        active_users_today: 0,
        total_orders: 0,
        total_revenue: 0,
        avg_order_value: 0,
      };
    }
  };

  // Refresh activities from database
  const refreshActivities = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("user_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      handleError(error, "refresh activities");
    } finally {
      setLoading(false);
    }
  };

  // Refresh analytics from database
  const refreshAnalytics = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("analytics_daily")
        .select("*")
        .order("date", { ascending: false })
        .limit(30);

      if (error) throw error;
      setAnalytics(data || []);
    } catch (error) {
      handleError(error, "refresh analytics");
    } finally {
      setLoading(false);
    }
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  // Load data on mount
  useEffect(() => {
    refreshActivities();
    refreshAnalytics();
  }, []);

  // Set up real-time subscriptions
  useEffect(() => {
    const activitiesChannel = supabase
      .channel("activities_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_activities",
        },
        () => {
          refreshActivities();
        },
      )
      .subscribe();

    const analyticsChannel = supabase
      .channel("analytics_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "analytics_daily",
        },
        () => {
          refreshAnalytics();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(analyticsChannel);
    };
  }, []);

  const value: UserActivitiesContextType = {
    activities,
    analytics,
    loading,
    error,
    logActivity,
    logUserLogin,
    logUserLogout,
    logOrderActivity,
    logPaymentActivity,
    logPageView,
    getUserActivities,
    getRecentActivities,
    getActivitiesByType,
    getActivitiesByDateRange,
    getDailyAnalytics,
    getUserStats,
    getSystemStats,
    refreshActivities,
    refreshAnalytics,
    clearError,
  };

  return (
    <UserActivitiesContext.Provider value={value}>
      {children}
    </UserActivitiesContext.Provider>
  );
};
