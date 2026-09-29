// pico.js: Fast, lightweight face detection in JavaScript
// Released under the MIT license by Nenad Markuš (https://github.com/nenadmarkus/picojs)

export interface PicoImage {
  pixels: Uint8Array;
  nrows: number;
  ncols: number;
  ldim: number;
}

export interface PicoDetectionParams {
  shiftfactor: number;
  minsize: number;
  maxsize: number;
  scalefactor: number;
}

export type ClassifyRegionFn = (
  r: number,
  c: number,
  s: number,
  pixels: Uint8Array,
  ldim: number
) => number;

export function unpackCascade(bytes: Int8Array): ClassifyRegionFn {
  const dview = new DataView(new ArrayBuffer(4));
  let p = 8;

  dview.setUint8(0, bytes[p + 0]);
  dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]);
  dview.setUint8(3, bytes[p + 3]);
  const tdepth = dview.getInt32(0, true);
  p += 4;

  dview.setUint8(0, bytes[p + 0]);
  dview.setUint8(1, bytes[p + 1]);
  dview.setUint8(2, bytes[p + 2]);
  dview.setUint8(3, bytes[p + 3]);
  const ntrees = dview.getInt32(0, true);
  p += 4;

  const tcodesLs: number[] = [];
  const tpredsLs: number[] = [];
  const threshLs: number[] = [];

  for (let t = 0; t < ntrees; ++t) {
    tcodesLs.push(0, 0, 0, 0);
    const sub = bytes.slice(p, p + 4 * Math.pow(2, tdepth) - 4);
    for (let i = 0; i < sub.length; i++) {
      tcodesLs.push(sub[i]);
    }
    p = p + 4 * Math.pow(2, tdepth) - 4;

    for (let i = 0; i < Math.pow(2, tdepth); ++i) {
      dview.setUint8(0, bytes[p + 0]);
      dview.setUint8(1, bytes[p + 1]);
      dview.setUint8(2, bytes[p + 2]);
      dview.setUint8(3, bytes[p + 3]);
      tpredsLs.push(dview.getFloat32(0, true));
      p += 4;
    }

    dview.setUint8(0, bytes[p + 0]);
    dview.setUint8(1, bytes[p + 1]);
    dview.setUint8(2, bytes[p + 2]);
    dview.setUint8(3, bytes[p + 3]);
    threshLs.push(dview.getFloat32(0, true));
    p += 4;
  }

  const tcodes = new Int8Array(tcodesLs);
  const tpreds = new Float32Array(tpredsLs);
  const thresh = new Float32Array(threshLs);

  return function classifyRegion(
    r: number,
    c: number,
    s: number,
    pixels: Uint8Array,
    ldim: number
  ): number {
    const rScaled = 256 * r;
    const cScaled = 256 * c;
    let root = 0;
    let o = 0.0;
    const pow2tdepth = Math.pow(2, tdepth) >> 0;

    for (let i = 0; i < ntrees; ++i) {
      let idx = 1;
      for (let j = 0; j < tdepth; ++j) {
        const pixA =
          pixels[
            (((rScaled + tcodes[root + 4 * idx + 0] * s) >> 8) * ldim) +
              ((cScaled + tcodes[root + 4 * idx + 1] * s) >> 8)
          ];
        const pixB =
          pixels[
            (((rScaled + tcodes[root + 4 * idx + 2] * s) >> 8) * ldim) +
              ((cScaled + tcodes[root + 4 * idx + 3] * s) >> 8)
          ];
        idx = 2 * idx + (pixA <= pixB ? 1 : 0);
      }

      o += tpreds[pow2tdepth * i + idx - pow2tdepth];

      if (o <= thresh[i]) {
        return -1;
      }

      root += 4 * pow2tdepth;
    }
    return o - thresh[ntrees - 1];
  };
}

export function runCascade(
  image: PicoImage,
  classifyRegion: ClassifyRegionFn,
  params: PicoDetectionParams
): number[][] {
  const pixels = image.pixels;
  const nrows = image.nrows;
  const ncols = image.ncols;
  const ldim = image.ldim;

  const shiftfactor = params.shiftfactor;
  const minsize = params.minsize;
  const maxsize = params.maxsize;
  const scalefactor = params.scalefactor;

  let scale = minsize;
  const detections: number[][] = [];

  while (scale <= maxsize) {
    const step = Math.max(shiftfactor * scale, 1) >> 0;
    const offset = (scale / 2 + 1) >> 0;

    for (let r = offset; r <= nrows - offset; r += step) {
      for (let c = offset; c <= ncols - offset; c += step) {
        const q = classifyRegion(r, c, scale, pixels, ldim);
        if (q > 0.0) {
          detections.push([r, c, scale, q]);
        }
      }
    }

    scale = scale * scalefactor;
  }

  return detections;
}

export function clusterDetections(
  dets: number[][],
  iouThreshold: number
): number[][] {
  const sorted = [...dets].sort((a, b) => b[3] - a[3]);

  function calculateIou(det1: number[], det2: number[]): number {
    const r1 = det1[0],
      c1 = det1[1],
      s1 = det1[2];
    const r2 = det2[0],
      c2 = det2[1],
      s2 = det2[2];
    const overr = Math.max(
      0,
      Math.min(r1 + s1 / 2, r2 + s2 / 2) - Math.max(r1 - s1 / 2, r2 - s2 / 2)
    );
    const overc = Math.max(
      0,
      Math.min(c1 + s1 / 2, c2 + s2 / 2) - Math.max(c1 - s1 / 2, c2 - s2 / 2)
    );
    return (overr * overc) / (s1 * s1 + s2 * s2 - overr * overc);
  }

  const assignments = new Array(sorted.length).fill(0);
  const clusters: number[][] = [];

  for (let i = 0; i < sorted.length; ++i) {
    if (assignments[i] === 0) {
      let r = 0.0,
        c = 0.0,
        s = 0.0,
        q = 0.0,
        n = 0;
      for (let j = i; j < sorted.length; ++j) {
        if (calculateIou(sorted[i], sorted[j]) > iouThreshold) {
          assignments[j] = 1;
          r += sorted[j][0];
          c += sorted[j][1];
          s += sorted[j][2];
          q += sorted[j][3];
          n += 1;
        }
      }
      clusters.push([r / n, c / n, s / n, q]);
    }
  }

  return clusters;
}

export function instantiateDetectionMemory(
  size: number
): (dets: number[][]) => number[][] {
  let n = 0;
  const memory: number[][][] = [];
  for (let i = 0; i < size; ++i) {
    memory.push([]);
  }

  return function updateMemory(dets: number[][]): number[][] {
    memory[n] = dets;
    n = (n + 1) % memory.length;
    let accumulated: number[][] = [];
    for (let i = 0; i < memory.length; ++i) {
      accumulated = accumulated.concat(memory[i]);
    }
    return accumulated;
  };
}
