import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRole, setUserRole] = useState<string>("");

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      const role = session?.user?.user_metadata?.role;
      setUserRole(role || "");
      setIsAdmin(role === "Admin");
    });

    // Listen for changes (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
      const role = session?.user?.user_metadata?.role;
      setUserRole(role || "");
      setIsAdmin(role === "Admin");
    });

    return () => subscription.unsubscribe();
  }, [location]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (

    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm transition-all duration-300">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group">
            <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground font-heading tracking-tight">Campus Clean Care</span>
          </Link>

          <div className="flex items-center gap-4">
            {!isLoggedIn ? (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </>
            ) : (
              <>
                {isAdmin ? (
                  <>
                    <Link to="/admin">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Admin Panel</Button>
                    </Link>
                    <Link to="/admin/analytics">
                      <Button variant="ghost" size="sm" className="text-primary font-bold">Analytics</Button>
                    </Link>
                  </>
                ) : (
                  <Link to="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                )}

                {userRole !== "Admin" && userRole !== "Staff" && (
                  <Link to="/raise-complaint">
                    <Button variant="ghost" size="sm">Raise Complaint</Button>
                  </Link>
                )}

                {userRole === "Staff" && (
                  <Link to="/view-complaints">
                    <Button variant="ghost" size="sm">View Tasks</Button>
                  </Link>
                )}

                {(userRole === "Student" || userRole === "Lecturer") && (
                  <Link to="/view-complaints">
                    <Button variant="ghost" size="sm">View Complaints</Button>
                  </Link>
                )}

                <NotificationBell />

                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
