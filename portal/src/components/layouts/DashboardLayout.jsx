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
} from "lucide-react";
import { Header } from "./Header";
import { useToast } from "@/hooks/use-toast";

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
      id: "payments",
      title: "Payments",
      icon: CreditCard,
      href: "/admin/payments",
    },
    {
      id: "payouts",
      title: "Payouts",
      icon: Banknote,
      href: "/admin/payouts",
      comingSoon: true,
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
    <div className="min-h-screen bg-gray-100">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 lg:hidden z-40"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r",
          "transform transition-transform duration-200 ease-in-out lg:transform-none",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center justify-between px-4 border-b">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isParent = item.subItems && item.subItems.length > 0;

            if (isParent) {
              return (
                <div key={item.id}>
                  <div className="flex items-center gap-3 px-3 py-2 text-sm font-semibold text-gray-700">
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </div>
                  <div className="ml-6 space-y-1">
                    {item.subItems.map((sub) => (
                      <Link
                        key={sub.id}
                        to={sub.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-1 rounded-lg text-sm font-medium transition-colors",
                          location.pathname === sub.href
                            ? "bg-primary text-white"
                            : "text-gray-600 hover:bg-gray-100"
                        )}
                      >
                        <sub.icon className="h-4 w-4" />
                        <span>{sub.title}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.id}
                to={item.comingSoon ? "#" : item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative",
                  isActive
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
                onClick={(e) => handleNavClick(e, item.href, item.comingSoon)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
                {item.comingSoon && (
                  <span className="absolute right-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Soon
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};