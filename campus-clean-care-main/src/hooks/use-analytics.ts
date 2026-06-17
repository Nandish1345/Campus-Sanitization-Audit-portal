import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Complaint, Category, Status } from "@/types";

export interface AnalyticsData {
  totalComplaints: number;
  pendingComplaints: number;
  avgResolutionTimeHours: number;
  mostFrequentCategory: string;
  categoryDistribution: { name: string; value: number }[];
  statusDistribution: { name: string; value: number }[];
  monthlyTrends: { month: string; complaints: number }[];
  locationDistribution: { name: string; value: number }[];
}

export const useComplaintAnalytics = () => {
  return useQuery({
    queryKey: ["complaint-analytics"],
    queryFn: async (): Promise<AnalyticsData> => {
      // 1. Fetch raw complaints data securely
      const { data: complaints, error } = await supabase
        .from("complaints")
        .select("*");

      if (error) throw error;
      if (!complaints) throw new Error("No data returned");

      const typedComplaints = complaints as Complaint[];

      // 2. Compute KPIs
      const totalComplaints = typedComplaints.length;
      const pendingComplaints = typedComplaints.filter(
        (c) => c.status === "Pending"
      ).length;

      // Avg Resolution Time (in hours)
      const resolvedComplaints = typedComplaints.filter(
        (c) => c.status === "Resolved" && c.resolved_at
      );
      
      let totalResolutionHours = 0;
      resolvedComplaints.forEach((c) => {
        const created = new Date(c.created_at).getTime();
        const resolved = new Date(c.resolved_at!).getTime();
        const diffHours = (resolved - created) / (1000 * 60 * 60);
        totalResolutionHours += diffHours;
      });
      const avgResolutionTimeHours =
        resolvedComplaints.length > 0
          ? Math.round(totalResolutionHours / resolvedComplaints.length)
          : 0;

      // 3. Category Distribution & Most Frequent Category
      const categoryCounts: Record<string, number> = {};
      typedComplaints.forEach((c) => {
        const cat = c.category || "Uncategorized";
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      });

      const categoryDistribution = Object.entries(categoryCounts).map(
        ([name, value]) => ({ name, value })
      );

      let mostFrequentCategory = "N/A";
      let maxCount = 0;
      for (const [cat, count] of Object.entries(categoryCounts)) {
        if (count > maxCount) {
          maxCount = count;
          mostFrequentCategory = cat;
        }
      }

      // 4. Status Distribution
      const statusCounts: Record<string, number> = {
        Pending: 0,
        "In Progress": 0,
        Resolved: 0,
      };
      typedComplaints.forEach((c) => {
        if (statusCounts[c.status] !== undefined) {
          statusCounts[c.status]++;
        } else {
           statusCounts[c.status] = 1; 
        }
      });

      const statusDistribution = Object.entries(statusCounts).map(
        ([name, value]) => ({ name, value })
      );

      // 5. Monthly Trends (Short Month format e.g., 'Jan')
      const monthlyCounts: Record<string, number> = {};
      const sortedByDate = [...typedComplaints].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedByDate.forEach((c) => {
        const date = new Date(c.created_at);
        // e.g "Jan 2026"
        const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyCounts[monthYear] = (monthlyCounts[monthYear] || 0) + 1;
      });

      const monthlyTrends = Object.entries(monthlyCounts).map(
        ([month, complaints]) => ({ month, complaints })
      );

      // 6. Location Distribution
      const locationCounts: Record<string, number> = {};
      typedComplaints.forEach((c) => {
        const loc = c.location || "Unknown";
        locationCounts[loc] = (locationCounts[loc] || 0) + 1;
      });

      const locationDistribution = Object.entries(locationCounts)
        .sort((a, b) => b[1] - a[1]) // Sort desc
        .slice(0, 10) // Keep top 10 locations to avoid huge charts
        .map(([name, value]) => ({ name, value }));

      return {
        totalComplaints,
        pendingComplaints,
        avgResolutionTimeHours,
        mostFrequentCategory,
        categoryDistribution,
        statusDistribution,
        monthlyTrends,
        locationDistribution,
      };
    },
    // Refresh every 10 seconds if needed, but allow manual refresh
    staleTime: 10 * 1000, 
  });
};
