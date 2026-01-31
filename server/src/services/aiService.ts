/**
 * AI Service - OpenAI Integration
 * 
 * Provides AI-powered analysis and recommendations using OpenAI API
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Types for AI recommendations
export interface AIRecommendationInput {
  products: Array<{
    id: string;
    name: string;
    grade: string;
    qualityTier: string;
    costPerKg: number;
    qualityScore: number;
    stockKg: number;
    status: string;
  }>;
  clients: Array<{
    id: string;
    name: string;
    segment: string;
    totalRevenue: number;
    totalCOGS: number;
    profit: number;
    profitMargin: number;
    orders: Array<{
      productId: string;
      productName: string;
      quantityKg: number;
      unitPrice: number;
    }>;
  }>;
  inventory: Array<{
    id: string;
    skuName: string;
    supplierName: string;
    qtyKgRemaining: number;
    landedCostSgdPerKg: number;
    expiryDate?: string;
    daysToExpiry?: number;
  }>;
  fxRate: number;
}

export interface AIRecommendation {
  type: 'SUPPLIER_SWAP' | 'SKU_SWAP' | 'REORDER' | 'ALLOCATION_OPTIMIZATION' | 'PRICING' | 'CLIENT_STRATEGY';
  title: string;
  explanation: string;
  impactScore: number;
  riskScore: number;
  confidenceScore: number;
  potentialSavings?: number;
  potentialRevenue?: number;
  clientName?: string;
  currentProduct?: string;
  recommendedProduct?: string;
  actionItems: string[];
  metadata: Record<string, unknown>;
}

export interface AIAnalysisResult {
  recommendations: AIRecommendation[];
  marketInsights: string;
  riskAssessment: string;
  summary: string;
}

/**
 * Generate AI-powered recommendations using OpenAI
 */
