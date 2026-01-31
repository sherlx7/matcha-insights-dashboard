import { Leaf, BarChart3, Boxes, FlaskConical } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="container py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary">
              <Leaf className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold tracking-tight">Matsu Matcha</h1>
              <p className="text-sm text-muted-foreground">B2B Dashboard</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs value={activeTab} onValueChange={onTabChange}>
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="financials" className="flex items-center gap-2 px-4">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Financials</span>
              </TabsTrigger>
              <TabsTrigger value="operations" className="flex items-center gap-2 px-4">
                <Boxes className="h-4 w-4" />
                <span className="hidden sm:inline">Operations</span>
                {pendingCount > 0 && (
                  <span className="rounded-full bg-amber-500 text-amber-50 px-1.5 py-0.5 text-xs font-medium">
                    {pendingCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="sandbox" className="flex items-center gap-2 px-4">
                <FlaskConical className="h-4 w-4" />
                <span className="hidden sm:inline">Sandbox</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </header>
  );
}
