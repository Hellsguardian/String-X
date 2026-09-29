import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, Check, X, Search } from 'lucide-react';

export const UNDERGRAD_COURSES = [
  'Diploma',
  'B.Tech',
  'BBA',
  'BCA',
  'B.Sc',
  'B.Pharm',
  'B.Com',
  'B.Sc Nursing',
  'BPT',
  'B.Sc Agriculture',
  'B.Arch',
  'B.A.',
  'B.Des',
  'BAMS',
  'BHMS',
  'B.Sc Medical Science',
  'B.Sc Public Health',
  'BHMCT',
  'BBA LL.B',
  'BA LL.B',
  'B.Com LL.B',
  'Bachelor of Visual Arts',
  'Bachelor of Performing Arts',
  'Bachelor of Social Work',
  'Bachelor of Physical Education & Sports',
  'Bachelor of Library & Information Science',
  'Other',
];

export const POSTGRAD_COURSES = [
  'MBA',
  'MCA',
  'M.Tech',
  'M.Sc',
  'M.Com',
  'M.Pharm',
  'M.A.',
  'MPT',
  'M.Sc Nursing',
  'LL.M',
  'M.Des',
  'M.Arch',
  'MD / MS',
  'MPH',
  'MSW',
  'MHMCT',
  'Other',
];

const UG_POPULAR = ['B.Tech', 'BCA', 'BBA', 'B.Com', 'B.Sc'];
const PG_POPULAR = ['MBA', 'MCA', 'M.Tech', 'M.Sc', 'M.Com'];

interface CourseSelectorProps {
  collegeYear: string;
  value: string;
  onChange: (course: string) => void;
}

export const CourseSelector: React.FC<CourseSelectorProps> = ({
  collegeYear,
  value,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const isPostgrad = collegeYear === 'PG';
  const allCourses = isPostgrad ? POSTGRAD_COURSES : UNDERGRAD_COURSES;
  const popularCourses = isPostgrad ? PG_POPULAR : UG_POPULAR;

  const filteredCourses = allCourses.filter((course) =>
    course.toLowerCase().includes(search.toLowerCase().trim())
  );

  const handleSelectCourse = (course: string) => {
    onChange(course);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="w-full select-none">
      {/* 1. MAIN SELECTION CARD (Modeled directly after Home State) */}
      <motion.button
        type="button"
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(true)}
        className="w-full p-4 rounded-2xl bg-white border-3 border-[#251436] shadow-[4px_4px_0px_#251436] flex items-center justify-between transition-all hover:bg-white/95 cursor-pointer text-left"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1 pr-2">
          {/* Decorative Course Icon Badge */}
          <div className="w-12 h-12 rounded-xl bg-[#FFC928] border-2 border-[#251436] flex items-center justify-center text-xl flex-shrink-0 shadow-[1px_1px_0px_#251436]">
            <GraduationCap size={24} strokeWidth={2.5} className="text-[#251436]" />
          </div>

          <div className="text-left min-w-0 flex-1">
            <span
              className={`text-[11px] font-extrabold uppercase tracking-wider block ${
                value ? 'text-[#894EFF]' : 'text-[#251436]/60'
              }`}
            >
              {value ? 'SELECTED COURSE' : 'YOUR COURSE'}
            </span>
            <span
              className={`text-lg sm:text-xl font-black block truncate ${
                value ? 'text-[#251436]' : 'text-[#251436]/40'
              }`}
            >
              {value || 'Choose your course'}
            </span>
          </div>
        </div>

        {/* Action Button: Change ▾ or Select ▾ */}
        <div
          className={`px-3 py-1.5 rounded-xl border-2 border-[#251436] text-xs font-black text-[#251436] flex-shrink-0 transition-colors ${
            value ? 'bg-[#D4CEEF]' : 'bg-[#FFC928] shadow-[1px_1px_0px_#251436]'
          }`}
        >
          {value ? 'Change ▾' : 'Select ▾'}
        </div>
      </motion.button>

      {/* 2. POPULAR QUICK-PICK CHIPS (Modeled directly after Home State) */}
      <div className="mt-4">
        <span className="text-xs font-bold text-[#251436]/70 uppercase tracking-wider block mb-2">
          POPULAR COURSES
        </span>
        <div className="flex flex-wrap gap-2">
          {popularCourses.map((course) => {
            const isSelected = value === course;
            return (
              <motion.button
                key={course}
                type="button"
                whileTap={{ scale: 0.96 }}
                onClick={() => onChange(course)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#894EFF] text-white border-[#251436] shadow-[2px_2px_0px_#251436]'
                    : 'bg-white text-[#251436] border-[#251436]/30 hover:border-[#251436] hover:bg-white shadow-[1.5px_1.5px_0px_#251436]'
                }`}
              >
                {course}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 3. FULL COURSE SELECTION BOTTOM SHEET / OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-[#251436]/60 backdrop-blur-xs">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              className="w-full max-w-md bg-[#E3E0F5] border-t-4 sm:border-4 border-[#251436] rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 max-h-[82vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3.5">
                <div>
                  <h3 className="text-2xl font-black text-[#251436] leading-tight">
                    Pick your course
                  </h3>
                  <p className="text-xs font-semibold text-[#251436]/70 mt-0.5">
                    Choose what you're studying.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className="w-9 h-9 rounded-full bg-white border-2 border-[#251436] flex items-center justify-center text-[#251436] hover:bg-[#D4CEEF] transition-colors cursor-pointer shadow-[1px_1px_0px_#251436]"
                >
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Search input */}
              <div className="relative mb-3">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#251436]/60"
                />
                <input
                  type="text"
                  placeholder="Search course name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-[#251436] rounded-xl text-sm font-bold text-[#251436] placeholder:text-[#251436]/40 focus:outline-hidden focus:ring-2 focus:ring-[#894EFF]"
                />
              </div>

              {/* Single-column Course list */}
              <div className="overflow-y-auto space-y-2 flex-1 pr-1 pb-1">
                {filteredCourses.length > 0 ? (
                  filteredCourses.map((course) => {
                    const isSelected = value === course;
                    return (
                      <motion.button
                        key={course}
                        type="button"
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectCourse(course)}
                        className={`w-full p-3.5 rounded-xl border-2 font-bold text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#894EFF] text-white border-[#251436] shadow-[3px_3px_0px_#251436]'
                            : 'bg-white text-[#251436] border-[#251436]/20 hover:border-[#251436]'
                        }`}
                      >
                        <span className="leading-snug break-words pr-2">
                          {course}
                        </span>
                        {isSelected && <Check size={18} strokeWidth={3} />}
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-sm font-bold text-[#251436]/60">
                    No course found for "{search}"
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
