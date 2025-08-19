import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Star, Package } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";

interface TopService {
  id: string;
  name: string;
  revenue: number;
  orderCount: number;
}

interface TopServicesCardProps {
  topServices: TopService[];
  isLoading: boolean;
}

export function TopServicesCard({ topServices, isLoading }: TopServicesCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />;
      case 1:
        return <Star className="w-4 h-4 text-gray-400 fill-gray-400" />;
      case 2:
        return <Star className="w-4 h-4 text-orange-600 fill-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRankBadgeColor = (index: number) => {
    switch (index) {
      case 0:
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case 1:
        return "bg-gray-50 text-gray-700 border-gray-200";
      case 2:
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-blue-50 text-blue-700 border-blue-200";
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Top Performing Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Top Performing Services
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topServices.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No service data available</p>
            <p className="text-sm">Service performance will appear here once orders are placed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {topServices.map((service, index) => (
              <div
                key={service.id}
                className="flex items-center justify-between p-3 bg-card/30 rounded-lg border border-border/30 hover:bg-card/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {getRankIcon(index)}
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium ${getRankBadgeColor(index)}`}
                    >
                      #{index + 1}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{service.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {service.orderCount} {service.orderCount === 1 ? "order" : "orders"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    {formatCurrency(service.revenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Avg: {formatCurrency(service.revenue / service.orderCount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
