import React from 'react';
import { PlayfulBadge } from '../illustrations/GarbaIllustrations';

interface DeviceFrameProps {
  children: React.ReactNode;
  onQuickFill?: () => void;
  onJumpToCombinedScreen?: () => void;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ children }) => {
  return (
    <div className="w-full h-full min-h-[100vh] min-h-[100dvh] max-h-[100dvh] bg-[#E3E0F5] flex flex-col items-center justify-center relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Editorial Decorative Elements on Desktop Canvas (Large Desktop Only) */}
      <div className="hidden xl:block absolute inset-0 pointer-events-none select-none overflow-hidden">
        {/* Top left bold statement */}
        <div className="absolute top-8 left-10 max-w-xs space-y-2">
          <PlayfulBadge text="COLLEGE GARBA BUDDY FINDER" color="yellow" tilt="left" />
          <h1 className="text-4xl font-black text-[#251436] leading-[1.05] tracking-tight">
            Meet your <span className="text-[#894EFF]">Garba person</span> before the dhol drops.
          </h1>
          <p className="text-sm font-semibold text-[#251436]/70">
            No endless swiping. No boring forms. Just matching vibes, stamina & 3-taali synchronization.
          </p>
        </div>

        {/* Top right stickers */}
        <div className="absolute top-10 right-12 flex flex-col items-end gap-3">
          <PlayfulBadge text="100% CAMPUS VERIFIED" color="teal" tilt="right" />
          <div className="bg-[#251436] text-[#FFFFFF] px-4 py-2 rounded-2xl border-2 border-[#251436] shadow-[3px_3px_0px_#FFC928] text-xs font-bold -rotate-2">
            🪩 Partner reveal: 1 day before Navratri
          </div>
        </div>

        {/* Bottom left editorial block */}
        <div className="absolute bottom-8 left-10 flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F02A8A] border-3 border-[#251436] flex items-center justify-center text-3xl shadow-[3px_3px_0px_#251436]">
            💃
          </div>
          <div>
            <p className="text-sm font-black text-[#251436]">Over 2,400+ Students</p>
            <p className="text-xs font-semibold text-[#251436]/60">Matching across 28+ campuses</p>
          </div>
        </div>

        {/* Bottom right floating doodle & string */}
        <div className="absolute bottom-8 right-12 flex items-center gap-2">
          <div className="text-right">
            <span className="text-xs font-black uppercase text-[#894EFF] block">One Invisible String</span>
            <span className="text-xs font-semibold text-[#251436]/70">Connecting two dancers</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#FFC928] border-2 border-[#251436] flex items-center justify-center text-lg">
            ✨
          </div>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="relative flex items-center justify-center w-full h-full min-h-[100dvh] max-h-[100dvh] sm:min-h-0 sm:h-auto sm:max-h-[min(880px,calc(100dvh-24px))] sm:px-4">
        {/*
          The Mobile Application Viewport Container:
          - On mobile (< sm): 100vw, 100dvh, zero borders, zero frame decorations, zero margins.
          - On desktop (>= sm): Centered phone frame preview (max-w-[400px], h-[844px] or constrained by viewport).
        */}
        <main
          className="relative w-full h-full min-h-[100dvh] max-h-[100dvh] sm:min-h-0 sm:h-[844px] sm:max-h-[min(880px,calc(100dvh-24px))] sm:max-w-[400px] flex flex-col bg-[#E3E0F5] border-0 rounded-none shadow-none sm:border-4 sm:border-[#251436] sm:rounded-[44px] sm:shadow-[10px_10px_0px_#251436] overflow-hidden"
          style={{
            height: '100dvh',
          }}
        >
          {/* Subtle Phone Notch / Speaker bar on desktop frame preview only */}
          <div className="hidden sm:flex justify-center pt-2.5 pb-1 select-none pointer-events-none shrink-0">
            <div className="w-24 h-4 bg-[#251436] rounded-full flex items-center justify-end px-2">
              <div className="w-2 h-2 rounded-full bg-[#894EFF]/40" />
            </div>
          </div>

          {/* Content Container (fills available height with zero unwanted scrollbars) */}
          <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
