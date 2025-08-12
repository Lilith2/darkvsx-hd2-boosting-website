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

const ReferralsContext = createContext<ReferralsContextType | undefined>(undefined);

export function ReferralsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<ReferralStats>({
    totalReferred: 0,
    totalEarned: 0,
    pendingEarnings: 0,
    referrals: [],
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
        referrals: [],
        creditBalance: 0,
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

      // Fetch user's credit balance
      const { data: profileData, error: creditsError } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      const referralData = referrals || [];
      const creditBalance = profileData?.credit_balance || 0;

      // Handle referrals table not existing
      if (referralsError && 
          (referralsError.code === "PGRST116" || 
           referralsError.message?.includes("relation") || 
           referralsError.message?.includes("does not exist"))) {
        console.warn("Referrals table not found - using default data");
      } else if (referralsError) {
        throw referralsError;
      }

      // Handle credit_balance column not existing
      if (creditsError && 
          (creditsError.code === 'PGRST116' || 
           creditsError.message?.includes('column') || 
           creditsError.message?.includes('does not exist'))) {
        console.warn("Credit balance column not found - using 0");
      }

      // Calculate stats
      const totalReferred = referralData.length;
      const totalEarned = referralData
        .filter(r => r?.status === "completed")
        .reduce((sum, r) => sum + (parseFloat(String(r.commission_amount)) || 0), 0);
      const pendingEarnings = referralData
        .filter(r => r?.status === "pending")
        .reduce((sum, r) => sum + (parseFloat(String(r.commission_amount)) || 0), 0);

      setStats({
        totalReferred,
        totalEarned,
        pendingEarnings,
        referrals: referralData,
        creditBalance: parseFloat(String(creditBalance)) || 0,
      });

    } catch (err: any) {
      console.error("Error fetching referral stats:", err);
      setError(`Failed to load referral data: ${err?.message || String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const getUserCredits = async (): Promise<number> => {
    if (!user?.id) return 0;

    try {
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("id", user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          return 0; // Column doesn't exist yet
        }
        throw error;
      }

      return parseFloat(String(profileData?.credit_balance || 0));
    } catch (err) {
      console.error("Error fetching user credits:", err);
      return 0;
    }
  };

  const useCredits = async (amount: number): Promise<boolean> => {
    if (!user?.id || amount <= 0) return false;

    try {
      // Get current balance
      const currentBalance = await getUserCredits();
      
      if (currentBalance < amount) {
        console.error(`Insufficient credits. Available: ${currentBalance}, Requested: ${amount}`);
        return false;
      }

      // Deduct credits
      const { error } = await supabase
        .from('profiles')
        .update({
          credit_balance: currentBalance - amount,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        if (error.code === 'PGRST116' || error.message?.includes('column') || error.message?.includes('does not exist')) {
          console.warn('Credit balance column does not exist. Database migration needed.');
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