export async function generateAIRecommendations(
  input: AIRecommendationInput
): Promise<AIAnalysisResult> {
  // Build context for the AI
  const productList = input.products.map(p => 
    `- ${p.name} (${p.grade}, ${p.qualityTier}): SGD ${p.costPerKg.toFixed(2)}/kg, Quality: ${p.qualityScore}/100, Stock: ${p.stockKg}kg, Status: ${p.status}`
  ).join('\n');

  const clientAnalysis = input.clients.map(c => {
    const orderDetails = c.orders.map(o => 
      `    - ${o.productName}: ${o.quantityKg}kg @ SGD ${o.unitPrice}/kg`
    ).join('\n');
    return `  ${c.name} (${c.segment}):
    Revenue: SGD ${c.totalRevenue.toFixed(2)}, COGS: SGD ${c.totalCOGS.toFixed(2)}
    Profit: SGD ${c.profit.toFixed(2)}, Margin: ${c.profitMargin.toFixed(1)}%
    Orders:
${orderDetails}`;
  }).join('\n\n');

  const inventoryStatus = input.inventory.map(i => {
    const expiryInfo = i.daysToExpiry !== undefined 
      ? `, Expires in ${i.daysToExpiry} days` 
      : '';
    return `- ${i.skuName} from ${i.supplierName}: ${i.qtyKgRemaining.toFixed(1)}kg @ SGD ${i.landedCostSgdPerKg.toFixed(2)}/kg${expiryInfo}`;
  }).join('\n');

  const systemPrompt = `You are an expert B2B matcha tea business analyst for Matsu Matcha, a premium matcha supplier based in Singapore sourcing from Uji, Kyoto. Your role is to analyze business data and provide actionable recommendations to improve profitability, optimize inventory, and strengthen client relationships.

Current FX Rate: 1 JPY = ${input.fxRate.toFixed(6)} SGD

AVAILABLE PRODUCTS:
${productList}

CLIENT ANALYSIS:
${clientAnalysis}

INVENTORY STATUS:
${inventoryStatus}

Your analysis should consider:
1. Cost optimization opportunities (supplier swaps, bulk ordering)
2. Margin improvement strategies (SKU swaps, pricing adjustments)
3. Inventory management (reorder alerts, expiry management)
4. Client relationship strategies (upselling, retention)
5. Risk factors (supply chain, currency, market)

Provide specific, data-driven recommendations with clear impact estimates.`;

  const userPrompt = `Analyze the business data and provide:
1. Up to 5 specific, actionable recommendations ranked by potential impact
2. Brief market insights relevant to the matcha B2B business
3. Key risk factors to monitor
4. An executive summary

For each recommendation, include:
- Type (SUPPLIER_SWAP, SKU_SWAP, REORDER, ALLOCATION_OPTIMIZATION, PRICING, or CLIENT_STRATEGY)
- Clear title and explanation
- Impact score (0-100)
- Risk score (0-100)
- Confidence score (0-1)
- Estimated financial impact if applicable
- Specific action items

Format your response as a JSON object matching this structure:
{
  "recommendations": [...],
  "marketInsights": "...",
  "riskAssessment": "...",
  "summary": "..."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const result = JSON.parse(content) as AIAnalysisResult;
    
    // Validate and sanitize the response
    return {
      recommendations: (result.recommendations || []).map((rec, index) => ({
        type: rec.type || 'CLIENT_STRATEGY',
        title: rec.title || `Recommendation ${index + 1}`,
        explanation: rec.explanation || '',
        impactScore: Math.min(100, Math.max(0, rec.impactScore || 50)),
        riskScore: Math.min(100, Math.max(0, rec.riskScore || 30)),
        confidenceScore: Math.min(1, Math.max(0, rec.confidenceScore || 0.7)),
        potentialSavings: rec.potentialSavings,
        potentialRevenue: rec.potentialRevenue,
        clientName: rec.clientName,
        currentProduct: rec.currentProduct,
        recommendedProduct: rec.recommendedProduct,
        actionItems: rec.actionItems || [],
        metadata: rec.metadata || {},
      })),
      marketInsights: result.marketInsights || 'No market insights available.',
      riskAssessment: result.riskAssessment || 'No risk assessment available.',
      summary: result.summary || 'Analysis complete.',
    };
  } catch (error) {
    console.error('AI recommendation error:', error);
    throw new Error(`Failed to generate AI recommendations: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate AI-powered product swap recommendations (for frontend compatibility)
 */
export async function generateProductSwapRecommendations(
  clients: Array<{
    client: { id: string; name: string };
    totalRevenue: number;
    totalCOGS: number;
    profit: number;
    profitMargin: number;
    orders: Array<{
      product: {
        id: string;
        name: string;
        grade: string;
        cost_per_kg: number;
        quality_score: number;
        stock_kg: number;
        status: string;
      };
      quantity_kg: number;
      unit_price: number;
    }>;
  }>,
  products: Array<{
    id: string;
    name: string;
    grade: string;
    origin: string;
    cost_per_kg: number;
    quality_score: number;
    stock_kg: number;
    status: string;
  }>
): Promise<{
  recommendations: Array<{
    client: { id: string; name: string };
    currentProduct: typeof products[0];
    recommendedProduct: typeof products[0];
    potentialSavings: number;
    reason: string;
  }>;
}> {
  const productList = products.map(p => 
    `- ${p.name} (${p.grade}): SGD ${p.cost_per_kg}/kg, Quality: ${p.quality_score}/100, Stock: ${p.stock_kg}kg, Status: ${p.status}`
  ).join('\n');

  const clientAnalysis = clients.map(c => {
    const orderDetails = c.orders.map(o => 
      `  - ${o.product.name}: ${o.quantity_kg}kg @ SGD ${o.unit_price}/kg`
    ).join('\n');
    return `Client: ${c.client.name}
  Revenue: SGD ${c.totalRevenue.toFixed(2)}, COGS: SGD ${c.totalCOGS.toFixed(2)}, Profit: SGD ${c.profit.toFixed(2)}, Margin: ${c.profitMargin.toFixed(1)}%
  Orders:
${orderDetails}`;
  }).join('\n\n');

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

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: `Analyze the client data and provide up to 3 specific product swap recommendations that would improve profitability while maintaining quality. 

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

Only include recommendations where there's a clear benefit. If no beneficial swaps exist, return an empty recommendations array.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.5,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { recommendations: [] };
    }

    const parsed = JSON.parse(content);
    
    // Map AI recommendations to frontend-compatible format
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

    return { recommendations };
  } catch (error) {
    console.error('AI product swap recommendation error:', error);
    return { recommendations: [] };
  }
}
