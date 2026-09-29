import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { PhoneNumberSignUpScreen } from '../../components/screens/PhoneNumberSignUpScreen';

interface PhoneNumberSignUpPageProps {
  onBack: () => void;
  onSuccess: (verifiedPhone: string, isExistingUser?: boolean) => void;
}

export const PhoneNumberSignUpPage: React.FC<PhoneNumberSignUpPageProps> = ({
  onBack,
  onSuccess,
}) => {
  const { profile, sendPhoneOtp, verifyPhoneOtp } = useAuth();

  return (
    <PhoneNumberSignUpScreen
      initialPhone={profile.phone}
      onBack={onBack}
      onSendOtp={async (phone) => {
        return sendPhoneOtp(phone);
      }}
      onVerifyOtp={async (phone, otp) => {
        return verifyPhoneOtp(phone, otp);
      }}
      onSuccess={onSuccess}
    />
  );
};
