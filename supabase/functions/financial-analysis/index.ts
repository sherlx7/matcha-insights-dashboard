import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderData {
  order_date: string;
  total_revenue: number;
  quantity_kg: number;
  product_cost_per_kg: number;
}

interface ClientData {
  name: string;
  totalRevenue: number;
  totalCOGS: number;
  profit: number;
  profitMargin: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { orders, clients, products } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Calculate monthly aggregates from order data
    const monthlyData: Record<string, { revenue: number; cogs: number; orders: number }> = {};
    
    const productMap = new Map(products.map((p: any) => [p.id, p]));
    
    for (const order of orders) {
      const date = new Date(order.order_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { revenue: 0, cogs: 0, orders: 0 };
      }
      
      const product = productMap.get(order.product_id) as { cost_per_kg: number } | undefined;
      const cogs = product ? Number(order.quantity_kg) * Number(product.cost_per_kg) : 0;
      
      monthlyData[monthKey].revenue += Number(order.total_revenue);
      monthlyData[monthKey].cogs += cogs;
      monthlyData[monthKey].orders += 1;
    }

    // Prepare data summary for AI
    const sortedMonths = Object.keys(monthlyData).sort();
    const historicalSummary = sortedMonths.map(month => ({
      month,
      revenue: monthlyData[month].revenue.toFixed(2),
      cogs: monthlyData[month].cogs.toFixed(2),
      profit: (monthlyData[month].revenue - monthlyData[month].cogs).toFixed(2),
      margin: ((monthlyData[month].revenue - monthlyData[month].cogs) / monthlyData[month].revenue * 100).toFixed(1),
      orderCount: monthlyData[month].orders,
    }));

    const clientSummary = clients.slice(0, 10).map((c: ClientData) => ({
      name: c.name,
      revenue: c.totalRevenue.toFixed(2),
      profit: c.profit.toFixed(2),
      margin: c.profitMargin.toFixed(1),
    }));

    const systemPrompt = `You are a financial analyst for Matsu Matcha, a premium matcha tea wholesale company. 
Analyze the provided financial data and provide:
1. A brief analysis of current profitability trends
2. Key insights about client performance
3. A quarterly forecast for the next 3 months with monthly breakdown
4. Specific recommendations to improve margins

Keep your response concise and actionable. Use bullet points for clarity.
Format numbers as currency where appropriate.`;

    const userPrompt = `Here is the financial data for analysis:

HISTORICAL MONTHLY PERFORMANCE:
${JSON.stringify(historicalSummary, null, 2)}

TOP CLIENTS BY PROFITABILITY:
${JSON.stringify(clientSummary, null, 2)}

PRODUCT COUNT: ${products.length} SKUs

Please provide:
1. Current State Analysis (2-3 sentences)
2. Key Insights (3-4 bullet points)
3. Next Quarter Forecast (monthly predictions for revenue, COGS, and profit)
4. Recommendations (3-4 actionable items)`;

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
          { role: "user", content: userPrompt },
        ],
        stream: false,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const analysis = aiResponse.choices?.[0]?.message?.content || "Unable to generate analysis.";

    // Generate forecast data for chart
    const lastMonth = sortedMonths[sortedMonths.length - 1] || new Date().toISOString().slice(0, 7);
    const [year, month] = lastMonth.split('-').map(Number);
    
    // Calculate average growth rate
    let avgRevenue = 0;
    let avgCogs = 0;
    if (sortedMonths.length > 0) {
      avgRevenue = sortedMonths.reduce((sum, m) => sum + monthlyData[m].revenue, 0) / sortedMonths.length;
      avgCogs = sortedMonths.reduce((sum, m) => sum + monthlyData[m].cogs, 0) / sortedMonths.length;
    }
    
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const forecastDate = new Date(year, month - 1 + i, 1);
      const forecastMonth = `${forecastDate.getFullYear()}-${String(forecastDate.getMonth() + 1).padStart(2, '0')}`;
      
      // Simple projection with slight growth
      const growthFactor = 1 + (0.05 * i); // 5% growth per month
      const projectedRevenue = avgRevenue * growthFactor;
      const projectedCogs = avgCogs * growthFactor * 0.98; // Slight efficiency gain
      
      forecast.push({
        month: forecastMonth,
        revenue: projectedRevenue,
        cogs: projectedCogs,
        profit: projectedRevenue - projectedCogs,
        isProjection: true,
      });
    }

    return new Response(JSON.stringify({
      analysis,
      historicalData: historicalSummary,
      forecast,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Financial analysis error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
