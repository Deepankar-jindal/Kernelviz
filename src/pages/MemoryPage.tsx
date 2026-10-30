import React, { useState } from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { Plus, Trash2, RefreshCw, Layers, Zap } from 'lucide-react';
import './MemoryPage.css';

type Strategy = 'FirstFit' | 'BestFit' | 'WorstFit';

interface MemBlock {
  id: string;
  start: number;
  size: number;
  isFree: boolean;
  pid?: string;
  color?: string;
}

const TOTAL_MEM_KB = 512;

const INITIAL_BLOCKS: MemBlock[] = [
  { id: 'b0', start: 0,   size: 64,  isFree: false, pid: 'OS_KERNEL', color: '#B58A3A' },
  { id: 'b1', start: 64,  size: 80,  isFree: true },
  { id: 'b2', start: 144, size: 96,  isFree: false, pid: 'SYS_DAEMON', color: '#176B67' },
  { id: 'b3', start: 240, size: 120, isFree: true },
  { id: 'b4', start: 360, size: 80,  isFree: false, pid: 'USER_APP_1', color: '#C17E3A' },
  { id: 'b5', start: 440, size: 72,  isFree: true },
];

const PROCESS_COLORS = ['#D4AF37', '#22D3EE', '#EBD17C', '#F59E0B', '#10B981', '#A855F7', '#EC4899'];

interface Props {
  onCommandCenter: () => void;
}

