import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Order {
  id: string;
  service: string;
  status: "pending" | "in-progress" | "completed" | "cancelled";
  amount: number;
  date: string;
  progress?: string;
}

const mockOrders: Order[] = [
  {
    id: "ORD-2024-001",
    service: "Level Boost (1-50)",
    status: "completed",
    amount: 29.99,
    date: "2024-01-10",
    progress: "Completed successfully",
  },
  {
    id: "ORD-2024-002",
    service: "Super Sample Farming",
    status: "in-progress",
    amount: 34.99,
    date: "2024-01-15",
    progress: "30/50 samples collected",
  },
];

export default function Account() {
  const { user, logout } = useAuth();
  const { getUserOrders } = useOrders();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const userOrders = user ? getUserOrders(user.id) : [];
  const [accountData, setAccountData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "in-progress":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "in-progress":
        return <AlertCircle className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const handleAccountUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement account update logic
    console.log("Account update:", accountData);
    alert("Account information updated successfully!");
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (accountData.newPassword !== accountData.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    if (accountData.newPassword.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    // TODO: Implement password change logic
    console.log("Password change request");
    alert("Password changed successfully!");

    setAccountData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Account</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account settings and view your orders
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">My Orders</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your account details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAccountUpdate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={accountData.username}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            username: e.target.value,
                          }))
                        }
                        placeholder="Your username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={accountData.email}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button type="submit">
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order History
                </CardTitle>
                <CardDescription>
                  Track your boosting service orders and their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">
                      No orders yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Start by browsing our boosting services
                    </p>
                    <Link to="/">
                      <Button>Browse Services</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userOrders.map((order) => (
                      <div
                        key={order.id}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">{order.id}</h3>
                            <p className="text-sm text-muted-foreground">
                              {order.services.map((s) => s.name).join(", ")}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={getStatusColor(order.status)}>
                              {getStatusIcon(order.status)}
                              <span className="ml-1 capitalize">
                                {order.status}
                              </span>
                            </Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              ${order.totalAmount}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Order Date:{" "}
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          {order.progress && (
                            <span className="text-muted-foreground">
                              Progress: {order.progress}%
                            </span>
                          )}
                          <Link
                            to={`/order/${order.id}`}
                            className="text-primary hover:underline"
                          >
                            Track Order
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showPassword ? "text" : "password"}
                        value={accountData.currentPassword}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        placeholder="Enter current password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        value={accountData.newPassword}
                        onChange={(e) =>
                          setAccountData((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))
                        }
                        placeholder="Enter new password"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={accountData.confirmPassword}
                      onChange={(e) =>
                        setAccountData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit">
                      <Lock className="w-4 h-4 mr-2" />
                      Change Password
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
