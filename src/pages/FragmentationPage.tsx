import React, { useState } from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { FragmentationLab } from '../components/Fragmentation/FragmentationLab';
import { Layers, AlertOctagon } from 'lucide-react';
import './FragmentationPage.css';

interface FixedPartition {
  id: number;
  capacity: number;
  processId: string | null;
  processSize: number;
}

const INITIAL_FIXED_PARTITIONS: FixedPartition[] = [
  { id: 1, capacity: 64,  processId: 'P1', processSize: 42 },
  { id: 2, capacity: 128, processId: 'P2', processSize: 85 },
  { id: 3, capacity: 64,  processId: null, processSize: 0 },
  { id: 4, capacity: 256, processId: 'P3', processSize: 180 },
  { id: 5, capacity: 128, processId: null, processSize: 0 },
];

interface Props {
  onCommandCenter: () => void;
}

export const FragmentationPage: React.FC<Props> = ({ onCommandCenter }) => {
  const [activeTab, setActiveTab] = useState<'external' | 'internal'>('external');
  const [fixedPartitions, setFixedPartitions] = useState<FixedPartition[]>(INITIAL_FIXED_PARTITIONS);
  const [newFixedPid, setNewFixedPid] = useState('P4');
  const [newFixedSize, setNewFixedSize] = useState(50);
  const [fixedError, setFixedError] = useState<string | null>(null);

  // Calculate internal fragmentation stats
  let totalFixedCapacity = 0;
  let totalFixedUsed = 0;
  let totalInternalFrag = 0;

  for (const part of fixedPartitions) {
    totalFixedCapacity += part.capacity;
    if (part.processId) {
      totalFixedUsed += part.processSize;
      totalInternalFrag += (part.capacity - part.processSize);
    }
  }

  const allocateFixed = () => {
    if (!newFixedPid.trim()) { setFixedError('Process ID required'); return; }
    if (newFixedSize <= 0) { setFixedError('Size must be > 0'); return; }
    if (fixedPartitions.some(p => p.processId === newFixedPid)) { setFixedError('Process ID already exists'); return; }

    // Find first free partition with capacity >= newFixedSize
    const targetIdx = fixedPartitions.findIndex(p => p.processId === null && p.capacity >= newFixedSize);
    if (targetIdx === -1) {
      setFixedError(`No free fixed partition can hold ${newFixedSize} KB!`);
      return;
    }

    setFixedPartitions(prev => {
      const next = [...prev];
      next[targetIdx] = {
        ...next[targetIdx],
        processId: newFixedPid,
        processSize: newFixedSize,
      };
      return next;
    });

    setFixedError(null);
    setNewFixedPid(`P${Math.floor(Math.random() * 80) + 10}`);
  };

  const freeFixed = (id: number) => {
    setFixedPartitions(prev => prev.map(p => p.id === id ? { ...p, processId: null, processSize: 0 } : p));
  };

  const resetFixed = () => {
    setFixedPartitions(INITIAL_FIXED_PARTITIONS);
    setFixedError(null);
  };

  return (
    <SimulationLayout
      moduleNumber="08"
      moduleTag="MEMORY // FRAGMENTATION ANALYSIS"
      title="MEMORY // INTERNAL & EXTERNAL FRAGMENTATION LABORATORY"
      description="Empirical investigation of memory fragmentation. Explore internal fragmentation in fixed partitioning/paging and external fragmentation in dynamic contiguous placement with hole coalescing and compaction."
      onCommandCenter={onCommandCenter}
    >
      {/* Tab Switcher */}
      <div className="frag-page-tabs">
        <button
          className={`frag-tab-btn ${activeTab === 'external' ? 'active' : ''}`}
          onClick={() => setActiveTab('external')}
        >
          <Layers className="w-3.5 h-3.5 inline mr-1 text-cyan" />
          EXTERNAL FRAGMENTATION (DYNAMIC VARIABLE PARTITIONS)
        </button>
        <button
          className={`frag-tab-btn ${activeTab === 'internal' ? 'active' : ''}`}
          onClick={() => setActiveTab('internal')}
        >
          <AlertOctagon className="w-3.5 h-3.5 inline mr-1 text-gold" />
          INTERNAL FRAGMENTATION (FIXED PARTITIONS / PAGING)
        </button>
      </div>

      {activeTab === 'external' && (
        <FragmentationLab />
      )}

      {activeTab === 'internal' && (
        <div>
          {/* Internal Fragmentation Header Panel */}
          <div className="panel" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div className="label label-gold">FIXED PARTITIONING // INTERNAL SLACK ANALYSIS</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Internal fragmentation occurs when allocated storage is larger than requested data, creating unusable residual slack inside the partition.
                </div>
              </div>
              <button className="btn btn-sm" onClick={resetFixed}>RESET FIXED MEMORY</button>
            </div>

            {/* Form */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '20px', flexWrap: 'wrap' }}>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '4px' }}>PROCESS ID</label>
                <input
                  className="input-field"
                  style={{ width: '120px' }}
                  value={newFixedPid}
                  onChange={e => setNewFixedPid(e.target.value.toUpperCase())}
                />
              </div>
              <div>
                <label className="label" style={{ display: 'block', marginBottom: '4px' }}>PROCESS SIZE (KB)</label>
                <input
                  className="input-field"
                  type="number"
                  style={{ width: '140px' }}
                  min="1"
                  max="256"
                  value={newFixedSize}
                  onChange={e => setNewFixedSize(Number(e.target.value))}
                />
              </div>
              <button className="btn btn-primary" onClick={allocateFixed}>
                + ALLOCATE FIXED
              </button>
            </div>
            {fixedError && <div className="label" style={{ color: '#ef4444', marginTop: '8px' }}>{fixedError}</div>}
          </div>

          {/* Partitions Grid */}
          <div className="internal-grid">
            {fixedPartitions.map(p => {
              const isAllocated = p.processId !== null;
              const usedPct = isAllocated ? (p.processSize / p.capacity) * 100 : 0;
              const internalSlack = isAllocated ? p.capacity - p.processSize : 0;

              return (
                <div key={p.id} className="internal-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="label font-mono">PARTITION #{p.id} // {p.capacity} KB</span>
                    {isAllocated ? (
                      <button className="btn btn-sm btn-danger" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => freeFixed(p.id)}>
                        FREE
                      </button>
                    ) : (
                      <span className="label" style={{ color: 'var(--lime)' }}>UNOCCUPIED</span>
                    )}
                  </div>

                  <div className="internal-bar-box">
                    {isAllocated ? (
                      <>
                        <div className="internal-used-fill" style={{ width: `${usedPct}%` }}>
                          {p.processId}: {p.processSize} KB
                        </div>
                        {internalSlack > 0 && (
                          <div className="internal-wasted-fill" title={`Internal Frag: ${internalSlack} KB`}>
                            WASTED: {internalSlack} KB
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)' }}>
                        EMPTY PARTITION ({p.capacity} KB AVAILABLE)
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                    <span className="text-muted">SLACK WASTAGE:</span>
                    <span style={{ color: internalSlack > 0 ? '#f87171' : 'var(--text-muted)', fontWeight: 700 }}>
                      {internalSlack} KB ({isAllocated ? ((internalSlack / p.capacity) * 100).toFixed(0) : 0}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="panel" style={{ padding: '20px' }}>
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>
              INTERNAL FRAGMENTATION SUMMARY METRICS
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              <div>
                <span className="label">TOTAL PARTITION CAPACITY</span>
                <div className="font-mono text-gold font-bold" style={{ fontSize: '20px', marginTop: '4px' }}>
                  {totalFixedCapacity} KB
                </div>
              </div>
              <div>
                <span className="label">ACTIVE PROCESS STORAGE</span>
                <div className="font-mono text-cyan font-bold" style={{ fontSize: '20px', marginTop: '4px' }}>
                  {totalFixedUsed} KB
                </div>
              </div>
              <div>
                <span className="label" style={{ color: '#ef4444' }}>TOTAL INTERNAL FRAGMENTATION</span>
                <div className="font-mono font-bold" style={{ fontSize: '20px', marginTop: '4px', color: '#ef4444' }}>
                  {totalInternalFrag} KB
                </div>
              </div>
              <div>
                <span className="label">WASTAGE RATIO</span>
                <div className="font-mono font-bold text-coral" style={{ fontSize: '20px', marginTop: '4px' }}>
                  {totalFixedCapacity > 0 ? ((totalInternalFrag / totalFixedCapacity) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SimulationLayout>
  );
};
