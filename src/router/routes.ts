export type RoutePath =
  | '/'
  | '/core'
  | '/pipeline'
  | '/scheduler'
  | '/memory'
  | '/tlb'
  | '/paging'
  | '/replacement'
  | '/fragmentation'
  | '/benchmark';

export interface RouteItem {
  id: string;
  label: string;
  path: RoutePath;
  number: string;
  title: string;
  desc: string;
}

export const ROUTES: RouteItem[] = [
  { id: '01', label: 'CORE',          path: '/core',          number: '01', title: 'PROCESS // LIFECYCLE & STATE MACHINE', desc: 'PCB lifecycle state transitions, dispatch latency, and register restoration.' },
  { id: '02', label: 'PIPELINE',      path: '/pipeline',      number: '02', title: 'INSTRUCTION // PIPELINE STAGES',        desc: '5-stage RISC execution, clock cycles timeline, and pipeline hazard detection.' },
  { id: '03', label: 'SCHEDULER',     path: '/scheduler',     number: '03', title: 'CPU // SCHEDULING DISPATCH',           desc: 'Preemptive and cooperative algorithmic dispatchers with interactive Gantt timeline.' },
  { id: '04', label: 'MEMORY',        path: '/memory',        number: '04', title: 'MEMORY // PARTITION ALLOCATION',       desc: 'Contiguous memory allocation with First Fit, Best Fit, and Worst Fit strategies.' },
  { id: '05', label: 'TLB',           path: '/tlb',           number: '05', title: 'CACHE // TRANSLATION LOOKASIDE BUFFER', desc: '4-way associative cache lookups, hit/miss ratios, and Effective Access Time.' },
  { id: '06', label: 'PAGING',        path: '/paging',        number: '06', title: 'PAGING // VIRTUAL ADDRESS TRANSLATION', desc: 'Virtual page to physical frame address translation with bitwise decomposition.' },
  { id: '07', label: 'REPLACEMENT',   path: '/replacement',   number: '07', title: 'PAGE REPLACEMENT // FAULT ANALYSIS',    desc: 'FIFO, LRU, and Optimal frame eviction algorithms with real-time fault tracking.' },
  { id: '08', label: 'FRAGMENTATION', path: '/fragmentation', number: '08', title: 'MEMORY // FRAGMENTATION ANALYSIS',     desc: 'Internal and external fragmentation telemetry, hole coalescing, and compaction.' },
  { id: '09', label: 'BENCHMARK',     path: '/benchmark',     number: '09', title: 'ALGORITHM // BENCHMARK ARENA',          desc: 'Head-to-head empirical comparison across identical multi-process workloads.' },
];

export function normalizePath(path: string): string {
  const p = path.toLowerCase().replace(/\/+$/, '') || '/';
  return p;
}
