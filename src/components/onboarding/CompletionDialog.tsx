import { PartyPopper, RotateCcw, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CompletionDialogProps {
  open: boolean;
  onClose: () => void;
  onRestart: () => void;
}

export function CompletionDialog({ open, onClose, onRestart }: CompletionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
              <PartyPopper className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl">You're All Set! 🎉</DialogTitle>
          <DialogDescription className="text-base pt-2">
            You've completed the dashboard tour. You now know how to leverage all the tools to manage your matcha business effectively.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="p-4 rounded-lg bg-muted/50 border">
            <p className="font-medium text-sm mb-2">Quick Tips:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use the date filter to analyze specific periods</li>
              <li>• Check AI Insights for margin improvement suggestions</li>
              <li>• Test pricing changes in Sandbox before applying them</li>
              <li>• Monitor Low Stock badges to prevent stockouts</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onClose} className="w-full">
            <ArrowRight className="h-4 w-4 mr-2" />
            Start Exploring
          </Button>
          <Button variant="outline" onClick={onRestart} className="w-full">
            <RotateCcw className="h-4 w-4 mr-2" />
            Restart Tutorial
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
