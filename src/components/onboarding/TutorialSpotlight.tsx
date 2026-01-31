import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TutorialSpotlightProps {
  targetSelector: string;
  isActive: boolean;
  padding?: number;
  onTargetFound?: (rect: SpotlightRect) => void;
}

export function TutorialSpotlight({
  targetSelector,
  isActive,
  padding = 8,
  onTargetFound,
}: TutorialSpotlightProps) {
  const [targetRect, setTargetRect] = useState<SpotlightRect | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    if (!isActive) {
      setIsVisible(false);
      setTargetRect(null);
      return;
    }

    const findTarget = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        const newRect = {
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        };
        setTargetRect(newRect);
        onTargetFound?.(newRect);

        // Scroll element into view if needed
        const elementTop = rect.top;
        const elementBottom = rect.bottom;
        const viewportHeight = window.innerHeight;
        
        if (elementTop < 100 || elementBottom > viewportHeight - 100) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Set up resize observer
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
        observerRef.current = new ResizeObserver(() => {
          const newR = target.getBoundingClientRect();
          setTargetRect({
            top: newR.top - padding + window.scrollY,
            left: newR.left - padding,
            width: newR.width + padding * 2,
            height: newR.height + padding * 2,
          });
        });
        observerRef.current.observe(target);

        setTimeout(() => setIsVisible(true), 50);
        return true;
      }
      return false;
    };

    // Try to find target immediately
    if (!findTarget()) {
      // Retry a few times with delays
      const attempts = [100, 300, 500, 1000];
      let attemptIndex = 0;
      
      const retry = () => {
        if (attemptIndex < attempts.length) {
          setTimeout(() => {
            if (!findTarget()) {
              attemptIndex++;
              retry();
            }
          }, attempts[attemptIndex]);
        }
      };
      retry();
    }

    // Update position on scroll/resize
    const handleUpdate = () => {
      const target = document.querySelector(targetSelector);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect({
          top: rect.top - padding + window.scrollY,
          left: rect.left - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        });
      }
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [targetSelector, isActive, padding, onTargetFound]);

  if (!isActive || !targetRect) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[9998] pointer-events-none transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0"
      )}
      style={{
        background: `radial-gradient(ellipse at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2 - window.scrollY}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2}px, rgba(0, 0, 0, 0.75) ${Math.max(targetRect.width, targetRect.height)}px)`,
      }}
    >
      {/* Highlight border around target */}
      <div
        className="absolute border-2 border-primary rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.75)] transition-all duration-300"
        style={{
          top: targetRect.top - window.scrollY,
          left: targetRect.left,
          width: targetRect.width,
          height: targetRect.height,
        }}
      />
    </div>
  );
}
