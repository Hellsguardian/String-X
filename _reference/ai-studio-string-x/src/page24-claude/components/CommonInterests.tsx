export interface CommonInterestsProps {
  label: string;
  interests: string[];
}

/** "COMMON INTERESTS" label + up to three chips. Renders nothing when the list is empty. */
export function CommonInterests({ label, interests }: CommonInterestsProps) {
  if (interests.length === 0) return null;
  return (
    <div className="p24-interests">
      <div className="p24-interests-label">{label}</div>
      <div className="p24-interests-list">
        {interests.map((interest, i) => (
          <span key={`${interest}-${i}`} className="p24-chip">
            {interest}
          </span>
        ))}
      </div>
    </div>
  );
}
