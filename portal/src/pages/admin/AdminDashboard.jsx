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
      totalRevenue: 0,
    },
    recentRequests: [],
    recentPayments: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/admin/dashboard/stats");
      setStats(response.data.data);
    } catch (error) {
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
      description: "Total service requests",
    },
    {
      title: "Completed Services",
      value: stats.counts.completedRequests,
      icon: CheckCircle,
      description: "Successfully completed services",
    },
    {
      title: "Pending Requests",
      value: stats.counts.pendingRequests,
      icon: Clock,
      description: "Awaiting assignment or completion",
    },
    {
      title: "Total Revenue",
      value: `$${stats.counts.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Total revenue from completed services",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <Button onClick={fetchDashboardStats} disabled={isLoading}>
          Refresh Data
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              {stats.recentRequests.map((request) => (
                <div
                  key={request._id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{request.title}</p>
                    <p className="text-sm text-muted-foreground">
                      Client: {request.client?.name}
                    </p>
                  </div>
                  <Badge variant={
                    request.status === "completed" 
                      ? "success" 
                      : request.status === "pending"
                      ? "warning"
                      : "secondary"
                  }>
                    {request.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentPayments.map((payment) => (
                <div
                  key={payment._id}
                  className="flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">
                      ${payment.amount.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {payment.client?.name} - {payment.serviceRequest?.title}
                    </p>
                  </div>
                  <Badge variant={
                    payment.status === "completed" 
                      ? "success" 
                      : "secondary"
                  }>
                    {payment.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 