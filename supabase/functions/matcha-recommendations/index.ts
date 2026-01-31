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
    // Get OpenAI API key from environment
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const { clients, products } = await req.json() as { 
      clients: ClientProfitability[]; 
      products: MatchaProduct[] 
    };

    // Build context for the AI
    const productList = products.map(p => 
      `- ${p.name} (${p.grade}): SGD ${p.cost_per_kg}/kg, Quality: ${p.quality_score}/100, Stock: ${p.stock_kg}kg, Status: ${p.status}`
    ).join("\n");

    const clientAnalysis = clients.map(c => {
      const orderDetails = c.orders.map(o => 
        `  - ${o.product.name}: ${o.quantity_kg}kg @ SGD ${o.unit_price}/kg`
      ).join("\n");
      return `Client: ${c.client.name}
  Revenue: SGD ${c.totalRevenue.toFixed(2)}, COGS: SGD ${c.totalCOGS.toFixed(2)}, Profit: SGD ${c.profit.toFixed(2)}, Margin: ${c.profitMargin.toFixed(1)}%
  Orders:
${orderDetails}`;
    }).join("\n\n");

    const systemPrompt = `You are a B2B matcha tea business analyst for Matsu Matcha, a premium matcha supplier based in Singapore sourcing from Uji, Kyoto. Your role is to analyze client purchasing patterns and recommend matcha product swaps that improve profitability while maintaining or improving quality.

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

    const userPrompt = `Analyze the client data and provide up to 3 specific product swap recommendations that would improve profitability while maintaining quality.

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "clientName": "Client Name",
      "currentProductName": "Current Product Name",
      "recommendedProductName": "Recommended Product Name",
      "potentialSavings": 123.45,
      "reason": "Explanation for the recommendation"
    }
  ]
}

Only include recommendations where there's a clear benefit. If no beneficial swaps exist, return an empty recommendations array.`;

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Please check configuration." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("Failed to get AI recommendations");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      return new Response(JSON.stringify({ recommendations: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(content);
    
    // Map the AI recommendations to our format with full product/client objects
    const recommendations = (parsed.recommendations || []).map((rec: any) => {
      const client = clients.find(c => 
        c.client.name.toLowerCase().includes(rec.clientName?.toLowerCase() || '') ||
        (rec.clientName?.toLowerCase() || '').includes(c.client.name.toLowerCase())
      );
      const currentProduct = products.find(p => 
        p.name.toLowerCase().includes(rec.currentProductName?.toLowerCase() || '') ||
        (rec.currentProductName?.toLowerCase() || '').includes(p.name.toLowerCase())
      );
      const recommendedProduct = products.find(p => 
        p.name.toLowerCase().includes(rec.recommendedProductName?.toLowerCase() || '') ||
        (rec.recommendedProductName?.toLowerCase() || '').includes(p.name.toLowerCase())
      );

      if (!client || !currentProduct || !recommendedProduct) {
        return null;
      }

      return {
        client: client.client,
        currentProduct,
        recommendedProduct,
        potentialSavings: rec.potentialSavings || 0,
        reason: rec.reason || 'AI-recommended swap for improved profitability',
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ 
      recommendations,
      generatedBy: 'OpenAI GPT-4o-mini',
      generatedAt: new Date().toISOString(),
    }), {
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
