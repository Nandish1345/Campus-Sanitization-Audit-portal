import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

interface Props {
  data: { name: string; value: number }[];
}

export function LocationComplaintChart({ data }: Props) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Complaints by Location</CardTitle>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data} layout="vertical" margin={{ left: 50, right: 20 }}>
            <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <YAxis 
              type="category" 
              dataKey="name" 
              fontSize={12} 
              tickLine={false} 
              axisLine={false} 
              width={100}
            />
            <Tooltip
              cursor={{ fill: "transparent" }}
              contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
            />
            <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
