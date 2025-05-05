import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, LogIn, Mail, Lock, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { showToast } from "@/components/ui/Toaster";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  // Refs for animation sequences
  const cardRef = useRef(null);

  useEffect(() => {
    // Start animation sequence after initial render
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    
    // Check for error messages in URL parameters
    const params = new URLSearchParams(location.search);
    const errorMessage = params.get("error");
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    }
    
    return () => clearTimeout(timer);
  }, [location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Add card shake animation when submitting
    if (cardRef.current) {
      cardRef.current.classList.add('animate-wiggle');
      setTimeout(() => {
        cardRef.current.classList.remove('animate-wiggle');
      }, 500);
    }

    try {
      await login(formData.email, formData.password);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    try {
      window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
    } catch (error) {
      console.error("Error initiating Google login:", error);
      showToast("Failed to initiate Google sign in", "error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/90 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background animated circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-20 w-80 h-80 bg-accent/10 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-success/10 rounded-full filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <Card 
        ref={cardRef}
        className={`w-full max-w-md border-t border-l border-primary/20 shadow-xl backdrop-blur-sm bg-card/90 transition-all duration-700 ${
          animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        } hover-lift`}
      >
        <CardHeader className="space-y-2">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary via-accent to-success rounded-full flex items-center justify-center mb-2 shadow-lg">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gradient">Welcome Back</CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            Sign in to your account to continue your study journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className={`space-y-2 transition-all duration-500 ${animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                 style={{ transitionDelay: "100ms" }}>
              <Label htmlFor="email" className="text-sm font-medium flex items-center">
                <Mail className="mr-2 h-4 w-4 text-primary" />
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="rounded-lg border-border/50 focus:border-primary transition-all duration-300"
              />
            </div>
            
            <div className={`space-y-2 transition-all duration-500 ${animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                 style={{ transitionDelay: "200ms" }}>
              <Label htmlFor="password" className="text-sm font-medium flex items-center">
                <Lock className="mr-2 h-4 w-4 text-primary" />
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="rounded-lg border-border/50 focus:border-primary transition-all duration-300"
              />
              <div className="text-right">
                <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                  Forgot password?
                </Link>
              </div>
            </div>
            
            {error && (
              <Alert variant="destructive" className={`transition-all duration-500 ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button
              type="submit"
              variant="gradient"
              className={`w-full rounded-lg transition-all duration-500 ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
              disabled={isLoading}
              style={{ transitionDelay: "300ms" }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
        
        <div className="px-6 py-2">
          <div className={`relative flex items-center transition-all duration-500 ${animate ? "opacity-100" : "opacity-0"}`}
              style={{ transitionDelay: "400ms" }}>
            <div className="flex-grow border-t border-border"></div>
            <span className="mx-3 text-sm text-muted-foreground">or continue with</span>
            <div className="flex-grow border-t border-border"></div>
          </div>
        </div>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="button"
            variant="outline"
            className={`w-full rounded-lg transition-all duration-500 flex items-center justify-center ${animate ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
            onClick={handleGoogleLogin}
            style={{ transitionDelay: "500ms" }}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </Button>
          
          <p className={`text-sm text-center text-muted-foreground transition-all duration-500 ${animate ? "opacity-100" : "opacity-0"}`}
             style={{ transitionDelay: "600ms" }}>
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium inline-flex items-center group">
              Sign up
              <ExternalLink className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
} 