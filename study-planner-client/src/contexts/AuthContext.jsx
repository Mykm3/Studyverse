import { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showToast } from "@/components/ui/Toaster";
import api from "@/utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log("[Auth] No token found in localStorage, user is not authenticated");
      setLoading(false);
      return;
    }

    console.log("[Auth] Token found, verifying with server...");
    try {
      const userData = await api.get('/api/auth/profile');
      console.log("[Auth] User authenticated successfully:", userData);
      setUser(userData);
    } catch (error) {
      console.error("[Auth] Auth check failed:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await api.post('/api/auth/login', { email, password });
      console.log("[Auth] Login successful, received token:", data.token ? "Token received" : "No token received");
      
      if (!data.token) {
        throw new Error("No authentication token received from server");
      }
      
      localStorage.setItem("token", data.token);
      setUser(data.user);
      showToast("Successfully logged in!", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error("[Auth] Login error:", error);
      showToast(error.message, "error");
      throw error;
    }
  };

  const register = async (email, password, displayName) => {
    try {
      const data = await api.post('/api/auth/register', { email, password, displayName });
      localStorage.setItem("token", data.token);
      setUser(data.user);
      showToast("Account created successfully!", "success");
      navigate("/dashboard");
    } catch (error) {
      console.error("Registration error:", error);
      showToast(error.message, "error");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      setUser(null);
      showToast("Successfully logged out!", "success");
      navigate("/login");
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
} 