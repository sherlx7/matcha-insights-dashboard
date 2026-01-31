import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialAnalysis } from "./FinancialAnalysis";
import { RecommendationsPanel } from "./RecommendationsPanel";
import { ClientProfitability, MatchaProduct, ClientOrder } from "@/types/database";
import { Brain, Sparkles, TrendingUp } from "lucide-react";

interface AIInsightsTabProps {
  clients: ClientProfitability[];
  products: MatchaProduct[];
  orders: ClientOrder[];
}

export function AIInsightsTab({ clients, products, orders }: AIInsightsTabProps) {
  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center gap-3 pb-2">
        <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">AI Insights</h2>
          <p className="text-sm text-muted-foreground">
            Powered forecasts, analysis, and product recommendations
          </p>
        </div>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast & Analysis
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Product Swaps
          </TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="mt-4">
          <FinancialAnalysis
            clients={clients}
            products={products}
            orders={orders}
          />
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <RecommendationsPanel
            clients={clients}
            products={products}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
