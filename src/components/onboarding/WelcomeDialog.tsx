import { Leaf, BookOpen, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useOnboarding } from "./OnboardingProvider";

export function WelcomeDialog() {
  const { shouldShowWelcome, startTutorial, skipTutorial } = useOnboarding();

  return (
    <Dialog open={shouldShowWelcome} onOpenChange={(open) => !open && skipTutorial()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Welcome to Matsu Matcha!</DialogTitle>
          <DialogDescription className="text-base pt-2">
            Your B2B dashboard for managing matcha inventory, pricing, and client relationships.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">Guided Tour</p>
              <p className="text-sm text-muted-foreground">
                Take a quick 2-minute tour to learn about all the features and insights available.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm">What You'll Learn</p>
              <p className="text-sm text-muted-foreground">
                Financial analysis, inventory management, client profitability, and AI-powered insights.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={startTutorial} className="w-full">
            Start Tutorial
          </Button>
          <Button variant="ghost" onClick={skipTutorial} className="w-full">
            Skip for Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
