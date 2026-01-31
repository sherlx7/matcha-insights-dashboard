import { 
  Client, 
  ClientOrder, 
  MatchaProduct, 
  Supplier, 
  SupplierProduct,
  WarehouseArrival,
  ClientAllocation,
  SHIPPING_COST_PER_KG,
  IMPORT_TAX_RATE,
  ProductCostBreakdown,
  ClientPricingDetails,
  calculateProductCost
} from "@/types/database";
import { differenceInDays, parseISO, startOfMonth, subMonths, format } from "date-fns";

export { calculateProductCost, SHIPPING_COST_PER_KG, IMPORT_TAX_RATE };

export function getSupplierExchangeRate(
  product: MatchaProduct,
  suppliers: Supplier[],
  supplierProducts: SupplierProduct[]
): number {
  // Find primary supplier for this product
  const primarySp = supplierProducts.find(
    sp => sp.product_id === product.id && sp.is_primary_supplier
  );
  
  if (!primarySp) {
    // Default exchange rate if no supplier
    return 0.0067;
  }
  
  const supplier = suppliers.find(s => s.id === primarySp.supplier_id);
  return supplier?.exchange_rate_jpy_usd ?? 0.0067;
}

export function getProductCostBreakdown(
  product: MatchaProduct,
  suppliers: Supplier[],
  supplierProducts: SupplierProduct[]
): ProductCostBreakdown | null {
  if (!product.cost_per_kg_jpy) {
    return null;
  }
  
  const exchangeRate = getSupplierExchangeRate(product, suppliers, supplierProducts);
  return calculateProductCost(product.cost_per_kg_jpy, exchangeRate);
}

export function calculateMonthlyQuantity(
  clientId: string,
  productId: string,
  orders: ClientOrder[]
): number {
  // Get orders from last 3 months for this client-product combo
  const threeMonthsAgo = subMonths(new Date(), 3);
  
  const recentOrders = orders.filter(o => 
    o.client_id === clientId && 
    o.product_id === productId &&
    o.status !== 'cancelled' &&
    parseISO(o.order_date) >= threeMonthsAgo
  );
  
  if (recentOrders.length === 0) return 0;
  
  const totalKg = recentOrders.reduce((sum, o) => sum + Number(o.quantity_kg), 0);
  
  // Average per month
  return totalKg / 3;
}

export function getLastOrderDate(
  clientId: string,
  productId: string,
  orders: ClientOrder[]
): string | null {
  const clientOrders = orders
    .filter(o => o.client_id === clientId && o.product_id === productId)
    .sort((a, b) => parseISO(b.order_date).getTime() - parseISO(a.order_date).getTime());
  
  return clientOrders[0]?.order_date ?? null;
}

export function getLastArrivalDate(
  productId: string,
  arrivals: WarehouseArrival[]
): string | null {
  const productArrivals = arrivals
    .filter(a => a.product_id === productId && a.status === 'received')
    .sort((a, b) => parseISO(b.arrival_date).getTime() - parseISO(a.arrival_date).getTime());
  
  return productArrivals[0]?.arrival_date ?? null;
}

export function calculateDaysToNextOrder(
  product: MatchaProduct,
  monthlyConsumption: number
): number | null {
  if (monthlyConsumption <= 0) return null;
  
  const stock = Number(product.stock_kg);
  const reorderPoint = Number(product.reorder_point_kg);
  
  // Days of stock remaining until hitting reorder point
  const kgAboveReorder = stock - reorderPoint;
  if (kgAboveReorder <= 0) return 0;
  
  const dailyConsumption = monthlyConsumption / 30;
  if (dailyConsumption <= 0) return null;
  
  return Math.round(kgAboveReorder / dailyConsumption);
}

export function calculateKgNeeded(
  product: MatchaProduct,
  allocations: ClientAllocation[],
  monthlyConsumption: number
): number {
  // Total allocated for this product
  const totalAllocated = allocations
    .filter(a => a.product_id === product.id)
    .reduce((sum, a) => sum + Number(a.allocated_kg), 0);
  
  const currentStock = Number(product.stock_kg);
  const reorderQty = Number(product.reorder_quantity_kg);
  
  // Target: have enough for 2 months + maintain reorder quantity
  const targetStock = (monthlyConsumption * 2) + reorderQty;
  const shortfall = targetStock - currentStock;
  
  return Math.max(0, shortfall);
}

export function getNextDeliveryDate(
  clientId: string,
  productId: string,
  orders: ClientOrder[]
): string | null {
  // Find pending or shipped orders for this client-product
  const upcomingOrders = orders
    .filter(o => 
      o.client_id === clientId && 
      o.product_id === productId &&
      (o.status === 'pending' || o.status === 'shipped') &&
      o.scheduled_delivery_date
    )
    .sort((a, b) => {
      const dateA = a.scheduled_delivery_date ? parseISO(a.scheduled_delivery_date).getTime() : 0;
      const dateB = b.scheduled_delivery_date ? parseISO(b.scheduled_delivery_date).getTime() : 0;
      return dateA - dateB;
    });
  
  return upcomingOrders[0]?.scheduled_delivery_date ?? null;
}

export function buildClientPricingDetails(
  client: Client,
  product: MatchaProduct,
  suppliers: Supplier[],
  supplierProducts: SupplierProduct[],
  orders: ClientOrder[],
  arrivals: WarehouseArrival[],
  allocations: ClientAllocation[]
): ClientPricingDetails | null {
  const costBreakdown = getProductCostBreakdown(product, suppliers, supplierProducts);
  
  if (!costBreakdown) {
    return null;
  }
  
  const sellingPricePerKg = product.selling_price_per_kg ?? 0;
  const discountPercent = client.discount_percent ?? 0;
  const effectiveSellingPrice = sellingPricePerKg * (1 - discountPercent / 100);
  const profitPerKg = effectiveSellingPrice - costBreakdown.totalCostPerKg;
  
  const monthlyQuantityKg = calculateMonthlyQuantity(client.id, product.id, orders);
  const monthlyProfit = profitPerKg * monthlyQuantityKg;
  
  const lastOrderDate = getLastOrderDate(client.id, product.id, orders);
  const lastArrivalDate = getLastArrivalDate(product.id, arrivals);
  
  // Total monthly consumption across all clients for this product
  const totalMonthlyConsumption = orders
    .filter(o => o.product_id === product.id)
    .reduce((sum, o) => {
      return sum + calculateMonthlyQuantity(o.client_id, product.id, orders);
    }, 0) / (orders.filter(o => o.product_id === product.id).length || 1);
  
  const daysToNextOrder = calculateDaysToNextOrder(product, totalMonthlyConsumption);
  const kgNeededToFulfill = calculateKgNeeded(product, allocations, monthlyQuantityKg);
  const nextDeliveryDate = getNextDeliveryDate(client.id, product.id, orders);
  
  return {
    client,
    product,
    costBreakdown,
    sellingPricePerKg,
    discountPercent,
    effectiveSellingPrice,
    profitPerKg,
    monthlyQuantityKg,
    monthlyProfit,
    existingStock: Number(product.stock_kg),
    lastOrderDate,
    lastArrivalDate,
    daysToNextOrder,
    kgNeededToFulfill,
    nextDeliveryDate,
  };
}
