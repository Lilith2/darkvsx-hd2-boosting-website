import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Gift, DollarSign } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Gift className="w-5 h-5 mr-2" />
          Referrals & Credits
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code Section */}
        <div className="space-y-3">
          <Label htmlFor="referral-code">Referral Code (Optional)</Label>
          <div className="flex space-x-2">
            <Input
              id="referral-code"
              placeholder="Enter referral code"
              value={referralCode}
              onChange={(e) => onReferralCodeChange(e.target.value)}
              disabled={disabled}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => onValidateReferral(referralCode)}
              disabled={disabled || !referralCode.trim()}
            >
              Apply
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get 10% off your order with a valid referral code
          </p>
        </div>

        {/* Credits Section - Only show for authenticated users */}
        {isAuthenticated && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Available Credits
              </Label>
              <span className="font-medium">${availableCredits.toFixed(2)}</span>
            </div>
            
            {availableCredits > 0 && (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-credits"
                    checked={useReferralCredits}
                    onCheckedChange={onUseReferralCreditsChange}
                    disabled={disabled}
                  />
                  <Label 
                    htmlFor="use-credits" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    Use all available credits (${availableCredits.toFixed(2)})
                  </Label>
                </div>
                
                {useReferralCredits && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-green-800">
                      ${referralCreditsApplied.toFixed(2)} in credits will be applied to your order
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {availableCredits === 0 && (
              <p className="text-xs text-muted-foreground">
                You don't have any credits available. Refer friends to earn credits!
              </p>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Sign in to use referral credits and earn rewards
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
