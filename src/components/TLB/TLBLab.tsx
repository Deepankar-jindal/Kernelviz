import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TLBEntry } from '../../types';
import './TLBLab.css';

const WAYS = 4;

const initialEntries: TLBEntry[] = [
  { vpn: 2, pfn: 5, valid: true, way: 0 },
  { vpn: 7, pfn: 1, valid: true, way: 1 },
  { vpn: 0, pfn: 8, valid: true, way: 2 },
  { vpn: 4, pfn: 3, valid: true, way: 3 },
];

interface LookupResult { hit: boolean; vpn: number; pfn: number | null; way: number | null; }

export const TLBLab: React.FC = () => {
  const [entries, setEntries] = useState<TLBEntry[]>(initialEntries);
  const [vpnInput, setVpnInput] = useState('');
  const [lookupResult, setLookupResult] = useState<LookupResult | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [deepDive, setDeepDive] = useState(false);
  const [tlbTime] = useState(2);
  const [memTime] = useState(100);
  const [ptTime] = useState(80);
  const [history, setHistory] = useState<{ vpn: number; hit: boolean; time: number }[]>([]);

  const lookup = () => {
    const vpn = parseInt(vpnInput);
    if (isNaN(vpn) || vpn < 0) return;
    const entry = entries.find(e => e.vpn === vpn && e.valid);
    if (entry) {
      setLookupResult({ hit: true, vpn, pfn: entry.pfn, way: entry.way });
      setHits(h => h + 1);
      setHistory(prev => [...prev.slice(-9), { vpn, hit: true, time: tlbTime + memTime }]);
    } else {
      // Simulate page-table lookup: add to TLB with a new pfn
      const newPfn = Math.floor(Math.random() * 16);
      const replaceWay = Math.floor(Math.random() * WAYS);
      setLookupResult({ hit: false, vpn, pfn: newPfn, way: replaceWay });
      setMisses(m => m + 1);
      setEntries(prev => prev.map(e => e.way === replaceWay ? { vpn, pfn: newPfn, valid: true, way: replaceWay } : e));
      setHistory(prev => [...prev.slice(-9), { vpn, hit: false, time: tlbTime + ptTime + memTime }]);
    }
    setVpnInput('');
  };

  const reset = () => { setEntries(initialEntries); setLookupResult(null); setHits(0); setMisses(0); setHistory([]); };
  const total = hits + misses;
  const hitRate = total > 0 ? ((hits / total) * 100).toFixed(1) : '—';
  const missRate = total > 0 ? ((misses / total) * 100).toFixed(1) : '—';

  const eat = total > 0
    ? ((hits / total) * (tlbTime + memTime) + (misses / total) * (tlbTime + ptTime + memTime)).toFixed(1)
    : '—';

  return (
    <section id="tlb" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">05 // CACHE</span>
          <h2 className="section-title">CACHE // HIERARCHY</h2>
          <div className="section-divider" />
          <span className="label">TLB // 4-WAY ASSOCIATIVE</span>
          <button className={`btn btn-sm ${deepDive ? 'btn-lime' : ''}`} onClick={() => setDeepDive(d => !d)}>
            {deepDive ? '◈ BASIC' : '◉ DEEP DIVE'}
          </button>
        </div>

        <div className="tlb-layout">
          {/* TLB Ways */}
          <div className="tlb-ways">
            <div className="label label-cyan" style={{ marginBottom: '16px' }}>TRANSLATION LOOKASIDE BUFFER</div>
            <div className="tlb-ways-grid">
              {entries.map(entry => {
                const isHit = lookupResult?.hit && lookupResult.way === entry.way;
                const isMiss = lookupResult && !lookupResult.hit && lookupResult.way === entry.way;
                return (
                  <motion.div
                    key={entry.way}
                    className={`tlb-way panel ${isHit ? 'tlb-hit' : ''} ${isMiss ? 'tlb-miss' : ''}`}
                    animate={isHit ? { scale: [1, 1.03, 1] } : isMiss ? { x: [0, -4, 4, -4, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <div className="tlb-way-label">WAY {entry.way}</div>
                    <div className="tlb-way-entry">
                      <div className="tlb-field">
                        <span className="label">VPN</span>
                        <span className="font-mono tlb-val">{entry.valid ? String(entry.vpn).padStart(2,'0') : '—'}</span>
                      </div>
                      <div className="tlb-arrow">→</div>
                      <div className="tlb-field">
                        <span className="label">PFN</span>
                        <span className="font-mono tlb-val">{entry.valid ? String(entry.pfn).padStart(2,'0') : '—'}</span>
                      </div>
                      <div className="tlb-status" style={{ color: isHit ? 'var(--lime)' : isMiss ? 'var(--coral)' : 'var(--text-muted)' }}>
                        {isHit ? 'HIT' : isMiss ? 'MISS' : entry.valid ? 'VALID' : 'INVALID'}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Lookup panel */}
          <div className="tlb-lookup">
            <div className="panel" style={{ padding: '20px' }}>
              <div className="label label-cyan" style={{ marginBottom: '12px' }}>VPN LOOKUP</div>
              <div className="tlb-lookup-form">
                <input
                  className="input-field"
                  type="number"
                  placeholder="Enter VPN (0–15)"
                  min="0" max="15"
                  value={vpnInput}
                  onChange={e => setVpnInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && lookup()}
                />
                <button className="btn btn-lime" onClick={lookup}>LOOKUP</button>
                <button className="btn btn-coral" onClick={reset}>RESET</button>
              </div>

              <AnimatePresence mode="wait">
                {lookupResult && (
                  <motion.div
                    key={`${lookupResult.vpn}-${lookupResult.hit}`}
                    className={`tlb-result ${lookupResult.hit ? 'tlb-result-hit' : 'tlb-result-miss'}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="tlb-result-status">{lookupResult.hit ? '✓ TLB HIT' : '✗ TLB MISS'}</div>
                    <div className="font-mono tlb-result-detail">
                      VPN {String(lookupResult.vpn).padStart(2,'0')} → PFN {String(lookupResult.pfn ?? 'XX').padStart(2,'0')}
                    </div>
                    {lookupResult.hit && <div className="label">WAY {lookupResult.way} MATCHED</div>}
                    {!lookupResult.hit && <div className="label" style={{ color: 'var(--orange)' }}>PAGE TABLE LOOKUP + EVICTION @ WAY {lookupResult.way}</div>}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stats */}
              <div className="tlb-stats">
                <div className="tlb-stat">
                  <span className="label">HITS</span>
                  <span className="font-mono" style={{ color: 'var(--lime)', fontSize: '24px', fontWeight: 700 }}>{hits}</span>
                </div>
                <div className="tlb-stat">
                  <span className="label">MISSES</span>
                  <span className="font-mono" style={{ color: 'var(--coral)', fontSize: '24px', fontWeight: 700 }}>{misses}</span>
                </div>
                <div className="tlb-stat">
                  <span className="label">HIT RATE</span>
                  <span className="font-mono" style={{ color: 'var(--cyan)', fontSize: '20px', fontWeight: 600 }}>{hitRate}%</span>
                </div>
                <div className="tlb-stat">
                  <span className="label">MISS RATE</span>
                  <span className="font-mono" style={{ color: 'var(--orange)', fontSize: '20px', fontWeight: 600 }}>{missRate}%</span>
                </div>
              </div>
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="panel" style={{ padding: '16px', marginTop: '16px' }}>
                <div className="label label-cyan" style={{ marginBottom: '10px' }}>LOOKUP HISTORY</div>
                <div className="tlb-history">
                  {history.map((h, i) => (
                    <div key={i} className="tlb-history-row">
                      <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>#{i + 1}</span>
                      <span className="font-mono" style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>VPN {h.vpn}</span>
                      <span className="label" style={{ color: h.hit ? 'var(--lime)' : 'var(--coral)' }}>{h.hit ? 'HIT' : 'MISS'}</span>
                      <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>{h.time}ns</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EAT mini */}
            <div className="panel" style={{ padding: '16px', marginTop: '16px' }}>
              <div className="label label-cyan" style={{ marginBottom: '10px' }}>EAT ESTIMATE</div>
              <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.9 }}>
                <div>h = {hits}/{total || '—'} = {hitRate}%</div>
                {deepDive && <>
                  <div style={{ color: 'var(--cyan)', marginTop: '8px' }}>
                    EAT = h × (TLB + MEM) + (1−h) × (TLB + PT + MEM)
                  </div>
                  <div>    = {hitRate}% × ({tlbTime} + {memTime}) + {missRate}% × ({tlbTime} + {ptTime} + {memTime})</div>
                </>}
                <div style={{ color: 'var(--lime)', marginTop: '8px', fontSize: '16px', fontWeight: 700 }}>
                  EAT ≈ {eat} ns
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
