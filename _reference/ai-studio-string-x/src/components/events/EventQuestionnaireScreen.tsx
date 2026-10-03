import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';
import { EventDefinition, EventQuestion } from '../../types/events';

interface EventQuestionnaireScreenProps {
  event: EventDefinition;
  onComplete: (answers: Record<string, any>) => void;
  onCancel: () => void;
}

export const EventQuestionnaireScreen: React.FC<EventQuestionnaireScreenProps> = ({
  event,
  onComplete,
  onCancel,
}) => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});

  const question: EventQuestion = event.questions[currentIdx];
  const totalQuestions = event.questions.length;
  const currentAnswer = answers[question.id];

  const handleSelectAnswer = (value: any) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const isCurrentAnswerValid = () => {
    if (question.type === 'slider') {
      return typeof currentAnswer === 'number' || currentAnswer !== undefined;
    }
    return currentAnswer !== undefined && currentAnswer !== '';
  };

  const handleNext = () => {
    if (!isCurrentAnswerValid()) return;

    if (currentIdx < totalQuestions - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Completed all questions for this event!
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    } else {
      onCancel();
    }
  };

  const progressPercent = ((currentIdx + 1) / totalQuestions) * 100;

  return (
    <div className="w-full flex-1 flex flex-col justify-between overflow-hidden bg-[#E3E0F5] text-[#251436] select-none">
      {/* Top Navigation Bar with Progress */}
      <div className="shrink-0 px-5 pt-3 pb-2 bg-[#E3E0F5]">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={handleBack}
            className="w-9 h-9 rounded-xl bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] shadow-[2px_2px_0px_#251436] active:translate-y-0.5 cursor-pointer transition-all"
            aria-label="Previous question"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
          </button>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-[#894EFF] bg-white border border-[#251436] px-2.5 py-0.5 rounded-full shadow-[1.5px_1.5px_0px_#251436]">
              {event.title}
            </span>
            <span className="text-xs font-mono font-bold text-[#251436]/70">
              {currentIdx + 1}/{totalQuestions}
            </span>
          </div>

          <div className="w-9" />
        </div>

        {/* Tactile Progress Track */}
        <div className="w-full h-2.5 bg-white rounded-full border-2 border-[#251436] overflow-hidden p-0.5 shadow-[1.5px_1.5px_0px_#251436]">
          <motion.div
            className="h-full bg-[#894EFF] rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Content (Animated Slide) */}
      <div className="flex-1 flex flex-col justify-start px-5 py-2 overflow-y-auto no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={question.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full flex-1 flex flex-col"
          >
            {/* Question Header */}
            <div className="mb-3.5">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#894EFF]">
                {question.numberLabel}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-[#251436] tracking-tight mt-0.5 leading-snug">
                {question.title}
              </h2>
              {question.subtitle && (
                <p className="text-xs font-semibold text-[#251436]/70 mt-1 leading-normal">
                  {question.subtitle}
                </p>
              )}
            </div>

            {/* 1. CARDS SELECTOR */}
            {question.type === 'cards' && question.options && (
              <div className="flex flex-col gap-2.5">
                {question.options.map((opt) => {
                  const isSelected = currentAnswer === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSelectAnswer(opt.id)}
                      className={`w-full text-left p-3.5 rounded-2xl border-3 border-[#251436] transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#894EFF] text-white shadow-[3px_3px_0px_#251436] -translate-y-0.5'
                          : 'bg-white text-[#251436] shadow-[2.5px_2.5px_0px_#251436] hover:bg-[#FDFCFE]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {opt.emoji && (
                          <div
                            className={`w-10 h-10 rounded-xl border-2 border-[#251436] flex items-center justify-center text-xl shrink-0 ${
                              isSelected ? 'bg-white/20' : 'bg-[#E3E0F5]'
                            }`}
                          >
                            <span>{opt.emoji}</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-black leading-tight">
                            {opt.title}
                          </div>
                          {opt.subtitle && (
                            <div
                              className={`text-[11px] font-medium leading-tight mt-0.5 ${
                                isSelected ? 'text-white/80' : 'text-[#251436]/65'
                              }`}
                            >
                              {opt.subtitle}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-full border-2 border-[#251436] flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? 'bg-[#FFC928] text-[#251436]' : 'bg-transparent'
                        }`}
                      >
                        {isSelected && <Check size={14} strokeWidth={3.5} />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* 2. SCALE SELECTOR */}
            {question.type === 'scale' && question.scalePoints && (
              <div className="w-full my-auto py-4">
                <div className="grid grid-cols-2 gap-3">
                  {question.scalePoints.map((pt) => {
                    const isSelected = currentAnswer === pt.value;
                    return (
                      <motion.button
                        key={pt.value}
                        type="button"
                        whileTap={{ scale: 0.96 }}
                        onClick={() => handleSelectAnswer(pt.value)}
                        className={`p-4 rounded-2xl border-3 border-[#251436] flex flex-col items-center text-center cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#894EFF] text-white shadow-[3px_3px_0px_#251436] -translate-y-0.5'
                            : 'bg-white text-[#251436] shadow-[2.5px_2.5px_0px_#251436] hover:bg-[#FDFCFE]'
                        }`}
                      >
                        <span className="text-3xl mb-2">{pt.emoji || '✨'}</span>
                        <span className="text-sm font-black">{pt.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. TACTILE SLIDER */}
            {question.type === 'slider' && (
              <div className="w-full my-auto py-6 flex flex-col items-center">
                {/* Visual Level Display */}
                <div className="w-24 h-24 rounded-full border-3 border-[#251436] bg-white shadow-[4px_4px_0px_#251436] flex flex-col items-center justify-center mb-6">
                  <span className="text-2xl font-black text-[#894EFF]">
                    {currentAnswer !== undefined
                      ? `${currentAnswer}%`
                      : `${question.sliderConfig?.defaultValue || 70}%`}
                  </span>
                  <span className="text-[10px] font-bold text-[#251436]/60 uppercase">
                    {(currentAnswer ?? 70) > 75
                      ? 'Wild ⚡'
                      : (currentAnswer ?? 70) > 40
                      ? 'Balanced 💃'
                      : 'Chill ☕'}
                  </span>
                </div>

                {/* Range Input Slider */}
                <div className="w-full px-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentAnswer ?? question.sliderConfig?.defaultValue ?? 70}
                    onChange={(e) => handleSelectAnswer(Number(e.target.value))}
                    className="w-full h-4 bg-white rounded-lg appearance-none cursor-pointer border-2 border-[#251436] accent-[#894EFF] shadow-[2px_2px_0px_#251436]"
                  />

                  <div className="flex justify-between items-center text-xs font-black text-[#251436] mt-3">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#251436]/30">
                      {question.sliderConfig?.minLabel || 'Keep it chill'}
                    </span>
                    <span className="bg-white px-2 py-0.5 rounded-md border border-[#251436]/30">
                      {question.sliderConfig?.maxLabel || "LET'S MEET EVERYONE"}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Anchored Bottom CTA Button */}
      <div className="shrink-0 px-5 pt-2 pb-4 bg-[#E3E0F5]">
        <button
          type="button"
          onClick={handleNext}
          disabled={!isCurrentAnswerValid()}
          className={`w-full py-3.5 px-6 rounded-2xl text-base font-black border-3 border-[#251436] transition-all flex items-center justify-center gap-2 ${
            isCurrentAnswerValid()
              ? 'bg-[#894EFF] text-white shadow-[3.5px_3.5px_0px_#251436] hover:bg-[#783dee] active:translate-y-0.5 cursor-pointer'
              : 'bg-white/40 text-[#251436]/40 shadow-none cursor-not-allowed pointer-events-none'
          }`}
        >
          <span>
            {currentIdx === totalQuestions - 1 ? 'Find My Matches' : 'Continue'}
          </span>
          <ArrowRight size={18} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};
