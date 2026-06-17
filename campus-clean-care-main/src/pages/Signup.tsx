import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { Shield, Mail, KeyRound, ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const Signup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Step 1 = registration form, Step 2 = OTP verification, Step 3 = Success
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "",
    department: "",
  });
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // ── Step 1: Register — only sends OTP, does NOT activate account ────────────
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role || !formData.department) {
      toast({ title: "Error", description: "Please fill in all fields", variant: "destructive" });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            role: formData.role,
            department: formData.department,
          },
        },
      });

      if (error) throw error;

      // Account is pending — NOT active until OTP is verified
      if (data.user) {
        toast({
          title: "OTP Sent!",
          description: `Check your inbox at ${formData.email} for the 8-digit verification code.`,
        });
        setStep(2);
      }
    } catch (error: any) {
      toast({ title: "Signup Failed", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Step 2: Verify OTP — account is ONLY activated here ────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 8) {
      toast({ title: "Error", description: "Please enter the complete 8-digit OTP code", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: formData.email,
        token: otp.trim(),
        type: "signup",
      });

      if (error) throw error;

      // OTP verified → account is now active → show success screen
      setStep(3);
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid or expired OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ── Resend OTP ──────────────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: formData.email,
      });
      if (error) throw error;
      toast({ title: "OTP Resent", description: `A new 8-digit code has been sent to ${formData.email}` });
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

          {/* ── Step 1: Registration Form ── */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <Shield className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-muted-foreground">Join the campus audit portal</p>
              </div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                  <CardDescription>Fill in your details — you'll verify your email next.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your real email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Create a password (min. 6 chars)"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select onValueChange={(value) => setFormData({ ...formData, role: value })} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Student">Student</SelectItem>
                          <SelectItem value="Lecturer">Lecturer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        placeholder="Enter your department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Sending OTP..." : "Sign Up & Verify Email"}
                    </Button>

                    <div className="text-center text-sm text-muted-foreground">
                      Already have an account?{" "}
                      <Link to="/login" className="text-primary hover:underline">
                        Login
                      </Link>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Step 2: OTP Verification ── */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <Mail className="h-16 w-16 text-primary mx-auto mb-4" />
                <h1 className="text-3xl font-bold mb-2">Verify Your Email</h1>
                <p className="text-muted-foreground">
                  Enter the 8-digit code sent to <strong>{formData.email}</strong>
                </p>
              </div>
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <KeyRound className="h-5 w-5" /> Enter OTP Code
                  </CardTitle>
                  <CardDescription>
                    Your account will only be created after the OTP is verified.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="otp">8-Digit OTP Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        inputMode="numeric"
                        maxLength={8}
                        placeholder="e.g. 48291063"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        className="text-center text-2xl tracking-[0.5em] font-mono"
                        required
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground text-center">
                        {otp.length}/8 digits entered
                      </p>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading || otp.length !== 8}>
                      {isLoading ? "Verifying..." : "Verify & Create Account"}
                    </Button>

                    <div className="flex flex-col gap-2 items-center text-sm text-muted-foreground">
                      <span>Didn't receive a code?</span>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                      >
                        Resend OTP
                      </Button>
                      <button
                        type="button"
                        onClick={() => { setStep(1); setOtp(""); }}
                        className="flex items-center gap-1 text-primary hover:underline mt-1"
                      >
                        <ArrowLeft className="h-3 w-3" /> Go back and change email
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </>
          )}

          {/* ── Step 3: Success Screen ── */}
          {step === 3 && (
            <>
              <div className="text-center mb-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4 animate-bounce" />
                <h1 className="text-3xl font-bold mb-2 text-green-600">Account Created!</h1>
                <p className="text-muted-foreground">Your email has been verified successfully.</p>
              </div>
              <Card className="shadow-lg border-green-200">
                <CardContent className="pt-6">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                    <p className="text-green-700 font-semibold text-lg">✅ Account Created Successfully!</p>
                    <p className="text-green-600 text-sm mt-1">
                      Welcome, <strong>{formData.name}</strong>! Your account is now active.
                    </p>
                    <p className="text-green-600 text-sm mt-1">
                      Role: <strong>{formData.role}</strong> | Department: <strong>{formData.department}</strong>
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => navigate("/login")}
                  >
                    Go to Login →
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Signup;
