import { useState, useMemo } from "react";
import { MatchaProduct, Client, ClientOrder, ClientProfitability } from "@/types/database";

interface SearchableData {
  products: MatchaProduct[];
  clients: Client[];
  orders: ClientOrder[];
  clientProfitability: ClientProfitability[];
}

export function useDashboardSearch(data: SearchableData) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return data;
    }

    const query = searchQuery.toLowerCase();

    const filteredProducts = data.products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.grade.toLowerCase().includes(query) ||
        p.origin.toLowerCase().includes(query)
    );

    const filteredClients = data.clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.contact_email?.toLowerCase().includes(query) ||
        c.address?.toLowerCase().includes(query)
    );

    const filteredOrders = data.orders.filter((o) => {
      const client = data.clients.find((c) => c.id === o.client_id);
      const product = data.products.find((p) => p.id === o.product_id);
      return (
        client?.name.toLowerCase().includes(query) ||
        product?.name.toLowerCase().includes(query) ||
        o.status.toLowerCase().includes(query)
      );
    });

    const filteredClientProfitability = data.clientProfitability.filter(
      (cp) =>
        cp.client.name.toLowerCase().includes(query) ||
        cp.client.contact_email?.toLowerCase().includes(query)
    );

    return {
      products: filteredProducts,
      clients: filteredClients,
      orders: filteredOrders,
      clientProfitability: filteredClientProfitability,
    };
  }, [searchQuery, data]);

  return {
    searchQuery,
    setSearchQuery,
    filteredData,
    hasActiveSearch: searchQuery.trim().length > 0,
  };
}
