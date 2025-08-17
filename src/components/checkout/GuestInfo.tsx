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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          {isAuthenticated ? "Order Information" : "Guest Information"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isAuthenticated ? (
          // Guest checkout form
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guest-name">Full Name *</Label>
              <Input
                id="guest-name"
                placeholder="Enter your full name"
                value={guestInfo.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                disabled={disabled}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guest-email">Email Address *</Label>
              <Input
                id="guest-email"
                type="email"
                placeholder="Enter your email address"
                value={guestInfo.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                disabled={disabled}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll use this email to send you order updates
              </p>
            </div>
          </div>
        ) : (
          // Authenticated user info
          <div className="space-y-2">
            <Label className="flex items-center">
              <Mail className="w-4 h-4 mr-2" />
              Email Address
            </Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{userEmail}</p>
              <p className="text-xs text-muted-foreground">
                Order updates will be sent to this email
              </p>
            </div>
          </div>
        )}

        {/* Order Notes Section */}
        <div className="space-y-2">
          <Label htmlFor="order-notes" className="flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Order Notes (Optional)
          </Label>
          <Textarea
            id="order-notes"
            placeholder="Any special instructions or notes for your order..."
            value={orderNotes}
            onChange={(e) => onOrderNotesChange(e.target.value)}
            disabled={disabled}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Include any specific requirements, account details, or special instructions
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
