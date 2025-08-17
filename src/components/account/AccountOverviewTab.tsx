import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, DollarSign, Package, Calendar, Trophy } from "lucide-react";
import { OrderData } from "@/hooks/useOrders";

interface AccountStats {
  totalSpent: number;
  totalOrders: number;
  completedOrders: number;
  favoriteServices: Array<{ name: string; count: number }>;
  recentActivity: Array<{
    action: string;
    details: string;
    time: string;
    icon: any;
  }>;
}

interface AccountOverviewTabProps {
  user: {
    username: string;
    email: string;
    created_at?: string;
  };
  stats: AccountStats;
  userCredits: number;
  loading?: boolean;
}

export function AccountOverviewTab({
  user,
  stats,
  userCredits,
  loading = false,
}: AccountOverviewTabProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-muted rounded"></div>
                  <div className="h-8 bg-muted rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const memberSince = user.created_at 
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Recently";

  const completionRate = stats.totalOrders > 0 
    ? (stats.completedOrders / stats.totalOrders) * 100 
    : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Account Summary
            </CardTitle>
            <CardDescription>
              Welcome back, {user.username}!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Member since</span>
                <span className="font-medium">{memberSince}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total orders</span>
                <Badge variant="secondary">{stats.totalOrders}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Completion rate</span>
                <span className="font-medium">{completionRate.toFixed(1)}%</span>
              </div>
            </div>
            <Progress value={completionRate} className="w-full" />
          </CardContent>
        </Card>

        {/* Spending Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Spending Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                ${stats.totalSpent.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">Total spent</p>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold">${userCredits.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Available credits</p>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  ${stats.totalOrders > 0 ? (stats.totalSpent / stats.totalOrders).toFixed(2) : '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Avg per order</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorite Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Favorite Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.favoriteServices.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No services ordered yet
              </p>
            ) : (
              <div className="space-y-3">
                {stats.favoriteServices.slice(0, 3).map((service, index) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-sm">{service.name}</span>
                    </div>
                    <Badge variant="outline">{service.count}x</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent activity
              </p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="p-1 bg-primary/10 rounded-full">
                        <Icon className="w-3 h-3 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {activity.details}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
