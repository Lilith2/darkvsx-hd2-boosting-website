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

export interface ReferralStats {
  totalReferred: number;
  totalEarned: number;
  pendingEarnings: number;
  referrals: Referral[];
}

interface ReferralsContextType {
  stats: ReferralStats;
  loading: boolean;
  error: string | null;
  refreshStats: () => Promise<void>;
}

const ReferralsContext = createContext<ReferralsContextType | undefined>(undefined);

export function ReferralsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    referrals: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStats = async () => {
    if (!user?.id) {
      setStats({
        totalReferred: 0,
        totalEarned: 0,
        pendingEarnings: 0,
        referrals: [],
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch user's referrals
      const { data: referrals, error: referralsError } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_user_id", user.id)
        .order("created_at", { ascending: false });

      if (referralsError) {
        // Handle case where referrals table doesn't exist yet
        if (
          referralsError.code === "PGRST116" ||
          referralsError.message?.includes("relation") ||
          referralsError.message?.includes("does not exist") ||
          referralsError.message?.includes("referrals")
        ) {
          console.warn("Referrals table not found - using default data. Error:", referralsError.message);
          setStats({
            totalReferred: 0,
            totalEarned: 0,
            pendingEarnings: 0,
            referrals: [],
          });
          setError(null);
          setLoading(false);
          return;
        }
        throw referralsError;
      }

      const referralData = referrals || [];
      
      // Calculate stats
      const totalReferred = referralData.length;
      const totalEarned = referralData
        .filter(r => r.status === "completed")
        .reduce((sum, r) => {
          const amount = parseFloat(r.commission_amount) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);
      const pendingEarnings = referralData
        .filter(r => r.status === "pending")
        .reduce((sum, r) => {
          const amount = parseFloat(r.commission_amount) || 0;
          return sum + (isNaN(amount) ? 0 : amount);
        }, 0);

      setStats({
        totalReferred,
        totalEarned: parseFloat(totalEarned.toFixed(2)),
        pendingEarnings: parseFloat(pendingEarnings.toFixed(2)),
        referrals: referralData,
      });

    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      const errorMessage = err?.message || err?.error_description || String(err) || "Unknown error occurred";
      setError(`Failed to load referral data: ${errorMessage}`);
    } finally {
      setLoading(false);
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
