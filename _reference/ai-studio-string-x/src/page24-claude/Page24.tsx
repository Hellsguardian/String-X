import { useMemo, useRef } from 'react';
import './styles/fonts.css';
import './styles/Page24.css';
import type { Page24Copy, Page24Props, Page24ViewModel } from './types';
import { PAGE24_DESIGN_HEIGHT, PAGE24_DESIGN_WIDTH, Page24View } from './Page24View';
import { useStageScale } from './hooks/useStageScale';
import { courseAndYear, firstName, intersectInterests, yearBadge } from './utils/format';

const MAX_INTERESTS = 3;

/**
 * Page 24 — Match Reveal ("Strings attached").
 *
 * Self-contained: no router, no global CSS, no host wrapper required.
 * Renders the fixed 390 × 844 design and scales it uniformly ("contain")
 * to the available viewport, respecting device safe areas.
 */
export function Page24({
  currentUser,
  matchedUser,
  commonInterests,
  onBack,
  onMessage,
  onReject,
  onAccept,
  copy: copyOverrides,
  layout = 'fullscreen',
  className,
}: Page24Props) {
  const fitRef = useRef<HTMLDivElement>(null);
  const metrics = useStageScale(fitRef, PAGE24_DESIGN_WIDTH, PAGE24_DESIGN_HEIGHT);

  const model = useMemo<Page24ViewModel>(() => {
    const currentFirst = firstName(currentUser.name);
    const matchFirst = firstName(matchedUser.name);

    const matchLabel =
      matchedUser.age !== undefined && matchedUser.age !== null && `${matchedUser.age}` !== ''
        ? `${matchFirst}, ${matchedUser.age}`
        : matchFirst;

    const interests = (
      commonInterests ??
      (() => {
        const common = intersectInterests(currentUser.interests, matchedUser.interests);
        return common.length ? common : matchedUser.interests ?? [];
      })()
    )
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, MAX_INTERESTS);

    const copy: Page24Copy = {
      stickerTag: 'STRINGS ATTACHED',
      titleLine1: 'You found your',
      titleLine2: 'Garba partner.',
      matchSubtitle: `${matchFirst} · ${courseAndYear(matchedUser)}`,
      interestsLabel: 'COMMON INTERESTS',
      ctaLabel: 'Send a Message',
      backLabel: 'Back',
      currentPhotoAlt: 'Your photo',
      matchPhotoAlt: `${matchFirst}'s photo`,
      ...copyOverrides,
    };

    return {
      currentName: currentFirst,
      currentPhotoUrl: currentUser.photoUrl || null,
      currentYear: yearBadge(currentUser),
      matchLabel,
      matchPhotoUrl: matchedUser.photoUrl || null,
      matchYear: yearBadge(matchedUser),
      interests,
      copy,
    };
  }, [currentUser, matchedUser, commonInterests, copyOverrides]);

  const s = metrics?.scale ?? 1;
  const stageH = metrics?.stageHeight ?? PAGE24_DESIGN_HEIGHT;
  const t = metrics?.compactProgress ?? 0;

  // Background vertical anchor: moves upward by the exact reduced height
  // so the bottom of the background artwork remains preserved and excess is cropped from top.
  const bgShift = Math.max(0, PAGE24_DESIGN_HEIGHT - stageH);
  const bgTop = Math.round(-36 - bgShift);

  // Progressive vertical gap tightening based on t (0 = standard 844px, 1 = fully compact 580px)
  const headerTop = Math.round(18 - 4 * t);
  const ropeTop = Math.round(-30 * t);
  const polaroidTop = Math.round(140 - 30 * t);
  const ctaBottom = Math.round(20 - 5 * t);
  const ctaTop = stageH - ctaBottom - 62;
  const stickerHeight = 125;
  const stickerTop = Math.round(508 - 203 * t);
  const stickerBottom = stickerTop + stickerHeight;
  const actionsHeight = 48;
  const gapBetween = Math.max(8, Math.round((ctaTop - stickerBottom - actionsHeight) / 2));
  const actionsTop = stickerBottom + gapBetween;
  const sheetHeight = Math.max(160, Math.round(stageH - (stickerTop + 34)));

  return (
    <div
      className={['p24-root', `p24-root--${layout}`, className].filter(Boolean).join(' ')}
      data-page24=""
    >
      <div className="p24-fit" ref={fitRef}>
        <div
          className={`p24-stage-box${metrics === null ? ' p24-stage-box--measuring' : ''}`}
          style={{ width: PAGE24_DESIGN_WIDTH * s, height: stageH * s }}
        >
          <div
            className="p24-stage"
            style={{
              height: stageH,
              transform: `scale(${s})`,
              ['--p24-bg-top' as string]: `${bgTop}px`,
              ['--p24-header-top' as string]: `${headerTop}px`,
              ['--p24-rope-top' as string]: `${ropeTop}px`,
              ['--p24-polaroid-top' as string]: `${polaroidTop}px`,
              ['--p24-gate-top' as string]: `${bgTop}px`,
              ['--p24-sticker-top' as string]: `${stickerTop}px`,
              ['--p24-actions-top' as string]: `${actionsTop}px`,
              ['--p24-cta-bottom' as string]: `${ctaBottom}px`,
              ['--p24-sheet-h' as string]: `${sheetHeight}px`,
            }}
          >
            <Page24View
              model={model}
              onBack={onBack}
              onMessage={onMessage}
              onReject={onReject}
              onAccept={onAccept}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Page24;
