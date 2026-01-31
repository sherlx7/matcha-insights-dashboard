import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ClientProfitability } from "@/types/database";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface ClientProfitabilityTableProps {
  clients: ClientProfitability[];
  isLoading: boolean;
}

export function ClientProfitabilityTable({ clients, isLoading }: ClientProfitabilityTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading client data...</div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground">
        No client data available.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Location</TableHead>
          <TableHead className="text-right">Revenue</TableHead>
          <TableHead className="text-right">COGS</TableHead>
          <TableHead className="text-right">Profit</TableHead>
          <TableHead className="text-right">Margin</TableHead>
          <TableHead className="text-right">Orders</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => {
          const marginClass = client.profitMargin >= 30 
            ? "text-primary" 
            : client.profitMargin >= 20 
              ? "text-amber-600" 
              : "text-destructive";
          
          const TrendIcon = client.profitMargin >= 30 
            ? TrendingUp 
            : client.profitMargin >= 20 
              ? Minus 
              : TrendingDown;

          return (
            <TableRow key={client.client.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{client.client.name}</div>
                  {client.client.contact_email && (
                    <div className="text-xs text-muted-foreground">{client.client.contact_email}</div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.client.address || "—"}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${client.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                ${client.totalCOGS.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right font-medium">
                ${client.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <div className={cn("flex items-center justify-end gap-1 font-medium", marginClass)}>
                  <TrendIcon className="h-4 w-4" />
                  {client.profitMargin.toFixed(1)}%
                </div>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{client.orders.length}</Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
