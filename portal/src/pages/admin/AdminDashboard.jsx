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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={fetchDashboardStats} disabled={isLoading}>
          {isLoading ? "Loading..." : "Refresh Data"}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Service Requests</CardTitle>
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
                      <p className="font-medium">Request #{request.request_id}</p>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Service Orders</CardTitle>
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
                      <p className="font-medium">
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