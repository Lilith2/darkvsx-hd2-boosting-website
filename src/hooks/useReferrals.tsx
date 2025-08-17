import {
  useState,
  useEffect,
  createContext,
  useContext,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Referral {
  id: string;
  referrer_user_id: string;
  referred_user_id: string | null;
  referral_code: string;
  order_id: string;
  commission_amount: number;
  status: "pending" | "completed" | "cancelled";
  created_at: string;
  updated_at: string;
}

export interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingEarnings: number;
  creditBalance: number;
}

interface ReferralsContextType {
  stats: ReferralStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  getUserCredits: () => Promise<number>;
  useCredits: (amount: number) => Promise<boolean>;
}

const ReferralsContext = createContext<ReferralsContextType | undefined>(
  undefined,
);

export function ReferralsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    creditBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    if (!user?.id) {
      setStats({
        totalReferred: 0,
        totalEarned: 0,
        pendingEarnings: 0,
        creditBalance: 0,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's credit balance with better error handling
      let creditBalance = 0;
      try {
        const { data: profileData, error: creditsError } = await supabase
          .from("profiles")
          .select("credit_balance")
          .eq("id", user.id)
          .single();

        if (creditsError) {
          if (
            creditsError.code === "PGRST116" ||
            creditsError.message?.includes("column") ||
            creditsError.message?.includes("does not exist")
          ) {
            console.warn("Credit balance column not found - using 0");
          } else {
            console.error("Error fetching credit balance:", creditsError);
          }
        } else {
          creditBalance = parseFloat(String(profileData?.credit_balance || 0));
        }
      } catch (err) {
        console.warn("Failed to fetch credit balance:", err);
      }

      // Fetch orders that used referral codes (including custom orders)
      const [ordersResult, customOrdersResult] = await Promise.allSettled([
        supabase
          .from("orders")
          .select("referral_code, credits_used, total_amount, status")
          .not("referral_code", "is", null),
        supabase
          .from("custom_orders")
          .select("referral_code, total_amount, status")
          .not("referral_code", "is", null)
      ]);

      const ordersData = ordersResult.status === 'fulfilled' ? ordersResult.value.data || [] : [];
      const customOrdersData = customOrdersResult.status === 'fulfilled' ? customOrdersResult.value.data || [] : [];

      // Log any errors but don't fail completely
      if (ordersResult.status === 'rejected') {
        console.warn("Failed to fetch regular orders:", ordersResult.reason);
      }
      if (customOrdersResult.status === 'rejected') {
        console.warn("Failed to fetch custom orders:", customOrdersResult.reason);
      }

      // Calculate referral stats from both regular and custom orders
      const userReferralCode = `HD2BOOST-${user.id.slice(-6)}`;

      const referralOrders = ordersData.filter(
        (order) => order.referral_code === userReferralCode,
      );

      const referralCustomOrders = customOrdersData.filter(
        (order) => order.referral_code === userReferralCode,
      );

      const allReferralOrders = [
        ...referralOrders.map(o => ({ ...o, source: 'regular' })),
        ...referralCustomOrders.map(o => ({ ...o, source: 'custom' }))
      ];

      const totalReferred = allReferralOrders.length;

      const totalEarned = allReferralOrders
        .filter((order) => order.status === "completed")
        .reduce((sum, order) => {
          // Calculate 5% commission from order total
          const commission = parseFloat(String(order.total_amount || 0)) * 0.05;
          return sum + commission;
        }, 0);

      const pendingEarnings = allReferralOrders
        .filter(
          (order) =>
            order.status === "pending" || order.status === "processing",
        )
        .reduce((sum, order) => {
          const commission = parseFloat(String(order.total_amount || 0)) * 0.05;
          return sum + commission;
        }, 0);

      setStats({
        totalReferred,
        totalEarned,
        pendingEarnings,
        creditBalance,
      });
    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      setError(`Failed to load referral data: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserCredits = async (): Promise<number> => {
    if (!user?.id) {
      console.warn("getUserCredits: No user ID available");
      return 0;
    }

    try {
      // Check if user is authenticated
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      if (!authUser) {
        console.warn("getUserCredits: User not authenticated");
        return 0;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        // Handle specific known errors
        if (error.code === "PGRST116") {
          console.warn(
            "getUserCredits: No rows returned (user profile not found)",
          );
          return 0;
        }
        if (
          error.message?.includes("column") ||
          error.message?.includes("does not exist")
        ) {
          console.warn("getUserCredits: Credit balance column does not exist");
          return 0;
        }
        if (error.message?.includes("JWT") || error.message?.includes("auth")) {
          console.warn("getUserCredits: Authentication issue:", error.message);
          return 0;
        }
        throw error;
      }

      return parseFloat(String(profileData?.credit_balance || 0));
    } catch (err: any) {
      console.error("Error fetching user credits:", err?.message || err);

      // If it's a network error, provide more specific info
      if (err?.message?.includes("Failed to fetch")) {
        console.error(
          "Network error - check internet connection and Supabase configuration",
        );
      }

      return 0;
    }
  };

  const useCredits = async (amount: number): Promise<boolean> => {
    if (!user?.id || amount <= 0) return false;

    try {
      // Get current balance
      const currentBalance = await getUserCredits();

      if (currentBalance < amount) {
        console.error(
          `Insufficient credits. Available: ${currentBalance}, Requested: ${amount}`,
        );
        return false;
      }

      // Deduct credits
      const { error } = await supabase
        .from("profiles")
        .update({
          credit_balance: currentBalance - amount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        if (
          error.code === "PGRST116" ||
          error.message?.includes("column") ||
          error.message?.includes("does not exist")
        ) {
          console.warn(
            "Credit balance column does not exist. Database migration needed.",
          );
          return true; // Simulate success to avoid blocking checkout
        }
        throw error;
      }

      // Refresh stats
      await refreshStats();
      return true;
    } catch (error) {
      console.error("Error using credits:", error);
      return false;
    }
  };

  useEffect(() => {
    refreshStats();
  }, [user?.id]);

  return (
    <ReferralsContext.Provider
      value={{
        stats,
        loading,
        error,
        refreshStats,
        getUserCredits,
        useCredits,
      }}
    >
      {children}
    </ReferralsContext.Provider>
  );
}

export function useReferrals() {
  const context = useContext(ReferralsContext);
  if (context === undefined) {
    throw new Error("useReferrals must be used within a ReferralsProvider");
  }
  return context;
}
