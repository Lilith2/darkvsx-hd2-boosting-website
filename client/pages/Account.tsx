import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, OrderData } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Save,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Trophy,
  Star,
  Download,
  MessageSquare,
  Bell,
  Shield,
  CreditCard,
  Settings,
  Gift,
  TrendingUp,
  Calendar,
  DollarSign,
  Target,
  BarChart3,
  History,
  Heart,
  Bookmark,
  Copy,
  Check,
  RefreshCw,
  Share2,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Account() {
  const { user, logout } = useAuth();
  const { getUserOrders } = useOrders();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [referralCode] = useState(
    "HD2BOOST-" + user?.id?.slice(-6) || "ABCD12",
  );
  const [copied, setCopied] = useState(false);

  const userOrders = user ? getUserOrders(user.id) : [];

  // Calculate user statistics
  const totalSpent = userOrders.reduce(
    (sum, order) => sum + order.totalAmount,
    0,
  );
  const completedOrders = userOrders.filter(
    (order) => order.status === "completed",
  ).length;
  const activeOrders = userOrders.filter((order) =>
    ["pending", "processing", "in-progress"].includes(order.status),
  ).length;
  const totalOrders = userOrders.length;
  const joinDate = user?.id ? new Date(2024, 0, 1) : new Date(); // Mock join date

  const [accountData, setAccountData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });


  const [favoriteServices] = useState([
    {
      name: "Level 1-20 Boost",
      category: "Level Boost",
      lastUsed: "2024-01-15",
    },
    { name: "Weapon Mastery", category: "Weapons", lastUsed: "2024-01-10" },
    {
      name: "Super Credits Farm",
      category: "Currency",
      lastUsed: "2024-01-08",
    },
  ]);

  const getStatusColor = (status: OrderData["status"]) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400";
      case "processing":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400";
      case "in-progress":
        return "bg-purple-500/20 text-purple-700 dark:text-purple-400";
      case "completed":
        return "bg-green-500/20 text-green-700 dark:text-green-400";
      case "cancelled":
        return "bg-red-500/20 text-red-700 dark:text-red-400";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: OrderData["status"]) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3" />;
      case "processing":
        return <Package className="w-3 h-3" />;
      case "in-progress":
        return <AlertCircle className="w-3 h-3" />;
      case "completed":
        return <CheckCircle className="w-3 h-3" />;
      case "cancelled":
        return <AlertCircle className="w-3 h-3" />;
      default:
        return null;
    }
  };


  const handleAccountUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Account Updated",
      description: "Your account information has been updated successfully.",
    });
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();

    if (accountData.newPassword !== accountData.confirmPassword) {
      toast({
        title: "Password Error",
        description: "New passwords don't match!",
        variant: "destructive",
      });
      return;
    }

    if (accountData.newPassword.length < 6) {
      toast({
        title: "Password Error",
        description: "Password must be at least 6 characters long!",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
    });

    setAccountData((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    }));
  };

  const handlePreferencesUpdate = () => {
    toast({
      title: "Preferences Updated",
      description: "Your notification preferences have been saved.",
    });
  };

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Referral code copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const recentActivity = [
    {
      action: "Order placed",
      details: "Level 50-60 Boost",
      time: "2 hours ago",
      icon: Package,
    },
    {
      action: "Order completed",
      details: "Weapon Mastery",
      time: "1 day ago",
      icon: CheckCircle,
    },
    {
      action: "Referral earned",
      details: "$5 bonus credit",
      time: "3 days ago",
      icon: Gift,
    },
    {
      action: "Profile updated",
      details: "Changed email address",
      time: "1 week ago",
      icon: User,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <div className="bg-gradient-to-r from-card to-card/80 border-b border-border">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {user?.username}
                </h1>
                <div className="flex items-center space-x-3 mt-1">
                  <span className="text-sm text-muted-foreground">
                    Member since {joinDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 mt-4 md:mt-0">
              <Link to="/">
                <Button variant="outline">Back to Home</Button>
              </Link>
              <Button variant="outline" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Quick Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Spent
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    ${totalSpent}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-primary/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Completed Orders
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {completedOrders}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Active Orders
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {activeOrders}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600/50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Referral Earnings
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    $0
                  </p>
                </div>
                <Gift className="w-8 h-8 text-green-600/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <History className="w-5 h-5 mr-2" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 p-3 border border-border/30 rounded-lg"
                      >
                        <activity.icon className="w-5 h-5 text-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {activity.action}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.details}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {activity.time}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Favorite Services */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Heart className="w-5 h-5 mr-2" />
                    Favorite Services
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {favoriteServices.map((service, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border border-border/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{service.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.category}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-muted-foreground">
                            Last:{" "}
                            {new Date(service.lastUsed).toLocaleDateString()}
                          </span>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Reorder
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Referral Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Referral Quick Stats
                </CardTitle>
                <CardDescription>
                  Share your code and earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/5 rounded-lg">
                    <Users className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xl font-bold">0</p>
                    <p className="text-sm text-muted-foreground">Referred</p>
                  </div>
                  <div className="text-center p-4 bg-green-500/5 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <p className="text-xl font-bold">$0</p>
                    <p className="text-sm text-muted-foreground">Earned</p>
                  </div>
                  <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                    <Share2 className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                    <div className="flex items-center justify-center space-x-1">
                      <Input value={referralCode} readOnly className="text-xs h-6 text-center" />
                      <Button onClick={copyReferralCode} size="sm" variant="ghost" className="h-6 w-6 p-0">
                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Your Code</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
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

                  <div className="space-y-2">
                    <Label htmlFor="discord">Discord Username (Optional)</Label>
                    <Input
                      id="discord"
                      placeholder="YourDiscord#1234"
                      disabled
                    />
                    <p className="text-xs text-muted-foreground">
                      Link your Discord for faster support communication
                    </p>
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

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Order History ({totalOrders})
                    </CardTitle>
                    <CardDescription>
                      Track your boosting service orders and their progress
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {userOrders.length === 0 ? (
                  <div className="text-center py-12">
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
                        className="border border-border rounded-lg p-4 hover:border-primary/30 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h3 className="font-medium">
                              Order #{order.id.slice(-6)}
                            </h3>
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

                        {order.progress && order.progress > 0 && (
                          <div className="mb-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{order.progress}%</span>
                            </div>
                            <Progress value={order.progress} className="h-2" />
                          </div>
                        )}

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                          <div className="flex space-x-2">
                            <Link
                              to={`/order/${order.id}`}
                              className="text-primary hover:underline"
                            >
                              Track Order
                            </Link>
                            {order.status === "completed" && (
                              <Button size="sm" variant="outline">
                                <Star className="w-3 h-3 mr-1" />
                                Review
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>


          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            {/* Main Referral Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gift className="w-5 h-5 mr-2" />
                  Referral Program
                </CardTitle>
                <CardDescription>
                  Earn 10% commission on every friend you refer! No limits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Referral Code Section */}
                <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-lg border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">Your Referral Code</h3>
                    <Badge className="bg-green-500/20 text-green-700">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Input
                      value={referralCode}
                      readOnly
                      className="flex-1 font-mono text-center bg-background/50"
                    />
                    <Button onClick={copyReferralCode} variant="outline" className="px-4">
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const text = `🎮 Get boosted in Helldivers 2! Use my code "${referralCode}" for 5% off your first order: https://helldivers-boost.com`;
                        navigator.clipboard.writeText(text);
                        toast({ title: "Message copied!", description: "Ready to share on Discord or social media" });
                      }}
                    >
                      <Share2 className="w-3 h-3 mr-1" />
                      Share Message
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Get boosted in Helldivers 2! Use code "${referralCode}" for 5% off: https://helldivers-boost.com`)}`)}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Share on Twitter
                    </Button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border border-border/50">
                    <CardContent className="p-6 text-center">
                      <Users className="w-10 h-10 text-primary mx-auto mb-3" />
                      <p className="text-3xl font-bold">0</p>
                      <p className="text-sm text-muted-foreground">Friends Referred</p>
                      <p className="text-xs text-muted-foreground mt-1">All time</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/50">
                    <CardContent className="p-6 text-center">
                      <DollarSign className="w-10 h-10 text-green-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-green-600">$0.00</p>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-xs text-muted-foreground mt-1">Available to spend</p>
                    </CardContent>
                  </Card>
                  <Card className="border border-border/50">
                    <CardContent className="p-6 text-center">
                      <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                      <p className="text-3xl font-bold text-blue-600">$0.00</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-xs text-muted-foreground mt-1">Processing orders</p>
                    </CardContent>
                  </Card>
                </div>

                {/* How it Works */}
                <Card className="border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">How Referrals Work</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">1</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Share Your Code</h4>
                            <p className="text-sm text-muted-foreground">Send your unique referral code to friends</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary">2</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Friend Places Order</h4>
                            <p className="text-sm text-muted-foreground">They use your code and get 5% discount</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-green-600">3</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Earn Commission</h4>
                            <p className="text-sm text-muted-foreground">Get 10% of their order value as credit</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-green-600">4</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Use Your Credits</h4>
                            <p className="text-sm text-muted-foreground">Apply earnings to future orders</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Referral History */}
                <Card className="border border-border/50">
                  <CardHeader>
                    <CardTitle className="text-lg">Referral History</CardTitle>
                    <CardDescription>Track your successful referrals and earnings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <h3 className="font-medium mb-2">No referrals yet</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Start sharing your code to see your earnings here
                      </p>
                      <Button onClick={copyReferralCode} className="bg-primary hover:bg-primary/90">
                        <Share2 className="w-4 h-4 mr-2" />
                        Copy Referral Code
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Account Security
                </CardTitle>
                <CardDescription>
                  Additional security features for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Enable 2FA
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Login Sessions</p>
                    <p className="text-sm text-muted-foreground">
                      Manage your active login sessions
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    View Sessions
                  </Button>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Delete Account</p>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all data
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">Delete Account</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently
                          delete your account and remove all data.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button variant="destructive">Delete Account</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
