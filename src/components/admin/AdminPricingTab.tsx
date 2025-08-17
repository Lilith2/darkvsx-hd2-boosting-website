import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Edit, Trash2 } from "lucide-react";

interface PricingData {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
  active: boolean;
}

interface AdminPricingTabProps {
  pricing: PricingData[];
  loading: boolean;
  onAddPricing: () => void;
  onEditPricing: (pricing: PricingData) => void;
  onDeletePricing: (id: string) => void;
}

export function AdminPricingTab({
  pricing,
  loading,
  onAddPricing,
  onEditPricing,
  onDeletePricing,
}: AdminPricingTabProps) {
  return (
    <Card className="border border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Custom Pricing ({pricing.length})
          </CardTitle>
          <CardDescription>
            Create custom pricing tiers and packages
          </CardDescription>
        </div>
        <Button onClick={onAddPricing} className="flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Pricing
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : pricing.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-semibold mb-2">No custom pricing yet</h3>
            <p className="mb-4">Create custom pricing tiers for specialized packages</p>
            <Button onClick={onAddPricing}>
              <Plus className="w-4 h-4 mr-2" />
              Add Pricing
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricing.map((price) => (
              <Card 
                key={price.id} 
                className={`border transition-colors ${
                  price.popular 
                    ? "border-primary shadow-lg" 
                    : "border-border/30 hover:border-primary/30"
                }`}
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {price.popular && (
                      <Badge className="w-fit mx-auto">
                        Most Popular
                      </Badge>
                    )}
                    
                    <div className="text-center">
                      <h3 className="font-semibold text-lg mb-2">
                        {price.name}
                      </h3>
                      <div className="text-3xl font-bold text-primary">
                        ${price.price}
                      </div>
                      <Badge
                        variant={price.active ? "default" : "secondary"}
                        className="text-xs mt-2"
                      >
                        {price.active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <p className="text-sm text-muted-foreground text-center">
                      {price.description}
                    </p>

                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">
                        Features:
                      </div>
                      <div className="space-y-1">
                        {price.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="text-xs flex items-center">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full mr-2"></div>
                            {feature}
                          </div>
                        ))}
                        {price.features.length > 4 && (
                          <div className="text-xs text-muted-foreground">
                            +{price.features.length - 4} more features
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 pt-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditPricing(price)}
                        className="flex-1"
                      >
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDeletePricing(price.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
