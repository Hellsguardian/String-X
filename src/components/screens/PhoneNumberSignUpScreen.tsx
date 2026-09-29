import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { HeaderNav } from '../ui/HeaderNav';
import { PrimaryButton } from '../ui/PrimaryButton';
import { PlayfulBadge } from '../illustrations/GarbaIllustrations';

interface PhoneNumberSignUpScreenProps {
  initialPhone?: string;
  onBack: () => void;
  onSuccess: (verifiedPhone: string, isExistingUser?: boolean) => void;
  onSendOtp?: (phone: string) => Promise<{ success: boolean; error?: string }>;
  onVerifyOtp?: (phone: string, token: string) => Promise<{ success: boolean; error?: string; isExistingUser?: boolean }>;
}

export const PhoneNumberSignUpScreen: React.FC<PhoneNumberSignUpScreenProps> = ({
  initialPhone = '',
  onBack,
  onSuccess,
  onSendOtp,
  onVerifyOtp,
}) => {
  // Extract pure 10 digits from initialPhone if present
  const rawInitialDigits = initialPhone.replace(/\D/g, '').slice(-10);

  const [phoneDigits, setPhoneDigits] = useState(rawInitialDigits);
  const [phoneError, setPhoneError] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Bottom Sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [isResent, setIsResent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  const phoneInputRef = useRef<HTMLInputElement>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus on phone input when sheet is not open
  useEffect(() => {
    if (!isSheetOpen) {
      setTimeout(() => phoneInputRef.current?.focus(), 150);
    }
  }, [isSheetOpen]);

  // Focus first OTP input when sheet opens
  useEffect(() => {
    if (isSheetOpen) {
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 260);
    }
  }, [isSheetOpen]);

  // Countdown timer for OTP resend (in seconds)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSheetOpen && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isSheetOpen, countdown]);

  // Format seconds to mm:ss (e.g., 00:30, 00:14)
  const formatTimer = (secs: number) => {
    const s = secs < 10 ? `0${secs}` : `${secs}`;
    return `00:${s}`;
  };

  // Handle phone digits change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPhoneDigits(rawVal);
    if (phoneError && rawVal.length === 10) {
      setPhoneError('');
    }
  };

  // Formatted phone display (e.g., 98251 44321)
  const formatPhone = (digits: string) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handleSendOtp = async () => {
    if (phoneDigits.length !== 10) {
      setPhoneError('Please enter a valid 10-digit mobile number');
      return;
    }
    setPhoneError('');
    setIsSendingOtp(true);

    if (onSendOtp) {
      const res = await onSendOtp(`+91 ${phoneDigits}`);
      if (!res.success && res.error) {
        setIsSendingOtp(false);
        setPhoneError(res.error);
        return;
      }
    }

    // Short natural delay for sending OTP request
    setTimeout(() => {
      setIsSendingOtp(false);
      setCountdown(30);
      setIsResent(false);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setIsSheetOpen(true);
    }, 280);
  };

  const handleDismissSheet = () => {
    if (isVerifying || isVerifiedSuccess) return;
    setIsSheetOpen(false);
    setOtpError('');
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    if (onSendOtp) {
      await onSendOtp(`+91 ${phoneDigits}`);
    }
    setCountdown(30);
    setIsResent(true);
    setOtp(['', '', '', '', '', '']);
    setOtpError('');
    setTimeout(() => {
      otpInputsRef.current[0]?.focus();
    }, 100);
  };

  // Handle individual OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    const cleanDigit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = cleanDigit;
    setOtp(newOtp);
    if (otpError) setOtpError('');

    // Auto-advance to next input if digit entered
    if (cleanDigit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      if (otpError) setOtpError('');
      const focusIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[focusIndex]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredCode = otp.join('');
    if (enteredCode.length !== 6) {
      setOtpError("That code doesn't look right. Try again 👀");
      return;
    }

    setIsVerifying(true);
    setOtpError('');

    let isExisting = false;
    if (onVerifyOtp) {
      const res = await onVerifyOtp(`+91 ${phoneDigits}`, enteredCode);
      if (!res.success && res.error) {
        setIsVerifying(false);
        setOtpError(res.error);
        return;
      }
      isExisting = Boolean(res?.isExistingUser);
    }

    try {
      confetti({
        particleCount: 30,
        spread: 55,
        origin: { y: 0.7 },
        colors: ['#894EFF', '#F02A8A', '#FFC928', '#08A98D'],
        disableForReducedMotion: true
      });
    } catch {
      // safe fallback
    }

    setIsVerifiedSuccess(true);

    // Short success verification pause, then close sheet and proceed to College Verification
    setTimeout(() => {
      setIsSheetOpen(false);
      const fullPhoneNumber = `+91 ${formatPhone(phoneDigits)}`;
      onSuccess(fullPhoneNumber, isExisting);
    }, 450);
  };

  const isOtpComplete = otp.join('').length === 6;

  return (
    <div className="w-full h-full min-h-full max-h-full flex-1 flex flex-col justify-between bg-[#E3E0F5] text-[#251436] select-none relative overflow-hidden">
      {/* Top Header with Back button & Step Progress */}
      <div className="shrink-0 pt-[env(safe-area-inset-top,0px)]">
        <HeaderNav
          currentStep={2}
          totalSteps={22}
          onBack={onBack}
          showProgress={true}
        />
      </div>

      {/* Main Content Area (stays rendered underneath) */}
      <div 
        className={`flex-1 min-h-0 flex flex-col justify-between px-6 py-2 sm:py-3.5 overflow-y-auto no-scrollbar transition-all duration-300 ${
          isSheetOpen ? 'filter blur-[3px] opacity-70 pointer-events-none' : ''
        }`}
      >
        <div className="space-y-4">
          {/* Badge & Title */}
          <div>
            <PlayfulBadge text="STEP 01 • VERIFY PHONE" color="yellow" tilt="left" />
            <h2 className="text-3xl font-black text-[#251436] tracking-tight mt-2.5">
              Let's get you in 🪩
            </h2>
            <p className="text-xs font-semibold text-[#251436]/70 mt-1">
              Enter your phone number to start your STRING X journey.
            </p>
          </div>

          {/* Phone Sign-up Illustration (/assets/phone.png) */}
          <div className="flex items-center justify-center py-1 select-none">
            <img
              src="/assets/phone.png"
              alt="Phone sign up illustration"
              className="w-auto max-w-[140px] sm:max-w-[160px] max-h-[140px] sm:max-h-[160px] object-contain select-none pointer-events-none"
              loading="eager"
            />
          </div>

          {/* Mobile Number Input Section */}
          <div className="space-y-2 pt-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#251436]/70">
              Mobile Number
            </label>

            <div className="flex items-center gap-2">
              {/* Fixed Country Code Pill */}
              <div className="px-3.5 py-3.5 bg-white border-3 border-[#251436] rounded-2xl shadow-[3px_3px_0px_#251436] flex items-center gap-1.5 flex-shrink-0">
                <span className="text-base leading-none">🇮🇳</span>
                <span className="text-sm font-black text-[#251436]">+91</span>
              </div>

              {/* Phone Number Input */}
              <div className="flex-1 relative">
                <input
                  ref={phoneInputRef}
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={formatPhone(phoneDigits)}
                  onChange={handlePhoneChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && phoneDigits.length === 10) {
                      handleSendOtp();
                    }
                  }}
                  placeholder="Your phone number"
                  disabled={isSheetOpen}
                  className={`w-full px-4 py-3.5 bg-white border-3 rounded-2xl text-base font-extrabold text-[#251436] placeholder-[#251436]/40 shadow-[3px_3px_0px_#251436] focus:outline-none transition-all ${
                    phoneError
                      ? 'border-[#F02A8A] ring-2 ring-[#F02A8A]/30'
                      : 'border-[#251436] focus:ring-2 focus:ring-[#894EFF]'
                  }`}
                />
              </div>
            </div>

            {phoneError ? (
              <p className="text-xs font-bold text-[#F02A8A] mt-1 pl-1">
                ⚠️ {phoneError}
              </p>
            ) : (
              <p className="text-[11px] font-semibold text-[#251436]/60 pl-1">
                We'll send a quick 6-digit verification code.
              </p>
            )}
          </div>

          {/* Friendly trust note */}
          <div className="p-2.5 sm:p-3 bg-white/80 border-2 border-[#251436]/40 rounded-2xl flex items-center gap-2.5 shadow-xs">
            <span className="text-xl flex-shrink-0">🔒</span>
            <p className="text-xs font-semibold text-[#251436]/80 leading-snug">
              STRING X uses your phone only to coordinate your Navratri match. No spam, ever.
            </p>
          </div>
        </div>
      </div>

      {/* Anchored Bottom Navigation CTA */}
      <div className="shrink-0 px-6 pt-2 pb-3 sm:pb-4 pb-[max(12px,env(safe-area-inset-bottom,0px))] bg-[#E3E0F5]">
        <PrimaryButton
          label={isSendingOtp ? "Sending code..." : "Send OTP →"}
          onClick={handleSendOtp}
          disabled={phoneDigits.length !== 10 || isSendingOtp || isSheetOpen}
          variant="primary"
          icon={false}
        />
      </div>

      {/* ========================================================================= */}
      {/* OTP VERIFICATION MODAL BOTTOM SHEET OVERLAY & CONTAINER */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSheetOpen && (
          <>
            {/* Blurred & Dimmed Backdrop (rgba(37, 20, 54, 0.35)) */}
            <motion.div
              key="otp-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={handleDismissSheet}
              className="absolute inset-0 z-40 bg-[#251436]/35 backdrop-blur-[6px]"
              aria-label="Close OTP Bottom Sheet"
            />

            {/* Bottom Sheet Modal (Taller ~56% viewport, content-driven, balanced) */}
            <motion.div
              key="otp-bottom-sheet"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 28,
                stiffness: 300,
                mass: 0.8
              }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 90 || info.velocity.y > 400) {
                  handleDismissSheet();
                }
              }}
              className="absolute inset-x-0 bottom-0 z-50 bg-white border-t-3 border-x-3 border-[#251436] rounded-t-[36px] shadow-[0px_-8px_0px_#251436] flex flex-col min-h-[56%] sm:min-h-[500px] max-h-[82%] justify-between overflow-hidden"
            >
              {/* Top Handle / Drag indicator */}
              <div className="pt-3 pb-1 flex flex-col items-center cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 rounded-full bg-[#251436]/20" />
              </div>

              {/* Main Content with Intentional Vertical Rhythm */}
              <div className="px-6 flex-1 flex flex-col justify-between py-2">
                {/* 1. Header with subtle Edit action & Close button */}
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-black text-[#251436] tracking-tight">
                        Check your phone 📱
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <p className="text-xs font-semibold text-[#251436]/70">
                          We sent a 6-digit code to{' '}
                          <span className="font-extrabold text-[#251436]">
                            +91 {formatPhone(phoneDigits)}
                          </span>
                        </p>
                        <button
                          type="button"
                          onClick={handleDismissSheet}
                          className="inline-flex items-center text-[11px] font-bold text-[#894EFF]/85 hover:text-[#894EFF] underline decoration-dotted ml-1 transition-colors"
                          title="Change phone number"
                        >
                          Edit
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleDismissSheet}
                      className="w-8 h-8 rounded-full bg-[#E3E0F5] border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF] active:scale-95 transition-transform shadow-[1px_1px_0px_#251436] -mt-0.5"
                      aria-label="Close"
                    >
                      <X size={15} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* 2. StringX OTP Illustration Asset (/assets/otp.png) */}
                <div className="flex items-center justify-center py-1">
                  <img
                    src="/assets/otp.png"
                    alt="Verification illustration"
                    className="w-auto max-w-[190px] sm:max-w-[210px] max-h-[96px] sm:max-h-[105px] object-contain select-none pointer-events-none"
                    loading="eager"
                  />
                </div>

                {/* 3. OTP Input Section */}
                <div className="space-y-2">
                  {/* Subtle Secondary Label */}
                  <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#251436]/60">
                      ENTER YOUR CODE
                    </span>
                  </div>

                  {/* 6 Individual Digit Boxes */}
                  <div className="grid grid-cols-6 gap-2 sm:gap-2.5 max-w-xs mx-auto" onPaste={handleOtpPaste}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          otpInputsRef.current[index] = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => {
                          handleOtpKeyDown(index, e);
                          if (e.key === 'Enter' && isOtpComplete) {
                            handleVerify();
                          }
                        }}
                        className={`w-full aspect-square text-center text-2xl font-black rounded-2xl transition-all shadow-[2px_2px_0px_#251436] focus:outline-none ${
                          otpError
                            ? 'border-2.5 border-[#F02A8A] bg-[#F02A8A]/10 text-[#F02A8A] ring-2 ring-[#F02A8A]/30'
                            : digit
                            ? 'bg-[#E3E0F5]/45 border-2.5 border-[#251436] text-[#894EFF]'
                            : 'bg-white border-2 border-[#251436] text-[#251436] focus:border-[#894EFF] focus:ring-2 focus:ring-[#894EFF]/25'
                        }`}
                      />
                    ))}
                  </div>

                  {/* 4. Playful Micro-copy / Error Notice */}
                  <div className="text-center pt-1 min-h-[20px]">
                    {otpError ? (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs font-black text-[#F02A8A]"
                      >
                        {otpError}
                      </motion.p>
                    ) : (
                      <p className="text-xs font-semibold text-[#251436]/65">
                        Your secret little code is on its way ✨
                      </p>
                    )}
                  </div>
                </div>

                {/* 5. Resend compact text line */}
                <div className="text-center text-xs font-semibold text-[#251436]/70 pt-1 pb-1">
                  <span>Didn't get the code? </span>
                  {countdown > 0 ? (
                    <span className="font-semibold text-[#251436]/80">
                      Resend in <strong className="font-extrabold text-[#894EFF]">{formatTimer(countdown)}</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="font-black text-[#894EFF] hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                  {isResent && (
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-black text-[#08A98D] ml-2">
                      <Check size={12} strokeWidth={3} /> Resent!
                    </span>
                  )}
                </div>

                {/* 6. Primary Action Button */}
                <div className="pt-2 pb-6">
                  <motion.div
                    animate={isOtpComplete && !isVerifying && !isVerifiedSuccess ? { scale: [1, 1.015, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    <PrimaryButton
                      label={
                        isVerifiedSuccess
                          ? "Verified! 💃"
                          : isVerifying
                          ? "Verifying..."
                          : "Verify & Continue →"
                      }
                      onClick={handleVerify}
                      disabled={!isOtpComplete || isVerifying || isVerifiedSuccess}
                      variant="primary"
                      icon={false}
                      className={
                        isOtpComplete
                          ? 'shadow-[4px_4px_0px_#251436] bg-[#894EFF] hover:bg-[#783dee]'
                          : 'bg-[#D4CEEF]/60 text-[#251436]/40 border-[#251436]/30 shadow-none'
                      }
                    />
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
