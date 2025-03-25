import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get("token");
      const error = params.get("error");

      if (error) {
        console.error("Authentication error:", error);
        showToast(decodeURIComponent(error), "error");
        navigate("/login");
        return;
      }

      if (!token) {
        showToast("No authentication token received", "error");
        navigate("/login");
        return;
      }

      try {
        // Store the token in localStorage
        localStorage.setItem("token", token);
        
        // Fetch user data and update auth context
        await checkAuth();
        
        showToast("Successfully signed in with Google!", "success");
        navigate("/dashboard");
      } catch (error) {
        console.error("Error completing authentication:", error);
        showToast("Failed to complete Google sign in", "error");
        navigate("/login");
      }
    };

    handleCallback();
  }, [navigate, location, checkAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
} 