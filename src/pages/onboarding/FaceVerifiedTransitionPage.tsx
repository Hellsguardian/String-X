import React from 'react';
import { FaceVerifiedTransition } from '../../components/screens/FaceVerifiedTransition';

interface FaceVerifiedTransitionPageProps {
  onComplete: () => void;
}

export const FaceVerifiedTransitionPage: React.FC<FaceVerifiedTransitionPageProps> = ({
  onComplete,
}) => {
  return <FaceVerifiedTransition onComplete={onComplete} />;
};
