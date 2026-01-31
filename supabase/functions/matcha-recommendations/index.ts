import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MatchaProduct {
  id: string;
  name: string;
  grade: string;
  origin: string;
  cost_per_kg: number;
  quality_score: number;
  stock_kg: number;
  status: string;
}

interface Client {
  id: string;
  name: string;
  contact_email: string | null;
  address: string | null;
}

interface ClientOrder {
  id: string;
  client_id: string;
  product_id: string;
  quantity_kg: number;
  unit_price: number;
  total_revenue: number;
  product: MatchaProduct;
}

interface ClientProfitability {
  client: Client;
  totalRevenue: number;
  totalCOGS: number;
  profit: number;
  profitMargin: number;
  orders: ClientOrder[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { clients, products } = await req.json() as { 
      clients: ClientProfitability[]; 
      products: MatchaProduct[] 
    };

    // Build context for the AI
    const productList = products.map(p => 
      `- ${p.name} (${p.grade}): $${p.cost_per_kg}/kg, Quality: ${p.quality_score}/100, Stock: ${p.stock_kg}kg, Status: ${p.status}`
    ).join("\n");

    const clientAnalysis = clients.map(c => {
      const orderDetails = c.orders.map(o => 
        `  - ${o.product.name}: ${o.quantity_kg}kg @ $${o.unit_price}/kg`
      ).join("\n");
      return `Client: ${c.client.name}
  Revenue: $${c.totalRevenue.toFixed(2)}, COGS: $${c.totalCOGS.toFixed(2)}, Profit: $${c.profit.toFixed(2)}, Margin: ${c.profitMargin.toFixed(1)}%
  Orders:
${orderDetails}`;
    }).join("\n\n");

    const systemPrompt = `You are a B2B matcha tea business analyst for Matsu Matcha. Your role is to analyze client purchasing patterns and recommend matcha product swaps that improve profitability while maintaining or improving quality.

Rules:
1. Only recommend swaps where the recommended product has EQUAL or BETTER quality score
2. Only recommend products that are in_stock or have sufficient stock
3. Calculate potential savings based on cost difference and typical order quantity
4. Keep the same or better grade category when possible
5. Provide clear, actionable reasons for each recommendation

Available Products:
${productList}

Client Purchase Analysis:
${clientAnalysis}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { 
            role: "user", 
            content: "Analyze the client data and provide up to 3 specific product swap recommendations that would improve profitability while maintaining quality. For each recommendation, specify the client, current product, recommended product, estimated savings per order, and a brief reason."
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_recommendations",
              description: "Provide matcha product swap recommendations for clients",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        clientId: { type: "string", description: "ID of the client" },
                        clientName: { type: "string", description: "Name of the client" },
                        currentProductId: { type: "string", description: "ID of current product" },
                        currentProductName: { type: "string", description: "Name of current product" },
                        recommendedProductId: { type: "string", description: "ID of recommended product" },
                        recommendedProductName: { type: "string", description: "Name of recommended product" },
                        potentialSavings: { type: "number", description: "Estimated savings per order in dollars" },
                        reason: { type: "string", description: "Brief explanation for the recommendation" }
                      },
                      required: ["clientName", "currentProductName", "recommendedProductName", "potentialSavings", "reason"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_recommendations" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI recommendations");
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    
    // Map the AI recommendations to our format with full product/client objects
    const recommendations = (parsed.recommendations || []).map((rec: any) => {
      const client = clients.find(c => 
        c.client.name.toLowerCase().includes(rec.clientName.toLowerCase()) ||
        rec.clientName.toLowerCase().includes(c.client.name.toLowerCase())
      );
      const currentProduct = products.find(p => 
        p.name.toLowerCase().includes(rec.currentProductName.toLowerCase()) ||
        rec.currentProductName.toLowerCase().includes(p.name.toLowerCase())
      );
      const recommendedProduct = products.find(p => 
        p.name.toLowerCase().includes(rec.recommendedProductName.toLowerCase()) ||
        rec.recommendedProductName.toLowerCase().includes(p.name.toLowerCase())
      );

      if (!client || !currentProduct || !recommendedProduct) {
        return null;
      }

      return {
        client: client.client,
        currentProduct,
        recommendedProduct,
        potentialSavings: rec.potentialSavings,
        reason: rec.reason,
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ recommendations }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in matcha-recommendations:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
