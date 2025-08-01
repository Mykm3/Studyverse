import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Label } from "@/components/ui/Label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Loader2, Mail, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { showToast } from "@/components/ui/Toaster";

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [animate, setAnimate] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const cardRef = useRef(null);

  useEffect(() => {
    // Start animation sequence after initial render
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Add card shake animation when submitting
    if (cardRef.current) {
      cardRef.current.classList.add('animate-wiggle');
      setTimeout(() => {
        cardRef.current.classList.remove('animate-wiggle');
      }, 500);
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setIsSuccess(true);
        showToast("Password reset email sent successfully!", "success");
      } else {
        setError(data.message);
        showToast(data.message, "error");
      }
    } catch (err) {
      const errorMessage = "Failed to send reset email. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setIsSuccess(false);
    setMessage("");
    setError("");
    setEmail("");
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
            <Mail className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gradient">
            {isSuccess ? "Check Your Email" : "Forgot Password"}
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            {isSuccess 
              ? "We've sent you a password reset link"
              : "Enter your email to receive a password reset link"
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {!isSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className={`space-y-2 transition-all duration-500 ${animate ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`}
                   style={{ transitionDelay: "100ms" }}>
                <Label htmlFor="email" className="text-sm font-medium flex items-center">
                  <Mail className="mr-2 h-4 w-4 text-primary" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="rounded-lg border-border/50 focus:border-primary transition-all duration-300"
                />
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
                style={{ transitionDelay: "200ms" }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className={`space-y-4 transition-all duration-500 ${animate ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground text-center space-y-2">
                <p>Didn't receive the email? Check your spam folder or try again.</p>
                <p>Make sure you entered the correct email address.</p>
              </div>
              
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-lg"
                  onClick={handleBackToLogin}
                >
                  Try Again
                </Button>
              </div>
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