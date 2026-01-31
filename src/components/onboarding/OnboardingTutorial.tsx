import { useState } from 'react';
import { useOnboarding } from './OnboardingProvider';
import { TutorialSpotlight } from './TutorialSpotlight';
import { TutorialTooltip } from './TutorialTooltip';
import { WelcomeDialog } from './WelcomeDialog';
import { CompletionDialog } from './CompletionDialog';

export function OnboardingTutorial() {
  const {
    isActive,
    currentStep,
    currentStepData,
    totalSteps,
    nextStep,
    previousStep,
    endTutorial,
    startTutorial,
  } = useOnboarding();

  const [showCompletion, setShowCompletion] = useState(false);

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      setShowCompletion(true);
      endTutorial(true);
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    endTutorial(false);
  };

  const handleCloseCompletion = () => {
    setShowCompletion(false);
  };

  const handleRestartFromCompletion = () => {
    setShowCompletion(false);
    startTutorial();
  };

  return (
    <>
      <WelcomeDialog />
      
      {isActive && currentStepData && (
        <>
          <TutorialSpotlight
            targetSelector={currentStepData.targetSelector}
            isActive={isActive}
          />
          <TutorialTooltip
            step={currentStepData}
            stepNumber={currentStep}
            totalSteps={totalSteps}
            targetSelector={currentStepData.targetSelector}
            onNext={handleNext}
            onPrevious={previousStep}
            onSkip={handleSkip}
            isFirst={currentStep === 0}
            isLast={currentStep === totalSteps - 1}
          />
        </>
      )}

      <CompletionDialog
        open={showCompletion}
        onClose={handleCloseCompletion}
        onRestart={handleRestartFromCompletion}
      />
    </>
  );
}
