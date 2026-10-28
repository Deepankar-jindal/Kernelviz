import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Process, SchedulerResult } from '../../types';
import { runFCFS, runSJF, runSRTF, runRoundRobin, runPriority } from '../../algorithms/scheduling';
import './AlgorithmBattle.css';

const defaultWorkload: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 8, priority: 3, color: '#B58A3A' },
  { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1, color: '#176B67' },
  { pid: 'P3', arrivalTime: 2, burstTime: 9, priority: 4, color: '#C17E3A' },
  { pid: 'P4', arrivalTime: 3, burstTime: 5, priority: 2, color: '#D4AF37' },
  { pid: 'P5', arrivalTime: 4, burstTime: 2, priority: 1, color: '#A65F3E' },
];

interface AlgoResult { name: string; result: SchedulerResult; color: string; }

const METRICS = [
  { key: 'avgWaitingTime', label: 'AVG WAIT', unit: 'ms', better: 'lower' },
  { key: 'avgTurnaroundTime', label: 'AVG TAT', unit: 'ms', better: 'lower' },
  { key: 'avgResponseTime', label: 'AVG RESP', unit: 'ms', better: 'lower' },
  { key: 'cpuUtilization', label: 'CPU UTIL', unit: '%', better: 'higher' },
  { key: 'contextSwitches', label: 'CTX SW', unit: '', better: 'lower' },
] as const;

export const AlgorithmBattle: React.FC = () => {
  const [results, setResults] = useState<AlgoResult[]>([]);
  const [ran, setRan] = useState(false);

  const run = () => {
    const algos: { name: string; fn: () => SchedulerResult; color: string }[] = [
      { name: 'FCFS', fn: () => runFCFS(defaultWorkload), color: '#B58A3A' },
      { name: 'SJF',  fn: () => runSJF(defaultWorkload),  color: '#176B67' },
      { name: 'SRTF', fn: () => runSRTF(defaultWorkload), color: '#C17E3A' },
      { name: 'RR',   fn: () => runRoundRobin(defaultWorkload, 2), color: '#D4AF37' },
      { name: 'Priority', fn: () => runPriority(defaultWorkload), color: '#A65F3E' },
    ];
    setResults(algos.map(a => ({ name: a.name, result: a.fn(), color: a.color })));
    setRan(true);
  };

  const getBest = (key: string, better: string) => {
    if (results.length === 0) return null;
    const vals = results.map(r => (r.result as any)[key]);
    return better === 'lower' ? Math.min(...vals) : Math.max(...vals);
  };

  const maxVal = (key: string) => {
    const vals = results.map(r => (r.result as any)[key] as number);
    return Math.max(...vals) || 1;
  };

  return (
    <section id="battle" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">09 // BENCHMARK</span>
          <h2 className="section-title">ALGORITHM // BENCHMARK ARENA</h2>
          <div className="section-divider" />
        </div>

        <div className="battle-subtext">
          Same workload. 5 processes. 5 algorithms. Who wins?
        </div>

        {/* Workload display */}
        <div className="battle-workload panel" style={{ padding: '16px', marginBottom: '24px' }}>
          <div className="label label-cyan" style={{ marginBottom: '10px' }}>TEST WORKLOAD</div>
          <div className="battle-workload-row">
            {defaultWorkload.map(p => (
              <div key={p.pid} className="battle-proc" style={{ borderColor: p.color }}>
                <span className="font-mono" style={{ color: p.color, fontWeight: 700 }}>{p.pid}</span>
                <span className="label">ARR:{p.arrivalTime}</span>
                <span className="label">BURST:{p.burstTime}</span>
                <span className="label">PRI:{p.priority}</span>
              </div>
            ))}
          </div>
        </div>

        <button className="btn btn-lime btn-lg" style={{ marginBottom: '32px' }} onClick={run}>
          ⚔ RUN ALGORITHM BATTLE
        </button>

        {ran && results.length > 0 && (
          <div className="battle-results">
            {METRICS.map((m, mi) => {
              const best = getBest(m.key, m.better);
              const max = maxVal(m.key);
              return (
                <div key={m.key} className="battle-metric-block panel" style={{ padding: '16px' }}>
                  <div className="label label-cyan" style={{ marginBottom: '12px' }}>{m.label}</div>
                  {results.map((r, i) => {
                    const val = (r.result as any)[m.key] as number;
                    const isWinner = val === best;
                    const barPct = m.better === 'lower'
                      ? ((max - val) / (max || 1)) * 100
                      : (val / (max || 1)) * 100;
                    return (
                      <motion.div
                        key={r.name}
                        className="battle-bar-row"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: mi * 0.05 + i * 0.05 }}
                      >
                        <span className="font-mono battle-bar-name" style={{ color: r.color }}>{r.name}</span>
                        <div className="battle-bar-track">
                          <motion.div
                            className="battle-bar-fill"
                            style={{ background: isWinner ? 'var(--lime)' : r.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.max(barPct, 4)}%` }}
                            transition={{ delay: mi * 0.05 + i * 0.06 + 0.1, duration: 0.6, ease: 'easeOut' }}
                          />
                        </div>
                        <span className="font-mono battle-bar-val" style={{ color: isWinner ? 'var(--lime)' : 'var(--text-secondary)' }}>
                          {typeof val === 'number' ? val.toFixed(m.key === 'contextSwitches' ? 0 : 1) : val}{m.unit}
                          {isWinner && ' ★'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};


