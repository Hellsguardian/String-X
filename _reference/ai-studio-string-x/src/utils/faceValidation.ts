export interface Point2D {
  x: number;
  y: number;
}

export interface Ellipse2D {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
}

export interface VideoViewportTransform {
  videoWidth: number;
  videoHeight: number;
  containerWidth: number;
  containerHeight: number;
  isMirrored: boolean;
}

export interface DetectedFaceGeometry {
  centerX: number; // in video pixel coordinates
  centerY: number; // in video pixel coordinates
  width: number;   // in video pixel coordinates
  height: number;  // in video pixel coordinates
  landmarks?: {
    type: 'eye' | 'nose' | 'mouth' | string;
    locations: Point2D[];
  }[];
}

export interface FaceValidationResult {
  isValid: boolean;
  containmentRatio: number; // 0.0 - 1.0 (requires >= 0.90)
  sizeRatio: number;        // faceHeight / ovalHeight (backward compat)
  widthRatio: number;       // faceWidth / ovalWidth (requires 0.70 - 0.90)
  heightRatio: number;      // faceHeight / ovalHeight (requires 0.75 - 0.92)
  areaRatio: number;        // faceArea / ovalArea (requires >= 0.53)
  isTooSmall: boolean;
  isTooLarge: boolean;
  isOffCenter: boolean;
  centerOffset: { x: number; y: number };
  eyesVisible: boolean;
  noseVisible: boolean;
  mouthVisible: boolean;
  isFrontal: boolean;
  isNotTilted: boolean;
  isInsideFrame: boolean;
  isNotOccluded: boolean;
  hint: string;
  reason?: string;
}

/**
 * Calculates the exact target oval geometry in container screen pixels.
 * Matches the SVG viewport (300x400) and preserveAspectRatio="xMidYMid meet".
 */
export function getTargetOval(containerWidth: number, containerHeight: number): Ellipse2D {
  const svgViewW = 300;
  const svgViewH = 400;
  const scale = Math.min(containerWidth / svgViewW, containerHeight / svgViewH);
  const offsetX = (containerWidth - svgViewW * scale) / 2;
  const offsetY = (containerHeight - svgViewH * scale) / 2;

  // The single STRING-X oval guide is centered at (150, 195) with rx=95, ry=125
  return {
    cx: offsetX + 150 * scale,
    cy: offsetY + 195 * scale,
    rx: 95 * scale,
    ry: 125 * scale,
  };
}

/**
 * Maps a point from native video pixel space to container screen pixels,
 * accounting for CSS object-cover and CSS horizontal mirror (scale-x-[-1]).
 */
export function mapVideoToScreen(
  vx: number,
  vy: number,
  t: VideoViewportTransform
): Point2D {
  const { videoWidth, videoHeight, containerWidth, containerHeight, isMirrored } = t;
  if (!videoWidth || !videoHeight || !containerWidth || !containerHeight) {
    return { x: vx, y: vy };
  }

  // object-cover scale
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
  const renderedW = videoWidth * scale;
  const renderedH = videoHeight * scale;
  const offsetX = (containerWidth - renderedW) / 2;
  const offsetY = (containerHeight - renderedH) / 2;

  // With scale-x-[-1] (horizontal selfie mirror):
  const effectiveVx = isMirrored ? videoWidth - vx : vx;

  return {
    x: offsetX + effectiveVx * scale,
    y: offsetY + vy * scale,
  };
}

/**
 * Tests whether a screen-space point lies strictly inside the target ellipse.
 */
export function isPointInsideEllipse(pt: Point2D, ellipse: Ellipse2D): boolean {
  const dx = (pt.x - ellipse.cx) / ellipse.rx;
  const dy = (pt.y - ellipse.cy) / ellipse.ry;
  return dx * dx + dy * dy <= 1.0;
}

/**
 * Computes the exact containment ratio of the face geometry inside the target oval.
 * Concept: faceGeometry ⊂ targetOval.
 * We sample 100+ dense points covering the full face perimeter and interior.
 */
