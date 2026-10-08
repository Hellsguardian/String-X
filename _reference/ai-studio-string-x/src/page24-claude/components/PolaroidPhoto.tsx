/// <reference path="../page24-env.d.ts" />
import { useEffect, useState } from 'react';
import placeholderCurrent from '../assets/photo-placeholder-current.svg?raw';
import placeholderMatch from '../assets/photo-placeholder-match.svg?raw';
import { InlineSvgBlock } from './InlineSvg';

export interface PolaroidPhotoProps {
  variant: 'current' | 'match';
  photoUrl: string | null;
  alt: string;
}

/** Photo window of a polaroid. Falls back to the design's gradient silhouette if there is no photo or it fails to load. */
export function PolaroidPhoto({ variant, photoUrl, alt }: PolaroidPhotoProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]);

  const showImage = !!photoUrl && !failed;

  return (
    <div className="p24-polaroid-photo">
      {showImage ? (
        <img
          className="p24-polaroid-img"
          src={photoUrl}
          alt={alt}
          draggable={false}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <InlineSvgBlock
          svg={variant === 'current' ? placeholderCurrent : placeholderMatch}
          className="p24-polaroid-placeholder"
        />
      )}
      <div className="p24-polaroid-sheen" />
    </div>
  );
}
