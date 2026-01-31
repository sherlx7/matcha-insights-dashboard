import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight, Loader2, RefreshCw } from "lucide-react";
import { ClientProfitability, MatchaProduct, ProductRecommendation } from "@/types/database";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface RecommendationsPanelProps {
  clients: ClientProfitability[];
  products: MatchaProduct[];
}

export function RecommendationsPanel({ clients, products }: RecommendationsPanelProps) {
  const [recommendations, setRecommendations] = useState<ProductRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateRecommendations = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/matcha-recommendations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ clients, products }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate recommendations");
      }

      const data = await response.json();
      setRecommendations(data.recommendations || []);
      setHasGenerated(true);
      toast.success("Recommendations generated!");
    } catch (error) {
      console.error("Error generating recommendations:", error);
      toast.error("Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>AI Recommendations</CardTitle>
          </div>
          <Button 
            onClick={generateRecommendations} 
            disabled={isLoading || clients.length === 0}
            variant={hasGenerated ? "outline" : "default"}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : hasGenerated ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
        <CardDescription>
          AI-powered suggestions for optimizing client profitability with quality-matched matcha swaps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasGenerated ? (
          <div className="py-12 text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Click "Generate" to analyze your client data and get AI-powered recommendations.</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>All clients are optimally matched with their current matcha products!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recommendations.map((rec, index) => (
              <RecommendationCard key={index} recommendation={rec} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RecommendationCard({ recommendation }: { recommendation: ProductRecommendation }) {
  return (
    <div className="p-4 rounded-lg border bg-accent/30 border-accent-foreground/10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {recommendation.client.name}
            </Badge>
            <Badge variant="outline" className="bg-accent text-accent-foreground">
              +${recommendation.potentialSavings.toFixed(2)} profit
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm mb-2">
            <span className="font-medium">{recommendation.currentProduct.name}</span>
            <ArrowRight className="h-4 w-4 text-primary" />
            <span className="font-medium text-primary">{recommendation.recommendedProduct.name}</span>
          </div>
          
          <p className="text-sm text-muted-foreground">{recommendation.reason}</p>
        </div>
        
        <div className="text-right text-xs text-muted-foreground">
          <div>Quality: {recommendation.currentProduct.quality_score} → {recommendation.recommendedProduct.quality_score}</div>
          <div>Grade: {recommendation.currentProduct.grade} → {recommendation.recommendedProduct.grade}</div>
        </div>
      </div>
    </div>
  );
}
