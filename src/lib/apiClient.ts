/**
 * API Client for Matsu Matcha Backend
 * 
 * This client provides typed access to the backend REST API.
 * It handles authentication, error handling, and request formatting.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Types
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'VIEWER';
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface Supplier {
  id: string;
  name: string;
  country: string;
  currency: string;
  typicalLeadTimeDays: number;
  reliabilityScore: number;
  minOrderKg: number;
  notes: string | null;
}

export interface MatchaSKU {
  id: string;
  name: string;
  qualityTier: 'COMPETITION' | 'CEREMONIAL' | 'CAFE';
  tastingNotes: string | null;
  intendedUse: 'LATTE' | 'STRAIGHT' | 'BOTH';
  substitutableGroupId: string | null;
  active: boolean;
}

export interface SupplierOffer {
  id: string;
  supplierId: string;
  skuId: string;
  costJpyPerKg: number;
  moqKg: number | null;
  packSizeKg: number | null;
  supplier?: { id: string; name: string };
  sku?: { id: string; name: string };
}

export interface Client {
  id: string;
  name: string;
  segment: 'CAFE' | 'BRAND' | 'OTHER';
  defaultDiscountPct: number;
  paymentTerms: string | null;
  notes: string | null;
}

export interface ClientContractLine {
  id: string;
  clientId: string;
  skuId: string;
  sellingSgdPerKg: number;
  discountPct: number;
  monthlyVolumeKg: number;
  deliveryFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  nextDeliveryDate: string | null;
  client?: { id: string; name: string };
  sku?: { id: string; name: string };
}

export interface InventoryLot {
  id: string;
  supplierId: string;
  skuId: string;
  arrivedAt: string;
  qtyKgTotal: number;
  qtyKgRemaining: number;
  costBasisSgdPerKg: number;
  warehouseLocation: string | null;
  expiryDate: string | null;
  supplier?: { id: string; name: string };
  sku?: { id: string; name: string };
}

export interface Allocation {
  id: string;
  inventoryLotId: string;
  clientId: string;
  skuId: string;
  qtyKgAllocated: number;
  status: 'RESERVED' | 'FULFILLED' | 'RELEASED';
  client?: { id: string; name: string };
  sku?: { id: string; name: string };
}

export interface FXRate {
  id: string;
  base: string;
  quote: string;
  rate: number;
  source: 'MANUAL' | 'API';
  timestamp: string;
}

export interface Recommendation {
  id: string;
  type: 'SUPPLIER_SWAP' | 'SKU_SWAP' | 'REORDER' | 'ALLOCATION_OPTIMIZATION';
  title: string;
  explanation: string;
  impactScore: number;
  riskScore: number;
  finalScore: number;
  confidenceScore: number;
  numericImpact: {
    deltaLandedCostPerKg?: number;
    deltaMonthlyProfit?: number;
    stockoutRiskReduction?: number;
  };
  assumptions: string[];
  applyAction: {
    entityType: string;
    entityId: string;
    changes: Record<string, unknown>;
  } | null;
  metadata: Record<string, unknown>;
}

export interface ProfitabilityMetrics {
  groupBy: string;
  fxRate: number;
  data: Array<{
    id: string;
    name: string;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    avgMargin: number;
    totalVolumeKg: number;
    lineCount: number;
  }>;
  totals: {
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    totalVolumeKg: number;
    avgMargin: number;
  };
}

export interface InventoryMetrics {
  data: Array<{
    skuId: string;
    skuName: string;
    qualityTier: string;
    totalStockKg: number;
    allocatedKg: number;
    unallocatedKg: number;
    monthlyDemandKg: number;
    stockCoverageDays: number | null;
    lotCount: number;
    clientCount: number;
    status: 'critical' | 'low' | 'healthy' | 'no_demand';
  }>;
  totals: {
    totalStockKg: number;
    allocatedKg: number;
    unallocatedKg: number;
    monthlyDemandKg: number;
  };
  alerts: {
    criticalCount: number;
    lowCount: number;
    healthyCount: number;
  };
}

// API Client class
class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('matcha_auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  // Auth
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('matcha_auth_token', token);
    } else {
      localStorage.removeItem('matcha_auth_token');
    }
  }

  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(email: string, password: string, name?: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    this.setToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<{ user: AuthUser }> {
    return this.request('/api/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Suppliers
  async getSuppliers(): Promise<Supplier[]> {
    return this.request('/api/suppliers');
  }

  async getSupplier(id: string): Promise<Supplier> {
    return this.request(`/api/suppliers/${id}`);
  }

  async createSupplier(data: Partial<Supplier>): Promise<Supplier> {
    return this.request('/api/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplier(id: string, data: Partial<Supplier>): Promise<Supplier> {
    return this.request(`/api/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSupplier(id: string): Promise<void> {
    return this.request(`/api/suppliers/${id}`, { method: 'DELETE' });
  }

  // SKUs
  async getSKUs(active?: boolean): Promise<MatchaSKU[]> {
    const query = active !== undefined ? `?active=${active}` : '';
    return this.request(`/api/skus${query}`);
  }

  async getSKU(id: string): Promise<MatchaSKU> {
    return this.request(`/api/skus/${id}`);
  }

  async createSKU(data: Partial<MatchaSKU>): Promise<MatchaSKU> {
    return this.request('/api/skus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSKU(id: string, data: Partial<MatchaSKU>): Promise<MatchaSKU> {
    return this.request(`/api/skus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Supplier Offers
  async getSupplierOffers(params?: { supplierId?: string; skuId?: string }): Promise<SupplierOffer[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/supplier-offers${query ? `?${query}` : ''}`);
  }

  async createSupplierOffer(data: Partial<SupplierOffer>): Promise<SupplierOffer> {
    return this.request('/api/supplier-offers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSupplierOffer(id: string, data: Partial<SupplierOffer>): Promise<SupplierOffer> {
    return this.request(`/api/supplier-offers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return this.request('/api/clients');
  }

  async getClient(id: string): Promise<Client> {
    return this.request(`/api/clients/${id}`);
  }

  async createClient(data: Partial<Client>): Promise<Client> {
    return this.request('/api/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClient(id: string, data: Partial<Client>): Promise<Client> {
    return this.request(`/api/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Contract Lines
  async getContractLines(params?: { clientId?: string; skuId?: string }): Promise<ClientContractLine[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/client-contract-lines${query ? `?${query}` : ''}`);
  }

  async createContractLine(data: Partial<ClientContractLine>): Promise<ClientContractLine> {
    return this.request('/api/client-contract-lines', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateContractLine(id: string, data: Partial<ClientContractLine>): Promise<ClientContractLine> {
    return this.request(`/api/client-contract-lines/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Inventory Lots
  async getInventoryLots(params?: { skuId?: string; supplierId?: string; hasStock?: boolean }): Promise<InventoryLot[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/inventory-lots${query ? `?${query}` : ''}`);
  }

  async createInventoryLot(data: Partial<InventoryLot>): Promise<InventoryLot> {
    return this.request('/api/inventory-lots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventoryLot(id: string, data: Partial<InventoryLot>): Promise<InventoryLot> {
    return this.request(`/api/inventory-lots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Allocations
  async getAllocations(params?: { clientId?: string; skuId?: string }): Promise<Allocation[]> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/allocations${query ? `?${query}` : ''}`);
  }

  async createAllocation(data: Partial<Allocation>): Promise<Allocation> {
    return this.request('/api/allocations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAllocation(id: string, data: Partial<Allocation>): Promise<Allocation> {
    return this.request(`/api/allocations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // FX Rates
  async getFXRates(limit?: number): Promise<FXRate[]> {
    return this.request(`/api/fx-rates${limit ? `?limit=${limit}` : ''}`);
  }

  async getLatestFXRate(): Promise<FXRate> {
    return this.request('/api/fx-rates/latest');
  }

  async createFXRate(data: { rate: number; source?: 'MANUAL' | 'API' }): Promise<FXRate> {
    return this.request('/api/fx-rates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFXRateHistory(days?: number): Promise<{
    rates: FXRate[];
    statistics: {
      average: number;
      min: number;
      max: number;
      volatility: number;
      volatilityPct: number;
    };
  }> {
    return this.request(`/api/fx-rates/history${days ? `?days=${days}` : ''}`);
  }

  // Metrics
  async getProfitabilityMetrics(groupBy?: 'client' | 'sku' | 'supplier'): Promise<ProfitabilityMetrics> {
    return this.request(`/api/metrics/profitability${groupBy ? `?group_by=${groupBy}` : ''}`);
  }

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    return this.request('/api/metrics/inventory');
  }

  // Recommendations
  async getRecommendations(params?: { limit?: number; type?: string }): Promise<{
    recommendations: Recommendation[];
    count: number;
    generatedAt: string;
  }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/recommendations${query ? `?${query}` : ''}`);
  }

  async simulateChange(contractLineId: string, simulation: {
    type: 'supplier_offer' | 'fx_rate' | 'selling_price' | 'volume';
    changes: Record<string, unknown>;
  }): Promise<{
    contractLineId: string;
    simulation: typeof simulation;
    result: {
      before: Record<string, number | null>;
      after: Record<string, number | null>;
      delta: Record<string, number>;
    };
  }> {
    return this.request('/api/recommendations/simulate', {
      method: 'POST',
      body: JSON.stringify({ contractLineId, simulation }),
    });
  }

  // Audit
  async getAuditLogs(params?: { entity_type?: string; entity_id?: string; limit?: number }): Promise<{
    logs: Array<{
      id: string;
      entityType: string;
      entityId: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      beforeJson: string | null;
      afterJson: string | null;
      timestamp: string;
      actor?: { id: string; email: string; name: string | null };
    }>;
    count: number;
  }> {
    const query = new URLSearchParams(params as Record<string, string>).toString();
    return this.request(`/api/audit${query ? `?${query}` : ''}`);
  }

  async revertChange(auditLogId: string): Promise<{ success: boolean; message: string; data?: unknown }> {
    return this.request('/api/audit/revert', {
      method: 'POST',
      body: JSON.stringify({ auditLogId }),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default apiClient;
