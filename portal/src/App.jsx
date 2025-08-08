import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { StaffLoginPage } from "@/pages/auth/StaffLoginPage";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { ClientsPage } from "@/pages/admin/ClientsPage";
import { ExpertsPage } from "@/pages/admin/ExpertsPage";
import { LandingPage } from "@/pages/LandingPage";
import { AdminsPage } from "@/pages/admin/AdminsPage";
import { ServiceTypesPage } from "@/pages/admin/ServiceTypesPage";
import { RepairRequestsPage } from "@/pages/admin/RepairRequestsPage";
import { RepairRequestFormPage } from "@/pages/admin/RepairRequestFormPage";
import { BidsManagementPage } from "@/pages/admin/BidsManagementPage";
import { queryClient } from "@/lib/react-query";
import { RepairRequestDetailsPage } from "./pages/admin/RepairRequestDetailsPage";
import { ServiceOrdersPage } from "@/pages/admin/ServiceOrdersPage";
import { ServiceOrderDetailsPage } from "@/pages/admin/ServiceOrderDetailsPage";
import { PaymentLogsPage } from "@/pages/admin/PaymentLogsPage";
import { RefundsPage } from "@/pages/admin/RefundsPage";
import { PayoutLogsPage } from "./pages/admin/PayoutLogsPage";
import { ReportsPage } from "@/pages/admin/ReportsPage";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
 
            {/* Auth Route */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <StaffLoginPage />
                </PublicRoute>
              }
            />

            {/* Protected Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <DashboardLayout>
                    <Routes>
                      <Route index element={<AdminDashboard />} />
                      <Route path="experts" element={<ExpertsPage />} />
                      <Route path="customers" element={<ClientsPage />} />
                      <Route path="admins" element={<AdminsPage />} />
                      <Route path="service-types" element={<ServiceTypesPage />} />
                      {/* Repair Request Routes */}
                      <Route path="repair-requests" element={<RepairRequestsPage />} />
                      <Route path="repair-requests/new" element={<RepairRequestFormPage />} />
                      <Route path="repair-requests/:id" element={<RepairRequestDetailsPage />} />
                      <Route path="repair-requests/:id/edit" element={<RepairRequestFormPage />} />
                      <Route path="repair-requests/:requestId/bids" element={<BidsManagementPage />} />
                      <Route path="service-orders" element={<ServiceOrdersPage />} />
                      <Route path="service-orders/:id" element={<ServiceOrderDetailsPage />} />
                      <Route path="payments" element={<PaymentLogsPage />} />
                      <Route path="refunds" element={<RefundsPage />} />
                      <Route path="payouts" element={<PayoutLogsPage />} />
                      <Route path="reports" element={<ReportsPage />} />
                    </Routes>
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
