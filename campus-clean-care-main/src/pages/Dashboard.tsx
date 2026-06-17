import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Clock, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import { supabase } from "@/lib/supabase";
interface UserMetadata {
  full_name: string;
  role: string;
  email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      setUser(session.user);

      // Fetch complaints stats
      // Staff see assigned tasks, others see their own complaints
      let query = supabase.from('complaints').select('status');
      
      if (session.user.user_metadata?.role === 'Staff') {
        query = query.eq('assigned_to', session.user.id);
      } else {
        query = query.eq('user_id', session.user.id);
      }

      const { data: complaints, error } = await query;

      if (complaints) {
        setStats({
          total: complaints.length,
          pending: complaints.filter(c => c.status === "Pending").length,
          in_progress: complaints.filter(c => c.status === "In Progress").length,
          resolved: complaints.filter(c => c.status === "Resolved").length,
        });
      }
    };

    fetchDashboardData();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <Navbar />

      <div className="container mx-auto px-4 pt-32 pb-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome, {user.user_metadata?.role} {user.user_metadata?.full_name}!
          </h1>
          <p className="text-muted-foreground">Here's your sanitization audit overview</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Complaints
              </CardTitle>
              <FileText className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Complaints
              </CardTitle>
              <Clock className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
              <Clock className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.in_progress}</div>
            </CardContent>
          </Card>

          <Card className="shadow-lg hover:shadow-xl transition-all border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved Complaints
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-4 justify-center">
          {user.user_metadata?.role !== 'Staff' && user.user_metadata?.role !== 'Admin' && (
            <Link to="/raise-complaint">
              <Button size="lg" className="shadow-lg">
                <AlertCircle className="mr-2 h-5 w-5" />
                Raise New Complaint
              </Button>
            </Link>
          )}
          <Link to="/view-complaints">
            <Button size="lg" variant="outline" className="shadow-lg">
              <FileText className="mr-2 h-5 w-5" />
              {user.user_metadata?.role === 'Staff' ? 'View My Tasks' : 'View All Complaints'}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
