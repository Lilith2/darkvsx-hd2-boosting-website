import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Mail, MessageSquare } from "lucide-react";

interface GuestInfoProps {
  guestInfo: {
    name: string;
    email: string;
  };
  onGuestInfoChange: (info: { name: string; email: string }) => void;
  orderNotes: string;
  onOrderNotesChange: (notes: string) => void;
  isAuthenticated: boolean;
  userEmail?: string;
  disabled?: boolean;
}

export function GuestInfo({
  guestInfo,
  onGuestInfoChange,
  orderNotes,
  onOrderNotesChange,
  isAuthenticated,
  userEmail,
  disabled = false,
}: GuestInfoProps) {
  const handleInputChange = (field: keyof typeof guestInfo, value: string) => {
    onGuestInfoChange({
      ...guestInfo,
      [field]: value,
    });
  };

  return (
    <Card className="border-0 shadow-sm bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <User className="w-6 h-6 mr-3 text-primary" />
          {isAuthenticated ? "Order Information" : "Contact Information"}
        </CardTitle>
        {!isAuthenticated && (
          <p className="text-sm text-muted-foreground mt-2">
            We'll use this information to send you order updates
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          // Guest checkout form
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guest-name" className="text-base font-medium">Full Name *</Label>
                <Input
                  id="guest-name"
                  placeholder="Enter your full name"
                  value={guestInfo.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={disabled}
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="guest-email" className="text-base font-medium">Email Address *</Label>
                <Input
                  id="guest-email"
                  type="email"
                  placeholder="Enter your email address"
                  value={guestInfo.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={disabled}
                  required
                  className="h-12"
                />
              </div>
            </div>
          </div>
        ) : (
          // Authenticated user info
          <div className="space-y-2">
            <Label className="flex items-center text-base font-medium">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Email Address
            </Label>
            <div className="p-4 bg-gradient-to-r from-muted/50 to-muted/30 rounded-xl border border-border/50">
              <p className="text-base font-medium">{userEmail}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Order confirmations and updates will be sent to this email
              </p>
            </div>
          </div>
        )}

        {/* Order Notes Section */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <Label htmlFor="order-notes" className="flex items-center text-base font-medium">
            <MessageSquare className="w-5 h-5 mr-2 text-primary" />
            Order Notes (Optional)
          </Label>
          <Textarea
            id="order-notes"
            placeholder="Any special instructions, account details, or requirements for your boosting service..."
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            disabled={disabled}
            rows={4}
            className="resize-none"
          />
          <p className="text-sm text-muted-foreground">
            💡 Include Discord username, preferred hours, or any specific requirements
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
