import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './MemoryLab.css';

export const MemoryLab: React.FC = () => {
  const [tlbTime, setTlbTime] = useState(2);
  const [memTime, setMemTime] = useState(100);
  const [ptTime, setPtTime] = useState(80);
  const [hitRatio, setHitRatio] = useState(0.85);
  const [step, setStep] = useState<'tlb' | 'pt' | 'mem' | null>(null);

  const eat = hitRatio * (tlbTime + memTime) + (1 - hitRatio) * (tlbTime + ptTime + memTime);
  const eatWithout = 2 * memTime; // without TLB
  const speedup = eatWithout / eat;

  const [frames] = useState(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i,
      used: ((i * 7 + 3) % 10) > 3,
      page: (i * 3 + 1) % 20,
      process: ['P1', 'P2', 'P3'][i % 3],
    }))
  );

  const animateFlow = () => {
    const steps: ('tlb' | 'pt' | 'mem')[] = ['tlb', 'pt', 'mem'];
    let i = 0;
    const t = setInterval(() => {
      setStep(steps[i]);
      i++;
      if (i >= steps.length) { clearInterval(t); setTimeout(() => setStep(null), 800); }
    }, 700);
  };

  return (
    <section id="memory" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">04 // MEMORY</span>
          <h2 className="section-title">MEMORY // ALLOCATION</h2>
          <div className="section-divider" />
        </div>

        <div className="mem-layout">
          {/* EAT Calculator */}
          <div className="panel mem-eat" style={{ padding: '24px' }}>
            <div className="label label-cyan" style={{ marginBottom: '16px' }}>EFFECTIVE ACCESS TIME CALCULATOR</div>

            <div className="mem-eat-formula">
              <div className="font-mono eat-formula-text">
                EAT = h × (TLB + MEM) + (1−h) × (TLB + PT + MEM)
              </div>
            </div>

            <div className="mem-inputs">
              {[
                { label: 'TLB LOOKUP TIME (ns)', val: tlbTime, set: setTlbTime, min: 1, max: 20 },
                { label: 'MEMORY ACCESS TIME (ns)', val: memTime, set: setMemTime, min: 10, max: 500 },
                { label: 'PAGE TABLE LOOKUP (ns)', val: ptTime, set: setPtTime, min: 10, max: 300 },
              ].map(inp => (
                <div key={inp.label} className="mem-input-row">
                  <label className="label">{inp.label}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input type="range" min={inp.min} max={inp.max} value={inp.val}
                      onChange={e => inp.set(Number(e.target.value))}
                      style={{ flex: 1, accentColor: 'var(--brass)' }} />
                    <span className="font-mono" style={{ color: 'var(--brass)', minWidth: '48px', textAlign: 'right' }}>
                      {inp.val}ns
                    </span>
                  </div>
                </div>
              ))}

              <div className="mem-input-row">
                <label className="label">TLB HIT RATIO (h)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input type="range" min={0} max={100} value={Math.round(hitRatio * 100)}
                    onChange={e => setHitRatio(Number(e.target.value) / 100)}
                    style={{ flex: 1, accentColor: 'var(--lime)' }} />
                  <span className="font-mono" style={{ color: 'var(--lime)', minWidth: '48px', textAlign: 'right' }}>
                    {(hitRatio * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="mem-eat-breakdown">
              <div className="mem-eat-component" style={{ background: 'rgba(181,138,58,0.05)' }}>
                <div className="label">HIT PATH</div>
                <div className="font-mono mem-eat-val" style={{ color: 'var(--brass)' }}>
                  {hitRatio.toFixed(2)} × ({tlbTime} + {memTime}) = {(hitRatio * (tlbTime + memTime)).toFixed(1)}ns
                </div>
              </div>
              <div className="mem-eat-plus">+</div>
              <div className="mem-eat-component" style={{ background: 'rgba(255,138,0,0.05)' }}>
                <div className="label">MISS PATH</div>
                <div className="font-mono mem-eat-val" style={{ color: 'var(--orange)' }}>
                  {(1 - hitRatio).toFixed(2)} × ({tlbTime} + {ptTime} + {memTime}) = {((1 - hitRatio) * (tlbTime + ptTime + memTime)).toFixed(1)}ns
                </div>
              </div>
              <div className="mem-eat-equals">=</div>
              <div className="mem-eat-result">
                <div className="label label-lime">EFFECTIVE ACCESS TIME</div>
                <div className="font-mono" style={{ color: 'var(--lime)', fontSize: '32px', fontWeight: 700 }}>
                  {eat.toFixed(1)}ns
                </div>
                <div className="label" style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
                  {speedup.toFixed(2)}× faster than no TLB ({eatWithout}ns)
                </div>
              </div>
            </div>

            <button className="btn btn-sm" style={{ marginTop: '16px' }} onClick={animateFlow}>
              ▶ ANIMATE FLOW
            </button>
          </div>

          {/* Memory flow diagram */}
          <div className="mem-flow">
            <div className="label label-cyan" style={{ marginBottom: '16px' }}>ADDRESS TRANSLATION FLOW</div>

            {[
              { id: 'virtual', label: 'VIRTUAL ADDRESS', sub: '0x00401A2C', color: 'var(--violet-bright)', active: true },
              { id: 'tlb', label: 'TLB LOOKUP', sub: `${tlbTime}ns — 4-way associative`, color: 'var(--brass)', active: step === 'tlb' },
              { id: 'pt', label: 'PAGE TABLE', sub: `${ptTime}ns — on miss`, color: 'var(--orange)', active: step === 'pt' },
              { id: 'mem', label: 'PHYSICAL MEMORY', sub: `${memTime}ns — DRAM access`, color: 'var(--lime)', active: step === 'mem' },
            ].map((node, i) => (
              <React.Fragment key={node.id}>
                <motion.div
                  className={`mem-flow-node panel ${node.active ? 'mem-flow-node--active' : ''}`}
                  style={{ borderColor: node.active ? node.color : 'var(--border)' }}
                  animate={node.active ? { boxShadow: `0 0 20px ${node.color}40` } : {}}
                >
                  <span className="label" style={{ color: node.color }}>{node.label}</span>
                  <span className="font-mono mem-flow-val">{node.sub}</span>
                </motion.div>
                {i < 3 && (
                  <div className="mem-flow-arrow">
                    <span style={{ color: 'var(--brass)', opacity: 0.4 }}>↓</span>
                  </div>
                )}
              </React.Fragment>
            ))}

            {/* Physical memory heatmap */}
            <div className="label label-cyan" style={{ margin: '24px 0 12px' }}>PHYSICAL MEMORY FRAMES</div>
            <div className="mem-heatmap">
              {frames.map(f => (
                <div
                  key={f.id}
                  className={`mem-frame ${f.used ? 'mem-frame-used' : 'mem-frame-free'}`}
                  title={`Frame ${f.id}: ${f.used ? `${f.process} — Page ${f.page}` : 'FREE'}`}
                >
                  <span>{f.id}</span>
                </div>
              ))}
            </div>
            <div className="mem-legend">
              <span className="mem-legend-item"><span className="mem-frame-dot used" />ALLOCATED</span>
              <span className="mem-legend-item"><span className="mem-frame-dot free" />FREE</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


