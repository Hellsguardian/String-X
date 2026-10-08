import React from 'react';
import { UserProfile } from '../../types';
import { SAMPLE_MATCH_PROFILE } from '../../data/mockData';
import { Page24 } from '../../page24-claude/Page24';
import type { Page24CurrentUser, Page24MatchedUser, Page24Year } from '../../page24-claude/types';

interface MatchRevealScreenProps {
  profile: UserProfile;
  onBack: () => void;
  onSendMessage: () => void;
  onReject?: () => void;
  onAccept?: () => void;
}

const parseYear = (val: string | number | undefined | null): Page24Year => {
  if (typeof val === 'number') return val;
  if (!val) return 2;
  const trimmed = val.trim();
  if (/^1/i.test(trimmed)) return 1;
  if (/^2/i.test(trimmed)) return 2;
  if (/^3/i.test(trimmed)) return 3;
  if (/^4/i.test(trimmed)) return 4;
  if (/^5/i.test(trimmed)) return 5;
  if (/pg/i.test(trimmed)) return 'PG';
  return trimmed;
};

export const MatchRevealScreen: React.FC<MatchRevealScreenProps> = ({
  profile,
  onBack,
  onSendMessage,
  onReject,
  onAccept,
}) => {
  const match = SAMPLE_MATCH_PROFILE;
  const isUserMale = profile.gender === 'Male';

  const currentUser: Page24CurrentUser = {
    name: profile.nickname?.trim() || profile.fullName?.trim() || 'You',
    photoUrl: profile.faceVerificationPhoto || profile.photoUrl || null,
    year: parseYear(profile.collegeYear),
    course: profile.department || undefined,
    interests: profile.interests?.length ? profile.interests : profile.navratriVibes,
  };

  const matchedName = isUserMale ? 'Aanya Shah' : (match.name || 'Arjun Mehta');
  const matchedAge = isUserMale ? 20 : (match.age || 21);
  const matchedPhoto = isUserMale
    ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
    : (match.photoUrl || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=600&q=80');
  const matchedYear = parseYear(isUserMale ? '2nd Year' : match.collegeYear);
  const matchedCourse = isUserMale ? 'B.Tech' : (match.department || 'B.Tech');
  const matchedInterests = match.sharedInterests || ['Garba', 'Late Night Chai', 'Music'];

  const matchedUser: Page24MatchedUser = {
    name: matchedName,
    age: matchedAge,
    photoUrl: matchedPhoto,
    year: matchedYear,
    course: matchedCourse,
    interests: matchedInterests,
  };

  const commonInterests = match.sharedInterests?.length
    ? match.sharedInterests.slice(0, 3)
    : undefined;

  return (
    <div className="relative w-full h-full min-h-0 flex-1 flex flex-col overflow-hidden">
      <Page24
        layout="fill"
        currentUser={currentUser}
        matchedUser={matchedUser}
        commonInterests={commonInterests}
        onBack={onBack}
        onMessage={onSendMessage}
        onReject={onReject ?? onBack}
        onAccept={onAccept ?? onSendMessage}
      />
    </div>
  );
};
