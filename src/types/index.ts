// KERNELVIZ — Core Type Definitions

export interface Process {
  pid: string;
  arrivalTime: number;
  burstTime: number;
  priority: number;
  color?: string;
  name?: string;
}

export interface ScheduledProcess extends Process {
  startTime: number;
  endTime: number;
  completionTime: number;
  turnaroundTime: number;
  waitingTime: number;
  responseTime: number;
  remainingTime: number;
}

export interface GanttSlot {
  pid: string;
  startTime: number;
  endTime: number;
  isIdle?: boolean;
}

export interface SchedulerResult {
  gantt: GanttSlot[];
  processes: ScheduledProcess[];
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  avgResponseTime: number;
  cpuUtilization: number;
  contextSwitches: number;
  throughput: number;
}

export type SchedulerAlgorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'Priority';

export interface PageReplacementResult {
  frames: (number | null)[][];
  faults: boolean[];
  hits: boolean[];
  totalFaults: number;
  totalHits: number;
  hitRate: number;
  faultRate: number;
}

export type PageReplacementAlgorithm = 'FIFO' | 'LRU' | 'Optimal';

export interface MemoryBlock {
  id: string;
  start: number;
  size: number;
  isFree: boolean;
  processId?: string;
  internalFrag?: number;
}

export interface FragmentationResult {
  blocks: MemoryBlock[];
  totalMemory: number;
  usedMemory: number;
  freeMemory: number;
  internalFragmentation: number;
  externalFragmentation: number;
}

export interface TLBEntry {
  vpn: number;
  pfn: number;
  valid: boolean;
  way: number;
}

export interface PageTableEntry {
  pageNumber: number;
  frameNumber: number | null;
  present: boolean;
}

export interface AddressTranslation {
  virtualAddress: number;
  pageNumber: number;
  offset: number;
  frameNumber: number | null;
  physicalAddress: number | null;
  tlbHit: boolean;
  pageFault: boolean;
}

export type BootState = 'BOOTING' | 'READY' | 'SKIPPED' | 'ENTERING' | 'COMPLETE';
