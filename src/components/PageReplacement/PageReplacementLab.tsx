import React, { useState } from 'react';
import type { PageReplacementAlgorithm } from '../../types';
import { runFIFO, runLRU, runOptimal } from '../../algorithms/pageReplacement';
import './PageReplacementLab.css';

const COLORS = ['#B58A3A','#176B67','#C17E3A','#D4AF37','#A65F3E','#1F9490','#8A6528','#6B8892','#C17E3A','#176B67'];
const DEFAULT_REF = '7 0 1 2 0 3 0 4 2 3 0 3 2 1 2 0 1 7 0 1';

export const PageReplacementLab: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<PageReplacementAlgorithm>('FIFO');
  const [refString, setRefString] = useState(DEFAULT_REF);
  const [frameCount, setFrameCount] = useState(3);
  const [result, setResult] = useState<ReturnType<typeof runFIFO> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deepDive, setDeepDive] = useState(false);

  const run = () => {
    const pages = refString.trim().split(/[\s,]+/).map(Number);
    if (pages.some(isNaN) || pages.length === 0) {
      setError('ERR_INVALID_INPUT // REFERENCE STRING MUST CONTAIN NUMBERS');
      return;
    }
    if (frameCount < 1 || frameCount > 8) {
      setError('ERR_INVALID_INPUT // FRAME COUNT MUST BE 1–8');
      return;
    }
    setError(null);
    try {
      let res;
      switch (algorithm) {
        case 'FIFO': res = runFIFO(pages, frameCount); break;
        case 'LRU': res = runLRU(pages, frameCount); break;
        case 'Optimal': res = runOptimal(pages, frameCount); break;
      }
      if (res) setResult(res);
    } catch (e) {
      setError(`ERR_SIMULATION_FAILED // ${String(e)}`);
    }
  };

  const pages = refString.trim().split(/[\s,]+/).map(Number).filter(n => !isNaN(n));
  const uniquePages = [...new Set(pages)];
  const colorMap: Record<number, string> = {};
  uniquePages.forEach((p, i) => { colorMap[p] = COLORS[i % COLORS.length]; });

  return (
    <section id="replacement" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">07 // REPLACEMENT</span>
          <h2 className="section-title">PAGE REPLACEMENT // FAULT ANALYSIS</h2>
          <div className="section-divider" />
          <button className={`btn btn-sm ${deepDive ? 'btn-lime' : ''}`} onClick={() => setDeepDive(d => !d)}>
            {deepDive ? '◈ BASIC' : '◉ DEEP DIVE'}
          </button>
        </div>

        <div className="pr-layout">
          <div className="panel pr-config" style={{ padding: '20px' }}>
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>ALGORITHM</div>
            <div className="pr-algo-row">
              {(['FIFO','LRU','Optimal'] as PageReplacementAlgorithm[]).map(a => (
                <button
                  key={a}
                  className={`sched-algo-btn ${algorithm === a ? 'active' : ''}`}
                  onClick={() => { setAlgorithm(a); setResult(null); }}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="label label-cyan" style={{ margin: '20px 0 8px' }}>REFERENCE STRING</div>
            <textarea
              className="input-field pr-textarea"
              value={refString}
              onChange={e => { setRefString(e.target.value); setResult(null); }}
              placeholder="e.g. 7 0 1 2 0 3 0 4 2 3"
              rows={3}
            />

            <div className="paging-config-row" style={{ marginTop: '12px' }}>
              <label className="label">FRAME COUNT</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button className="btn btn-sm" onClick={() => setFrameCount(f => Math.max(1, f - 1))}>−</button>
                <span className="font-mono" style={{ color: 'var(--cyan)', fontSize: '18px', minWidth: '24px', textAlign: 'center' }}>{frameCount}</span>
                <button className="btn btn-sm" onClick={() => setFrameCount(f => Math.min(8, f + 1))}>+</button>
              </div>
            </div>

            {error && <div className="label" style={{ color: 'var(--coral)', marginTop: '8px' }}>{error}</div>}

            <button className="btn btn-lime" style={{ marginTop: '16px', width: '100%' }} onClick={run}>
              ▶ RUN SIMULATION
            </button>

            {result && (
              <div className="pr-stats">
                <div className="pr-stat">
                  <span className="label">PAGE FAULTS</span>
                  <span className="font-mono" style={{ color: 'var(--coral)', fontSize: '28px', fontWeight: 700 }}>{result.totalFaults}</span>
                </div>
                <div className="pr-stat">
                  <span className="label">HITS</span>
                  <span className="font-mono" style={{ color: 'var(--lime)', fontSize: '28px', fontWeight: 700 }}>{result.totalHits}</span>
                </div>
                <div className="pr-stat">
                  <span className="label">HIT RATE</span>
                  <span className="font-mono" style={{ color: 'var(--cyan)', fontSize: '22px', fontWeight: 600 }}>{(result.hitRate * 100).toFixed(1)}%</span>
                </div>
                <div className="pr-stat">
                  <span className="label">FAULT RATE</span>
                  <span className="font-mono" style={{ color: 'var(--orange)', fontSize: '22px', fontWeight: 600 }}>{(result.faultRate * 100).toFixed(1)}%</span>
                </div>
              </div>
            )}
          </div>

          {result && (
            <div className="pr-viz panel" style={{ padding: '20px' }}>
              <div className="label label-cyan" style={{ marginBottom: '16px' }}>FRAME STATE VISUALIZATION</div>

              {/* Reference string */}
              <div className="pr-ref-row">
                {pages.map((p, i) => (
                  <div key={i} className={`pr-ref-cell ${result.faults[i] ? 'fault' : 'hit'}`}
                    style={{ borderColor: colorMap[p] }}>
                    <span className="font-mono" style={{ color: colorMap[p], fontSize: '11px', fontWeight: 700 }}>{p}</span>
                    <span className="label" style={{ color: result.faults[i] ? 'var(--coral)' : 'var(--lime)', fontSize: '8px' }}>
                      {result.faults[i] ? 'F' : 'H'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Frame rows */}
              {Array.from({ length: frameCount }, (_, fi) => (
                <div key={fi} className="pr-frame-row">
                  <span className="label" style={{ width: '48px', flexShrink: 0 }}>F{fi}</span>
                  {result.frames.map((frameState, i) => {
                    const val = frameState[fi];
                    const prevVal = i > 0 ? result.frames[i - 1][fi] : null;
                    const changed = val !== prevVal;
                    return (
                      <div
                        key={i}
                        className={`pr-frame-cell ${result.faults[i] && changed ? 'replaced' : ''}`}
                        style={{ borderColor: val !== null ? `${colorMap[val]}60` : 'transparent' }}
                      >
                        {val !== null ? (
                          <span className="font-mono" style={{ color: colorMap[val], fontSize: '10px', fontWeight: 600 }}>{val}</span>
                        ) : <span style={{ color: 'transparent' }}>·</span>}
                      </div>
                    );
                  })}
                </div>
              ))}

              {deepDive && (
                <div className="panel" style={{ marginTop: '16px', padding: '12px', background: 'rgba(181,138,58,0.04)' }}>
                  <div className="label label-cyan" style={{ marginBottom: '8px' }}>ALGORITHM DESCRIPTION</div>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                    {algorithm === 'FIFO' && 'FIFO: Replaces the oldest loaded page. Simple but can suffer from Belady\'s anomaly.'}
                    {algorithm === 'LRU' && 'LRU: Replaces the least recently used page. No Belady\'s anomaly. Stack algorithm.'}
                    {algorithm === 'Optimal' && 'Optimal (OPT): Replaces the page that will not be used for the longest time. Best possible performance — theoretical only.'}
                  </div>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--cyan)', marginTop: '8px' }}>
                    Total references: {pages.length} | Faults: {result.totalFaults} | Fault ratio: {(result.faultRate * 100).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};



