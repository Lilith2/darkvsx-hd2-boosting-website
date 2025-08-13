import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Menu,
  ShoppingCart,
  User,
  LogOut,
  Settings,
  Package,
  Crown,
  Bell,
  Search,
  Moon,
  Sun,
  Zap,
  Shield,
  Target,
  Award,
  Gamepad2,
  Star,
  ExternalLink,
  ChevronDown,
  Activity,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface NavigationItem {
  name: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  isNew?: boolean;
  description?: string;
  subItems?: Array<{
    name: string;
    href: string;
    description: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

const navigation: NavigationItem[] = [
  {
    name: "Services",
    href: "/#services",
    icon: Crown,
    description: "Professional boosting services",
    subItems: [
      {
        name: "Level Boosting",
        href: "/#services",
        description: "Fast character progression",
        icon: TrendingUp,
      },
      {
        name: "Medal Farming",
        href: "/#services",
        description: "Unlock achievements quickly",
        icon: Award,
      },
      {
        name: "Difficulty Unlocks",
        href: "/#services",
        description: "Access higher challenges",
        icon: Target,
      },
    ],
  },
  {
    name: "Bundles",
    href: "/bundles",
    icon: Package,
    badge: "Popular",
    description: "Discounted service packages",
  },
  {
    name: "Custom Order",
    href: "/custom-order",
    icon: Settings,
    isNew: true,
    description: "Personalized gaming assistance",
  },
  {
    name: "Support",
    href: "/faq",
    icon: Shield,
    description: "Get help and answers",
    subItems: [
      {
        name: "FAQ",
        href: "/faq",
        description: "Frequently asked questions",
        icon: HelpCircle,
      },
      {
        name: "Contact Us",
        href: "/contact",
        description: "Reach our support team",
        icon: MessageSquare,
      },
      {
        name: "Discord",
        href: "https://discord.gg/helldivers2boost",
        description: "Join our community",
        icon: ExternalLink,
      },
    ],
  },
];

export function DynamicNavbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { cartItems } = useCart();
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle scroll effect with enhanced styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  }, [logout, router]);

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
        router.push(`/?search=${encodeURIComponent(searchQuery)}`);
        setShowSearch(false);
        setSearchQuery("");
      }
    },
    [searchQuery, router],
  );

  const isActivePath = useCallback(
    (path: string) => {
      if (path === "/" && router.pathname !== "/") return false;
      if (path === "/#services" && router.pathname === "/") return true;
      return (
        router.pathname === path || router.pathname.startsWith(path + "/")
      );
    },
    [router.pathname],
  );

  return (
    <>
      <nav
        className={cn(
          "fixed top-0 z-50 w-full transition-all duration-300 ease-in-out",
          isScrolled
            ? "bg-background/95 backdrop-blur-xl border-b border-border/50 shadow-lg"
            : "bg-background/90 backdrop-blur-md border-b border-border/30",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Enhanced Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                  <Crown className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  HELLDIVERS II
                </span>
                <div className="text-sm text-primary font-semibold tracking-wider">
                  BOOSTING
                </div>
              </div>
            </Link>

            {/* Desktop Navigation with Mega Menu */}
            <div className="hidden lg:flex items-center">
              <NavigationMenu>
                <NavigationMenuList className="space-x-2">
                  {navigation.map((item) => {
                    const isActive = isActivePath(item.href);
                    
                    if (item.subItems) {
                      return (
                        <NavigationMenuItem key={item.name}>
                          <NavigationMenuTrigger
                            className={cn(
                              "h-10 px-4 py-2 bg-transparent hover:bg-accent/50 focus:bg-accent/50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                              isActive && "text-primary bg-primary/10"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {item.icon && <item.icon className="w-4 h-4" />}
                              {item.name}
                              {item.badge && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            <div className="grid w-[600px] gap-3 p-6">
                              <div className="row-span-3">
                                <NavigationMenuLink asChild>
                                  <Link
                                    href={item.href}
                                    className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-br from-primary/20 to-blue-500/20 p-6 no-underline outline-none focus:shadow-md hover:bg-gradient-to-br hover:from-primary/30 hover:to-blue-500/30 transition-all"
                                  >
                                    {item.icon && (
                                      <item.icon className="h-8 w-8 text-primary mb-2" />
                                    )}
                                    <div className="mb-2 mt-4 text-lg font-medium">
                                      {item.name}
                                    </div>
                                    <p className="text-sm leading-tight text-muted-foreground">
                                      {item.description}
                                    </p>
                                  </Link>
                                </NavigationMenuLink>
                              </div>
                              <div className="grid gap-2">
                                {item.subItems.map((subItem) => (
                                  <NavigationMenuLink key={subItem.name} asChild>
                                    <Link
                                      href={subItem.href}
                                      className="group select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                    >
                                      <div className="flex items-center gap-2">
                                        {subItem.icon && (
                                          <subItem.icon className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                                        )}
                                        <div className="text-sm font-medium leading-none">
                                          {subItem.name}
                                        </div>
                                      </div>
                                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                        {subItem.description}
                                      </p>
                                    </Link>
                                  </NavigationMenuLink>
                                ))}
                              </div>
                            </div>
                          </NavigationMenuContent>
                        </NavigationMenuItem>
                      );
                    }

                    return (
                      <NavigationMenuItem key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group inline-flex h-10 w-max items-center justify-center rounded-md bg-transparent px-4 py-2 text-sm font-medium transition-all duration-200 hover:bg-accent/50 focus:bg-accent focus:outline-none disabled:pointer-events-none disabled:opacity-50 gap-2",
                            isActive && "text-primary bg-primary/10 shadow-sm"
                          )}
                        >
                          {item.icon && (
                            <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          )}
                          {item.name}
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {item.isNew && (
                            <Badge className="text-xs bg-green-500 hover:bg-green-500 animate-pulse">
                              New
                            </Badge>
                          )}
                        </Link>
                      </NavigationMenuItem>
                    );
                  })}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Action Items */}
            <div className="flex items-center space-x-2">
              {/* Search Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSearch(!showSearch)}
                className="hidden sm:flex hover:bg-accent/50 transition-all duration-200"
              >
                <Search className="w-4 h-4" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="hover:bg-accent/50 transition-all duration-200"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                ) : (
                  <Moon className="w-4 h-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                )}
              </Button>

              {/* Notifications (for authenticated users) */}
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative hover:bg-accent/50 transition-all duration-200"
                >
                  <Bell className="w-4 h-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </Button>
              )}

              {/* Cart with enhanced styling */}
              <Button
                variant="ghost"
                size="icon"
                asChild
                className="relative hover:bg-accent/50 transition-all duration-200 hover:scale-105"
              >
                <Link href="/cart">
                  <ShoppingCart className="w-4 h-4" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-gradient-to-r from-primary to-blue-500 animate-bounce">
                      {cartItemCount > 99 ? "99+" : cartItemCount}
                    </Badge>
                  )}
                </Link>
              </Button>

              {/* Enhanced User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full hover:bg-accent/50 transition-all duration-200"
                    >
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      {isAdmin && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 rounded-full border-2 border-background" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user?.email}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {isAdmin ? "Administrator" : "Customer"}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/account" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Account Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center">
                        <Package className="w-4 h-4 mr-2" />
                        My Orders
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Settings className="w-4 h-4 mr-2" />
                            <span>Admin Dashboard</span>
                            <Badge className="ml-auto text-xs bg-yellow-500">
                              Admin
                            </Badge>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/login">Login</Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
                  >
                    <Link href="/register">Sign Up</Link>
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="w-4 h-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5 text-primary" />
                      Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 space-y-1">
                    {navigation.map((item) => (
                      <div key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-accent/50",
                            isActivePath(item.href)
                              ? "text-primary bg-primary/10 shadow-sm"
                              : "text-muted-foreground hover:text-foreground",
                          )}
                        >
                          {item.icon && <item.icon className="w-5 h-5" />}
                          <span className="flex-1">{item.name}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                          {item.isNew && (
                            <Badge className="text-xs bg-green-500">New</Badge>
                          )}
                        </Link>
                        {item.subItems && (
                          <div className="ml-8 mt-2 space-y-1">
                            {item.subItems.map((subItem) => (
                              <Link
                                key={subItem.name}
                                href={subItem.href}
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent/30 transition-colors"
                              >
                                {subItem.icon && (
                                  <subItem.icon className="w-3 h-3" />
                                )}
                                <span>{subItem.name}</span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          {showSearch && (
            <div className="pb-4 pt-2">
              <div className="relative max-w-md mx-auto">
                <form onSubmit={handleSearch} className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for services, bundles..."
                    className="block w-full pl-10 pr-20 py-2 border border-border rounded-lg bg-background/50 backdrop-blur-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    autoFocus
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <Button
                      type="submit"
                      size="sm"
                      className="mr-1 h-7 bg-gradient-to-r from-primary to-blue-500"
                    >
                      Search
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </nav>
      
      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
