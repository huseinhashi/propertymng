import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PublicRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
};
