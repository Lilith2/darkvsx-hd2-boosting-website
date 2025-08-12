import { useState, useEffect, createContext, useContext, ReactNode } from "react";
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

export interface ReferralCredits {
  balance: number;
  totalEarned: number;
  totalSpent: number;
}

export interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingEarnings: number;
  referrals: Referral[];
  credits: ReferralCredits;
}

interface ReferralsContextType {
  stats: ReferralStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
  getUserCredits: () => Promise<number>;
  hasCredits: (amount: number) => Promise<boolean>;
  useCredits: (amount: number, orderId?: string, description?: string) => Promise<boolean>;
}

const ReferralsContext = createContext<ReferralsContextType | undefined>(undefined);

export function ReferralsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    referrals: [],
    credits: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getDefaultStats = (): ReferralStats => ({
    totalReferred: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    referrals: [],
    credits: {
      balance: 0,
      totalEarned: 0,
      totalSpent: 0,
    },
  });

  const refreshStats = async () => {
    if (!user?.id) {
      console.log("No user ID, using default stats");
      setStats(getDefaultStats());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log("Fetching referrals for user:", user.id);

      // Fetch user's referrals
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      console.log("Referrals query result:", { referrals, referralsError });

      if (referralsError) {
        // Handle case where referrals table doesn't exist yet
        if (
          referralsError.code === "PGRST116" ||
          referralsError.message?.includes("relation") ||
          referralsError.message?.includes("does not exist") ||
          referralsError.message?.includes("referrals")
        ) {
          console.warn("Referrals table not found - using default data. Error:", referralsError.message);
          setStats(getDefaultStats());
          setError(null);
          setLoading(false);
          return;
        }
        throw referralsError;
      }

      const referralData = referrals || [];
      console.log("Processing referral data:", referralData);

      // Fetch user's credit balance from profile
      const { data: profileData, error: creditsError } = await supabase
        .from("profiles")
        .select("credit_balance, total_credits_earned, total_credits_used")
        .eq("id", user.id)
        .single();

      console.log("Credits query result:", { creditsData, creditsError });

      // Initialize credits if not found
      let userCredits = {
        balance: 0,
        totalEarned: 0,
        totalSpent: 0,
      };

      if (creditsError) {
        console.warn("Error fetching user profile credits:", creditsError);
      } else if (profileData) {
        userCredits = {
          balance: parseFloat(String(profileData.credit_balance || 0)),
          totalEarned: parseFloat(String(profileData.total_credits_earned || 0)),
          totalSpent: parseFloat(String(profileData.total_credits_used || 0)),
        };
      }

      // Calculate stats with safety checks
      const totalReferred = referralData.length;
      const totalEarned = referralData
        .filter(r => r && r.status === "completed")
        .reduce((sum, r) => {
          try {
            const amount = r.commission_amount ? parseFloat(String(r.commission_amount)) : 0;
            return sum + (isNaN(amount) ? 0 : amount);
          } catch (err) {
            console.warn("Error parsing commission amount:", r.commission_amount, err);
            return sum;
          }
        }, 0);
      const pendingEarnings = referralData
        .filter(r => r && r.status === "pending")
        .reduce((sum, r) => {
          try {
            const amount = r.commission_amount ? parseFloat(String(r.commission_amount)) : 0;
            return sum + (isNaN(amount) ? 0 : amount);
          } catch (err) {
            console.warn("Error parsing commission amount:", r.commission_amount, err);
            return sum;
          }
        }, 0);

      const safeStats = {
        totalReferred: Math.max(0, totalReferred || 0),
        totalEarned: Math.max(0, parseFloat((totalEarned || 0).toFixed(2))),
        pendingEarnings: Math.max(0, parseFloat((pendingEarnings || 0).toFixed(2))),
        referrals: Array.isArray(referralData) ? referralData : [],
        credits: {
          balance: Math.max(0, parseFloat((userCredits.balance || 0).toFixed(2))),
          totalEarned: Math.max(0, parseFloat((userCredits.totalEarned || 0).toFixed(2))),
          totalSpent: Math.max(0, parseFloat((userCredits.totalSpent || 0).toFixed(2))),
        },
      };

      console.log("Setting referral stats:", safeStats);
      setStats(safeStats);

    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      const errorMessage = err?.message || err?.error_description || String(err) || "Unknown error occurred";
      setError(`Failed to load referral data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserCredits = async (): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const { data: creditsData, error } = await supabase
        .from("referral_credits")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) {
        console.log("No credits record found for user, returning 0");
        return 0;
      }

      return parseFloat(String(creditsData?.balance || 0));
    } catch (err) {
      console.error("Error fetching user credits:", err);
      return 0;
    }
  };

  const hasCredits = async (amount: number): Promise<boolean> => {
    const balance = await getUserCredits();
    return balance >= amount;
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
        hasCredits,
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
