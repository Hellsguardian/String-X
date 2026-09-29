import React from 'react';
import { OnboardingFlowContainer, OnboardingFlowContainerProps } from '../../pages/onboarding/OnboardingFlowContainer';

export type OnboardingFlowProps = OnboardingFlowContainerProps;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = (props) => {
  return <OnboardingFlowContainer {...props} />;
};
