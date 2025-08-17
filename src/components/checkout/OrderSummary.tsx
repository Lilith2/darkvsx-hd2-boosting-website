import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Package } from "lucide-react";

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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="w-5 h-5 mr-2" />
          Order Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex justify-between items-start"
          >
            <div className="flex-1">
              <h4 className="font-medium">{item.service.title}</h4>
              <p className="text-sm text-muted-foreground">
                Quantity: {item.quantity}
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">
                ${(item.service.price * item.quantity).toFixed(2)}
              </p>
            </div>
          </div>
        ))}

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          {referralDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Referral Discount</span>
              <span>-${referralDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span>Tax</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {referralCreditsApplied > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Credits Applied</span>
              <span>-${referralCreditsApplied.toFixed(2)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
