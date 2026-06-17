import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Shield, ArrowLeft, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // ── Login ──────────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!email || !password) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      if (data.user) {
        toast({ title: "Success", description: "Logged in successfully!" });
        const role = data.user.user_metadata?.role;
        if (role === "Admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error: any) {
      toast({ title: "Login Failed", description: error.message || "Invalid email or password", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Forgot Password ────────────────────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) {
      toast({ title: "Error", description: "Please enter your email address", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;

      setResetSent(true);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="max-w-md mx-auto">

          {/* ── Login Form ── */}
          {!showForgotPassword && (
            <>
              <div className="text-center mb-8">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">Login to your account</p>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Login</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <button
                          type="button"
                          onClick={() => setShowForgotPassword(true)}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Logging in..." : "Login"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-primary hover:underline">
                        Sign up
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Forgot Password Form ── */}
          {showForgotPassword && (
            <>
              <div className="text-center mb-8">
                <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
                <p className="text-muted-foreground">We'll send a reset link to your email</p>
              </div>

              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Forgot Password</CardTitle>
                  <CardDescription>
                    {resetSent
                      ? "Check your inbox for the reset link."
                      : "Enter the email address linked to your account."}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!resetSent ? (
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email Address</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          placeholder="Enter your email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Sending..." : "Send Reset Link"}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto"
                      >
                        <ArrowLeft className="h-3 w-3" /> Back to Login
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-4 text-center">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-green-700 font-medium">✅ Reset link sent!</p>
                        <p className="text-green-600 text-sm mt-1">
                          Check your inbox at <strong>{resetEmail}</strong> and click the link to set a new password.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetSent(false);
                          setResetEmail("");
                        }}
                        className="flex items-center gap-1 text-sm text-primary hover:underline mx-auto"
                      >
                        <ArrowLeft className="h-3 w-3" /> Back to Login
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Login;
