import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft,
  Settings,
  Edit3,
  Ban,
  ShieldCheck,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  Sparkles,
  X
} from 'lucide-react';
import { UserProfile } from '../../types';

interface ProfileSettingsScreenProps {
  profile: UserProfile;
  onBack: () => void;
  onSignOut: () => void;
}

export const ProfileSettingsScreen: React.FC<ProfileSettingsScreenProps> = ({
  profile,
  onBack,
  onSignOut,
}) => {
  const [showUnavailableModal, setShowUnavailableModal] = useState<boolean>(false);
  const [showSignOutModal, setShowSignOutModal] = useState<boolean>(false);

  // Fallbacks
  const firstName = profile.fullName
    ? profile.fullName.trim().split(' ')[0]
    : profile.nickname || 'Student';

  const campusName = profile.collegeName || 'Parul University';
  const avatarPhoto = profile.photoUrl || profile.faceVerificationPhoto;

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-start bg-[#E3E0F5] text-[#251436] select-none overflow-hidden relative font-['Plus_Jakarta_Sans',sans-serif]">
      {/* ================================================================== */}
      {/* 1. TOP APP HEADER                                                  */}
      {/* ================================================================== */}
      <header className="shrink-0 px-5 sm:px-6 pt-[max(14px,env(safe-area-inset-top,0px))] pb-2.5 z-20">
        <div className="flex items-center justify-between">
          {/* LEFT: Back Navigation + STRING-X Brand Logo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to home"
              className="w-8 h-8 -ml-1 flex items-center justify-center text-[#251436] hover:text-[#894EFF] active:scale-95 transition-all cursor-pointer rounded-lg hover:bg-black/5"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>

            {/* STRING X Logo */}
            <div className="flex items-center gap-1.5 select-none">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-[#251436]">
                STRING
              </span>
              <span className="mx-0.5" />
              <span className="text-[#F02A8A] font-black text-xl sm:text-2xl relative">
                X
                {/* Subtle curved string accent under X */}
                <svg
                  className="absolute -bottom-1 left-0 w-full h-1.5 overflow-visible"
                  viewBox="0 0 20 6"
                  fill="none"
                >
                  <path
                    d="M1 1C5 5 15 5 19 1"
                    stroke="#FFC928"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </div>
          </div>

          {/* RIGHT: Clean Outline Settings / Gear Icon */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            aria-label="Settings"
            className="w-9 h-9 flex items-center justify-center text-[#251436] hover:text-[#894EFF] active:scale-95 transition-all cursor-pointer rounded-full hover:bg-black/5"
          >
            <Settings size={22} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* ================================================================== */}
      {/* 2. MAIN SCROLLABLE CONTENT BODY                                    */}
      {/* ================================================================== */}
      <main className="flex-1 min-h-0 px-5 sm:px-6 py-1 overflow-y-auto no-scrollbar space-y-4">
        
        {/* PROFILE HERO (Spacious, Centered, Direct on Canvas) */}
        <section className="flex flex-col items-center text-center pt-1 pb-1">
          {/* Circular Profile Photo with Subtle Verified Ring */}
          <div className="relative mb-2.5">
            <div className="w-[96px] h-[96px] sm:w-[104px] sm:h-[104px] rounded-full border-2 border-[#251436]/15 shadow-sm bg-white overflow-hidden p-0.5 ring-4 ring-white/60">
              {avatarPhoto ? (
                <img
                  src={avatarPhoto}
                  alt={profile.fullName || 'User'}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-[#894EFF] to-[#B085FF] flex items-center justify-center text-3xl font-black text-white">
                  {firstName.charAt(0) || 'U'}
                </div>
              )}
            </div>

            {/* Subtle Green Verified Indicator Badge */}
            <div
              title="Verified Student"
              className="absolute bottom-0 right-1 w-5 h-5 rounded-full bg-[#10B981] border-2 border-white shadow-xs text-white flex items-center justify-center text-[10px] font-black"
            >
              ✓
            </div>
          </div>

          {/* User Name with Green Verification Check beside name */}
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl sm:text-2xl font-black text-[#251436] tracking-tight">
              {profile.fullName || 'Your Profile'}
            </h1>
            <span
              title="Verified Student"
              className="inline-flex items-center justify-center w-4.5 h-4.5 rounded-full bg-[#10B981] text-white text-[10px] font-black shrink-0 shadow-xs"
            >
              ✓
            </span>
          </div>

          {/* Year • Course */}
          {(profile.collegeYear || profile.department) && (
            <p className="text-xs sm:text-sm font-semibold text-[#251436]/75 mt-0.5 leading-snug">
              {[profile.collegeYear, profile.department].filter(Boolean).join(' • ')}
            </p>
          )}

          {/* University */}
          <p className="text-xs sm:text-sm font-bold text-[#894EFF] mt-0.5">
            @ {campusName}
          </p>
        </section>

        {/* ================================================================ */}
        {/* 3. SIX INDEPENDENT PROFILE OPTIONS (Single Vertical List)         */}
        {/* ================================================================ */}
        <section className="space-y-2.5 pb-6">
          {/* 01 — Edit Profile */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#251436]/10 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-white active:bg-black/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#894EFF]/10 text-[#894EFF] flex items-center justify-center shrink-0">
                <Edit3 size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#251436] tracking-tight">
                  Edit Profile
                </h3>
                <p className="text-xs text-[#251436]/60 truncate mt-0.5">
                  Photos, bio, department & prompts
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#251436]/30 group-hover:text-[#251436]/60 transition-colors shrink-0 ml-2"
            />
          </button>

          {/* 02 — Block List */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#251436]/10 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-white active:bg-black/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#251436]/10 text-[#251436] flex items-center justify-center shrink-0">
                <Ban size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#251436] tracking-tight">
                  Block List
                </h3>
                <p className="text-xs text-[#251436]/60 truncate mt-0.5">
                  View and manage blocked campus users
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#251436]/30 group-hover:text-[#251436]/60 transition-colors shrink-0 ml-2"
            />
          </button>

          {/* 03 — Privacy & Policy */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#251436]/10 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-white active:bg-black/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#FF4F81]/10 text-[#FF4F81] flex items-center justify-center shrink-0">
                <ShieldCheck size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#251436] tracking-tight">
                  Privacy & Policy
                </h3>
                <p className="text-xs text-[#251436]/60 truncate mt-0.5">
                  Campus privacy and account safety
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#251436]/30 group-hover:text-[#251436]/60 transition-colors shrink-0 ml-2"
            />
          </button>

          {/* 04 — Terms & Conditions */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#251436]/10 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-white active:bg-black/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#894EFF]/10 text-[#894EFF] flex items-center justify-center shrink-0">
                <FileText size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#251436] tracking-tight">
                  Terms & Conditions
                </h3>
                <p className="text-xs text-[#251436]/60 truncate mt-0.5">
                  STRING X terms and guidelines
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#251436]/30 group-hover:text-[#251436]/60 transition-colors shrink-0 ml-2"
            />
          </button>

          {/* 05 — Help Center */}
          <button
            type="button"
            onClick={() => setShowUnavailableModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#251436]/10 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-white active:bg-black/[0.02] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#FFC928]/25 text-[#916A00] flex items-center justify-center shrink-0">
                <HelpCircle size={17} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#251436] tracking-tight">
                  Help Center
                </h3>
                <p className="text-xs text-[#251436]/60 truncate mt-0.5">
                  Safety tips, matching FAQs & support
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#251436]/30 group-hover:text-[#251436]/60 transition-colors shrink-0 ml-2"
            />
          </button>

          {/* 06 — Sign Out (Visually Distinct with Red/Pink Accent) */}
          <button
            type="button"
            onClick={() => setShowSignOutModal(true)}
            className="w-full bg-white/95 backdrop-blur-xs rounded-2xl border border-[#F43F5E]/20 px-4 py-3 flex items-center justify-between text-left shadow-[0_2px_8px_rgba(37,20,54,0.03)] hover:bg-[#FFF5F7] active:bg-[#FFEAEF] transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8.5 h-8.5 rounded-xl bg-[#F43F5E]/10 text-[#E11D48] flex items-center justify-center shrink-0">
                <LogOut size={16} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-[#E11D48] tracking-tight">
                  Sign Out
                </h3>
                <p className="text-xs text-[#E11D48]/70 truncate mt-0.5">
                  Sign out of this campus session
                </p>
              </div>
            </div>
            <ChevronRight
              size={16}
              className="text-[#E11D48]/40 group-hover:text-[#E11D48]/70 transition-colors shrink-0 ml-2"
            />
          </button>
        </section>
      </main>

      {/* ================================================================== */}
      {/* 4. MODALS & POPUPS                                                 */}
      {/* ================================================================== */}

      {/* CURRENTLY UNAVAILABLE POPUP */}
      <AnimatePresence>
        {showUnavailableModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full max-w-[320px] bg-white rounded-[24px] border border-[#251436]/15 shadow-xl p-5 text-center relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowUnavailableModal(false)}
                className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-[#E3E0F5]/80 flex items-center justify-center text-[#251436] hover:bg-[#E3E0F5] transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={15} strokeWidth={2.5} />
              </button>

              <div className="w-11 h-11 rounded-2xl bg-[#894EFF]/10 text-[#894EFF] flex items-center justify-center mx-auto mb-2.5">
                <Sparkles size={20} strokeWidth={2} />
              </div>

              <h3 className="text-base font-black text-[#251436] tracking-tight">
                Currently Unavailable
              </h3>

              <p className="text-xs text-[#251436]/70 font-medium mt-1.5 leading-relaxed px-1">
                This feature isn't available yet.
                <br />
                We're working on it and it'll be coming soon.
              </p>

              <button
                type="button"
                onClick={() => setShowUnavailableModal(false)}
                className="mt-4 w-full py-2.5 bg-[#894EFF] hover:bg-[#783cf0] active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Got it
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SIGN OUT CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSignOutModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[360px] bg-white rounded-t-[28px] sm:rounded-[28px] border border-[#251436]/15 shadow-xl p-5 relative overflow-hidden text-center"
            >
              <div className="w-10 h-10 rounded-xl bg-[#F43F5E]/10 text-[#E11D48] flex items-center justify-center mx-auto mb-2.5">
                <LogOut size={20} strokeWidth={2} />
              </div>

              <h3 className="text-base font-black text-[#251436] tracking-tight">
                Sign out of STRING X?
              </h3>
              <p className="text-xs font-medium text-[#251436]/70 mt-1 leading-relaxed">
                You will need to verify your phone number to sign back into your campus matching account.
              </p>

              <div className="mt-4 flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSignOutModal(false)}
                  className="flex-1 py-2.5 px-4 bg-white border border-[#251436]/15 rounded-xl font-bold text-xs text-[#251436] hover:bg-black/[0.02] active:scale-98 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignOutModal(false);
                    onSignOut();
                  }}
                  className="flex-1 py-2.5 px-4 bg-[#E11D48] hover:bg-[#be123c] text-white rounded-xl font-bold text-xs shadow-xs active:scale-98 transition-all cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
