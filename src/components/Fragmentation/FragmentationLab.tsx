import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { MemoryBlock } from '../../types';
import { computeStats, runFirstFit, runBestFit, runWorstFit } from '../../algorithms/allocation';
import './FragmentationLab.css';

type FitAlgorithm = 'FirstFit' | 'BestFit' | 'WorstFit';

const TOTAL_MEMORY = 256;
const initialBlocks: MemoryBlock[] = [
  { id: 'b0', start: 0, size: 40, isFree: false, processId: 'P1' },
  { id: 'b1', start: 40, size: 20, isFree: true },
  { id: 'b2', start: 60, size: 60, isFree: false, processId: 'P2' },
  { id: 'b3', start: 120, size: 30, isFree: true },
  { id: 'b4', start: 150, size: 50, isFree: false, processId: 'P3' },
  { id: 'b5', start: 200, size: 56, isFree: true },
];

const BLOCK_COLORS = ['#B58A3A','#176B67','#C17E3A','#D4AF37','#A65F3E','#1F9490','#8A6528'];
const usedColors: Record<string, string> = { P1: BLOCK_COLORS[0], P2: BLOCK_COLORS[1], P3: BLOCK_COLORS[2] };
let colorIdx = 3;

export const FragmentationLab: React.FC = () => {
  const [blocks, setBlocks] = useState<MemoryBlock[]>(initialBlocks);
  const [algorithm, setAlgorithm] = useState<FitAlgorithm>('FirstFit');
  const [newPid, setNewPid] = useState('');
  const [newSize, setNewSize] = useState(24);
  const [error, setError] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const stats = computeStats(blocks);

  const allocate = () => {
    if (!newPid.trim()) { setError('ERR_INVALID_INPUT // PROCESS ID REQUIRED'); return; }
    if (newSize <= 0 || newSize > TOTAL_MEMORY) { setError(`ERR_INVALID_INPUT // SIZE MUST BE 1–${TOTAL_MEMORY}`); return; }
    if (blocks.find(b => b.processId === newPid)) { setError('ERR_DUPLICATE_PID // PROCESS ALREADY IN MEMORY'); return; }

    if (!usedColors[newPid]) { usedColors[newPid] = BLOCK_COLORS[colorIdx % BLOCK_COLORS.length]; colorIdx++; }

    let result;
    switch (algorithm) {
      case 'FirstFit': result = runFirstFit(blocks, newPid, newSize); break;
      case 'BestFit':  result = runBestFit(blocks, newPid, newSize); break;
      case 'WorstFit': result = runWorstFit(blocks, newPid, newSize); break;
    }

    if (result.blocks === blocks) { setError('ERR_NO_SPACE // NOT ENOUGH CONTIGUOUS FREE MEMORY'); return; }
    setBlocks(result.blocks);
    setError(null);
    setNewPid('');
  };

  const deallocate = (pid: string) => {
    setBlocks(prev => {
      const next = prev.map(b => b.processId === pid ? { ...b, isFree: true, processId: undefined } : b);
      // Merge adjacent free blocks
      const merged: MemoryBlock[] = [];
      for (const b of next) {
        if (merged.length > 0 && merged[merged.length-1].isFree && b.isFree) {
          merged[merged.length-1].size += b.size;
        } else {
          merged.push({ ...b });
        }
      }
      return merged;
    });
  };

  const reset = () => { setBlocks(initialBlocks); setError(null); };

  return (
    <section id="fragmentation" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">08 // FRAGMENTATION</span>
          <h2 className="section-title">MEMORY // FRAGMENTATION ANALYSIS</h2>
          <div className="section-divider" />
        </div>

        <div className="frag-layout">
          {/* Controls */}
          <div className="panel frag-controls" style={{ padding: '20px' }}>
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>FIT ALGORITHM</div>
            <div className="frag-algo-row">
              {(['FirstFit','BestFit','WorstFit'] as FitAlgorithm[]).map(a => (
                <button key={a} className={`sched-algo-btn ${algorithm === a ? 'active' : ''}`} onClick={() => setAlgorithm(a)}>
                  {a.replace('Fit', ' FIT')}
                </button>
              ))}
            </div>

            <div className="label label-cyan" style={{ margin: '20px 0 12px' }}>ALLOCATE PROCESS</div>
            <div className="paging-config-row">
              <label className="label">PROCESS ID</label>
              <input className="input-field" placeholder="e.g. P4" value={newPid} maxLength={4}
                onChange={e => setNewPid(e.target.value.toUpperCase())} />
            </div>
            <div className="paging-config-row">
              <label className="label">SIZE (bytes)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="btn btn-sm" onClick={() => setNewSize(s => Math.max(1, s - 4))}>−</button>
                <span className="font-mono" style={{ color: 'var(--cyan)', fontSize: '16px', minWidth: '40px', textAlign: 'center' }}>{newSize}</span>
                <button className="btn btn-sm" onClick={() => setNewSize(s => Math.min(TOTAL_MEMORY, s + 4))}>+</button>
              </div>
            </div>

            {error && <div className="label" style={{ color: 'var(--coral)', margin: '8px 0' }}>{error}</div>}

            <button className="btn btn-lime" style={{ width: '100%', marginBottom: '8px' }} onClick={allocate}>
              + ALLOCATE
            </button>
            <button className="btn btn-coral" style={{ width: '100%' }} onClick={reset}>↺ RESET</button>

            {/* Stats */}
            <div className="frag-stats">
              <div className="frag-stat">
                <span className="label">TOTAL</span>
                <span className="font-mono frag-stat-val" style={{ color: 'var(--cyan)' }}>{TOTAL_MEMORY}B</span>
              </div>
              <div className="frag-stat">
                <span className="label">USED</span>
                <span className="font-mono frag-stat-val" style={{ color: 'var(--lime)' }}>{stats.usedMemory}B</span>
              </div>
              <div className="frag-stat">
                <span className="label">FREE</span>
                <span className="font-mono frag-stat-val" style={{ color: 'var(--orange)' }}>{stats.freeMemory}B</span>
              </div>
              <div className="frag-stat">
                <span className="label">EXT FRAG</span>
                <span className="font-mono frag-stat-val" style={{ color: 'var(--coral)' }}>{stats.externalFragmentation}B</span>
              </div>
            </div>

            {/* Process list for dealloc */}
            <div className="label label-cyan" style={{ margin: '16px 0 8px' }}>LOADED PROCESSES</div>
            {blocks.filter(b => !b.isFree).map(b => (
              <div key={b.processId} className="frag-proc-row">
                <span className="font-mono" style={{ color: usedColors[b.processId!] || 'var(--cyan)' }}>{b.processId}</span>
                <span className="label">{b.size}B @ {b.start}</span>
                <button className="btn btn-sm btn-coral" onClick={() => deallocate(b.processId!)}>FREE</button>
              </div>
            ))}
          </div>

          {/* Memory visualization */}
          <div className="frag-viz">
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>
              PHYSICAL MEMORY — {TOTAL_MEMORY} BYTES
            </div>
            <div className="frag-memory-bar">
              {blocks.map(block => {
                const widthPct = (block.size / TOTAL_MEMORY) * 100;
                const color = block.isFree ? 'transparent' : (usedColors[block.processId!] || 'var(--cyan)');
                const isHovered = hovered === block.id;
                return (
                  <motion.div
                    key={block.id}
                    className={`frag-block ${block.isFree ? 'frag-block-free' : 'frag-block-used'}`}
                    style={{
                      width: `${widthPct}%`,
                      background: block.isFree ? 'rgba(255,255,255,0.04)' : `${color}22`,
                      borderColor: block.isFree ? 'rgba(255,255,255,0.08)' : color,
                    }}
                    onMouseEnter={() => setHovered(block.id)}
                    onMouseLeave={() => setHovered(null)}
                    animate={{ scale: isHovered ? 1.02 : 1 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span className="font-mono frag-block-label" style={{ color: block.isFree ? 'var(--text-muted)' : color }}>
                      {block.isFree ? 'FREE' : block.processId}
                    </span>
                    <span className="label frag-block-size">{block.size}B</span>
                  </motion.div>
                );
              })}
            </div>

            {/* Address ruler */}
            <div className="frag-ruler">
              {blocks.map(block => (
                <div key={block.id} className="font-mono frag-ruler-mark" style={{ width: `${(block.size / TOTAL_MEMORY) * 100}%` }}>
                  {block.start}
                </div>
              ))}
              <span className="font-mono frag-ruler-end">{TOTAL_MEMORY}</span>
            </div>

            {/* Tooltip */}
            {hovered && (() => {
              const b = blocks.find(bl => bl.id === hovered);
              if (!b) return null;
              return (
                <div className="frag-tooltip panel">
                  <div className="font-mono" style={{ color: 'var(--cyan)', marginBottom: '6px' }}>
                    {b.isFree ? 'FREE HOLE' : `PROCESS ${b.processId}`}
                  </div>
                  <div className="label">START: {b.start}</div>
                  <div className="label">SIZE: {b.size}B</div>
                  <div className="label">END: {b.start + b.size}</div>
                  <div className="label" style={{ color: b.isFree ? 'var(--orange)' : 'var(--lime)' }}>
                    {b.isFree ? 'EXTERNAL FRAGMENT' : 'ALLOCATED'}
                  </div>
                </div>
              );
            })()}

            {/* Free holes visualization */}
            <div style={{ marginTop: '24px' }}>
              <div className="label label-cyan" style={{ marginBottom: '10px' }}>FREE HOLES</div>
              <div className="frag-holes">
                {blocks.filter(b => b.isFree).length === 0 && (
                  <div className="label" style={{ color: 'var(--lime)' }}>NO EXTERNAL FRAGMENTATION</div>
                )}
                {blocks.filter(b => b.isFree).map((b, i) => (
                  <div key={b.id} className="frag-hole panel">
                    <span className="label">HOLE #{i + 1}</span>
                    <span className="font-mono" style={{ color: 'var(--orange)', fontSize: '18px', fontWeight: 700 }}>{b.size}B</span>
                    <span className="label">@ {b.start}–{b.start + b.size}</span>
                  </div>
                ))}
              </div>
              {blocks.filter(b => b.isFree).length > 1 && (
                <div className="label" style={{ color: 'var(--coral)', marginTop: '8px' }}>
                  ⚠ EXTERNAL FRAGMENTATION: {stats.externalFragmentation}B FRAGMENTED ACROSS {blocks.filter(b => b.isFree).length} HOLES
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

