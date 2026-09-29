import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, X, Pencil } from 'lucide-react';

interface PhotoPickerProps {
  value?: string;
  additionalPhotos?: string[];
  onChange: (mainPhoto: string, additionalPhotos: string[]) => void;
}

export const PhotoPicker: React.FC<PhotoPickerProps> = ({
  value = '',
  additionalPhotos = [],
  onChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [draggedSlot, setDraggedSlot] = useState<number | null>(null);

  // Normalize secondary photos to exactly 3 slots
  const secondaryPhotos = [
    additionalPhotos[0] || '',
    additionalPhotos[1] || '',
    additionalPhotos[2] || '',
  ];

  const handleOpenPicker = (slotIndex: number) => {
    setActiveSlot(slotIndex);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileProcess = (file: File, slotIndex: number) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (typeof e.target?.result === 'string') {
        const newPhotoUrl = e.target.result;
        if (slotIndex === 0) {
          onChange(newPhotoUrl, secondaryPhotos);
        } else {
          const updatedSecondary = [...secondaryPhotos];
          updatedSecondary[slotIndex - 1] = newPhotoUrl;
          onChange(value, updatedSecondary);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (slotIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (slotIndex === 0) {
      onChange('', secondaryPhotos);
    } else {
      const updatedSecondary = [...secondaryPhotos];
      updatedSecondary[slotIndex - 1] = '';
      onChange(value, updatedSecondary);
    }
  };

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDraggedSlot(null);
    if (e.dataTransfer.files?.[0]) {
      handleFileProcess(e.dataTransfer.files[0], slotIndex);
    }
  };

  return (
    <div className="w-full flex flex-col items-center select-none pt-1">
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0] && activeSlot !== null) {
            handleFileProcess(e.target.files[0], activeSlot);
          }
        }}
      />

      {/* 1. LARGE MAIN PHOTO SLOT */}
      <div className="w-full flex flex-col items-center mb-4">
        <motion.div
          id="main-photo-slot"
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.15 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDraggedSlot(0);
          }}
          onDragLeave={() => setDraggedSlot(null)}
          onDrop={(e) => handleDrop(e, 0)}
          onClick={() => handleOpenPicker(0)}
          className={`relative w-44 h-56 sm:w-48 sm:h-60 rounded-3xl border-3 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center ${
            draggedSlot === 0
              ? 'border-[#894EFF] bg-[#D4CEEF] shadow-[4px_4px_0px_#894EFF]'
              : 'border-[#251436] bg-[#F8F7FD] shadow-[4px_4px_0px_#251436] hover:bg-[#F2EFFB]'
          }`}
        >
          {value ? (
            /* Filled Main Photo State */
            <div className="relative w-full h-full group">
              <img
                src={value}
                alt="Main profile photo"
                className="w-full h-full object-cover rounded-[21px]"
                referrerPolicy="no-referrer"
              />
              {/* Subtle Edit / Change pill */}
              <button
                type="button"
                id="edit-main-photo-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenPicker(0);
                }}
                className="absolute top-2.5 right-2.5 bg-white/95 text-[#251436] text-[11px] font-black px-2.5 py-1 rounded-full border-2 border-[#251436] shadow-[2px_2px_0px_#251436] flex items-center gap-1 hover:bg-white active:scale-95 transition-all"
                title="Change photo"
              >
                <Pencil size={11} strokeWidth={2.5} />
                <span>Change</span>
              </button>

              {/* Remove button */}
              <button
                type="button"
                id="remove-main-photo-btn"
                onClick={(e) => handleRemovePhoto(0, e)}
                className="absolute top-2.5 left-2.5 w-6 h-6 bg-white/95 text-[#251436] rounded-full border-2 border-[#251436] shadow-[1px_1px_0px_#251436] flex items-center justify-center hover:bg-red-50 hover:text-red-600 active:scale-90 transition-all"
                title="Remove photo"
              >
                <X size={13} strokeWidth={3} />
              </button>

              {/* Subtle Main Photo Badge */}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-[#251436]/80 backdrop-blur-xs text-white text-[10px] font-black rounded-full border border-white/20 uppercase tracking-wider">
                Main Photo
              </div>
            </div>
          ) : (
            /* Empty Main Photo State */
            <div className="flex flex-col items-center justify-center p-4 text-center">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.95, 1.05, 1] }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="w-12 h-12 rounded-2xl bg-[#D4CEEF] border-2 border-[#251436] flex items-center justify-center mb-2.5 shadow-[2px_2px_0px_#251436]"
              >
                <Plus size={26} strokeWidth={3} className="text-[#894EFF]" />
              </motion.div>
              <span className="text-xs font-black text-[#251436] tracking-tight">
                Add your photo
              </span>
              <span className="text-[10px] font-bold text-[#251436]/60 mt-0.5">
                Tap to choose
              </span>
            </div>
          )}
        </motion.div>
      </div>

      {/* 2. THREE SECONDARY PHOTO SLOTS (ONE HORIZONTAL ROW) */}
      <div className="w-full max-w-[320px] flex flex-col items-center">
        <div className="grid grid-cols-3 gap-3 w-full">
          {secondaryPhotos.map((photo, index) => {
            const slotNumber = index + 1; // slots 1, 2, 3
            const hasPhoto = Boolean(photo);

            return (
              <motion.div
                key={slotNumber}
                id={`secondary-photo-slot-${slotNumber}`}
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.15 }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDraggedSlot(slotNumber);
                }}
                onDragLeave={() => setDraggedSlot(null)}
                onDrop={(e) => handleDrop(e, slotNumber)}
                onClick={() => handleOpenPicker(slotNumber)}
                className={`relative aspect-square w-full rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-200 flex flex-col items-center justify-center ${
                  draggedSlot === slotNumber
                    ? 'border-[#894EFF] bg-[#D4CEEF] shadow-[3px_3px_0px_#894EFF]'
                    : 'border-[#251436] bg-[#F8F7FD] shadow-[3px_3px_0px_#251436] hover:bg-[#F2EFFB]'
                }`}
              >
                {hasPhoto ? (
                  /* Filled Secondary Photo */
                  <div className="relative w-full h-full group">
                    <img
                      src={photo}
                      alt={`Secondary photo ${slotNumber}`}
                      className="w-full h-full object-cover rounded-[14px]"
                      referrerPolicy="no-referrer"
                    />
                    {/* Small remove icon */}
                    <button
                      type="button"
                      id={`remove-secondary-photo-${slotNumber}`}
                      onClick={(e) => handleRemovePhoto(slotNumber, e)}
                      className="absolute top-1.5 right-1.5 w-5 h-5 bg-white/95 text-[#251436] rounded-full border border-[#251436] shadow-[1px_1px_0px_#251436] flex items-center justify-center hover:bg-red-50 hover:text-red-600 active:scale-90 transition-all"
                      title="Remove"
                    >
                      <X size={11} strokeWidth={3} />
                    </button>
                  </div>
                ) : (
                  /* Empty Secondary Slot */
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-8 h-8 rounded-xl bg-[#D4CEEF] border-2 border-[#251436] flex items-center justify-center shadow-[1.5px_1.5px_0px_#251436]">
                      <Plus size={18} strokeWidth={3} className="text-[#894EFF]" />
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
