import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, className }: KPICardProps) {
  return (
    <Card className={cn(
      "relative overflow-hidden transition-all hover:shadow-md",
      className
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {title}
            </p>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
            {(subtitle || trend) && (
              <div className="flex items-center gap-2">
                {trend && (
                  <span className={cn(
                    "inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full",
                    trend.isPositive 
                      ? "bg-primary/10 text-primary" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
