import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ClientOrder, MatchaProduct } from "@/types/database";
import { format, subDays, eachDayOfInterval, startOfDay } from "date-fns";

interface RevenueChartProps {
  orders: ClientOrder[];
  products: MatchaProduct[];
}

export function RevenueChart({ orders, products }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const productMap = new Map(products.map(p => [p.id, p]));
    const last30Days = eachDayOfInterval({
      start: subDays(new Date(), 29),
      end: new Date(),
    });

    return last30Days.map(date => {
      const dayStart = startOfDay(date);
      const dayOrders = orders.filter(order => {
        const orderDate = startOfDay(new Date(order.order_date));
        return orderDate.getTime() === dayStart.getTime();
      });

      const revenue = dayOrders.reduce((sum, order) => sum + Number(order.total_revenue), 0);
      const cogs = dayOrders.reduce((sum, order) => {
        const product = productMap.get(order.product_id);
        return sum + (product ? Number(order.quantity_kg) * Number(product.cost_per_kg) : 0);
      }, 0);

      return {
        date: format(date, "MMM d"),
        revenue,
        cogs,
        profit: revenue - cogs,
      };
    });
  }, [orders, products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profitability</CardTitle>
        <CardDescription>Last 30 days performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={(value) => `$${value}`}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: "hsl(var(--card))", 
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(var(--primary))"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                name="Revenue"
              />
              <Area
                type="monotone"
                dataKey="profit"
                stroke="hsl(var(--chart-2))"
                fillOpacity={1}
                fill="url(#colorProfit)"
                name="Profit"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
