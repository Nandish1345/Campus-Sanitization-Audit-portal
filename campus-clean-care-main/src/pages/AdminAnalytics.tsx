import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useComplaintAnalytics } from "@/hooks/use-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

// Import Analytics Components
import { DashboardStatsCards } from "@/components/analytics/DashboardStatsCards";
import { ComplaintCategoryChart } from "@/components/analytics/ComplaintCategoryChart";
import { ComplaintStatusPieChart } from "@/components/analytics/ComplaintStatusPieChart";
import { MonthlyTrendChart } from "@/components/analytics/MonthlyTrendChart";
import { LocationComplaintChart } from "@/components/analytics/LocationComplaintChart";
import { RefreshCw } from "lucide-react";

const AdminAnalytics = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isCheckingRole, setIsCheckingRole] = useState(true);

    const { data: analyticsOptions, isLoading, isError, error, refetch, isRefetching } = useComplaintAnalytics();

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate("/login");
                return;
            }

            const role = session.user.user_metadata?.role;
            if (role !== "Admin") {
                toast({
                    title: "Access Denied",
                    description: "You do not have permission to view Analytics.",
                    variant: "destructive",
                });
                navigate("/dashboard");
                return;
            }
        } finally {
            setIsCheckingRole(false);
        }
    };

    if (isCheckingRole) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                        <p className="text-muted-foreground">Overview of campus complaint metrics and distributions</p>
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => refetch()} 
                        disabled={isLoading || isRefetching}
                        className="flex items-center gap-2"
                    >
                        <RefreshCw className={`h-4 w-4 ${(isLoading || isRefetching) ? 'animate-spin' : ''}`} />
                        {isRefetching ? "Refreshing..." : "Refresh Data"}
                    </Button>
                </div>

                {isLoading ? (
                    <div className="space-y-6 animate-pulse">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-32 w-full rounded-xl" />
                            ))}
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                             <Skeleton className="h-[400px] w-full rounded-xl" />
                             <Skeleton className="h-[400px] w-full rounded-xl" />
                        </div>
                    </div>
                ) : isError ? (
                    <div className="p-8 text-center border rounded-xl bg-red-50 text-red-600">
                        <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
                        <p>{error?.message}</p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-fade-in">
                        {/* KPI Cards */}
                        {analyticsOptions && <DashboardStatsCards data={analyticsOptions} />}

                        {/* Top Charts */}
                        <div className="grid gap-4 md:grid-cols-2">
                            {analyticsOptions && <ComplaintCategoryChart data={analyticsOptions.categoryDistribution} />}
                            {analyticsOptions && <ComplaintStatusPieChart data={analyticsOptions.statusDistribution} />}
                        </div>

                        {/* Bottom Full-Width Charts */}
                        <div className="grid gap-4 lg:grid-cols-2">
                            {analyticsOptions && <MonthlyTrendChart data={analyticsOptions.monthlyTrends} />}
                            {analyticsOptions && <LocationComplaintChart data={analyticsOptions.locationDistribution} />}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminAnalytics;
