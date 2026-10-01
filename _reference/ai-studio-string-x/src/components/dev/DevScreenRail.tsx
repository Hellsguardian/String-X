import React, { useState } from 'react';
import { ScreenState } from '../../types';

export interface DevScreenInfo {
  number: string;
  stepIndex: number;
  label: string;
}

export const DEV_SCREENS: DevScreenInfo[] = [
  { number: '01', stepIndex: 1, label: 'Landing Screen' },
  { number: '02', stepIndex: 2, label: 'Phone Sign-Up' },
  { number: '03', stepIndex: 3, label: 'Name & Gender' },
  { number: '04', stepIndex: 4, label: 'University & Hostel' },
  { number: '05', stepIndex: 5, label: 'Birth Year Check' },
  { number: '06', stepIndex: 6, label: 'Photo Upload' },
  { number: '07', stepIndex: 7, label: 'Height & Weight' },
  { number: '08', stepIndex: 8, label: 'Home State' },
  { number: '09', stepIndex: 9, label: 'College Year' },
  { number: '10', stepIndex: 10, label: 'Course Selection' },
  { number: '11', stepIndex: 11, label: 'Face Verification' },
  { number: '12', stepIndex: 12, label: 'STRING X Home / Events' },
  { number: '13', stepIndex: 13, label: 'Partner Preference' },
  { number: '14', stepIndex: 14, label: 'General Interests' },
  { number: '15', stepIndex: 15, label: 'Favourite Evening Spot in PU' },
  { number: '16', stepIndex: 16, label: 'PU Navratri Excitement' },
  { number: '17', stepIndex: 17, label: 'Garba Skill Level' },
  { number: '18', stepIndex: 18, label: 'Navratri Excitement' },
  { number: '19', stepIndex: 19, label: 'Prompt 01' },
  { number: '20', stepIndex: 20, label: 'Prompt 02' },
  { number: '21', stepIndex: 21, label: 'Instagram ID' },
  { number: '22', stepIndex: 22, label: 'Finding Your Match' },
  { number: '23', stepIndex: 23, label: 'Countdown' },
  { number: '24', stepIndex: 24, label: 'Match Reveal' },
  { number: '25', stepIndex: 25, label: 'Message Screen' },
  { number: '26', stepIndex: 26, label: 'My Profile & Settings' },
];

interface DevScreenRailProps {
  currentScreen: ScreenState;
  onboardingStep: number;
  onNavigate: (stepIndex: number) => void;
}

export const DevScreenRail: React.FC<DevScreenRailProps> = ({
  currentScreen,
  onboardingStep,
  onNavigate,
}) => {
  // Allow toggling side if developer prefers left or right on desktop
  const [side, setSide] = useState<'right' | 'left'>('right');

  // Compute active step index matching the sequential 24-screen map
  const activeStepIndex = (() => {
    if (currentScreen === 'landing') {
      return 1;
    }
    if (currentScreen === 'phone-signup') {
      return 2;
    }
    if (currentScreen === 'onboarding') {
      if (onboardingStep <= 8) {
        return onboardingStep + 3; // Step 0 (Name & Gender) -> 3, Step 8 (Face Verification) -> 11
      } else {
        return onboardingStep + 4; // Step 9 (Partner Preference) -> 13, Step 16 (Prompt 02) -> 20, Step 17 (Instagram ID) -> 21
      }
    }
    if (currentScreen === 'home') {
      return 12;
    }
    if (currentScreen === 'success') {
      return 22;
    }
    if (currentScreen === 'countdown') {
      return 23;
    }
    if (currentScreen === 'match-reveal') {
      return 24;
    }
    if (currentScreen === 'messages') {
      return 25;
    }
    if (currentScreen === 'profile') {
      return 26;
    }
    return 1;
  })();

  return (
    <aside
      aria-label="Development Navigation Rail"
      className={`hidden xl:flex flex-col items-center fixed top-1/2 -translate-y-1/2 z-50 select-none transition-all duration-200 pointer-events-auto ${
        side === 'right'
          ? 'left-[calc(50%+220px)]'
          : 'right-[calc(50%+220px)]'
      }`}
    >
      <div className="w-[44px] max-h-[92vh] py-2 px-1 bg-white/95 backdrop-blur-md border border-slate-300/80 rounded-xl shadow-md flex flex-col items-center gap-1 overflow-y-auto no-scrollbar">
        {/* Rail Top Header: DEV label and Side Switcher */}
        <div className="flex flex-col items-center pb-1 border-b border-slate-200 w-full mb-0.5 shrink-0">
          <span className="text-[9px] font-mono font-black text-slate-400 tracking-wider">
            DEV
          </span>
          <button
            type="button"
            onClick={() => setSide((prev) => (prev === 'right' ? 'left' : 'right'))}
            title={side === 'right' ? 'Move rail to left side' : 'Move rail to right side'}
            className="text-[10px] text-slate-400 hover:text-slate-800 transition-colors p-0.5 cursor-pointer"
          >
            {side === 'right' ? '←' : '→'}
          </button>
        </div>

        {/* 23 Vertical Screen Numbers */}
        <nav className="flex flex-col gap-0.5 w-full">
          {DEV_SCREENS.map((item) => {
            const isActive = activeStepIndex === item.stepIndex;

            return (
              <div key={item.number} className="relative group w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => onNavigate(item.stepIndex)}
                  className={`w-full h-5.5 rounded flex items-center justify-center text-[10.5px] font-mono font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-200/80 hover:text-slate-950'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Jump to screen ${item.number}: ${item.label}`}
                >
                  {item.number}
                </button>

                {/* Hover Tooltip showing Screen Name */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 whitespace-nowrap px-2 py-1 text-[11px] font-medium rounded-md bg-slate-900 text-white shadow-lg ${
                    side === 'right' ? 'left-full ml-2' : 'right-full mr-2'
                  }`}
                >
                  <span className="font-mono text-slate-400 mr-1.5">{item.number}</span>
                  <span>{item.label}</span>
                </div>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
