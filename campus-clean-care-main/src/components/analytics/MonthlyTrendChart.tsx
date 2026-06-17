import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface Props {
  data: { month: string; complaints: number }[];
}

export function MonthlyTrendChart({ data }: Props) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Monthly Complaint Trends</CardTitle>
      </CardHeader>
      <CardContent className="pl-0">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ left: 10, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
               contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Line 
              type="monotone" 
              dataKey="complaints" 
              stroke="#8b5cf6" 
              strokeWidth={3}
              dot={{ r: 4, fill: "#8b5cf6" }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
