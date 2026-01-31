import { Leaf, BarChart3, Boxes, FlaskConical } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingCount?: number;
}

export function Header({
  activeTab,
  onTabChange,
  pendingCount = 0,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-sm">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold tracking-tight">Matsu Matcha</h1>
              <p className="text-xs text-muted-foreground">B2B Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="h-10 bg-muted/50 p-1">
              <TabsTrigger 
                value="financials" 
                className={cn(
                  "flex items-center gap-2 px-4 transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Financials</span>
              </TabsTrigger>
              <TabsTrigger 
                value="operations" 
                className={cn(
                  "flex items-center gap-2 px-4 transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <Boxes className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Operations</span>
                {pendingCount > 0 && (
                  <span className="ml-1 flex items-center justify-center min-w-5 h-5 rounded-full bg-amber-500 text-amber-50 px-1.5 text-xs font-semibold">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="sandbox" 
                className={cn(
                  "flex items-center gap-2 px-4 transition-all",
                  "data-[state=active]:bg-background data-[state=active]:shadow-sm"
                )}
              >
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline font-medium">Sandbox</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}
