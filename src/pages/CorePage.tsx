import React, { useState, useEffect, useRef } from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, Plus, Cpu } from 'lucide-react';
import './CorePage.css';

type ProcessState = 'NEW' | 'READY' | 'RUNNING' | 'WAITING' | 'TERMINATED';

interface CoreProcess {
  pid: string;
  name: string;
  state: ProcessState;
  priority: number;
  totalBurst: number;
  remainingBurst: number;
  registers: {
    rip: string;
    rax: string;
    rsp: string;
    rbp: string;
    cr3: string;
  };
  color: string;
  switches: number;
}

const DEFAULT_PROCESSES: CoreProcess[] = [
  {
    pid: 'PID: 101',
    name: 'kernel_sched',
    state: 'RUNNING',
    priority: 1,
    totalBurst: 12,
    remainingBurst: 8,
    registers: { rip: '0x00401A20', rax: '0x0000000A', rsp: '0x7FFFFFE0', rbp: '0x7FFFFF00', cr3: '0x001B4000' },
    color: '#D4AF37',
    switches: 3,
  },
  {
    pid: 'PID: 102',
    name: 'mmu_daemon',
    state: 'READY',
    priority: 2,
    totalBurst: 10,
    remainingBurst: 6,
    registers: { rip: '0x00402C88', rax: '0x00000042', rsp: '0x7FFFFEA0', rbp: '0x7FFFFDC0', cr3: '0x001B5000' },
    color: '#22D3EE',
    switches: 2,
  },
  {
    pid: 'PID: 103',
    name: 'disk_io_worker',
    state: 'WAITING',
    priority: 3,
    totalBurst: 15,
    remainingBurst: 12,
    registers: { rip: '0x00404410', rax: '0x00000000', rsp: '0x7FFFFD80', rbp: '0x7FFFFCA0', cr3: '0x001B6000' },
    color: '#F59E0B',
    switches: 1,
  },
  {
    pid: 'PID: 104',
    name: 'crypto_core',
    state: 'NEW',
    priority: 2,
    totalBurst: 8,
    remainingBurst: 8,
    registers: { rip: '0x00400000', rax: '0x00000000', rsp: '0x7FFFFFC0', rbp: '0x7FFFFEE0', cr3: '0x001B7000' },
    color: '#EBD17C',
    switches: 0,
  },
];

const SWITCH_STEPS = [
  'Timer Interrupt (IRQ0) raised — Time quantum expired',
  'Push general-purpose registers (RAX, RBX, RIP, RSP) to current PCB',
  'Change running process state to READY & requeue in runqueue',
  'Scheduler selects next READY process with lowest vruntime',
  'Switch MMU Page Table pointer (reload CR3 register)',
  'Pop saved registers from new PCB into CPU hardware registers',
  'IRETD instruction — Execution resumed in newly dispatched process',
];

interface Props {
  onCommandCenter: () => void;
}

