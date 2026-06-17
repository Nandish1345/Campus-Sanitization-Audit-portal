import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);

  useEffect(() => {
    // Supabase automatically picks up the reset token from the URL hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true);
      } else {
        toast({
          title: "Invalid or Expired Link",
          description: "This password reset link is invalid or has expired. Please request a new one.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    });
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast({ title: "Error", description: "Please fill in both fields", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({ title: "Password Updated!", description: "Your password has been changed. Please log in." });
      await supabase.auth.signOut();
      navigate("/login");
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
          <div className="text-center mb-8">
            <KeyRound className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
            <p className="text-muted-foreground">Choose a strong password for your account</p>
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Reset Password</CardTitle>
              <CardDescription>Enter and confirm your new password below.</CardDescription>
            </CardHeader>
            <CardContent>
              {isValidSession ? (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter new password (min. 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
                    {confirmPassword && password === confirmPassword && (
                      <p className="text-xs text-green-600">✅ Passwords match</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || password !== confirmPassword}
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Checking reset link... redirecting to login.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
