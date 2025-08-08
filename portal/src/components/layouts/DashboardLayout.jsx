import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Wallet,
  Briefcase,
  MessageSquare,
  X,
  ClipboardList,
  CreditCard,
  LogOut,
  UserCog,
  Settings,
  User,
  UserPlus,
  Banknote,
  FolderPlus,
  Bell,
  History,
  BarChart3,
  CreditCard as CardIcon,
  XCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Menu,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";

// Redesigned Header
export const Header = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="h-14 sticky top-0 z-40 flex items-center justify-between px-4 bg-background/70 backdrop-blur-md shadow-sm border-b border-border">
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">Dashboard</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <div className="hidden md:block relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-10 pr-3 py-1.5 w-56 rounded-md bg-card border border-border text-sm focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="flex items-center gap-1 bg-muted/50 rounded-full px-2 py-1">
          <ThemeToggle />
         
        </div>

        {/* Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-primary/60 to-primary/30 flex items-center justify-center font-bold text-primary">
                {user?.name?.[0]?.toUpperCase()}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>{user?.name}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="h-4 w-4 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="h-4 w-4 mr-2" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setShowLogoutAlert(true)}
            >
              <LogOut className="h-4 w-4 mr-2" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Dialog */}
      <AlertDialog open={showLogoutAlert} onOpenChange={setShowLogoutAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>You’ll be redirected to the login page.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
};



export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();

  const adminNavItems = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin",
    },
    {
      id: "admins",
      title: "Admins",
      href: "/admin/admins",
      icon: UserCog,
    },
    {
      id: "experts",
      title: "Technicians",
      icon: Briefcase,
      href: "/admin/experts",
    },
    {
      id: "customers",
      title: "Customers",
      icon: User,
      href: "/admin/customers",
    },
    {
      id: "service_types",
      title: "Service Types",
      icon: ClipboardList,
      href: "/admin/service-types",
    },
    {
      id: "requests",
      title: "Requests",
      icon: ClipboardList,
      href: "/admin/repair-requests",
    },
    {
      id: "service_orders",
      title: "Service Orders",
      icon: ClipboardList,
      href: "/admin/service-orders",
    },
       {
      id: "payouts",
      title: "Payouts",
      icon: Banknote,
      href: "/admin/payouts",
      // comingSoon: true,
    },
    {
      id: "payments",
      title: "Payments",
      icon: CreditCard,
      href: "/admin/payments",
    },
    {
      id: "refunds",
      title: "Refunds",
      icon: XCircle,
      href: "/admin/refunds",
    },
    {
      id: "reports",
      title: "Reports",
      icon: FileText,
      href: "/admin/reports",
    },
  
  ];

  const navItems = user?.role === "admin" ? adminNavItems : [];

  const handleNavClick = (e, href, comingSoon) => {
    if (comingSoon) {
      e.preventDefault();
      toast({
        title: "Coming Soon",
        description: "This feature is not available yet.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-card border-r border-border",
          "transform transition-transform duration-300 ease-in-out lg:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">A</span>
            </div>
            <h1 className="text-xl font-bold text-foreground">Property Repairs</h1>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;

              return (
                <Link
                  key={item.id}
                  to={item.comingSoon ? "#" : item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={(e) => handleNavClick(e, item.href, item.comingSoon)}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                  {item.comingSoon && (
                    <span className="absolute right-2 text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded text-[10px] font-medium">
                      06
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {user?.name}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
};