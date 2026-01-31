import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ClientOrder, MatchaProduct } from "@/types/database";
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, isWithinInterval, subWeeks } from "date-fns";
import { DateRange } from "react-day-picker";

interface RevenueChartProps {
  orders: ClientOrder[];
  products: MatchaProduct[];
  dateRange?: DateRange;
}

export function RevenueChart({ orders, products, dateRange }: RevenueChartProps) {
  const chartData = useMemo(() => {
    const productMap = new Map(products.map(p => [p.id, p]));
    
    // Default to last 12 weeks if no date range
    const endDate = dateRange?.to || new Date();
    const startDate = dateRange?.from || subWeeks(endDate, 11);
    
    // Get all weeks in the interval
    const weeks = eachWeekOfInterval({
      start: startDate,
      end: endDate,
    }, { weekStartsOn: 1 }); // Monday start

    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      
      const weekOrders = orders.filter(order => {
        const orderDate = new Date(order.order_date);
        return isWithinInterval(orderDate, { start: weekStart, end: weekEnd });
      });

      const revenue = weekOrders.reduce((sum, order) => sum + Number(order.total_revenue), 0);
      const cogs = weekOrders.reduce((sum, order) => {
        const product = productMap.get(order.product_id);
        return sum + (product ? Number(order.quantity_kg) * Number(product.cost_per_kg) : 0);
      }, 0);

      return {
        date: format(weekStart, "MMM d"),
        weekLabel: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        revenue,
        cogs,
        profit: revenue - cogs,
      };
    });
  }, [orders, products, dateRange]);

  const dateRangeText = dateRange?.from && dateRange?.to
    ? `${format(dateRange.from, "MMM d, yyyy")} - ${format(dateRange.to, "MMM d, yyyy")}`
    : "Last 12 weeks";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Profitability</CardTitle>
        <CardDescription>Weekly performance • {dateRangeText}</CardDescription>
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
                labelFormatter={(_, payload) => payload[0]?.payload?.weekLabel || ''}
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
