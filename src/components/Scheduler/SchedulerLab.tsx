import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Process, SchedulerResult, SchedulerAlgorithm } from '../../types';
import { runFCFS, runSJF, runSRTF, runRoundRobin, runPriority } from '../../algorithms/scheduling';
import './SchedulerLab.css';

const PROCESS_COLORS = ['#B58A3A','#176B67','#C17E3A','#D4AF37','#A65F3E','#1F9490','#8A6528','#176B67'];

const defaultProcesses: Process[] = [
  { pid: 'P1', arrivalTime: 0, burstTime: 6, priority: 2, color: PROCESS_COLORS[0] },
  { pid: 'P2', arrivalTime: 2, burstTime: 4, priority: 1, color: PROCESS_COLORS[1] },
  { pid: 'P3', arrivalTime: 4, burstTime: 2, priority: 3, color: PROCESS_COLORS[2] },
  { pid: 'P4', arrivalTime: 6, burstTime: 3, priority: 2, color: PROCESS_COLORS[3] },
];

function validateProcess(p: Partial<Process>): string | null {
  if (!p.pid || p.pid.trim() === '') return 'ERR_INVALID_INPUT // PID CANNOT BE EMPTY';
  if (p.arrivalTime === undefined || p.arrivalTime < 0) return 'ERR_INVALID_INPUT // ARRIVAL TIME MUST BE >= 0';
  if (!p.burstTime || p.burstTime <= 0) return 'ERR_INVALID_INPUT // BURST TIME MUST BE >= 1';
  if (p.priority === undefined || p.priority < 1) return 'ERR_INVALID_INPUT // PRIORITY MUST BE >= 1';
  return null;
}

