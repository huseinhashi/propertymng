//portal/src/contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("token");
  });

  // Add this effect to handle token on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  }, []);

const login = async (email, password) => {
  try {
    const response = await api.post("/auth/admin/login", { email, password });
    const { token, admin } = response.data.data;

    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(admin));

    setUser(admin);
    setIsAuthenticated(true);
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return user;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Login failed");
  }
};


  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
<AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}; 