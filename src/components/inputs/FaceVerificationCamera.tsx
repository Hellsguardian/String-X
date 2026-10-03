import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, RefreshCw, Maximize2, Minimize2, Lock, AlertCircle } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Camera as CapCamera } from '@capacitor/camera';
import {
  unpackCascade,
  runCascade,
  clusterDetections,
  instantiateDetectionMemory,
  ClassifyRegionFn,
  PicoDetectionParams,
} from '../../utils/pico';
import {
  getTargetOval,
  validateFacePosition,
  DetectedFaceGeometry,
  VideoViewportTransform,
} from '../../utils/faceValidation';
import { getBrowserGeolocation, GeolocationCoordinates } from '../../utils/geolocation';

interface FaceVerificationCameraProps {
  onCapture: (photoUrl: string, coordinates?: GeolocationCoordinates) => void;
  onRetake: () => void;
  initialPhoto?: string;
  isConfirmed?: boolean;
}

export const FaceVerificationCamera: React.FC<FaceVerificationCameraProps> = ({
  onCapture,
  onRetake,
  initialPhoto,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [cameraState, setCameraState] = useState<'live' | 'captured' | 'error'>(
    initialPhoto ? 'captured' : 'live'
  );
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(initialPhoto || null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isFaceValid, setIsFaceValid] = useState<boolean>(false);
  const [feedbackHint, setFeedbackHint] = useState<string>('Position your face in the oval');
  const [stabilizationProgress, setStabilizationProgress] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [flash, setFlash] = useState<boolean>(false);

  // References for continuous stability & auto-capture without stale state
  const isFaceValidRef = useRef<boolean>(false);
  const stabilityStartRef = useRef<number | null>(null);
  const isCapturingRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);
  const consecutiveValidRef = useRef<number>(0);
  const consecutiveInvalidRef = useRef<number>(0);
  const detectionIntervalRef = useRef<number | null>(null);
  const progressAnimFrameRef = useRef<number | null>(null);

  // Dedicated location state & references for the current verification attempt
  const [, setLocationStatus] = useState<
    'idle' | 'requesting' | 'captured' | 'denied' | 'unavailable' | 'error'
  >('idle');
  const capturedLocationRef = useRef<GeolocationCoordinates | null>(null);
  const locationPromiseRef = useRef<Promise<GeolocationCoordinates> | null>(null);
  const locationErrorRef = useRef<string | null>(null);

  // Detectors
  const nativeDetectorRef = useRef<any>(null);
  const picoClassifierRef = useRef<ClassifyRegionFn | null>(null);
  const picoMemoryRef = useRef<((dets: number[][]) => number[][]) | null>(null);

  // Required continuous stability duration (1.25s) before auto-capture
  const STABILITY_DURATION_MS = 1250;

  // Immediately initiate location capture for the current verification attempt
  const initiateLocationCapture = useCallback(() => {
    capturedLocationRef.current = null;
    locationErrorRef.current = null;
    setLocationStatus('requesting');

    const promise = getBrowserGeolocation();
    locationPromiseRef.current = promise;

    promise
      .then((coords) => {
        if (!isMountedRef.current || locationPromiseRef.current !== promise) return;
        capturedLocationRef.current = coords;
        setLocationStatus('captured');
        locationErrorRef.current = null;
      })
      .catch((err: any) => {
        if (!isMountedRef.current || locationPromiseRef.current !== promise) return;
        capturedLocationRef.current = null;
        locationErrorRef.current =
          err?.message ||
          'Location permission is required for face verification. Please enable location access in your browser settings and try again.';
        if (err?.code === 1 || err?.message?.toLowerCase().includes('denied')) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('error');
        }
      });

    return promise;
  }, []);

  // Initialize native browser FaceDetector API if available, plus load pico cascade
  useEffect(() => {
    if (typeof window !== 'undefined' && 'FaceDetector' in window) {
      try {
        nativeDetectorRef.current = new (window as any).FaceDetector({
          fastMode: true,
          maxDetectedFaces: 2,
        });
      } catch {
        nativeDetectorRef.current = null;
      }
    }

    // Load local facefinder cascade model for universal robust ML face detection
    fetch('/models/facefinder')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error ${res.status}`);
        return res.arrayBuffer();
      })
      .then((buffer) => {
        const bytes = new Int8Array(buffer);
        picoClassifierRef.current = unpackCascade(bytes);
        picoMemoryRef.current = instantiateDetectionMemory(3);
      })
      .catch((err) => {
        console.warn('Local facefinder cascade load notice:', err);
      });
  }, []);

  // Stop camera tracks cleanly and release device hardware
  const stopCameraStream = useCallback(() => {
    if (detectionIntervalRef.current) {
      window.clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (progressAnimFrameRef.current) {
      cancelAnimationFrame(progressAnimFrameRef.current);
      progressAnimFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Capture frame from video feed to canvas using the pre-captured or in-flight geolocation
  const captureFrame = useCallback(async () => {
    if (isCapturingRef.current || !videoRef.current) return;
    isCapturingRef.current = true;

    // Trigger subtle tactile flash transition
    setFlash(true);
    setTimeout(() => setFlash(false), 140);

    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvasRef.current = canvas;

    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Mirror horizontally to match the selfie viewfinder
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);

      // 1. Check if location has ALREADY been captured on mount/during scanning
      let coords: GeolocationCoordinates | null = capturedLocationRef.current;

      // 2. If location is still in-flight, await the ongoing promise (do NOT request location again)
      if (!coords && locationPromiseRef.current) {
        try {
          coords = await locationPromiseRef.current;
          capturedLocationRef.current = coords;
        } catch (locErr: any) {
          console.error('[FaceVerificationCamera] Geolocation acquisition failed during resolution:', locErr);
          isCapturingRef.current = false;
          setErrorMessage(
            locErr.message ||
              locationErrorRef.current ||
              'Location permission is required for face verification. Please enable location access and try again.'
          );
          setCameraState('error');
          stopCameraStream();
          return;
        }
      }

      // 3. If location could not be captured or was denied, block submission
      if (!coords) {
        isCapturingRef.current = false;
        setErrorMessage(
          locationErrorRef.current ||
            'Location permission is required for face verification. Please enable location access and try again.'
        );
        setCameraState('error');
        stopCameraStream();
        return;
      }

      setCapturedPhoto(dataUrl);
      setCameraState('captured');

      // Exit fullscreen if active
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);

      stopCameraStream();
      onCapture(dataUrl, coords);
    }
  }, [onCapture, stopCameraStream]);

  // Smooth animation frame loop for progress bar
  const updateProgressLoop = useCallback(() => {
    if (!isFaceValidRef.current || isCapturingRef.current) {
      setStabilizationProgress(0);
      stabilityStartRef.current = null;
      return;
    }

    if (stabilityStartRef.current === null) {
      stabilityStartRef.current = performance.now();
    }

    const elapsed = performance.now() - stabilityStartRef.current;
    const pct = Math.min(100, Math.max(0, (elapsed / STABILITY_DURATION_MS) * 100));
    setStabilizationProgress(pct);

    // Only auto-capture if face has remained continuously valid for entire 1.25s duration
    if (pct >= 100 && !isCapturingRef.current && isFaceValidRef.current) {
      captureFrame();
      return;
    }

    progressAnimFrameRef.current = requestAnimationFrame(updateProgressLoop);
  }, [captureFrame]);

  // Analyze video frame for face presence, strict 90%+ containment, centering, and facial features
  const runDetection = useCallback(async () => {
    if (
      isCapturingRef.current ||
      !videoRef.current ||
      !containerRef.current ||
      videoRef.current.readyState < 2
    ) {
      return;
    }

    const video = videoRef.current;
    const container = containerRef.current;
    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const cw = container.clientWidth || 300;
    const ch = container.clientHeight || 400;

    if (!vw || !vh || !cw || !ch) return;

    // Viewport transform mapping video pixels to container screen pixels
    const transform: VideoViewportTransform = {
      videoWidth: vw,
      videoHeight: vh,
      containerWidth: cw,
      containerHeight: ch,
      isMirrored: true, // video is styled with scale-x-[-1]
    };

    // Exact on-screen target oval matching SVG viewBox and preserveAspectRatio
    const targetOval = getTargetOval(cw, ch);

    let detectorRan = false;
    let frameIsValid = false;
    let currentHint = 'Position your face in the oval';

    // 1. Try Native FaceDetector API if supported
    if (nativeDetectorRef.current) {
      try {
        const faces = await nativeDetectorRef.current.detect(video);
        detectorRan = true;

        // Strictly require exactly 1 face detected
        if (faces.length === 1) {
          const box = faces[0].boundingBox;
          const detectedGeometry: DetectedFaceGeometry = {
            centerX: box.x + box.width / 2,
            centerY: box.y + box.height / 2,
            width: box.width,
            height: box.height,
            landmarks: faces[0].landmarks,
          };

          const validation = validateFacePosition(
            detectedGeometry,
            transform,
            targetOval,
            undefined,
            isFaceValidRef.current
          );

          frameIsValid = validation.isValid;
          currentHint = validation.hint;
        } else if (faces.length > 1) {
          currentHint = 'Only one person in frame';
          frameIsValid = false;
        } else {
          currentHint = 'Position your face in the oval';
          frameIsValid = false;
        }
      } catch {
        detectorRan = false;
      }
    }

    // 2. High-performance ML decision cascade via pico + facial feature analysis
    if (!detectorRan && picoClassifierRef.current) {
      const pw = 192;
      const ph = Math.round((pw * vh) / vw);

      if (!analysisCanvasRef.current) {
        analysisCanvasRef.current = document.createElement('canvas');
      }
      const aCanvas = analysisCanvasRef.current;
      if (aCanvas.width !== pw || aCanvas.height !== ph) {
        aCanvas.width = pw;
        aCanvas.height = ph;
      }

      const aCtx = aCanvas.getContext('2d', { willReadFrequently: true });
      if (aCtx) {
        aCtx.drawImage(video, 0, 0, pw, ph);
        const imgData = aCtx.getImageData(0, 0, pw, ph);
        const data = imgData.data;
        const pixels = new Uint8Array(pw * ph);

        for (let i = 0; i < pw * ph; i++) {
          pixels[i] = (2 * data[4 * i] + 7 * data[4 * i + 1] + 1 * data[4 * i + 2]) / 10;
        }

        const minFace = Math.floor(Math.min(pw, ph) * 0.18);
        const maxFace = Math.floor(Math.min(pw, ph) * 0.85);
        const params: PicoDetectionParams = {
          shiftfactor: 0.1,
          minsize: minFace,
          maxsize: maxFace,
          scalefactor: 1.15,
        };

        let dets = runCascade(
          { pixels, nrows: ph, ncols: pw, ldim: pw },
          picoClassifierRef.current,
          params
        );

        if (picoMemoryRef.current) {
          dets = picoMemoryRef.current(dets);
        }
        dets = clusterDetections(dets, 0.2);

        // Score >= 5.0 filters out non-face false positives
        const confidentDets = dets.filter((d) => d[3] >= 5.0);

        // Strictly require exactly 1 face detected
        if (confidentDets.length === 1) {
          const [r, c, s] = confidentDets[0];
          const scaleToVideo = vw / pw;

          const detectedGeometry: DetectedFaceGeometry = {
            centerX: c * scaleToVideo,
            centerY: r * scaleToVideo,
            width: s * 0.92 * scaleToVideo,
            height: s * 1.22 * scaleToVideo,
          };

          const validation = validateFacePosition(
            detectedGeometry,
            transform,
            targetOval,
            { pixels, pw, ph, r, c, s },
            isFaceValidRef.current
          );

          frameIsValid = validation.isValid;
          currentHint = validation.hint;
        } else if (confidentDets.length > 1) {
          currentHint = 'Only one person in frame';
          frameIsValid = false;
        } else {
          currentHint = 'Position your face in the oval';
          frameIsValid = false;
        }
      }
    }

    // 3. Smooth Anti-Flicker & Hysteresis State Machine
    if (frameIsValid) {
      consecutiveValidRef.current += 1;
      consecutiveInvalidRef.current = 0;

      // Require 2 consecutive valid evaluations before switching to GREEN
      if (consecutiveValidRef.current >= 2) {
        if (!isFaceValidRef.current) {
          isFaceValidRef.current = true;
          setIsFaceValid(true);
          stabilityStartRef.current = performance.now();

          // Start smooth perimeter progress animation
          if (progressAnimFrameRef.current) cancelAnimationFrame(progressAnimFrameRef.current);
          progressAnimFrameRef.current = requestAnimationFrame(updateProgressLoop);
        }
        setFeedbackHint('Hold still...');
      }
    } else {
      consecutiveInvalidRef.current += 1;
      consecutiveValidRef.current = 0;

      // When invalid, immediately cancel stability countdown and return oval to RED
      if (isFaceValidRef.current) {
        isFaceValidRef.current = false;
        setIsFaceValid(false);
        stabilityStartRef.current = null;
        setStabilizationProgress(0);

        if (progressAnimFrameRef.current) {
          cancelAnimationFrame(progressAnimFrameRef.current);
          progressAnimFrameRef.current = null;
        }
      }
      setFeedbackHint(currentHint);
    }
  }, [updateProgressLoop]);

  // Start front-facing camera
  const startCamera = useCallback(async () => {
    isCapturingRef.current = false;
    isFaceValidRef.current = false;
    stabilityStartRef.current = null;
    consecutiveValidRef.current = 0;
    consecutiveInvalidRef.current = 0;
    setIsFaceValid(false);
    setStabilizationProgress(0);
    setFeedbackHint('Position your face in the oval');
    setErrorMessage('');
    setCameraState('live');

    stopCameraStream();

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          const perm = await CapCamera.checkPermissions();
          if (perm.camera !== 'granted') {
            const req = await CapCamera.requestPermissions({ permissions: ['camera'] });
            if (req.camera !== 'granted') {
              throw new Error('Camera access was denied. Please allow camera access in app settings.');
            }
          }
        } catch (nativeCamErr: any) {
          console.warn('[FaceVerificationCamera] Native camera permission notice:', nativeCamErr);
          if (nativeCamErr?.message?.toLowerCase().includes('denied') || nativeCamErr?.message?.toLowerCase().includes('permission')) {
            throw nativeCamErr;
          }
        }
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported on this browser or device.');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: 'user' },
          width: { ideal: 720 },
          height: { ideal: 960 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});

          // Warm-up buffer before continuous face evaluation begins
          setTimeout(() => {
            if (streamRef.current && !isCapturingRef.current) {
              detectionIntervalRef.current = window.setInterval(runDetection, 120);
            }
          }, 350);
        };
      }
    } catch (err: any) {
      console.warn('Camera access failure:', err);
      stopCameraStream();
      setCameraState('error');

      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setErrorMessage('Camera access was denied. Please allow camera access in your browser settings.');
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError') {
        setErrorMessage('No camera was found on your device.');
      } else {
        setErrorMessage("We couldn't access your camera. Please allow camera access and try again.");
      }
    }
  }, [runDetection, stopCameraStream]);

  // Start camera and location capture on mount if not already confirmed
  useEffect(() => {
    isMountedRef.current = true;
    if (!initialPhoto) {
      initiateLocationCapture();
      startCamera();
    }
    return () => {
      isMountedRef.current = false;
      locationPromiseRef.current = null;
      capturedLocationRef.current = null;
      stopCameraStream();
    };
  }, [initialPhoto, initiateLocationCapture, startCamera, stopCameraStream]);

  // Handle Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Sync fullscreen change event
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
    };
  }, []);

  // Handle retake action: resets previous attempt and starts fresh location capture
  const handleRetake = () => {
    setCapturedPhoto(null);
    capturedLocationRef.current = null;
    locationErrorRef.current = null;
    locationPromiseRef.current = null;
    initiateLocationCapture();
    onRetake();
    startCamera();
  };

  // Single oval path starting from top center (150, 70), clockwise with rx=95, ry=125, centered at (150, 195)
  const ovalPathD = 'M 150 70 A 95 125 0 1 1 149.99 70 Z';

  return (
    <div className="w-full flex flex-col items-center select-none">
      {/* Hidden processing canvas for ML evaluation */}
      <canvas ref={canvasRef} className="hidden" />

      {/* 
        MAIN CAMERA CONTAINER:
        - 3:4 aspect ratio
        - Responsive portrait frame
        - Thick STRING-X border (#251436) and offset shadow
        - Object-fit cover without distortion
        - Seamless fullscreen support
      */}
      <div
        ref={containerRef}
        className={`relative w-full overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-0 shadow-none bg-black flex items-center justify-center'
            : 'max-w-[270px] sm:max-w-[290px] aspect-[3/4] max-h-[min(385px,50dvh)] rounded-[28px] sm:rounded-[32px] border-3 border-[#251436] bg-[#160C24] shadow-[4px_4px_0px_#251436] flex items-center justify-center'
        }`}
      >
        {/* Shutter flash effect */}
        {flash && (
          <div className="absolute inset-0 bg-white z-50 pointer-events-none transition-opacity duration-150" />
        )}

        {/* 1. CAMERA LIVE STATE */}
        {cameraState === 'live' && (
          <div className="relative w-full h-full flex items-center justify-center bg-[#160C24]">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className="w-full h-full object-cover scale-x-[-1]"
            />

            {/* 
              EXACTLY ONE VISIBLE OVAL GUIDE:
              - No second oval, no face bounding box, no contour, no landmarks.
              - When invalid / no face: muted red outline.
              - When valid: transitions smoothly to STRING-X green (#10B981).
              - During 1.25s stability: green progress stroke fills smoothly along the EXACT SAME perimeter.
            */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <svg
                className="w-full h-full"
                viewBox="0 0 300 400"
                preserveAspectRatio="xMidYMid meet"
              >
                {/* Single Base Oval Guide */}
                <path
                  d={ovalPathD}
                  fill="none"
                  stroke={isFaceValid ? '#10B981' : '#EF4444'}
                  strokeWidth="2.5"
                  opacity={isFaceValid ? 0.45 : 0.85}
                  className="transition-colors duration-300"
                />

                {/* Progress indicator along the identical perimeter when stabilizing */}
                {isFaceValid && stabilizationProgress > 0 && (
                  <path
                    d={ovalPathD}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    pathLength="100"
                    strokeDasharray="100"
                    strokeDashoffset={Math.max(0, 100 - stabilizationProgress)}
                    className="drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                  />
                )}
              </svg>
            </div>

            {/* Subtle Fullscreen Control */}
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="absolute top-3 right-3 z-30 p-2 rounded-full bg-black/40 text-white/80 hover:text-white hover:bg-black/60 transition-colors backdrop-blur-sm cursor-pointer"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        )}

        {/* 2. CAPTURED PHOTO STATE */}
        {cameraState === 'captured' && capturedPhoto && (
          <div className="relative w-full h-full bg-[#160C24]">
            <img
              src={capturedPhoto}
              alt="Captured verification selfie"
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* 3. CAMERA ERROR STATE */}
        {cameraState === 'error' && (
          <div className="relative w-full h-full flex flex-col items-center justify-center text-center p-5 bg-[#160C24] text-white">
            <div className="w-12 h-12 rounded-full bg-[#FF4F81]/20 border-2 border-[#FF4F81] text-[#FF4F81] flex items-center justify-center mb-3">
              <AlertCircle size={24} strokeWidth={2.5} />
            </div>

            <h3 className="text-base font-black text-white tracking-wide">
              Camera unavailable
            </h3>

            <p className="text-xs font-semibold text-white/70 mt-1.5 max-w-[210px] leading-snug">
              {errorMessage || "We couldn't access your camera. Please allow camera access and try again."}
            </p>

            <button
              type="button"
              onClick={startCamera}
              className="mt-4 py-2 px-5 bg-[#894EFF] text-white text-xs font-black rounded-xl border-2 border-[#251436] shadow-[2.5px_2.5px_0px_#251436] hover:bg-[#783dee] active:translate-y-0.5 cursor-pointer transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={13} strokeWidth={3} />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {/* INTERACTIONS & CONTROLS BELOW CAMERA */}
      <div className="w-full max-w-[270px] sm:max-w-[290px] mt-2.5 flex flex-col items-center">
        {/* Live State: Dynamic Instructional Feedback Badge */}
        {cameraState === 'live' && (
          <div className="mb-2 flex items-center justify-center min-h-[26px]">
            <span
              className={`text-[12px] font-black tracking-wide px-3 py-0.5 rounded-full transition-all duration-200 border ${
                isFaceValid
                  ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                  : 'bg-[#251436]/5 text-[#251436]/80 border-[#251436]/15'
              }`}
            >
              {isFaceValid ? (stabilizationProgress > 0 ? 'Hold still...' : 'Hold still...') : feedbackHint}
            </span>
          </div>
        )}

        {/* Live State: Fallback Manual Capture Button (Enabled only when face is genuinely valid) */}
        {cameraState === 'live' && (
          <div className="flex flex-col items-center mb-1">
            <button
              type="button"
              onClick={isFaceValid ? captureFrame : undefined}
              disabled={!isFaceValid}
              aria-label="Capture selfie"
              className={`w-11 h-11 rounded-full border-2 border-[#251436] flex items-center justify-center transition-all ${
                isFaceValid
                  ? 'bg-white text-[#894EFF] shadow-[2.5px_2.5px_0px_#251436] hover:scale-105 active:scale-95 cursor-pointer'
                  : 'bg-white/40 text-[#251436]/30 shadow-none cursor-not-allowed pointer-events-none'
              }`}
            >
              <Camera size={18} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Captured State: Subtle Retake Action */}
        {cameraState === 'captured' && (
          <button
            type="button"
            onClick={handleRetake}
            className="text-xs font-extrabold text-[#251436] bg-white/80 hover:bg-white border border-[#251436]/30 px-3.5 py-1.5 rounded-xl shadow-[1.5px_1.5px_0px_#251436] cursor-pointer transition-all flex items-center gap-1.5 active:translate-y-0.5"
          >
            <RefreshCw size={11} strokeWidth={2.5} />
            <span>Retake selfie</span>
          </button>
        )}

        {/* Subtle Reassuring Privacy Message */}
        <p className="text-[11px] font-medium text-[#251436]/65 text-center mt-2 flex items-center justify-center gap-1.5">
          <Lock size={11} className="text-[#894EFF] shrink-0" />
          <span>Your selfie is used only to verify your account.</span>
        </p>
      </div>
    </div>
  );
};