export const SchedulerLab: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<SchedulerAlgorithm>('FCFS');
  const [quantum, setQuantum] = useState(2);
  const [processes, setProcesses] = useState<Process[]>(defaultProcesses);
  const [result, setResult] = useState<SchedulerResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const [speed, setSpeed] = useState(500);
  const [deepDive, setDeepDive] = useState(false);
  const [newProc, setNewProc] = useState<Partial<Process>>({ pid: '', arrivalTime: 0, burstTime: 4, priority: 1 });
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const runAlgorithm = useCallback(() => {
    if (processes.length === 0) { setError('ERR_NO_PROCESSES // ADD AT LEAST ONE PROCESS'); return; }
    try {
      let res: SchedulerResult;
      switch (algorithm) {
        case 'FCFS': res = runFCFS(processes); break;
        case 'SJF':  res = runSJF(processes); break;
        case 'SRTF': res = runSRTF(processes); break;
        case 'RR':   res = runRoundRobin(processes, quantum); break;
        case 'Priority': res = runPriority(processes); break;
        default: return;
      }
      setResult(res);
      setStepIdx(-1);
      setError(null);
    } catch (e) {
      setError(`ERR_SIMULATION_FAILED // ${String(e)}`);
    }
  }, [algorithm, processes, quantum]);

  const handleStep = useCallback(() => {
    if (!result) { runAlgorithm(); return; }
    setStepIdx(prev => Math.min(prev + 1, result.gantt.length - 1));
  }, [result, runAlgorithm]);

  const handlePlay = useCallback(() => {
    if (!result) { runAlgorithm(); return; }
    setIsPlaying(true);
    setStepIdx(0);
  }, [result, runAlgorithm]);

  const handlePause = () => { setIsPlaying(false); if (playRef.current) clearInterval(playRef.current); };
  const handleReset = () => { setResult(null); setStepIdx(-1); setIsPlaying(false); if (playRef.current) clearInterval(playRef.current); };

  useEffect(() => {
    if (!isPlaying || !result) return;
    playRef.current = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= result.gantt.length - 1) {
          setIsPlaying(false);
          if (playRef.current) clearInterval(playRef.current);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => { if (playRef.current) clearInterval(playRef.current); };
  }, [isPlaying, result, speed]);

  const addProcess = () => {
    const err = validateProcess(newProc);
    if (err) { setError(err); return; }
    if (processes.find(p => p.pid === newProc.pid)) { setError('ERR_DUPLICATE_PID // PROCESS ID ALREADY EXISTS'); return; }
    const color = PROCESS_COLORS[processes.length % PROCESS_COLORS.length];
    setProcesses(prev => [...prev, { pid: newProc.pid!, arrivalTime: newProc.arrivalTime!, burstTime: newProc.burstTime!, priority: newProc.priority!, color }]);
    setNewProc({ pid: '', arrivalTime: 0, burstTime: 4, priority: 1 });
    setError(null);
    setResult(null);
  };

  const removeProcess = (pid: string) => {
    setProcesses(prev => prev.filter(p => p.pid !== pid));
    setResult(null);
  };

  const currentSlot = result && stepIdx >= 0 ? result.gantt[stepIdx] : null;
  const maxTime = result ? Math.max(...result.gantt.map(g => g.endTime)) : 0;

  return (
    <section id="scheduler" className="lab-section">
      <div className="container">
        <div className="section-header">
          <span className="section-number">03 // SCHEDULER</span>
          <h2 className="section-title">SCHEDULER // DISPATCH</h2>
          <div className="section-divider" />
          <button className={`btn btn-sm ${deepDive ? 'btn-lime' : ''}`} onClick={() => setDeepDive(d => !d)}>
            {deepDive ? '◈ BASIC TELEMETRY' : '◉ DEEP DIVE ARCHITECTURE'}
          </button>
        </div>

        <div className="sched-layout">
          {/* Left panel — config */}
          <div className="sched-config panel">
            <div className="panel-header">
              <span className="label label-cyan">ALGORITHM SELECTION</span>
            </div>
            <div className="sched-algo-grid">
              {(['FCFS','SJF','SRTF','RR','Priority'] as SchedulerAlgorithm[]).map(a => (
                <button
                  key={a}
                  className={`sched-algo-btn ${algorithm === a ? 'active' : ''}`}
                  onClick={() => { setAlgorithm(a); setResult(null); }}
                >
                  {a}
                </button>
              ))}
            </div>

            {algorithm === 'RR' && (
              <div className="sched-quantum">
                <label className="label">TIME QUANTUM</label>
                <div className="sched-quantum-input">
                  <button className="btn btn-sm" onClick={() => setQuantum(q => Math.max(1, q - 1))}>−</button>
                  <span className="font-mono sched-quantum-val">{quantum}</span>
                  <button className="btn btn-sm" onClick={() => setQuantum(q => q + 1)}>+</button>
                </div>
              </div>
            )}

            <div className="panel-header" style={{ marginTop: '20px' }}>
              <span className="label label-cyan">PROCESS TABLE</span>
            </div>

            <div className="sched-process-table">
              <div className="sched-process-header">
                <span>PID</span><span>ARR</span><span>BURST</span><span>PRI</span><span></span>
              </div>
              {processes.map(p => (
                <div key={p.pid} className="sched-process-row">
                  <span className="sched-pid" style={{ color: p.color }}>{p.pid}</span>
                  <span>{p.arrivalTime}</span>
                  <span>{p.burstTime}</span>
                  <span>{p.priority}</span>
                  <button className="sched-remove" onClick={() => removeProcess(p.pid)}>✕</button>
                </div>
              ))}
            </div>

            {/* Add process */}
            <div className="sched-add-form">
              <div className="label" style={{ marginBottom: '8px' }}>ADD PROCESS</div>
              <div className="sched-add-row">
                <input className="input-field" placeholder="PID" value={newProc.pid} maxLength={4}
                  onChange={e => setNewProc(p => ({ ...p, pid: e.target.value.toUpperCase() }))} />
                <input className="input-field" type="number" placeholder="ARR" min="0" value={newProc.arrivalTime}
                  onChange={e => setNewProc(p => ({ ...p, arrivalTime: parseInt(e.target.value) || 0 }))} />
                <input className="input-field" type="number" placeholder="BURST" min="1" value={newProc.burstTime}
                  onChange={e => setNewProc(p => ({ ...p, burstTime: parseInt(e.target.value) || 1 }))} />
                <input className="input-field" type="number" placeholder="PRI" min="1" value={newProc.priority}
                  onChange={e => setNewProc(p => ({ ...p, priority: parseInt(e.target.value) || 1 }))} />
              </div>
              <button className="btn btn-sm btn-lime" style={{ width: '100%', marginTop: '8px' }} onClick={addProcess}>
                + ADD PROCESS
              </button>
            </div>

            {error && (
              <div className="sched-error">
                <span className="label" style={{ color: 'var(--coral)' }}>{error}</span>
              </div>
            )}

            {/* Controls */}
            <div className="sched-controls">
              <button className="btn btn-lime" onClick={runAlgorithm}>▶ RUN</button>
              <button className="btn" onClick={handleStep} disabled={!result && processes.length === 0}>⊞ STEP</button>
              <button className="btn" onClick={isPlaying ? handlePause : handlePlay}>
                {isPlaying ? '⏸ PAUSE' : '⏵ PLAY'}
              </button>
              <button className="btn btn-coral" onClick={handleReset}>↺ RESET</button>
            </div>

            <div className="sched-speed">
              <label className="label">SPEED</label>
              <input type="range" min="100" max="1500" step="100" value={1600 - speed}
                onChange={e => setSpeed(1600 - parseInt(e.target.value))} className="sched-speed-slider" />
              <span className="label">{Math.round(1000/speed * 10)/10}x</span>
            </div>
          </div>

          {/* Right panel — visualization */}
          <div className="sched-viz">
            {/* Step status */}
            {currentSlot && (
              <div className="sched-step-status panel panel-bright">
                <div className="sched-step-row">
                  <span className="label">CURRENT TIME</span>
                  <span className="font-mono sched-step-val">{currentSlot.startTime} → {currentSlot.endTime}</span>
                </div>
                <div className="sched-step-row">
                  <span className="label">RUNNING</span>
                  <span className="font-mono sched-step-val" style={{ color: currentSlot.isIdle ? 'var(--text-muted)' : 'var(--lime)' }}>
                    {currentSlot.isIdle ? 'IDLE' : currentSlot.pid}
                  </span>
                </div>
                <div className="sched-step-row">
                  <span className="label">READY QUEUE</span>
                  <span className="font-mono sched-step-val" style={{ color: 'var(--cyan)' }}>
                    {result?.gantt.slice(0, stepIdx).filter(g => !g.isIdle).map(g => g.pid).join(' → ') || '—'}
                  </span>
                </div>
                <div className="sched-step-row">
                  <span className="label">CONTEXT SWITCH</span>
                  <span className="font-mono" style={{ color: stepIdx > 0 && result && result.gantt[stepIdx - 1]?.pid !== currentSlot.pid && !result.gantt[stepIdx - 1]?.isIdle ? 'var(--coral)' : 'var(--lime)' }}>
                    {stepIdx > 0 && result && result.gantt[stepIdx - 1]?.pid !== currentSlot.pid && !result.gantt[stepIdx - 1]?.isIdle ? 'YES' : 'NO'}
                  </span>
                </div>
              </div>
            )}

            {/* Gantt Chart */}
            {result && (
              <div className="sched-gantt-wrap panel">
                <div className="label label-cyan" style={{ marginBottom: '12px' }}>GANTT CHART</div>
                <div className="sched-gantt">
                  {result.gantt.map((slot, i) => {
                    const w = ((slot.endTime - slot.startTime) / maxTime) * 100;
                    const proc = processes.find(p => p.pid === slot.pid);
                    const isActive = i === stepIdx;
                    const isPast = i < stepIdx;
                    return (
                      <motion.div
                        key={i}
                        className={`sched-gantt-slot ${slot.isIdle ? 'idle' : ''} ${isActive ? 'active' : ''} ${stepIdx >= 0 && !isPast && !isActive ? 'dim' : ''}`}
                        style={{
                          width: `${w}%`,
                          background: slot.isIdle ? 'rgba(181,138,58,0.04)' : `${proc?.color || '#B58A3A'}1A`,
                          borderColor: slot.isIdle ? 'rgba(181,138,58,0.12)' : (proc?.color || '#B58A3A'),
                        }}
                        initial={{ opacity: 0, scaleX: 0 }}
                        animate={{ opacity: stepIdx >= 0 && !isPast && !isActive ? 0.3 : 1, scaleX: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <span style={{ color: proc?.color || 'var(--text-muted)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                          {slot.pid}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                <div className="sched-gantt-times">
                  <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>0</span>
                  {result.gantt.map((slot, i) => (
                    <span key={i} className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', flexBasis: `${((slot.endTime - slot.startTime) / maxTime) * 100}%`, textAlign: 'right' }}>
                      {slot.endTime}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Results table */}
            {result && (
              <div className="sched-results panel">
                <div className="label label-cyan" style={{ marginBottom: '12px' }}>PROCESS METRICS</div>
                <table className="sched-table">
                  <thead>
                    <tr>
                      <th>PID</th><th>ARRIVAL</th><th>BURST</th>
                      <th>COMPLETION</th><th>TURNAROUND</th><th>WAITING</th><th>RESPONSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.processes.map(p => {
                      const proc = processes.find(pr => pr.pid === p.pid);
                      return (
                        <tr key={p.pid}>
                          <td style={{ color: proc?.color }}>{p.pid}</td>
                          <td>{p.arrivalTime}</td><td>{p.burstTime}</td>
                          <td style={{ color: 'var(--lime)' }}>{p.completionTime}</td>
                          <td>{p.turnaroundTime}</td>
                          <td style={{ color: p.waitingTime > 5 ? 'var(--coral)' : 'inherit' }}>{p.waitingTime}</td>
                          <td>{p.responseTime}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {deepDive && (
                  <div className="sched-formula panel" style={{ marginTop: '16px', padding: '12px' }}>
                    <div className="label label-cyan" style={{ marginBottom: '8px' }}>FORMULAS</div>
                    <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                      <div>Turnaround Time = Completion − Arrival</div>
                      <div>Waiting Time = Turnaround − Burst</div>
                      <div>Response Time = First CPU − Arrival</div>
                      <div style={{ color: 'var(--cyan)', marginTop: '8px' }}>CPU Utilization = {result.cpuUtilization.toFixed(1)}%</div>
                      <div style={{ color: 'var(--lime)' }}>Throughput = {result.throughput.toFixed(3)} proc/unit</div>
                      <div style={{ color: 'var(--orange)' }}>Context Switches = {result.contextSwitches}</div>
                    </div>
                  </div>
                )}

                {/* Summary stats */}
                <div className="sched-stats">
                  {[
                    { label: 'AVG WAIT', value: result.avgWaitingTime.toFixed(2), unit: 'ms', color: 'var(--orange)' },
                    { label: 'AVG TAT', value: result.avgTurnaroundTime.toFixed(2), unit: 'ms', color: 'var(--cyan)' },
                    { label: 'AVG RESP', value: result.avgResponseTime.toFixed(2), unit: 'ms', color: 'var(--violet-bright)' },
                    { label: 'CPU UTIL', value: result.cpuUtilization.toFixed(1), unit: '%', color: 'var(--lime)' },
                    { label: 'CTX SW', value: String(result.contextSwitches), unit: '', color: 'var(--coral)' },
                  ].map(s => (
                    <div key={s.label} className="sched-stat">
                      <span className="label">{s.label}</span>
                      <span className="font-mono sched-stat-val" style={{ color: s.color }}>{s.value}{s.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};


