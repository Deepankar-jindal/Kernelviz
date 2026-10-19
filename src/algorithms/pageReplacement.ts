import type { PageReplacementResult } from '../types';

function buildPageResult(
  refString: number[],
  frames: (number | null)[][],
  faults: boolean[],
  hits: boolean[]
): PageReplacementResult {
  const totalFaults = faults.filter(Boolean).length;
  const totalHits = hits.filter(Boolean).length;
  const len = refString.length;
  return {
    frames,
    faults,
    hits,
    totalFaults,
    totalHits,
    hitRate: len > 0 ? totalHits / len : 0,
    faultRate: len > 0 ? totalFaults / len : 0,
  };
}

export function runFIFO(refString: number[], frameCount: number): PageReplacementResult {
  const frames: (number | null)[][] = [];
  const faults: boolean[] = [];
  const hits: boolean[] = [];
  const queue: number[] = [];
  const current: (number | null)[] = Array(frameCount).fill(null);

  for (const page of refString) {
    if (current.includes(page)) {
      hits.push(true);
      faults.push(false);
    } else {
      faults.push(true);
      hits.push(false);
      if (queue.length < frameCount) {
        const idx = current.indexOf(null);
        current[idx] = page;
        queue.push(page);
      } else {
        const evict = queue.shift()!;
        const idx = current.indexOf(evict);
        current[idx] = page;
        queue.push(page);
      }
    }
    frames.push([...current]);
  }

  return buildPageResult(refString, frames, faults, hits);
}

export function runLRU(refString: number[], frameCount: number): PageReplacementResult {
  const frames: (number | null)[][] = [];
  const faults: boolean[] = [];
  const hits: boolean[] = [];
  const current: (number | null)[] = Array(frameCount).fill(null);
  const recentUse: number[] = [];

  for (const page of refString) {
    if (current.includes(page)) {
      hits.push(true);
      faults.push(false);
      const idx = recentUse.indexOf(page);
      if (idx !== -1) recentUse.splice(idx, 1);
      recentUse.push(page);
    } else {
      faults.push(true);
      hits.push(false);
      if (current.includes(null)) {
        const idx = current.indexOf(null);
        current[idx] = page;
      } else {
        const lruPage = recentUse.shift()!;
        const idx = current.indexOf(lruPage);
        current[idx] = page;
      }
      recentUse.push(page);
    }
    frames.push([...current]);
  }

  return buildPageResult(refString, frames, faults, hits);
}

export function runOptimal(refString: number[], frameCount: number): PageReplacementResult {
  const frames: (number | null)[][] = [];
  const faults: boolean[] = [];
  const hits: boolean[] = [];
  const current: (number | null)[] = Array(frameCount).fill(null);

  for (let i = 0; i < refString.length; i++) {
    const page = refString[i];
    if (current.includes(page)) {
      hits.push(true);
      faults.push(false);
    } else {
      faults.push(true);
      hits.push(false);
      if (current.includes(null)) {
        current[current.indexOf(null)] = page;
      } else {
        let replaceIdx = 0;
        let farthest = -1;
        for (let j = 0; j < current.length; j++) {
          const futureIdx = refString.slice(i + 1).indexOf(current[j]!);
          if (futureIdx === -1) {
            replaceIdx = j;
            break;
          }
          if (futureIdx > farthest) {
            farthest = futureIdx;
            replaceIdx = j;
          }
        }
        current[replaceIdx] = page;
      }
    }
    frames.push([...current]);
  }

  return buildPageResult(refString, frames, faults, hits);
}
