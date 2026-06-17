import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, Clock, PieChart, AlertCircle } from "lucide-react";
import { AnalyticsData } from "@/hooks/use-analytics";

interface DashboardStatsCardsProps {
  data: AnalyticsData;
}

export function DashboardStatsCards({ data }: DashboardStatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.totalComplaints}</div>
          <p className="text-xs text-muted-foreground">
            All time reported issues
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Issues</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.pendingComplaints}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting admin action
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Resolution Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.avgResolutionTimeHours} <span className="text-sm font-normal">hrs</span></div>
          <p className="text-xs text-muted-foreground">
            From creation to resolution
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Top Category</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.mostFrequentCategory}</div>
          <p className="text-xs text-muted-foreground">
            Most commonly reported
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
