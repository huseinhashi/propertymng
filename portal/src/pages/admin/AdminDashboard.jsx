import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios";
import {
  Users,
  UserCog,
  FileText,
  CheckCircle,
  Clock,
  DollarSign,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
// --- Recharts imports ---
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    counts: {
      clients: 0,
      experts: 0,
      totalRequests: 0,
      completedRequests: 0,
      pendingRequests: 0,
      totalOrders: 0,
      completedOrders: 0,
      totalRevenue: 0,
    },
    recentRequests: [],
    recentOrders: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      // Fetch all required data in parallel
      const [
        customersResponse, 
        expertsResponse, 
        repairRequestsResponse,
        serviceOrdersStatsResponse
      ] = await Promise.all([
        api.get("/admin/customers"),
        api.get("/admin/experts"),
        api.get("/admin/repair-requests"),
        api.get("/admin/service-orders-stats")
      ]);
      // Calculate counts from the retrieved data
      const customers = customersResponse.data.data || [];
      const experts = expertsResponse.data.data || [];
      const repairRequests = repairRequestsResponse.data.data || [];
      const serviceOrdersStats = serviceOrdersStatsResponse.data.data || {};
      // Process repair requests to get status counts
      const completedRequests = repairRequests.filter(req => req.status === "closed").length;
      const pendingRequests = repairRequests.filter(req => req.status === "pending" || req.status === "bidding").length;
      // Get most recent repair requests
      const recentRequests = [...repairRequests]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setStats({
        counts: {
          clients: customers.length,
          experts: experts.length,
          totalRequests: repairRequests.length,
          completedRequests,
          pendingRequests,
          totalOrders: serviceOrdersStats.totalOrders || 0,
          completedOrders: (serviceOrdersStats.byStatus?.completed || 0) + (serviceOrdersStats.byStatus?.delivered || 0),
          totalRevenue: serviceOrdersStats.totalRevenue || 0,
        },
        recentRequests,
        recentOrders: serviceOrdersStats.recentOrders || [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch dashboard statistics",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // --- Chart Data ---
  const barChartData = [
    {
      name: "Requests",
      Total: stats.counts.totalRequests ?? 0,
      Completed: stats.counts.completedRequests ?? 0,
      Pending: stats.counts.pendingRequests ?? 0,
    },
    {
      name: "Orders",
      Total: stats.counts.totalOrders ?? 0,
      Completed: stats.counts.completedOrders ?? 0,
    },
  ];

  const pieChartData = [
    { name: "Revenue", value: stats.counts.totalRevenue ?? 0 },
    { name: "Orders", value: stats.counts.totalOrders ?? 0 },
    { name: "Requests", value: stats.counts.totalRequests ?? 0 },
  ];
  const pieColors = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/90 border border-border rounded-lg p-3 shadow-xl">
          <p className="font-semibold text-foreground mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value ?? 0}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const cards = [
    {
      title: "Total Clients",
      value: stats.counts.clients,
      icon: Users,
      description: "Active clients in the system",
    },
    {
      title: "Total Experts",
      value: stats.counts.experts,
      icon: UserCog,
      description: "Registered service experts",
    },
    {
      title: "Service Requests",
      value: stats.counts.totalRequests,
      icon: FileText,
      description: "Total repair requests",
    },
    {
      title: "Pending Requests",
      value: stats.counts.pendingRequests,
      icon: Clock,
      description: "Awaiting bids or acceptance",
    },
    {
      title: "Service Orders",
      value: stats.counts.totalOrders,
      icon: ShoppingCart,
      description: "Total service orders",
    },
    {
      title: "Completed Services",
      value: stats.counts.completedOrders,
      icon: Truck,
      description: "Completed and delivered services",
    },
    {
      title: "Total Revenue",
      value: `$${stats.counts.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total revenue from paid services",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
        <Button onClick={fetchDashboardStats} disabled={isLoading} className="rounded-full px-6">
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title} className="bg-gradient-to-br from-white via-muted to-blue-50/60 border-0 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-primary/80 to-primary/40 shadow text-white">
                  <card.icon className="h-5 w-5" />
                </span>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card className="bg-gradient-to-br from-card via-muted to-blue-50/60 border-0 shadow-xl rounded-2xl p-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Requests & Orders Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} barSize={32}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <YAxis axisLine={false} tickLine={false} className="text-xs text-muted-foreground" />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--muted)/.2)" }} />
                <Legend />
                <Bar dataKey="Total" fill="hsl(var(--chart-1))" radius={[12, 12, 0, 0]} />
                <Bar dataKey="Completed" fill="hsl(var(--chart-2))" radius={[12, 12, 0, 0]} />
                {barChartData[0]?.Pending !== undefined && (
                  <Bar dataKey="Pending" fill="hsl(var(--chart-3))" radius={[12, 12, 0, 0]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {/* Pie Chart */}
        <Card className="bg-gradient-to-br from-card via-muted to-blue-50/60 border-0 shadow-xl rounded-2xl p-4 flex flex-col">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">Revenue & Activity Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-[260px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={48}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  paddingAngle={4}
                  stroke="hsl(var(--background))"
                  strokeWidth={2}
                >
                  {pieChartData.map((entry, idx) => (
                    <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Lists */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-card via-muted to-blue-50/60 border-0 shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Service Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentRequests.length > 0 ? (
                stats.recentRequests.map((request) => (
                  <div
                    key={request.request_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">Request #{request.request_id}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.description?.length > 30
                          ? request.description.substring(0, 30) + "..."
                          : request.description}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Client: {request.customer?.name || "Unknown"}
                      </p>
                    </div>
                    <Badge variant={
                      request.status === "closed" 
                        ? "success" 
                        : request.status === "pending"
                        ? "warning"
                        : request.status === "bidding"
                        ? "secondary"
                        : "default"
                    }>
                      {request.status.toUpperCase()}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No recent requests found</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card via-muted to-blue-50/60 border-0 shadow-xl rounded-2xl p-4">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-foreground">Recent Service Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order) => (
                  <div
                    key={order.service_order_id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        Order #{order.service_order_id}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${parseFloat(order.total_price || 0).toFixed(2)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.bid?.repair_request?.customer?.name || "Unknown Customer"}
                        {order.bid?.expert ? ` - ${order.bid.expert.full_name}` : ''}
                      </p>
                    </div>
                    <Badge variant={
                      order.payment_status === "fully_paid" 
                        ? "success" 
                        : order.payment_status === "partially_paid"
                        ? "warning"
                        : "default"
                    }>
                      {order.payment_status?.toUpperCase().replace("_", " ") || "UNKNOWN"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground">No recent orders found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 