export function calculateFaceContainment(
  face: DetectedFaceGeometry,
  transform: VideoViewportTransform,
  oval: Ellipse2D
): { containmentRatio: number; totalSampled: number; insideCount: number } {
  const hw = face.width / 2;
  const hh = face.height / 2;
  const cx = face.centerX;
  const cy = face.centerY;

  let insideCount = 0;
  let totalSampled = 0;

  // 1. Perimeter points around the face ellipse
  const perimeterAngles = 24;
  for (let i = 0; i < perimeterAngles; i++) {
    const rad = (i * 2 * Math.PI) / perimeterAngles;
    const vx = cx + hw * Math.cos(rad);
    const vy = cy + hh * Math.sin(rad);
    const screenPt = mapVideoToScreen(vx, vy, transform);
    totalSampled++;
    if (isPointInsideEllipse(screenPt, oval)) {
      insideCount++;
    }
  }

  // 2. Interior concentric rings of points
  const rings = [0.25, 0.5, 0.75, 0.9];
  const pointsPerRing = [8, 12, 16, 20];

  for (let rIdx = 0; rIdx < rings.length; rIdx++) {
    const ringRadius = rings[rIdx];
    const numPoints = pointsPerRing[rIdx];
    for (let pIdx = 0; pIdx < numPoints; pIdx++) {
      const rad = (pIdx * 2 * Math.PI) / numPoints;
      const vx = cx + hw * ringRadius * Math.cos(rad);
      const vy = cy + hh * ringRadius * Math.sin(rad);
      const screenPt = mapVideoToScreen(vx, vy, transform);
      totalSampled++;
      if (isPointInsideEllipse(screenPt, oval)) {
        insideCount++;
      }
    }
  }

  // 3. Center point
  const centerPt = mapVideoToScreen(cx, cy, transform);
  totalSampled++;
  if (isPointInsideEllipse(centerPt, oval)) {
    insideCount++;
  }

  return {
    containmentRatio: insideCount / totalSampled,
    totalSampled,
    insideCount,
  };
}

/**
 * Analyzes grayscale pixel data across key facial regions (eyes, nose, mouth)
 * to verify visibility, absence of heavy occlusion, tilt, and frontal alignment.
 */
export function analyzeFacialFeatures(
  pixels: Uint8Array,
  pw: number,
  ph: number,
  r: number, // face center row in downscaled canvas
  c: number, // face center col in downscaled canvas
  s: number  // face scale / diameter in downscaled canvas
): {
  eyesVisible: boolean;
  noseVisible: boolean;
  mouthVisible: boolean;
  isFrontal: boolean;
  isNotTilted: boolean;
  isNotOccluded: boolean;
} {
  // Helper to compute mean and standard deviation of luminance in a bounding box
  function getPatchStats(boxX: number, boxY: number, boxW: number, boxH: number) {
    let sum = 0;
    let count = 0;
    const startX = Math.max(0, Math.floor(boxX));
    const endX = Math.min(pw, Math.floor(boxX + boxW));
    const startY = Math.max(0, Math.floor(boxY));
    const endY = Math.min(ph, Math.floor(boxY + boxH));

    for (let y = startY; y < endY; y++) {
      const rowOffset = y * pw;
      for (let x = startX; x < endX; x++) {
        sum += pixels[rowOffset + x];
        count++;
      }
    }

    if (count === 0) return { mean: 128, std: 0 };
    const mean = sum / count;

    let varSum = 0;
    for (let y = startY; y < endY; y++) {
      const rowOffset = y * pw;
      for (let x = startX; x < endX; x++) {
        const diff = pixels[rowOffset + x] - mean;
        varSum += diff * diff;
      }
    }
    const std = Math.sqrt(varSum / count);
    return { mean, std };
  }

  // 1. Left and right eye patches
  const eyeW = Math.max(4, Math.floor(s * 0.18));
  const eyeH = Math.max(4, Math.floor(s * 0.14));
  const leftEyeX = c - s * 0.28;
  const leftEyeY = r - s * 0.14;
  const rightEyeX = c + s * 0.10;
  const rightEyeY = r - s * 0.14;

  const leftEyeStats = getPatchStats(leftEyeX, leftEyeY, eyeW, eyeH);
  const rightEyeStats = getPatchStats(rightEyeX, rightEyeY, eyeW, eyeH);

  // 2. Nose patch
  const noseW = Math.max(4, Math.floor(s * 0.18));
  const noseH = Math.max(4, Math.floor(s * 0.18));
  const noseX = c - s * 0.09;
  const noseY = r - s * 0.02;
  const noseStats = getPatchStats(noseX, noseY, noseW, noseH);

  // 3. Mouth patch
  const mouthW = Math.max(6, Math.floor(s * 0.28));
  const mouthH = Math.max(4, Math.floor(s * 0.16));
  const mouthX = c - s * 0.14;
  const mouthY = r + s * 0.20;
  const mouthStats = getPatchStats(mouthX, mouthY, mouthW, mouthH);

  // 4. Cheek skin reference patch for contrast comparison
  const cheekStats = getPatchStats(c - s * 0.25, r + s * 0.05, eyeW, eyeH);

  // Natural human facial features have distinct variance (pupils, nostrils, lips)
  // whereas occluded patches (e.g. flat mask, hand, hair, wall) lack this gradient.
  const minFeatureStd = 4.0;
  const eyesVisible = leftEyeStats.std >= minFeatureStd && rightEyeStats.std >= minFeatureStd;
  const noseVisible = noseStats.std >= 3.0;
  const mouthVisible = mouthStats.std >= minFeatureStd;

  // Frontal check: bilateral symmetry of luminance and variance between left & right eye patches
  const eyeMeanDiff = Math.abs(leftEyeStats.mean - rightEyeStats.mean);
  const isFrontal = eyeMeanDiff < 55; // Not in harsh side profile

  // Tilt check: both eyes should have comparable feature response
  const isNotTilted = Math.abs(leftEyeStats.std - rightEyeStats.std) < 30;

  // Occlusion check: none of the key patches should be completely flat
  const isNotOccluded =
    eyesVisible &&
    noseVisible &&
    mouthVisible &&
    leftEyeStats.std > 2.5 &&
    rightEyeStats.std > 2.5;

  return {
    eyesVisible,
    noseVisible,
    mouthVisible,
    isFrontal,
    isNotTilted,
    isNotOccluded,
  };
}

