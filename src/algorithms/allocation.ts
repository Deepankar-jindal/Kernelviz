import type { MemoryBlock, FragmentationResult } from '../types';

export function computeStats(blocks: MemoryBlock[]): FragmentationResult {
  let total = 0;
  let used = 0;
  let free = 0;
  let internal = 0;
  let freeHoleCount = 0;
  let freeHolesSum = 0;

  for (let i = 0; i < blocks.length; i++) {
    const b = blocks[i];
    total += b.size;
    if (b.isFree) {
      free += b.size;
      freeHoleCount++;
      freeHolesSum += b.size;
    } else {
      used += b.size;
    }
    if (b.internalFrag) {
      internal += b.internalFrag;
    }
  }

  const external = freeHoleCount > 1 ? freeHolesSum : 0;

  return {
    blocks,
    totalMemory: total,
    usedMemory: used,
    freeMemory: free,
    internalFragmentation: internal,
    externalFragmentation: external,
  };
}

function allocateWithStrategy(
  blocks: MemoryBlock[],
  processId: string,
  size: number,
  selector: (candidates: MemoryBlock[]) => MemoryBlock | undefined
): FragmentationResult {
  const result = blocks.map(b => ({ ...b }));
  const freeBlocks = result.filter(b => b.isFree && b.size >= size);
  const block = selector(freeBlocks);
  if (block) {
    const remainder = block.size - size;
    block.isFree = false;
    block.processId = processId;
    block.internalFrag = 0;
    if (remainder > 0) {
      const idx = result.indexOf(block);
      result.splice(idx + 1, 0, { id: `free-${Date.now()}`, start: block.start + size, size: remainder, isFree: true });
      block.size = size;
    }
  }
  return computeStats(result);
}

export function runFirstFit(blocks: MemoryBlock[], processId: string, size: number): FragmentationResult {
  return allocateWithStrategy(blocks, processId, size, free => free[0]);
}

export function runBestFit(blocks: MemoryBlock[], processId: string, size: number): FragmentationResult {
  return allocateWithStrategy(blocks, processId, size, free =>
    free.length > 0 ? free.reduce((best, cur) => cur.size < best.size ? cur : best) : undefined
  );
}

export function runWorstFit(blocks: MemoryBlock[], processId: string, size: number): FragmentationResult {
  return allocateWithStrategy(blocks, processId, size, free =>
    free.length > 0 ? free.reduce((worst, cur) => cur.size > worst.size ? cur : worst) : undefined
  );
}
