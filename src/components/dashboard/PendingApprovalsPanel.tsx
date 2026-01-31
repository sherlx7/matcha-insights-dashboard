import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  StockChangeRequest, 
  MatchaProduct, 
  STOCK_CHANGE_REASON_LABELS,
  StockChangeReason 
} from "@/types/database";
import { useStockChangeRequests, useReviewStockChangeRequest } from "@/hooks/useStockChangeRequests";
import { Check, X, Clock, AlertTriangle, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface PendingApprovalsPanelProps {
  products: MatchaProduct[];
}

export function PendingApprovalsPanel({ products }: PendingApprovalsPanelProps) {
  const { data: pendingRequests = [], isLoading } = useStockChangeRequests('pending');
  const { data: allRequests = [] } = useStockChangeRequests();
  const [reviewingRequest, setReviewingRequest] = useState<StockChangeRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [supervisorName, setSupervisorName] = useState("");
  const reviewRequest = useReviewStockChangeRequest();

  const productMap = new Map(products.map(p => [p.id, p]));

  const handleApprove = () => {
    if (!reviewingRequest || !supervisorName.trim()) return;
    
    reviewRequest.mutate({
      id: reviewingRequest.id,
      decision: 'approved',
      reviewed_by: supervisorName,
      review_notes: reviewNotes,
      product_id: reviewingRequest.product_id,
      new_stock_kg: reviewingRequest.new_stock_kg || 0,
    }, {
      onSuccess: () => {
        setReviewingRequest(null);
        setReviewNotes("");
        setSupervisorName("");
      },
    });
  };

  const handleReject = () => {
    if (!reviewingRequest || !supervisorName.trim()) return;
    
    reviewRequest.mutate({
      id: reviewingRequest.id,
      decision: 'rejected',
      reviewed_by: supervisorName,
      review_notes: reviewNotes,
      product_id: reviewingRequest.product_id,
      new_stock_kg: reviewingRequest.new_stock_kg || 0,
    }, {
      onSuccess: () => {
        setReviewingRequest(null);
        setReviewNotes("");
        setSupervisorName("");
      },
    });
  };

  const recentlyReviewed = allRequests
    .filter(r => r.status !== 'pending')
    .slice(0, 10);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-pulse text-muted-foreground">Loading requests...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card className={pendingRequests.length > 0 ? "border-amber-500/50" : ""}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-lg">Pending Approvals</CardTitle>
            {pendingRequests.length > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                {pendingRequests.length}
              </Badge>
            )}
          </div>
          <CardDescription>
            Stock change requests awaiting supervisor approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No pending requests</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingRequests.map((request) => {
                  const product = productMap.get(request.product_id);
                  const currentStock = product ? Number(product.stock_kg) : 0;
                  const stockDiff = (request.new_stock_kg || 0) - currentStock;
                  
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d, HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product?.name || "Unknown"}
                      </TableCell>
                      <TableCell>{request.requested_by}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground font-mono text-sm">
                            {currentStock.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-mono text-sm">
                            {(request.new_stock_kg || 0).toFixed(1)} kg
                          </span>
                          <Badge 
                            variant={stockDiff >= 0 ? "default" : "destructive"}
                            className="font-mono text-xs"
                          >
                            {stockDiff >= 0 ? "+" : ""}{stockDiff.toFixed(1)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {STOCK_CHANGE_REASON_LABELS[request.reason as StockChangeReason] || request.reason}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setReviewingRequest(request)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recently Reviewed */}
      {recentlyReviewed.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Recently Reviewed</CardTitle>
            <CardDescription>
              Past stock change requests and their outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reviewed By</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyReviewed.map((request) => {
                  const product = productMap.get(request.product_id);
                  
                  return (
                    <TableRow key={request.id} className="opacity-75">
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(request.created_at), "MMM d")}
                      </TableCell>
                      <TableCell className="font-medium">
                        {product?.name || "Unknown"}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(request.new_stock_kg || 0).toFixed(1)} kg
                      </TableCell>
                      <TableCell className="text-sm">
                        {STOCK_CHANGE_REASON_LABELS[request.reason as StockChangeReason] || request.reason}
                      </TableCell>
                      <TableCell className="text-sm">
                        {request.reviewed_by || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={request.status === 'approved' ? "default" : "destructive"}
                          className={cn(
                            "capitalize",
                            request.status === 'approved' && "bg-primary/10 text-primary border-primary/20"
                          )}
                        >
                          {request.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                          {request.status === 'rejected' && <X className="h-3 w-3 mr-1" />}
                          {request.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={!!reviewingRequest} onOpenChange={() => setReviewingRequest(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Review Stock Change Request</DialogTitle>
            <DialogDescription>
              Approve or reject this manual stock adjustment.
            </DialogDescription>
          </DialogHeader>

          {reviewingRequest && (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Product:</span>
                  <span className="font-medium">
                    {productMap.get(reviewingRequest.product_id)?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Requested By:</span>
                  <span>{reviewingRequest.requested_by}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stock Change:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {Number(productMap.get(reviewingRequest.product_id)?.stock_kg || 0).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-semibold">
                      {(reviewingRequest.new_stock_kg || 0).toFixed(1)} kg
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reason:</span>
                  <Badge variant="outline">
                    {STOCK_CHANGE_REASON_LABELS[reviewingRequest.reason as StockChangeReason]}
                  </Badge>
                </div>
                {reviewingRequest.notes && (
                  <div className="pt-2 border-t">
                    <span className="text-sm text-muted-foreground block mb-1">Notes:</span>
                    <p className="text-sm">{reviewingRequest.notes}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Supervisor Name</label>
                <Input
                  placeholder="Enter your name"
                  value={supervisorName}
                  onChange={(e) => setSupervisorName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Review Notes (Optional)</label>
                <Textarea
                  placeholder="Add notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                />
              </div>

              {!supervisorName.trim() && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please enter your name to approve or reject.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={!supervisorName.trim() || reviewRequest.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={!supervisorName.trim() || reviewRequest.isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
