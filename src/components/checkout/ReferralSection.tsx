import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Gift, DollarSign, Sparkles, CheckCircle } from "lucide-react";

interface ReferralSectionProps {
  referralCode: string;
  onReferralCodeChange: (code: string) => void;
  onValidateReferral: (code: string) => void;
  useReferralCredits: boolean;
  onUseReferralCreditsChange: (use: boolean) => void;
  availableCredits: number;
  referralCreditsApplied: number;
  onCreditsAppliedChange: (amount: number) => void;
  isAuthenticated: boolean;
  disabled?: boolean;
}

export function ReferralSection({
  referralCode,
  onReferralCodeChange,
  onValidateReferral,
  useReferralCredits,
  onUseReferralCreditsChange,
  availableCredits,
  referralCreditsApplied,
  onCreditsAppliedChange,
  isAuthenticated,
  disabled = false,
}: ReferralSectionProps) {
  const handleApplyCredits = () => {
    if (availableCredits > 0) {
      onCreditsAppliedChange(availableCredits);
    }
  };

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <Gift className="w-6 h-6 mr-3 text-primary" />
          Referrals & Credits
          {(availableCredits > 0 || isAuthenticated) && (
            <Badge variant="secondary" className="ml-3">
              <Sparkles className="w-3 h-3 mr-1" />
              Savings Available
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="referral-code" className="text-base font-medium flex items-center">
              <Gift className="w-5 h-5 mr-2 text-primary" />
              Referral Code
            </Label>
            <Badge variant="outline" className="text-xs">
              Save 10%
            </Badge>
          </div>
          <div className="flex space-x-3">
            <Input
              id="referral-code"
              placeholder="HD2BOOST-XXXXXX"
              value={referralCode}
              onChange={(e) => onReferralCodeChange(e.target.value)}
              disabled={disabled}
              className="h-12 font-mono uppercase"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onValidateReferral(referralCode)}
              disabled={disabled || !referralCode.trim()}
              className="h-12 px-6"
            >
              Apply
            </Button>
          </div>
          <p className="text-sm text-muted-foreground flex items-center">
            <Sparkles className="w-4 h-4 mr-1 text-yellow-500" />
            Get 10% off your entire order with a valid referral code
          </p>
        </div>

        {/* Credits Section - Only show for authenticated users */}
        {isAuthenticated && (
          <div className="space-y-4 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between">
              <Label className="flex items-center text-base font-medium">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Available Credits
              </Label>
              <div className="text-right">
                <span className="text-2xl font-bold text-green-600">
                  ${availableCredits.toFixed(2)}
                </span>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>

            {availableCredits > 0 ? (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="use-credits"
                      checked={useReferralCredits}
                      onCheckedChange={onUseReferralCreditsChange}
                      disabled={disabled}
                      className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor="use-credits"
                        className="text-base font-semibold text-green-800 dark:text-green-200 cursor-pointer"
                      >
                        Apply ${availableCredits.toFixed(2)} in Credits
                      </Label>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Reduce your total with earned referral credits
                      </p>
                    </div>
                  </div>
                </div>

                {useReferralCredits && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
                          ${referralCreditsApplied.toFixed(2)} Credits Applied!
                        </p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your credits have been applied to this order
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-muted/50 border border-border/50 rounded-xl">
                <p className="text-sm text-muted-foreground text-center">
                  🎁 No credits available yet. Refer friends to earn credits!
                </p>
              </div>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-base font-semibold text-blue-800 dark:text-blue-200">
                  Sign in to unlock credits
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Create an account to use referral credits and earn rewards
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