export const CorePage: React.FC<Props> = ({ onCommandCenter }) => {
  const [processes, setProcesses] = useState<CoreProcess[]>(DEFAULT_PROCESSES);
  const [selectedPid, setSelectedPid] = useState<string>('PID: 101');
  const [switchActive, setSwitchActive] = useState<boolean>(false);
  const [switchStepIdx, setSwitchStepIdx] = useState<number>(-1);
  const [autoSimulate, setAutoSimulate] = useState<boolean>(false);
  const [switchCount, setSwitchCount] = useState<number>(14);
  const switchLatency = 1.24;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedProcess = processes.find(p => p.pid === selectedPid) || processes[0];

  // Manual Context Switch Simulation
  const triggerContextSwitch = () => {
    if (switchActive) return;
    setSwitchActive(true);
    setSwitchStepIdx(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      setSwitchStepIdx(step);
      if (step >= SWITCH_STEPS.length) {
        clearInterval(interval);
        setSwitchActive(false);
        setSwitchStepIdx(-1);
        setSwitchCount(c => c + 1);

        // Perform actual process swap: current RUNNING -> READY, first READY -> RUNNING
        setProcesses(prev => {
          const running = prev.find(p => p.state === 'RUNNING');
          const nextReady = prev.find(p => p.state === 'READY');

          return prev.map(p => {
            if (p.pid === running?.pid) {
              return { ...p, state: 'READY' as ProcessState, switches: p.switches + 1 };
            }
            if (p.pid === nextReady?.pid) {
              return { ...p, state: 'RUNNING' as ProcessState };
            }
            return p;
          });
        });
      }
    }, 450);
  };

  // State transitions
  const admitNewProcess = (pid: string) => {
    setProcesses(prev => prev.map(p => p.pid === pid ? { ...p, state: 'READY' } : p));
  };

  const blockProcess = (pid: string) => {
    setProcesses(prev => {
      const nextReady = prev.find(p => p.state === 'READY');
      return prev.map(p => {
        if (p.pid === pid) return { ...p, state: 'WAITING' };
        if (nextReady && p.pid === nextReady.pid) return { ...p, state: 'RUNNING' };
        return p;
      });
    });
  };

  const unblockProcess = (pid: string) => {
    setProcesses(prev => prev.map(p => p.pid === pid ? { ...p, state: 'READY' } : p));
  };

  const terminateProcess = (pid: string) => {
    setProcesses(prev => {
      const nextReady = prev.find(p => p.state === 'READY');
      return prev.map(p => {
        if (p.pid === pid) return { ...p, state: 'TERMINATED', remainingBurst: 0 };
        if (nextReady && p.pid === nextReady.pid) return { ...p, state: 'RUNNING' };
        return p;
      });
    });
  };

  const createProcess = () => {
    const nextNum = processes.length + 101;
    const newP: CoreProcess = {
      pid: `PID: ${nextNum}`,
      name: `proc_worker_${processes.length}`,
      state: 'NEW',
      priority: Math.floor(Math.random() * 3) + 1,
      totalBurst: Math.floor(Math.random() * 10) + 4,
      remainingBurst: 8,
      registers: {
        rip: `0x0040${Math.floor(Math.random() * 9000 + 1000).toString(16).toUpperCase()}`,
        rax: '0x00000000',
        rsp: '0x7FFFFFA0',
        rbp: '0x7FFFFEE0',
        cr3: `0x001B${(processes.length + 8).toString(16).toUpperCase()}000`,
      },
      color: ['#D4AF37', '#22D3EE', '#EBD17C', '#F59E0B', '#10B981'][processes.length % 5],
      switches: 0,
    };
    setProcesses(p => [...p, newP]);
    setSelectedPid(newP.pid);
  };

  const resetSimulation = () => {
    setProcesses(DEFAULT_PROCESSES);
    setSelectedPid('PID: 101');
    setSwitchActive(false);
    setSwitchStepIdx(-1);
    setSwitchCount(14);
  };

  // Auto simulate loop
  useEffect(() => {
    if (!autoSimulate) return;
    timerRef.current = setInterval(() => {
      setProcesses(prev => {
        const running = prev.find(p => p.state === 'RUNNING');
        if (!running) {
          const ready = prev.find(p => p.state === 'READY');
          if (ready) return prev.map(p => p.pid === ready.pid ? { ...p, state: 'RUNNING' } : p);
          return prev;
        }

        if (running.remainingBurst <= 1) {
          // Terminate
          const nextReady = prev.find(p => p.state === 'READY' && p.pid !== running.pid);
          return prev.map(p => {
            if (p.pid === running.pid) return { ...p, state: 'TERMINATED', remainingBurst: 0 };
            if (nextReady && p.pid === nextReady.pid) return { ...p, state: 'RUNNING' };
            return p;
          });
        }

        // Decrement burst
        return prev.map(p => p.pid === running.pid ? { ...p, remainingBurst: p.remainingBurst - 1 } : p);
      });
    }, 1200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [autoSimulate]);

  const statesMap: { key: ProcessState; label: string; desc: string }[] = [
    { key: 'NEW', label: 'NEW', desc: 'Process Control Block initialized; memory allocated' },
    { key: 'READY', label: 'READY', desc: 'Enqueued in CFS Red-Black runqueue waiting for CPU core' },
    { key: 'RUNNING', label: 'RUNNING', desc: 'Currently executing instructions on physical CPU Core #0' },
    { key: 'WAITING', label: 'WAITING', desc: 'Blocked awaiting asynchronous I/O completion or event' },
    { key: 'TERMINATED', label: 'TERMINATED', desc: 'Execution ended; resources deallocated, awaiting reaping' },
  ];

  return (
    <SimulationLayout
      moduleNumber="01"
      moduleTag="CORE // PROCESS CONTROL"
      title="PROCESS // LIFECYCLE & CONTEXT SWITCHING"
      description="Interactive operating system process state machine. Observe New, Ready, Running, Waiting, and Terminated states alongside physical CPU register restoration and dispatch overhead."
      onCommandCenter={onCommandCenter}
    >
      {/* Simulation Action Bar */}
      <div className="core-controls-row">
        <button
          className="btn btn-primary"
          onClick={triggerContextSwitch}
          disabled={switchActive}
        >
          <Cpu className="w-4 h-4" />
          <span>TRIGGER CONTEXT SWITCH</span>
        </button>

        <button className="btn btn-secondary" onClick={createProcess}>
          <Plus className="w-4 h-4" />
          <span>CREATE NEW PROCESS</span>
        </button>

        <button
          className={`btn ${autoSimulate ? 'btn-lime' : ''}`}
          onClick={() => setAutoSimulate(a => !a)}
        >
          {autoSimulate ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{autoSimulate ? 'PAUSE TICKS' : 'AUTO SIMULATE'}</span>
        </button>

        <button className="btn btn-secondary" onClick={resetSimulation}>
          <RefreshCw className="w-4 h-4" />
          <span>RESET LAB</span>
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div className="label font-mono">
            TOTAL CONTEXT SWITCHES: <span className="text-cyan font-bold">{switchCount}</span>
          </div>
          <div className="label font-mono">
            DISPATCH LATENCY: <span className="text-gold font-bold">{switchLatency} µs</span>
          </div>
        </div>
      </div>

      <div className="core-grid">
        {/* Left Column: State Machine & Step by Step Context Switch */}
        <div className="core-main-col">
          {/* State Machine Container */}
          <div className="panel core-states-container">
            <div className="core-states-header">
              <div>
                <span className="label label-cyan">PROCESS STATE TRANSITIONS</span>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Click any process card to inspect PCB registers & dispatch controls below.
                </div>
              </div>
              <div className="label font-mono">ACTIVE ENTITIES: {processes.length}</div>
            </div>

            <div className="core-states-map">
              {statesMap.map(st => {
                const list = processes.filter(p => p.state === st.key);
                return (
                  <div key={st.key} className={`core-state-node state-${st.key.toLowerCase()}`}>
                    <div className="core-state-title">
                      <span className="core-state-badge">{st.label}</span>
                      <span className="core-state-count font-mono">{list.length}</span>
                    </div>

                    <div className="core-process-list">
                      <AnimatePresence>
                        {list.map(p => (
                          <motion.div
                            key={p.pid}
                            layout
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className={`core-proc-card ${selectedPid === p.pid ? 'active-card' : ''}`}
                            onClick={() => setSelectedPid(p.pid)}
                          >
                            <div className="core-proc-header">
                              <span className="core-proc-pid" style={{ color: p.color }}>{p.pid}</span>
                              <span className="core-proc-meta font-mono">PRI: {p.priority}</span>
                            </div>
                            <div className="font-mono text-dim" style={{ fontSize: '10px' }}>{p.name}</div>
                            <div className="font-mono text-muted" style={{ fontSize: '9px', marginTop: '4px' }}>
                              BURST: {p.remainingBurst}s / {p.totalBurst}s
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      {list.length === 0 && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto' }}>
                          NO PROCESSES
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transition legend */}
            <div className="label font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              TRANSITION PATHS: [NEW] ➔ Admit ➔ [READY] ➔ Dispatch ➔ [RUNNING] ➔ Preempt/Yield ➔ [READY] | [RUNNING] ➔ I/O Block ➔ [WAITING] ➔ I/O Done ➔ [READY] | [RUNNING] ➔ Exit ➔ [TERMINATED]
            </div>
          </div>

          {/* Context Switching Demonstration */}
          <div className="panel core-switch-panel">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="label label-gold">CONTEXT SWITCH ARCHITECTURAL SEQUENCE</div>
              {switchActive && (
                <span className="label font-mono text-cyan animate-pulse">
                  SIMULATING SWITCH IN PROGRESS...
                </span>
              )}
            </div>

            <div className="core-switch-steps">
              {SWITCH_STEPS.map((stepDesc, idx) => {
                const isActive = switchStepIdx === idx;
                const isPassed = switchStepIdx > idx;
                return (
                  <div
                    key={idx}
                    className={`core-switch-step-item ${isActive ? 'step-active' : ''}`}
                    style={{ borderColor: isPassed ? 'rgba(34, 211, 238, 0.4)' : undefined }}
                  >
                    <div className="core-switch-step-num font-mono">PHASE 0{idx + 1}</div>
                    <div>{stepDesc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Process Control Block (PCB) Telemetry */}
        <div className="core-telemetry-col">
          <div className="panel pcb-inspector">
            <div className="label label-cyan" style={{ marginBottom: '12px' }}>
              PCB INSPECTOR // {selectedProcess.pid}
            </div>

            <table className="pcb-table">
              <tbody>
                <tr>
                  <td>PROCESS NAME</td>
                  <td>{selectedProcess.name}</td>
                </tr>
                <tr>
                  <td>PROCESS STATE</td>
                  <td style={{ color: selectedProcess.state === 'RUNNING' ? 'var(--cyan-active)' : 'var(--gold-champagne)' }}>
                    {selectedProcess.state}
                  </td>
                </tr>
                <tr>
                  <td>SCHEDULER PRIORITY</td>
                  <td>CLASS {selectedProcess.priority}</td>
                </tr>
                <tr>
                  <td>REMAINING BURST</td>
                  <td>{selectedProcess.remainingBurst} ms</td>
                </tr>
                <tr>
                  <td>CONTEXT SWITCHES</td>
                  <td>{selectedProcess.switches} switches</td>
                </tr>
                <tr>
                  <td>AFFINITY MASK</td>
                  <td>0x00000001 (Core #0)</td>
                </tr>
              </tbody>
            </table>

            {/* Hardware Execution Registers */}
            <div className="label" style={{ margin: '16px 0 8px', color: 'var(--text-muted)' }}>
              SAVED HARDWARE REGISTERS (PCB REGS)
            </div>
            <div className="regs-grid">
              <div className="reg-box">
                <span className="reg-name">RIP:</span>
                <span className="reg-val">{selectedProcess.registers.rip}</span>
              </div>
              <div className="reg-box">
                <span className="reg-name">RAX:</span>
                <span className="reg-val">{selectedProcess.registers.rax}</span>
              </div>
              <div className="reg-box">
                <span className="reg-name">RSP:</span>
                <span className="reg-val">{selectedProcess.registers.rsp}</span>
              </div>
              <div className="reg-box">
                <span className="reg-name">CR3:</span>
                <span className="reg-val">{selectedProcess.registers.cr3}</span>
              </div>
            </div>

            {/* Direct State Transition Controls for Selected Process */}
            <div className="label label-cyan" style={{ margin: '20px 0 10px' }}>
              DIRECT TRANSITION TRIGGERS
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedProcess.state === 'NEW' && (
                <button className="btn btn-sm btn-primary" onClick={() => admitNewProcess(selectedProcess.pid)}>
                  ADMIT TO READY QUEUE →
                </button>
              )}
              {selectedProcess.state === 'RUNNING' && (
                <>
                  <button className="btn btn-sm btn-secondary" onClick={() => blockProcess(selectedProcess.pid)}>
                    TRIGGER I/O WAIT (BLOCK) →
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => terminateProcess(selectedProcess.pid)}>
                    TERMINATE PROCESS (EXIT) →
                  </button>
                </>
              )}
              {selectedProcess.state === 'WAITING' && (
                <button className="btn btn-sm btn-primary" onClick={() => unblockProcess(selectedProcess.pid)}>
                  I/O COMPLETE ➔ READY →
                </button>
              )}
              {selectedProcess.state === 'READY' && (
                <button className="btn btn-sm btn-primary" onClick={() => {
                  setProcesses(prev => {
                    const running = prev.find(p => p.state === 'RUNNING');
                    return prev.map(p => {
                      if (p.pid === running?.pid) return { ...p, state: 'READY' };
                      if (p.pid === selectedProcess.pid) return { ...p, state: 'RUNNING' };
                      return p;
                    });
                  });
                }}>
                  FORCE DISPATCH TO CPU →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </SimulationLayout>
  );
};
