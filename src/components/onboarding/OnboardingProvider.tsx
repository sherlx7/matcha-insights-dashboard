import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { tutorialSteps, TutorialStep } from './tutorialSteps';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  currentStepData: TutorialStep | null;
  totalSteps: number;
  startTutorial: () => void;
  endTutorial: (completed?: boolean) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  skipTutorial: () => void;
  shouldShowWelcome: boolean;
  setShouldShowWelcome: (show: boolean) => void;
  onTabChange: ((tab: string) => void) | null;
  setOnTabChange: (fn: ((tab: string) => void) | null) => void;
  onSubTabChange: ((tab: string) => void) | null;
  setOnSubTabChange: (fn: ((tab: string) => void) | null) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

const TUTORIAL_STORAGE_KEY = 'matsu-tutorial-progress';

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, profile, refetchProfile } = useAuth();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldShowWelcome, setShouldShowWelcome] = useState(false);
  const [onTabChange, setOnTabChange] = useState<((tab: string) => void) | null>(null);
  const [onSubTabChange, setOnSubTabChange] = useState<((tab: string) => void) | null>(null);

  // Check if user should see welcome dialog on first load
  useEffect(() => {
    if (user && profile && !profile.has_completed_tutorial) {
      const dismissed = localStorage.getItem(`${TUTORIAL_STORAGE_KEY}-dismissed-${user.id}`);
      if (!dismissed) {
        setShouldShowWelcome(true);
      }
    }
  }, [user, profile]);

  const currentStepData = isActive ? tutorialSteps[currentStep] : null;

  const saveTutorialCompletion = useCallback(async () => {
    if (!user) return;
    
    try {
      await supabase
        .from('profiles')
        .update({ has_completed_tutorial: true })
        .eq('user_id', user.id);
      
      refetchProfile?.();
    } catch (error) {
      console.error('Error saving tutorial completion:', error);
    }
  }, [user, refetchProfile]);

  const startTutorial = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setShouldShowWelcome(false);
    
    // Navigate to first step's tab
    const firstStep = tutorialSteps[0];
    if (firstStep.mainTab && onTabChange) {
      onTabChange(firstStep.mainTab);
    }
  }, [onTabChange]);

  const endTutorial = useCallback((completed = false) => {
    setIsActive(false);
    setCurrentStep(0);
    
    if (completed) {
      saveTutorialCompletion();
    }
  }, [saveTutorialCompletion]);

  const skipTutorial = useCallback(() => {
    if (user) {
      localStorage.setItem(`${TUTORIAL_STORAGE_KEY}-dismissed-${user.id}`, 'true');
    }
    setShouldShowWelcome(false);
    setIsActive(false);
  }, [user]);

  const navigateToStep = useCallback((step: TutorialStep) => {
    // Navigate to the correct main tab
    if (step.mainTab && onTabChange) {
      onTabChange(step.mainTab);
    }
    
    // Navigate to the correct sub-tab after a short delay
    if (step.subTab && onSubTabChange) {
      setTimeout(() => {
        onSubTabChange(step.subTab!);
      }, 100);
    }
  }, [onTabChange, onSubTabChange]);

  const nextStep = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      const nextStepIndex = currentStep + 1;
      const nextStepData = tutorialSteps[nextStepIndex];
      navigateToStep(nextStepData);
      
      setTimeout(() => {
        setCurrentStep(nextStepIndex);
      }, 150);
    } else {
      endTutorial(true);
    }
  }, [currentStep, navigateToStep, endTutorial]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStepIndex = currentStep - 1;
      const prevStepData = tutorialSteps[prevStepIndex];
      navigateToStep(prevStepData);
      
      setTimeout(() => {
        setCurrentStep(prevStepIndex);
      }, 150);
    }
  }, [currentStep, navigateToStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < tutorialSteps.length) {
      const targetStep = tutorialSteps[step];
      navigateToStep(targetStep);
      
      setTimeout(() => {
        setCurrentStep(step);
      }, 150);
    }
  }, [navigateToStep]);

  return (
    <OnboardingContext.Provider
      value={{
        isActive,
        currentStep,
        currentStepData,
        totalSteps: tutorialSteps.length,
        startTutorial,
        endTutorial,
        nextStep,
        previousStep,
        goToStep,
        skipTutorial,
        shouldShowWelcome,
        setShouldShowWelcome,
        onTabChange,
        setOnTabChange,
        onSubTabChange,
        setOnSubTabChange,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
