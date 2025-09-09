import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/Toaster";
import Login from "@/components/Login";
import Register from "@/components/Register";
import ForgotPassword from "@/components/ForgotPassword";
import ResetPassword from "@/components/ResetPassword";
import AuthCallback from "@/components/AuthCallback";
import StudyDashboard from "@/components/StudyDashboard";
import StudyPlanPage from "./pages/studyplan";
import Sidebar from "@/components/Sidebar";
import Dashboard from "./pages/dashboard";
import Notebook from "./pages/notebook";
import Analytics from "./pages/analytics";
import StudySession from "./pages/StudySession";
import Settings from "./pages/Settings";
import { AuthProvider } from "@/contexts/AuthContext";
import { SubjectProvider } from "@/contexts/SubjectContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddSession from './pages/AddSession';
import EditSession from './pages/EditSession';
import SharedPlan from './pages/SharedPlan';
import TestUploadPage from './pages/test-upload';
import { useState, useEffect } from 'react';
import { useToast } from "./lib/toast";

// Animated page transition wrapper
const PageTransition = ({ children }) => {
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return (
    <div className={`page-transition ${isAnimating ? 'animate-in' : ''}`} style={{ 
      opacity: isAnimating ? 0 : 1,
      transform: isAnimating ? 'translateY(10px)' : 'translateY(0)',
      transition: 'all 0.4s ease-out'
    }}>
      {children}
    </div>
  );
};

// Layout component with sidebar
const Layout = ({ children, hideNav }) => {
  return (
    <div className="flex h-screen">
      {!hideNav && <Sidebar />}
      <main className="flex-1 overflow-y-auto">
        <PageTransition>
          {children}
        </PageTransition>
      </main>
    </div>
  );
};

function App() {
  // Initialize the global toast function
  useToast();
  
  return (
    <Router>
      <AuthProvider>
        <SubjectProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Shared plan route - public access */}
            <Route path="/shared-plan/:shareId" element={<SharedPlan />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudyDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-plan"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StudyPlanPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notebook"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Notebook />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/study-session"
              element={
                <ProtectedRoute>
                  <Layout hideNav={true}>
                    <StudySession />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-session"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AddSession />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-session/:sessionId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EditSession />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-upload"
              element={
                <ProtectedRoute>
                  <Layout>
                    <TestUploadPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          <Toaster />
        </SubjectProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
