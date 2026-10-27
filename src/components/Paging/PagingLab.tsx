import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AddressTranslation, PageTableEntry } from '../../types';
import './PagingLab.css';

export const PagingLab: React.FC = () => {
  const [pageSize, setPageSize] = useState(4096); // 4KB default
  const [physicalMemory, setPhysicalMemory] = useState(65536); // 64KB
  const [address, setAddress] = useState('');
  const [translation, setTranslation] = useState<AddressTranslation | null>(null);
  const [deepDive, setDeepDive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frameCount = Math.floor(physicalMemory / pageSize);

  // Build a simple page table
  const pageTable: PageTableEntry[] = Array.from({ length: 16 }, (_, i) => ({
    pageNumber: i,
    frameNumber: i < frameCount ? (i * 3 + 1) % frameCount : null,
    present: i < frameCount,
  }));

  const translate = () => {
    const va = parseInt(address, address.startsWith('0x') || address.startsWith('0X') ? 16 : 10);
    if (isNaN(va) || va < 0) { setError('ERR_INVALID_INPUT // ENTER A VALID VIRTUAL ADDRESS'); return; }
    const pn = Math.floor(va / pageSize);
    const offset = va % pageSize;
    const entry = pageTable[pn];
    if (!entry || !entry.present || entry.frameNumber === null) {
      setTranslation({ virtualAddress: va, pageNumber: pn, offset, frameNumber: null, physicalAddress: null, tlbHit: false, pageFault: true });
      setError(null);
      return;
    }
    const pa = entry.frameNumber * pageSize + offset;
    setTranslation({ virtualAddress: va, pageNumber: pn, offset, frameNumber: entry.frameNumber, physicalAddress: pa, tlbHit: Math.random() > 0.5, pageFault: false });
    setError(null);
  };

  const offsetBits = Math.log2(pageSize);
  const pageBits = Math.log2(65536 / pageSize);

  return (
    <section id="paging" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">06 // PAGING</span>
          <h2 className="section-title">PAGING // ADDRESS TRANSLATION</h2>
          <div className="section-divider" />
          <button className={`btn btn-sm ${deepDive ? 'btn-lime' : ''}`} onClick={() => setDeepDive(d => !d)}>
            {deepDive ? '◈ BASIC' : '◉ DEEP DIVE'}
          </button>
        </div>

        <div className="paging-layout">
          {/* Config */}
          <div className="panel paging-config" style={{ padding: '20px' }}>
            <div className="label label-cyan" style={{ marginBottom: '16px' }}>MEMORY CONFIGURATION</div>

            <div className="paging-config-row">
              <label className="label">PAGE SIZE</label>
              <select className="input-field" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setTranslation(null); }}>
                <option value={256}>256 B</option>
                <option value={512}>512 B</option>
                <option value={1024}>1 KB</option>
                <option value={4096}>4 KB</option>
                <option value={8192}>8 KB</option>
              </select>
            </div>

            <div className="paging-config-row">
              <label className="label">PHYSICAL MEMORY</label>
              <select className="input-field" value={physicalMemory} onChange={e => { setPhysicalMemory(Number(e.target.value)); setTranslation(null); }}>
                <option value={16384}>16 KB</option>
                <option value={32768}>32 KB</option>
                <option value={65536}>64 KB</option>
                <option value={131072}>128 KB</option>
              </select>
            </div>

            <div className="paging-metrics">
              <div className="paging-metric">
                <span className="label">FRAMES</span>
                <span className="font-mono paging-metric-val">{frameCount}</span>
              </div>
              <div className="paging-metric">
                <span className="label">PAGE BITS</span>
                <span className="font-mono paging-metric-val">{pageBits.toFixed(0)}</span>
              </div>
              <div className="paging-metric">
                <span className="label">OFFSET BITS</span>
                <span className="font-mono paging-metric-val">{offsetBits.toFixed(0)}</span>
              </div>
            </div>

            <div className="label label-cyan" style={{ margin: '20px 0 12px' }}>PAGE TABLE</div>
            <div className="paging-table">
              <div className="paging-table-header">
                <span>PAGE</span><span>FRAME</span><span>STATUS</span>
              </div>
              {pageTable.slice(0, 12).map(e => (
                <div
                  key={e.pageNumber}
                  className={`paging-table-row ${translation?.pageNumber === e.pageNumber ? 'highlighted' : ''}`}
                >
                  <span className="font-mono">{String(e.pageNumber).padStart(2,'0')}</span>
                  <span className="font-mono" style={{ color: e.present ? 'var(--cyan)' : 'var(--text-muted)' }}>
                    {e.present ? String(e.frameNumber).padStart(2,'0') : '—'}
                  </span>
                  <span className="label" style={{ color: e.present ? 'var(--lime)' : 'var(--coral)' }}>
                    {e.present ? 'PRESENT' : 'FAULT'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Address translation */}
          <div className="paging-translate">
            <div className="panel" style={{ padding: '20px' }}>
              <div className="label label-cyan" style={{ marginBottom: '12px' }}>ADDRESS TRANSLATION</div>
              <div className="paging-input-row">
                <input
                  className="input-field"
                  placeholder="Enter virtual address (decimal or 0x hex)"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && translate()}
                />
                <button className="btn btn-lime" onClick={translate}>TRANSLATE</button>
              </div>
              {error && <div className="label" style={{ color: 'var(--coral)', marginTop: '8px' }}>{error}</div>}
            </div>

            {/* Translation flow */}
            <AnimatePresence>
              {translation && (
                <motion.div
                  className="paging-flow"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {[
                    {
                      label: 'VIRTUAL ADDRESS',
                      value: `0x${translation.virtualAddress.toString(16).toUpperCase().padStart(4,'0')}`,
                      sub: `${translation.virtualAddress} decimal`,
                      color: 'var(--violet-bright)',
                    },
                    {
                      label: 'PAGE NUMBER',
                      value: String(translation.pageNumber).padStart(2,'0'),
                      sub: deepDive ? `bits [${offsetBits.toFixed(0)}..${(offsetBits+pageBits).toFixed(0)}]` : `= VA ÷ ${pageSize}`,
                      color: 'var(--cyan)',
                    },
                    {
                      label: 'PAGE OFFSET',
                      value: String(translation.offset).padStart(4,'0'),
                      sub: deepDive ? `bits [0..${offsetBits.toFixed(0)}]` : `= VA mod ${pageSize}`,
                      color: 'var(--orange)',
                    },
                    {
                      label: translation.tlbHit ? 'TLB HIT' : 'TLB MISS → PAGE TABLE',
                      value: translation.pageFault ? 'FAULT' : `Frame ${String(translation.frameNumber).padStart(2,'0')}`,
                      sub: translation.pageFault ? 'Page not in memory' : translation.tlbHit ? 'Fast path — TLB hit' : 'Slow path — PT lookup',
                      color: translation.pageFault ? 'var(--coral)' : translation.tlbHit ? 'var(--lime)' : 'var(--orange)',
                    },
                    {
                      label: 'PHYSICAL ADDRESS',
                      value: translation.pageFault ? 'PAGE FAULT' : `0x${translation.physicalAddress!.toString(16).toUpperCase().padStart(4,'0')}`,
                      sub: translation.pageFault ? 'OS handles fault' : `Frame ${translation.frameNumber} × ${pageSize} + ${translation.offset}`,
                      color: translation.pageFault ? 'var(--coral)' : 'var(--lime)',
                    },
                  ].map((step, i) => (
                    <motion.div
                      key={i}
                      className="paging-step panel"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.35 }}
                    >
                      <div className="label" style={{ color: step.color, opacity: 0.8 }}>{step.label}</div>
                      <div className="font-mono paging-step-val" style={{ color: step.color }}>{step.value}</div>
                      <div className="label" style={{ marginTop: '3px', opacity: 0.6 }}>{step.sub}</div>
                      {i < 4 && <div className="paging-step-arrow">↓</div>}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
