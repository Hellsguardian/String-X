import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ProfileSettingsScreen } from '../../components/screens/ProfileSettingsScreen';

interface ProfileSettingsPageProps {
  onBack: () => void;
  onSignOut: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  onBack,
  onSignOut,
}) => {
  const { profile, signOut, deleteAccount } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    onSignOut();
  };

  const handleDeleteAccount = async () => {
    const res = await deleteAccount();
    if (!res.success) {
      throw new Error(res.error || 'Failed to delete account');
    }
    onSignOut();
  };

  return (
    <ProfileSettingsScreen
      profile={profile}
      onBack={onBack}
      onSignOut={handleSignOut}
      onDeleteAccount={handleDeleteAccount}
    />
  );
};
