import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Package, Sparkles } from "lucide-react";

interface CartItem {
  id: string;
  service: {
    title: string;
    price: number;
  };
  quantity: number;
}

interface OrderSummaryProps {
  cartItems: CartItem[];
  subtotal: number;
  referralDiscount: number;
  tax: number;
  referralCreditsApplied: number;
  total: number;
}

export function OrderSummary({
  cartItems,
  subtotal,
  referralDiscount,
  tax,
  referralCreditsApplied,
  total,
}: OrderSummaryProps) {
  return (
    <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center text-xl">
          <Package className="w-6 h-6 mr-3 text-primary" />
          Order Total
          <Badge variant="secondary" className="ml-3">
            {cartItems.length} item{cartItems.length !== 1 ? "s" : ""}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between text-base">
            <span>Subtotal</span>
            <span className="font-medium">${subtotal.toFixed(2)}</span>
          </div>
          {referralDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Referral Discount (10%)
              </span>
              <span className="font-medium">
                -${referralDiscount.toFixed(2)}
              </span>
            </div>
          )}
          {referralCreditsApplied > 0 && (
            <div className="flex justify-between text-sm text-blue-600">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                Credits Applied
              </span>
              <span className="font-medium">
                -${referralCreditsApplied.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <Separator className="my-4" />
          <div className="flex justify-between text-2xl font-bold">
            <span>Total</span>
            <span className="text-primary">${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
