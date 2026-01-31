import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ClientProfitability, MatchaProduct, ClientOrder } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Brain, TrendingUp, RefreshCw, Sparkles, Download, FileText, FileSpreadsheet } from "lucide-react";
import { format, parseISO } from "date-fns";
import { exportToCSV, exportToPDF } from "@/lib/exportUtils";

interface FinancialAnalysisProps {
  clients: ClientProfitability[];
  products: MatchaProduct[];
  orders: ClientOrder[];
}

interface ForecastData {
  month: string;
  revenue: number;
  cogs: number;
  profit: number;
  isProjection?: boolean;
}

interface AnalysisResult {
  analysis: string;
  historicalData: ForecastData[];
  forecast: ForecastData[];
}

export function FinancialAnalysis({ clients, products, orders }: FinancialAnalysisProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const runAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('financial-analysis', {
        body: {
          orders,
          clients: clients.map(c => ({
            name: c.client.name,
            totalRevenue: c.totalRevenue,
            totalCOGS: c.totalCOGS,
            profit: c.profit,
            profitMargin: c.profitMargin,
          })),
          products,
        },
      });

      if (error) throw error;
      
      setResult(data);
      toast({
        title: "Analysis Complete",
        description: "Financial insights and forecast generated successfully.",
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Unable to generate analysis",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Combine historical and forecast data for the chart
  const chartData = result ? [
    ...result.historicalData.map(d => ({
      ...d,
      revenue: parseFloat(d.revenue as unknown as string),
      cogs: parseFloat(d.cogs as unknown as string),
      profit: parseFloat(d.profit as unknown as string),
      isProjection: false,
    })),
    ...result.forecast,
  ] : [];

  const lastHistoricalMonth = result?.historicalData[result.historicalData.length - 1]?.month;

  return (
    <div className="space-y-6">
      {/* AI Analysis Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Brain className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>AI Profitability Analysis</CardTitle>
                <CardDescription>
                  Quarterly forecast with monthly breakdown powered by AI
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Export Reports</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => exportToCSV({ clients, orders, products }, 'profitability')}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Client Profitability (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => exportToCSV({ clients, orders, products }, 'orders')}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Sales Orders (CSV)
                  </DropdownMenuItem>
                  {result?.forecast && (
                    <DropdownMenuItem 
                      onClick={() => exportToCSV({ clients, orders, products, forecast: result.forecast }, 'forecast')}
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Forecast (CSV)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => exportToPDF({ clients, orders, products }, 'profitability')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Client Profitability (PDF)
                  </DropdownMenuItem>
                  {result?.forecast && (
                    <DropdownMenuItem 
                      onClick={() => exportToPDF({ 
                        clients, 
                        orders, 
                        products, 
                        forecast: result.forecast,
                        analysis: result.analysis 
                      }, 'forecast')}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Forecast & Analysis (PDF)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem 
                    onClick={() => exportToPDF({ 
                      clients, 
                      orders, 
                      products, 
                      forecast: result?.forecast,
                      analysis: result?.analysis 
                    }, 'full')}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Full Report (PDF)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={runAnalysis} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap text-sm text-muted-foreground leading-relaxed">
                {result.analysis}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Brain className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>Click "Generate Analysis" to get AI-powered insights and quarterly forecasts</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Chart */}
      {result && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Revenue & Profit Forecast
                </CardTitle>
                <CardDescription>
                  Historical performance with quarterly projections (monthly breakdown)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  Historical
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/50 border border-dashed border-primary" />
                  Projected
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenueFinancial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProfitFinancial" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => {
                      try {
                        return format(parseISO(`${value}-01`), "MMM yy");
                      } catch {
                        return value;
                      }
                    }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))", 
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    labelFormatter={(value) => {
                      try {
                        const date = parseISO(`${value}-01`);
                        return format(date, "MMMM yyyy");
                      } catch {
                        return value;
                      }
                    }}
                    formatter={(value: number, name: string, props: any) => {
                      const label = props.payload?.isProjection ? ` (Projected)` : '';
                      return [`$${value.toFixed(2)}${label}`, name];
                    }}
                  />
                  {lastHistoricalMonth && (
                    <ReferenceLine 
                      x={lastHistoricalMonth} 
                      stroke="hsl(var(--muted-foreground))" 
                      strokeDasharray="5 5"
                      label={{ 
                        value: "Forecast →", 
                        position: "top",
                        fill: "hsl(var(--muted-foreground))",
                        fontSize: 11,
                      }}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenueFinancial)"
                    name="Revenue"
                  />
                  <Area
                    type="monotone"
                    dataKey="profit"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorProfitFinancial)"
                    name="Profit"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Forecast Table */}
      {result && result.forecast.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quarterly Forecast Summary</CardTitle>
            <CardDescription>
              Projected monthly performance for the next quarter
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {result.forecast.map((month) => (
                <div key={month.month} className="p-4 rounded-lg border bg-muted/30">
                  <div className="text-sm text-muted-foreground mb-2">
                    {(() => {
                      try {
                        return format(parseISO(`${month.month}-01`), "MMMM yyyy");
                      } catch {
                        return month.month;
                      }
                    })()}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Revenue</span>
                      <span className="font-mono font-medium">
                        ${month.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">COGS</span>
                      <span className="font-mono text-muted-foreground">
                        ${month.cogs.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-sm font-medium">Profit</span>
                      <span className="font-mono font-medium text-primary">
                        ${month.profit.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