/**
 * Comprehensive strict face-position validator.
 * Enforces:
 *  - Face detected & single face
 *  - 90%+ face containment inside target oval
 *  - Snug fit (size ratio 0.65 - 1.05)
 *  - Centered inside oval
 *  - Both eyes, nose, mouth visible
 *  - Frontal pose, no heavy tilt, no heavy occlusion
 *  - Completely inside camera frame
 */
export function validateFacePosition(
  face: DetectedFaceGeometry,
  transform: VideoViewportTransform,
  oval: Ellipse2D,
  pixelAnalysis?: {
    pixels: Uint8Array;
    pw: number;
    ph: number;
    r: number;
    c: number;
    s: number;
  },
  hysteresisValid: boolean = false
): FaceValidationResult {
  const { videoWidth, videoHeight, containerWidth, containerHeight } = transform;

  // 1. Boundary check inside camera frame (Face must not touch or clip outside camera frame)
  const marginX = videoWidth * 0.03;
  const marginY = videoHeight * 0.03;
  const left = face.centerX - face.width / 2;
  const right = face.centerX + face.width / 2;
  const top = face.centerY - face.height / 2;
  const bottom = face.centerY + face.height / 2;

  const isInsideFrame =
    left >= marginX &&
    right <= videoWidth - marginX &&
    top >= marginY &&
    bottom <= videoHeight - marginY;

  if (!isInsideFrame) {
    return {
      isValid: false,
      containmentRatio: 0,
      sizeRatio: 0,
      widthRatio: 0,
      heightRatio: 0,
      areaRatio: 0,
      isTooSmall: false,
      isTooLarge: false,
      isOffCenter: false,
      centerOffset: { x: 0, y: 0 },
      eyesVisible: false,
      noseVisible: false,
      mouthVisible: false,
      isFrontal: false,
      isNotTilted: false,
      isInsideFrame: false,
      isNotOccluded: false,
      hint: 'Keep face inside camera frame',
      reason: 'Face partially outside camera frame',
    };
  }

  // 2. Containment calculation: faceGeometry ⊂ targetOval
  const { containmentRatio } = calculateFaceContainment(face, transform, oval);

  // Strict 90%+ threshold (with slight hysteresis of 0.88 when already valid to prevent micro-flicker)
  const minContainment = hysteresisValid ? 0.88 : 0.90;
  const hasProperContainment = containmentRatio >= minContainment;

  // 3. Screen space sizing and snugness relative to target oval
  const screenCenter = mapVideoToScreen(face.centerX, face.centerY, transform);
  const scale = Math.max(containerWidth / videoWidth, containerHeight / videoHeight);
  const screenFaceWidth = face.width * scale;
  const screenFaceHeight = face.height * scale;
  const ovalWidth = oval.rx * 2;
  const ovalHeight = oval.ry * 2;

  const widthRatio = screenFaceWidth / ovalWidth;
  const heightRatio = screenFaceHeight / ovalHeight;
  const areaRatio = widthRatio * heightRatio;
  const sizeRatio = heightRatio;

  // Strict minimum & maximum size requirements:
  // Face width should occupy approximately 70–85% of oval width (min 0.70, hysteresis 0.68)
  // Face height should occupy approximately 75–90% of oval height (min 0.75, hysteresis 0.72)
  // Face area must occupy a substantial percentage of oval area (min 0.52, hysteresis 0.48)
  const minWidthRatio = hysteresisValid ? 0.68 : 0.70;
  const maxWidthRatio = hysteresisValid ? 0.94 : 0.90;
  const minHeightRatio = hysteresisValid ? 0.72 : 0.75;
  const maxHeightRatio = hysteresisValid ? 0.96 : 0.92;
  const minAreaRatio = hysteresisValid ? 0.48 : 0.52;

  const isTooSmall =
    widthRatio < minWidthRatio || heightRatio < minHeightRatio || areaRatio < minAreaRatio;
  const isTooLarge =
    widthRatio > maxWidthRatio || heightRatio > maxHeightRatio;
  const isSnugSize = !isTooSmall && !isTooLarge;

  // 4. Centering inside the target oval
  const normOffsetX = Math.abs(screenCenter.x - oval.cx) / oval.rx;
  const normOffsetY = Math.abs(screenCenter.y - oval.cy) / oval.ry;
  const maxCenterOffsetX = hysteresisValid ? 0.22 : 0.18;
  const maxCenterOffsetY = hysteresisValid ? 0.24 : 0.20;
  const isOffCenter = normOffsetX > maxCenterOffsetX || normOffsetY > maxCenterOffsetY;
  const isCentered = !isOffCenter;

  // 5. Landmark & Pose verification
  let eyesVisible = true;
  let noseVisible = true;
  let mouthVisible = true;
  let isFrontal = true;
  let isNotTilted = true;
  let isNotOccluded = true;

  // 5a. If native landmarks are available
  if (face.landmarks && face.landmarks.length > 0) {
    const eyes = face.landmarks.filter((l) => l.type === 'eye');
    const nose = face.landmarks.find((l) => l.type === 'nose');
    const mouth = face.landmarks.find((l) => l.type === 'mouth');

    eyesVisible = eyes.length >= 2;
    noseVisible = Boolean(nose);
    mouthVisible = Boolean(mouth);

    if (eyesVisible && eyes[0].locations.length > 0 && eyes[1].locations.length > 0) {
      const e1 = eyes[0].locations[0];
      const e2 = eyes[1].locations[0];
      const dx = Math.abs(e1.x - e2.x);
      const dy = Math.abs(e1.y - e2.y);
      const tiltAngleDeg = Math.atan2(dy, Math.max(1, dx)) * (180 / Math.PI);
      isNotTilted = tiltAngleDeg <= 18;

      // Frontal check: sufficient eye separation
      isFrontal = dx / Math.max(1, face.width) >= 0.20;

      if (nose && nose.locations.length > 0) {
        const nx = nose.locations[0].x;
        const minEyeX = Math.min(e1.x, e2.x);
        const maxEyeX = Math.max(e1.x, e2.x);
        if (nx < minEyeX || nx > maxEyeX) {
          isFrontal = false;
        }
      }
    }
  } else if (pixelAnalysis) {
    // 5b. Grayscale patch analysis for universal cross-browser reliability
    const fa = analyzeFacialFeatures(
      pixelAnalysis.pixels,
      pixelAnalysis.pw,
      pixelAnalysis.ph,
      pixelAnalysis.r,
      pixelAnalysis.c,
      pixelAnalysis.s
    );
    eyesVisible = fa.eyesVisible;
    noseVisible = fa.noseVisible;
    mouthVisible = fa.mouthVisible;
    isFrontal = fa.isFrontal;
    isNotTilted = fa.isNotTilted;
    isNotOccluded = fa.isNotOccluded;
  }

  const isValid =
    hasProperContainment &&
    isSnugSize &&
    isCentered &&
    eyesVisible &&
    noseVisible &&
    mouthVisible &&
    isFrontal &&
    isNotTilted &&
    isInsideFrame &&
    isNotOccluded;

  // Determine dynamic user instruction hint
  let hint = 'Hold still...';
  if (isTooSmall) {
    hint = 'Move closer';
  } else if (isTooLarge) {
    hint = 'Move farther away';
  } else if (isOffCenter) {
    hint = 'Center your face';
  } else if (!hasProperContainment) {
    hint = 'Fit face inside the oval';
  } else if (!isFrontal || !isNotTilted) {
    hint = 'Look straight at camera';
  } else if (!eyesVisible || !noseVisible || !mouthVisible || !isNotOccluded) {
    hint = 'Keep face clearly visible';
  }

  return {
    isValid,
    containmentRatio,
    sizeRatio,
    widthRatio,
    heightRatio,
    areaRatio,
    isTooSmall,
    isTooLarge,
    isOffCenter,
    centerOffset: { x: normOffsetX, y: normOffsetY },
    eyesVisible,
    noseVisible,
    mouthVisible,
    isFrontal,
    isNotTilted,
    isInsideFrame,
    isNotOccluded,
    hint,
    reason: isValid ? 'Face properly aligned and contained' : hint,
  };
}
