import { useEffect, useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, X, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { TutorialStep, getSectionLabel, getSectionColor } from './tutorialSteps';

interface TutorialTooltipProps {
  step: TutorialStep;
  stepNumber: number;
  totalSteps: number;
  targetSelector: string;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function TutorialTooltip({
  step,
  stepNumber,
  totalSteps,
  targetSelector,
  onNext,
  onPrevious,
  onSkip,
  isFirst,
  isLast,
}: TutorialTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(false);
    
    const positionTooltip = () => {
      const target = document.querySelector(targetSelector);
      const tooltip = tooltipRef.current;
      
      if (!target || !tooltip) return;

      const targetRect = target.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;
      const tooltipWidth = 380;

      let top = 0;
      let left = 0;

      // Determine best position based on step preference and available space
      const preferredPosition = step.position || 'bottom';
      
      const spaceAbove = targetRect.top;
      const spaceBelow = viewportHeight - targetRect.bottom;
      const spaceLeft = targetRect.left;
      const spaceRight = viewportWidth - targetRect.right;

      // Calculate position
      if (preferredPosition === 'bottom' && spaceBelow > tooltipRect.height + padding) {
        top = targetRect.bottom + padding + window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      } else if (preferredPosition === 'top' && spaceAbove > tooltipRect.height + padding) {
        top = targetRect.top - tooltipRect.height - padding + window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      } else if (spaceBelow > spaceAbove) {
        top = targetRect.bottom + padding + window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      } else {
        top = targetRect.top - tooltipRect.height - padding + window.scrollY;
        left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      }

      // Keep within viewport horizontally
      left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding));
      
      // Keep within viewport vertically
      top = Math.max(padding + window.scrollY, top);

      setPosition({ top, left });
      setTimeout(() => setIsVisible(true), 100);
    };

    // Initial positioning
    const timer = setTimeout(positionTooltip, 200);

    // Update on scroll/resize
    window.addEventListener('scroll', positionTooltip, true);
    window.addEventListener('resize', positionTooltip);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', positionTooltip, true);
      window.removeEventListener('resize', positionTooltip);
    };
  }, [targetSelector, step.position]);

  const progress = ((stepNumber + 1) / totalSteps) * 100;

  return (
    <div
      ref={tooltipRef}
      className={cn(
        "fixed z-[9999] w-[380px] transition-all duration-300 pointer-events-auto",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{
        top: position.top - window.scrollY,
        left: position.left,
      }}
    >
      <Card className="shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                Step {stepNumber + 1} of {totalSteps}
              </Badge>
              <Badge className={cn("text-xs", getSectionColor(step.section))}>
                {getSectionLabel(step.section)}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onSkip}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <h3 className="font-semibold text-lg leading-tight">{step.title}</h3>
        </CardHeader>
        
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            {step.description}
          </p>
          
          <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 shrink-0 mt-0.5">
              <Lightbulb className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary mb-1">Key Insight</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {step.insight}
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        </CardContent>
        
        <CardFooter className="pt-0 flex justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onPrevious}
            disabled={isFirst}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            size="sm"
            onClick={onNext}
            className="gap-1"
          >
            {isLast ? 'Finish' : 'Next'}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
