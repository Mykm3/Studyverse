import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: ""
  });
  
  const cardRef = useRef(null);

  useEffect(() => {
    // Start animation sequence after initial render
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Field ${name} changed:`, `"${value}"`, `(length: ${value.length})`);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    // Trim whitespace and compare passwords
    const trimmedNewPassword = formData.newPassword.trim();
    const trimmedConfirmPassword = formData.confirmPassword.trim();
    
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      console.log('Password mismatch:', {
        newPassword: `"${trimmedNewPassword}"`,
        confirmPassword: `"${trimmedConfirmPassword}"`,
        newPasswordLength: trimmedNewPassword.length,
        confirmPasswordLength: trimmedConfirmPassword.length
      });
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Add card shake animation when submitting
    if (cardRef.current) {
      cardRef.current.classList.add('animate-wiggle');
      setTimeout(() => {
        cardRef.current.classList.remove('animate-wiggle');
      }, 500);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/reset-password/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: trimmedNewPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        showToast("Password reset successful!", "success");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message);
        showToast(data.message, "error");
      }
    } catch (err) {
      const errorMessage = "Failed to reset password. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/90 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md border-t border-l border-primary/20 shadow-xl backdrop-blur-sm bg-card/90">
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Invalid reset link. Please request a new password reset.</AlertDescription>
            </Alert>
            <div className="mt-4 text-center">
              <Link to="/forgot-password" className="text-primary hover:underline">
                Request New Reset Link
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gradient">
            {isSuccess ? "Password Reset!" : "Reset Your Password"}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {isSuccess 
              ? "Your password has been successfully reset"
              : "Enter your new password below"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`space-y-2 transition-all duration-500 ${animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                   style={{ transitionDelay: "100ms" }}>
                <Label htmlFor="newPassword" className="text-sm font-medium flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-primary" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.newPassword}
                    onChange={handleChange}
                    placeholder="Enter your new password"
                    className="rounded-lg border-border/50 focus:border-primary transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div className={`space-y-2 transition-all duration-500 ${animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                   style={{ transitionDelay: "200ms" }}>
                <Label htmlFor="confirmPassword" className="text-sm font-medium flex items-center">
                  <Lock className="mr-2 h-4 w-4 text-primary" />
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your new password"
                    className="rounded-lg border-border/50 focus:border-primary transition-all duration-300 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              {error && (
                <Alert variant="destructive" className={`transition-all duration-500 ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
                  <AlertCircle className="h-4 w-4" />
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
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          ) : (
            <div className={`space-y-4 transition-all duration-500 ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your password has been successfully reset! You will be redirected to the login page shortly.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground text-center">
                <p>You can now log in with your new password.</p>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
                onClick={() => navigate('/login')}
              >
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
        
        <div className="px-6 py-4 border-t border-border/50">
          <Link 
            to="/login" 
            className="text-sm text-primary hover:text-primary/80 hover:underline transition-colors flex items-center justify-center group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Login
          </Link>
        </div>
      </Card>
    </div>
  );
} 