export const MemoryPage: React.FC<Props> = ({ onCommandCenter }) => {
  const [blocks, setBlocks] = useState<MemBlock[]>(INITIAL_BLOCKS);
  const [strategy, setStrategy] = useState<Strategy>('FirstFit');
  const [newPid, setNewPid] = useState<string>('P4');
  const [newSize, setNewSize] = useState<number>(48);
  const [error, setError] = useState<string | null>(null);
  const [lastActionLog, setLastActionLog] = useState<string>(
    'SYSTEM READY: 512 KB Total RAM mapped. Select algorithm and allocate new memory blocks.'
  );

  // Compute stats
  let usedKB = 0;
  let freeKB = 0;
  let freeHolesCount = 0;
  let maxFreeHole = 0;

  for (const b of blocks) {
    if (b.isFree) {
      freeKB += b.size;
      freeHolesCount++;
      if (b.size > maxFreeHole) maxFreeHole = b.size;
    } else {
      usedKB += b.size;
    }
  }

  const externalFragmentation = freeHolesCount > 1 ? freeKB - maxFreeHole : 0;
  const usedPercent = ((usedKB / TOTAL_MEM_KB) * 100).toFixed(1);

  // Allocation implementation
  const handleAllocate = () => {
    if (!newPid.trim()) {
      setError('ERR_INVALID_PID: Process ID cannot be empty');
      return;
    }
    if (newSize <= 0 || newSize > TOTAL_MEM_KB) {
      setError(`ERR_INVALID_SIZE: Size must be between 1 and ${TOTAL_MEM_KB} KB`);
      return;
    }
    if (blocks.some(b => !b.isFree && b.pid?.toLowerCase() === newPid.toLowerCase())) {
      setError(`ERR_DUPLICATE_PID: Process ${newPid} is already in memory`);
      return;
    }

    // Filter free candidates
    const freeCandidates = blocks.filter(b => b.isFree && b.size >= newSize);
    if (freeCandidates.length === 0) {
      setError(`ERR_OUT_OF_CONTIGUOUS_MEMORY: No free block has at least ${newSize} KB contiguous space`);
      setLastActionLog(
        `ALLOCATION FAILED: Requested ${newSize} KB for ${newPid}, but largest contiguous free hole is only ${maxFreeHole} KB (External Frag: ${externalFragmentation} KB).`
      );
      return;
    }

    let targetBlock: MemBlock;
    if (strategy === 'FirstFit') {
      targetBlock = freeCandidates[0];
    } else if (strategy === 'BestFit') {
      targetBlock = freeCandidates.reduce((best, curr) => (curr.size < best.size ? curr : best));
    } else {
      // WorstFit
      targetBlock = freeCandidates.reduce((worst, curr) => (curr.size > worst.size ? curr : worst));
    }

    const nextBlocks = [...blocks];
    const targetIdx = nextBlocks.findIndex(b => b.id === targetBlock.id);
    const color = PROCESS_COLORS[Math.floor(Math.random() * PROCESS_COLORS.length)];

    const remainder = targetBlock.size - newSize;
    if (remainder > 0) {
      // Split block
      const allocatedBlock: MemBlock = {
        id: `alloc-${Date.now()}`,
        start: targetBlock.start,
        size: newSize,
        isFree: false,
        pid: newPid,
        color,
      };
      const residualFreeBlock: MemBlock = {
        id: `free-${Date.now() + 1}`,
        start: targetBlock.start + newSize,
        size: remainder,
        isFree: true,
      };
      nextBlocks.splice(targetIdx, 1, allocatedBlock, residualFreeBlock);
    } else {
      // Exact match
      nextBlocks[targetIdx] = {
        ...targetBlock,
        isFree: false,
        pid: newPid,
        color,
      };
    }

    setBlocks(nextBlocks);
    setError(null);
    setLastActionLog(
      `${strategy.toUpperCase()}: Allocated ${newSize} KB to ${newPid} at address 0x${targetBlock.start.toString(16).toUpperCase().padStart(4, '0')}. Remaining residual hole: ${remainder} KB.`
    );
    setNewPid(`P${Math.floor(Math.random() * 80) + 10}`);
  };

  // Deallocation & Coalesce
  const handleDeallocate = (blockId: string) => {
    const target = blocks.find(b => b.id === blockId);
    if (!target || target.isFree) return;

    const unmerged = blocks.map(b => (b.id === blockId ? { ...b, isFree: true, pid: undefined, color: undefined } : b));
    // Coalesce adjacent free blocks
    const merged: MemBlock[] = [];
    for (const b of unmerged) {
      if (merged.length > 0 && merged[merged.length - 1].isFree && b.isFree) {
        merged[merged.length - 1].size += b.size;
      } else {
        merged.push({ ...b });
      }
    }

    setBlocks(merged);
    setError(null);
    setLastActionLog(`DEALLOCATED: Released ${target.pid} (${target.size} KB). Adjacent free holes coalesced.`);
  };

  // Coalesce free holes manually
  const handleCoalesce = () => {
    const merged: MemBlock[] = [];
    for (const b of blocks) {
      if (merged.length > 0 && merged[merged.length - 1].isFree && b.isFree) {
        merged[merged.length - 1].size += b.size;
      } else {
        merged.push({ ...b });
      }
    }
    setBlocks(merged);
    setLastActionLog('COALESCE: All contiguous adjacent free holes merged.');
  };

  // Memory Compaction
  const handleCompaction = () => {
    const allocated = blocks.filter(b => !b.isFree);
    let currentStart = 0;
    const compacted: MemBlock[] = [];

    for (const b of allocated) {
      compacted.push({ ...b, start: currentStart });
      currentStart += b.size;
    }

    const totalFree = TOTAL_MEM_KB - currentStart;
    if (totalFree > 0) {
      compacted.push({
        id: `free-compact-${Date.now()}`,
        start: currentStart,
        size: totalFree,
        isFree: true,
      });
    }

    setBlocks(compacted);
    setError(null);
    setLastActionLog(
      `COMPACTION COMPLETE: All active partitions shifted to low memory. Created single contiguous ${totalFree} KB free block. External fragmentation reduced to 0 KB!`
    );
  };

  const handleReset = () => {
    setBlocks(INITIAL_BLOCKS);
    setError(null);
    setLastActionLog('RESET: Memory partitions restored to default baseline.');
  };

  return (
    <SimulationLayout
      moduleNumber="04"
      moduleTag="MEMORY // DYNAMIC ALLOCATION"
      title="MEMORY // DYNAMIC PARTITION ALLOCATION LABORATORY"
      description="Simulate contiguous memory partition placement using First Fit, Best Fit, and Worst Fit algorithms. Experiment with process allocation, hole deallocation, automatic coalescing, compaction, and fragmentation metrics."
      onCommandCenter={onCommandCenter}
    >
      {/* Top Action Bar */}
      <div className="mem-action-bar">
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span className="label">ALGORITHM:</span>
          {(['FirstFit', 'BestFit', 'WorstFit'] as Strategy[]).map(s => (
            <button
              key={s}
              className={`btn btn-sm ${strategy === s ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStrategy(s)}
            >
              {s.replace('Fit', ' FIT')}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
          <button className="btn btn-sm btn-secondary" onClick={handleCoalesce}>
            <Layers className="w-3.5 h-3.5" />
            <span>COALESCE HOLES</span>
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleCompaction}>
            <Zap className="w-3.5 h-3.5" />
            <span>COMPACT MEMORY</span>
          </button>
          <button className="btn btn-sm" onClick={handleReset}>
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className="mem-page-grid">
        {/* Left Column: Visual Memory Strip & Block Table */}
        <div className="mem-main-col">
          {/* Visual Memory Map */}
          <div className="panel mem-strip-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="label label-gold">CONTIGUOUS PHYSICAL ADDRESS SPACE (0 — 512 KB)</div>
              <div className="label font-mono text-cyan">
                USED: {usedKB} KB ({usedPercent}%) / FREE: {freeKB} KB
              </div>
            </div>

            {/* Visual Bar Strip */}
            <div className="mem-strip-outer">
              <div className="mem-strip-bar">
                {blocks.map(b => {
                  const widthPct = (b.size / TOTAL_MEM_KB) * 100;
                  return (
                    <div
                      key={b.id}
                      className={`mem-block-chunk ${b.isFree ? 'mem-block-free' : 'mem-block-allocated'}`}
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: b.isFree ? undefined : b.color || '#D4AF37',
                      }}
                      title={
                        b.isFree
                          ? `Free Block: ${b.size} KB [0x${b.start.toString(16).toUpperCase()} - 0x${(b.start + b.size).toString(16).toUpperCase()}]`
                          : `Allocated to ${b.pid}: ${b.size} KB`
                      }
                      onClick={() => !b.isFree && handleDeallocate(b.id)}
                    >
                      <span className="mem-chunk-label">{b.isFree ? 'FREE' : b.pid}</span>
                      <span className="mem-chunk-size">{b.size} KB</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Address labels below strip */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
              <span>0x0000 (0 KB)</span>
              <span>0x0080 (128 KB)</span>
              <span>0x0100 (256 KB)</span>
              <span>0x0180 (384 KB)</span>
              <span>0x0200 (512 KB)</span>
            </div>

            {/* Event Log */}
            <div style={{ marginTop: '16px', padding: '10px 14px', background: 'rgba(7, 7, 9, 0.7)', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: '4px' }}>
              <div className="label font-mono text-cyan" style={{ fontSize: '9px', marginBottom: '2px' }}>
                AUDIT TELEMETRY LOG
              </div>
              <div className="font-mono text-secondary" style={{ fontSize: '11px' }}>
                {lastActionLog}
              </div>
            </div>
          </div>

          {/* Partition Blocks Table */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>
              MEMORY PARTITION TABLE
            </div>
            <div className="mem-blocks-table-wrap">
              <table className="mem-blocks-table">
                <thead>
                  <tr>
                    <th>STATUS</th>
                    <th>PROCESS ID</th>
                    <th>BASE ADDR</th>
                    <th>LIMIT ADDR</th>
                    <th>SIZE</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {blocks.map(b => (
                    <tr key={b.id}>
                      <td>
                        <span
                          className="label"
                          style={{ color: b.isFree ? 'var(--text-muted)' : 'var(--cyan-active)' }}
                        >
                          {b.isFree ? 'HOLE (FREE)' : 'ALLOCATED'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: b.color || '#ffffff' }}>
                        {b.isFree ? '—' : b.pid}
                      </td>
                      <td className="font-mono text-muted">0x{b.start.toString(16).toUpperCase().padStart(4, '0')}</td>
                      <td className="font-mono text-muted">0x{(b.start + b.size).toString(16).toUpperCase().padStart(4, '0')}</td>
                      <td className="font-mono text-gold font-bold">{b.size} KB</td>
                      <td>
                        {!b.isFree && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDeallocate(b.id)}
                            style={{ padding: '2px 8px', fontSize: '10px' }}
                          >
                            <Trash2 className="w-3 h-3 inline mr-1" />
                            FREE
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Allocation Form & Metrics HUD */}
        <div className="mem-sidebar-col">
          {/* Allocation Input Form */}
          <div className="panel mem-form-panel">
            <div className="label label-gold" style={{ marginBottom: '16px' }}>
              ALLOCATE NEW PARTITION
            </div>

            <div className="mem-form-group">
              <label className="mem-form-label">PROCESS IDENTIFIER (PID)</label>
              <input
                className="input-field"
                value={newPid}
                onChange={e => setNewPid(e.target.value.toUpperCase())}
                placeholder="e.g. P4, DB_CACHE"
              />
            </div>

            <div className="mem-form-group">
              <label className="mem-form-label">REQUESTED SIZE (KB)</label>
              <input
                className="input-field"
                type="number"
                min="1"
                max={TOTAL_MEM_KB}
                value={newSize}
                onChange={e => setNewSize(Number(e.target.value))}
              />
            </div>

            <div className="mem-form-group">
              <label className="mem-form-label">FIT STRATEGY</label>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, background: 'rgba(7, 7, 9, 0.6)', padding: '8px 10px', borderRadius: '4px' }}>
                {strategy === 'FirstFit' && 'FIRST FIT: Scans from beginning and allocates in the very first free hole large enough.'}
                {strategy === 'BestFit' && 'BEST FIT: Scans entire free list and allocates in the smallest hole that is large enough (minimizes residual hole size).'}
                {strategy === 'WorstFit' && 'WORST FIT: Scans entire free list and allocates in the largest available hole (leaves largest residual hole).'}
              </div>
            </div>

            {error && (
              <div className="label" style={{ color: '#ef4444', marginBottom: '12px' }}>
                {error}
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              onClick={handleAllocate}
            >
              <Plus className="w-4 h-4" />
              <span>ALLOCATE PARTITION</span>
            </button>
          </div>

          {/* Fragmentation & Memory Metrics */}
          <div className="panel mem-metrics-card">
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>
              FRAGMENTATION TELEMETRY
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">TOTAL CAPACITY</span>
                <span className="font-mono text-gold font-bold">{TOTAL_MEM_KB} KB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">ALLOCATED MEMORY</span>
                <span className="font-mono text-cyan font-bold">{usedKB} KB ({usedPercent}%)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">TOTAL FREE MEMORY</span>
                <span className="font-mono text-lime font-bold">{freeKB} KB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">FREE HOLES COUNT</span>
                <span className="font-mono font-bold">{freeHolesCount} holes</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="label">LARGEST FREE HOLE</span>
                <span className="font-mono text-gold font-bold">{maxFreeHole} KB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                <span className="label" style={{ color: externalFragmentation > 0 ? '#ef4444' : '#10b981' }}>
                  EXTERNAL FRAGMENTATION
                </span>
                <span className="font-mono font-bold" style={{ color: externalFragmentation > 0 ? '#ef4444' : '#10b981' }}>
                  {externalFragmentation} KB
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimulationLayout>
  );
};
