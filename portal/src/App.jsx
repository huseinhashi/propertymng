
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { StaffLoginPage } from "@/pages/auth/StaffLoginPage";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { UsersPage } from "@/pages/admin/UsersPage";
import { ClientsPage } from "@/pages/admin/ClientsPage";
import {ExpertsPage} from "@/pages/admin/ExpertsPage";
import { LandingPage } from "@/pages/LandingPage";
import { AdminsPage } from "@/pages/admin/AdminsPage";
import {ServiceTypesPage} from "@/pages/admin/ServiceTypesPage";
import { queryClient } from "@/lib/react-query";

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
                      <Route path="customer" element={<ClientsPage />} />
                      <Route path="admins" element={<AdminsPage />} />
                      <Route path="service-types" element={<ServiceTypesPage />} />
                     
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
