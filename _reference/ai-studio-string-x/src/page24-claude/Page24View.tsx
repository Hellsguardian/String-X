import { useState } from 'react';
import type { Page24ViewModel } from './types';
import { ActionButtons } from './components/ActionButtons';
import { CampusGate } from './components/CampusGate';
import { HangingPolaroid } from './components/HangingPolaroid';
import { Header } from './components/Header';
import { MatchSticker } from './components/MatchSticker';
import { MessageButton } from './components/MessageButton';
import { RejectConfirmModal } from './components/RejectConfirmModal';
import { RopeString } from './components/RopeString';
import { SkyLayer } from './components/SkyLayer';

export const PAGE24_DESIGN_WIDTH = 390;
export const PAGE24_DESIGN_HEIGHT = 844;

export interface Page24ViewProps {
  model: Page24ViewModel;
  onBack?: () => void;
  onMessage?: () => void;
  onReject?: () => void;
  onAccept?: () => void;
}

/**
 * The fixed 390 × 844 stage, layered exactly like the design
 * (back to front): sky → campus gate → header → rope → polaroids →
 * bottom sheet → sticker → action buttons (✕ & ✓) → CTA → reject modal.
 *
 * Not responsive on its own — Page24 scales it to the viewport.
 */
export function Page24View({
  model,
  onBack,
  onMessage,
  onReject,
  onAccept,
}: Page24ViewProps) {
  const { copy } = model;
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleOpenRejectModal = () => {
    setShowRejectModal(true);
  };

  const handleCloseRejectModal = () => {
    setShowRejectModal(false);
  };

  const handleConfirmReject = () => {
    setShowRejectModal(false);
    onReject?.();
  };

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    } else if (onMessage) {
      onMessage();
    }
  };

  return (
    <>
      <SkyLayer />
      <CampusGate />
      <Header backLabel={copy.backLabel} onBack={onBack} />
      <RopeString />
      <HangingPolaroid
        variant="current"
        label={model.currentName}
        photoUrl={model.currentPhotoUrl}
        photoAlt={copy.currentPhotoAlt}
        year={model.currentYear}
      />
      <HangingPolaroid
        variant="match"
        label={model.matchLabel}
        photoUrl={model.matchPhotoUrl}
        photoAlt={copy.matchPhotoAlt}
        year={model.matchYear}
      />
      <div className="p24-sheet" />
      <MatchSticker
        tag={copy.stickerTag}
        titleLine1={copy.titleLine1}
        titleLine2={copy.titleLine2}
        subtitle={copy.matchSubtitle}
      />
      <ActionButtons
        onReject={handleOpenRejectModal}
        onAccept={handleAccept}
      />
      <MessageButton label={copy.ctaLabel} onMessage={onMessage} />

      {showRejectModal && (
        <RejectConfirmModal
          onCancel={handleCloseRejectModal}
          onConfirm={handleConfirmReject}
        />
      )}
    </>
  );
}
