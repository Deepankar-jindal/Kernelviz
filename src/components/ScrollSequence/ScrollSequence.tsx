import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './ScrollSequence.css';

interface ArchitectureStage {
  id: string;
  step: string;
  title: string;
  category: string;
  description: string;
  technicalDetails: {
    label: string;
    value: string;
  }[];
  registers: { [key: string]: string };
  status: string;
}

const PIPELINE_STAGES: ArchitectureStage[] = [
  {
    id: 'created',
    step: '01',
    title: 'PROCESS CREATION',
    category: 'PROCESS // CONTROL',
    description: 'The kernel allocates a Process Control Block (PCB), assigns a unique PID, allocates initial virtual address space, and sets the process state to NEW.',
    technicalDetails: [
      { label: 'PCB Address', value: '0xFFFF8000_10200000' },
      { label: 'Initial State', value: 'TASK_UNINTERRUPTIBLE' },
      { label: 'Privilege Level', value: 'Ring 3 (User Mode)' },
      { label: 'Assigned Core', value: 'Affinity: Cores 0-7' },
    ],
    registers: { PID: '0x04A1', CR3: '0x001B4000', STATE: 'NEW', PRIORITY: '120' },
    status: 'SYSTEM // PCB ALLOCATED',
  },
  {
    id: 'ready',
    step: '02',
    title: 'READY QUEUE ENQUEUE',
    category: 'SCHEDULER // DISPATCH',
    description: 'The process is inserted into the Completely Fair Scheduler (CFS) red-black runqueue sorted by virtual runtime (vruntime) awaiting CPU time.',
    technicalDetails: [
      { label: 'Runqueue Type', value: 'CFS Red-Black Tree' },
      { label: 'Target vruntime', value: '412.85 ms' },
      { label: 'Queue Position', value: 'Rank #2 (Head + 1)' },
      { label: 'Preemption Check', value: 'No preemption required' },
    ],
    registers: { PID: '0x04A1', VRUNTIME: '412.8ms', STATE: 'TASK_RUNNING', LATENCY: '0.4ms' },
    status: 'SCHEDULER // RUNQUEUE ENQUEUED',
  },
  {
    id: 'dispatch',
    step: '03',
    title: 'CPU CORE DISPATCH',
    category: 'CPU // EXECUTION',
    description: 'The scheduler triggers a context switch. CPU registers (RAX, RBX, RIP, RSP) are restored from the PCB into physical Core 0 execution registers.',
    technicalDetails: [
      { label: 'Core Selected', value: 'Core #0 (Active @ 3.8GHz)' },
      { label: 'Switch Cost', value: '1.2 microseconds' },
      { label: 'Time Slice (Quantum)', value: '10.0 ms allocated' },
      { label: 'Interrupt Flag', value: 'IF=1 (Interrupts Enabled)' },
    ],
    registers: { RIP: '0x00401080', RSP: '0x7FFFFFE0', CORE: 'CORE #0', TIME_SLICE: '10ms' },
    status: 'CPU // CONTEXT SWITCH COMPLETE',
  },
  {
    id: 'vaddress',
    step: '04',
    title: 'VIRTUAL ADDRESS GENERATION',
    category: 'MEMORY // ALLOCATION',
    description: 'The instruction requests memory read at logical address 0x0040_20A8. The Memory Management Unit (MMU) splits it into Page Number (VPN) and Offset.',
    technicalDetails: [
      { label: 'Logical Address', value: '0x0040_20A8' },
      { label: 'Virtual Page (VPN)', value: '0x00402 (Page 1026)' },
      { label: 'Page Offset', value: '0x0A8 (168 Bytes)' },
      { label: 'Page Size', value: '4096 Bytes (4 KB Standard)' },
    ],
    registers: { LOGICAL_ADDR: '0x004020A8', VPN: '0x00402', OFFSET: '0x0A8', MMU_STATE: 'EVALUATING' },
    status: 'MMU // LOGICAL ADDRESS SPLIT',
  },
  {
    id: 'tlb',
    step: '05',
    title: 'TLB FAST LOOKUP',
    category: 'CACHE // HIERARCHY',
    description: 'The Translation Lookaside Buffer (TLB) is queried concurrently across 4 sets. VPN 0x00402 matches Line 2: TLB HIT achieved in 1 CPU cycle (~0.3ns).',
    technicalDetails: [
      { label: 'TLB Architecture', value: '4-Way Set Associative' },
      { label: 'Lookup Result', value: 'TLB HIT (Tag Match Set 2)' },
      { label: 'Access Latency', value: '< 1 cycle (0.35 ns)' },
      { label: 'Physical Frame (PFN)', value: '0x0014C (Frame 332)' },
    ],
    registers: { TLB_STATUS: 'HIT', PFN: '0x0014C', CYCLES: '1', ACC_TIME: '0.35ns' },
    status: 'TLB // CACHE HIT (FAST PATH)',
  },
  {
    id: 'pagetable',
    step: '06',
    title: 'PAGE TABLE VALIDATION',
    category: 'PAGING // TRANSLATION',
    description: 'CR3 register points to root Page Directory (PML4). Protection bits (Read/Write=1, User/Supervisor=1, Present=1) are verified against memory permissions.',
    technicalDetails: [
      { label: 'PML4 Entry', value: '0xFFFF8000_00000000' },
      { label: 'Access Permission', value: 'PAGE_READWRITE | PAGE_USER' },
      { label: 'Dirty Bit', value: '0 (Clean Page)' },
      { label: 'Present Bit', value: '1 (Resident in RAM)' },
    ],
    registers: { CR3: '0x001B4000', PERMISSIONS: 'R/W + USER', PRESENT: '1', DIRTY: '0' },
    status: 'MMU // PERMISSION VALIDATED',
  },
  {
    id: 'ram',
    step: '07',
    title: 'PHYSICAL RAM ACCESS',
    category: 'MEMORY // ALLOCATION',
    description: 'Physical address (0x0014C000 + 0x0A8 = 0x0014C0A8) is placed onto the system memory bus. Data word is fetched from DDR5 SDRAM cache line.',
    technicalDetails: [
      { label: 'Physical Address', value: '0x0014C0A8' },
      { label: 'Bus Width', value: '64-bit Dual Channel DDR5' },
      { label: 'L3 Cache State', value: 'L3 Shared Line Retrieved' },
      { label: 'Data Retrieved', value: '0xDEADBEEF_4889E5' },
    ],
    registers: { PHYS_ADDR: '0x0014C0A8', BUS_SPEED: '6400MT/s', BUS_STATUS: 'READY', DATA: '0xDEADBEEF' },
    status: 'HARDWARE // RAM FRAME ACCESSED',
  },
  {
    id: 'execution',
    step: '08',
    title: 'CPU PIPELINE EXECUTION',
    category: 'CPU // EXECUTION',
    description: 'Instruction is decoded by execution unit, Arithmetic Logic Unit (ALU) computes result, flags (ZF, SF, CF) update, and RIP advances to next instruction.',
    technicalDetails: [
      { label: 'ALU Opcode', value: 'ADDQ %rax, %rbx' },
      { label: 'Cycles Taken', value: '1 Clock Cycle' },
      { label: 'Branch Prediction', value: '99.4% Confidence (Taken)' },
      { label: 'IPC (Instructions/Cycle)', value: '3.42 IPC' },
    ],
    registers: { RAX: '0x00000042', RBX: '0x00000018', RFLAGS: '0x00000246', RIP_NEXT: '0x00401088' },
    status: 'SYSTEM // INSTRUCTION RETIRED',
  },
];

export const ScrollSequence: React.FC = () => {
  const [activeIdx, setActiveIdx] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % PIPELINE_STAGES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [autoPlay]);

  const currentStage = PIPELINE_STAGES[activeIdx];

  return (
    <section id="scroll-sequence" className="arch-pipeline-section">
      <div className="container">
        {/* Header */}
        <div className="arch-header">
          <div className="arch-badge">
            <span className="status-dot active" />
            <span>ARCHITECTURE // KERNEL EXECUTION FLOW</span>
          </div>
          <h2 className="arch-title">
            WHAT ACTUALLY HAPPENS<br />
            <span className="arch-title-gold">WHEN A PROCESS RUNS?</span>
          </h2>
          <p className="arch-sub">
            Interactive system walkthrough from PCB creation to ALU execution. No static slides — real hardware mechanics.
          </p>
        </div>

        {/* Pipeline Navigation Bar */}
        <div className="arch-stepper-wrap">
          <div className="arch-stepper">
            {PIPELINE_STAGES.map((st, i) => {
              const isSelected = i === activeIdx;
              const isPassed = i < activeIdx;
              return (
                <button
                  key={st.id}
                  className={`arch-step-btn ${isSelected ? 'selected' : ''} ${isPassed ? 'passed' : ''}`}
                  onClick={() => {
                    setActiveIdx(i);
                    setAutoPlay(false);
                  }}
                >
                  <div className="arch-step-circle">
                    <span className="arch-step-num">{st.step}</span>
                  </div>
                  <div className="arch-step-meta">
                    <span className="arch-step-name">{st.title.split(' ')[0]}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="arch-controls">
            <button
              className={`btn btn-sm ${autoPlay ? 'btn-lime' : ''}`}
              onClick={() => setAutoPlay(!autoPlay)}
            >
              {autoPlay ? '⏸ PAUSE PIPELINE' : '▶ AUTO SIMULATE'}
            </button>
            <div className="arch-counter font-mono">
              STAGE {currentStage.step} / {PIPELINE_STAGES.length.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Stage Presentation Deck */}
        <div className="arch-card-grid">
          {/* Main Stage Panel */}
          <div className="arch-main-panel panel panel-bright">
            <div className="arch-panel-top">
              <div className="label label-gold">{currentStage.category}</div>
              <div className="arch-live-badge">
                <span className="arch-pulse-dot" />
                <span className="font-mono">{currentStage.status}</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentStage.id}
                className="arch-panel-body"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.3 }}
              >
                <div className="arch-stage-heading-row">
                  <div className="arch-stage-number-big font-serif">{currentStage.step}</div>
                  <div>
                    <h3 className="arch-stage-title">{currentStage.title}</h3>
                    <p className="arch-stage-desc">{currentStage.description}</p>
                  </div>
                </div>

                {/* Technical Spec Matrix */}
                <div className="arch-specs-grid">
                  {currentStage.technicalDetails.map((td, idx) => (
                    <div key={idx} className="arch-spec-box">
                      <span className="arch-spec-label label">{td.label}</span>
                      <span className="arch-spec-val font-mono">{td.value}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Step Selector Bottom Nav */}
            <div className="arch-panel-nav">
              <button
                className="btn btn-sm"
                disabled={activeIdx === 0}
                onClick={() => {
                  setActiveIdx((p) => Math.max(0, p - 1));
                  setAutoPlay(false);
                }}
              >
                ← PREV STEP
              </button>
              <div className="arch-nav-dots">
                {PIPELINE_STAGES.map((_, dotIdx) => (
                  <span
                    key={dotIdx}
                    className={`arch-nav-dot ${dotIdx === activeIdx ? 'active' : ''}`}
                    onClick={() => {
                      setActiveIdx(dotIdx);
                      setAutoPlay(false);
                    }}
                  />
                ))}
              </div>
              <button
                className="btn btn-sm btn-gold"
                disabled={activeIdx === PIPELINE_STAGES.length - 1}
                onClick={() => {
                  setActiveIdx((p) => Math.min(PIPELINE_STAGES.length - 1, p + 1));
                  setAutoPlay(false);
                }}
              >
                NEXT STEP →
              </button>
            </div>
          </div>

          {/* Interactive Hardware HUD / Register State */}
          <div className="arch-hud-panel panel">
            <div className="arch-hud-header">
              <div className="label">SYSTEM REGISTERS // HARDWARE TELEMETRY</div>
              <span className="font-mono text-cyan" style={{ fontSize: '11px' }}>ONLINE</span>
            </div>

            <div className="arch-registers-box">
              {Object.entries(currentStage.registers).map(([k, v]) => (
                <div key={k} className="arch-reg-row">
                  <span className="arch-reg-key font-mono">{k}</span>
                  <span className="arch-reg-arrow font-mono">→</span>
                  <span className="arch-reg-val font-mono">{v}</span>
                </div>
              ))}
            </div>

            {/* Visual Hardware Map */}
            <div className="arch-hw-diagram">
              <div className="arch-hw-label label">PHYSICAL PIPELINE ARCHITECTURE</div>
              <div className="arch-hw-blocks">
                <div className={`arch-hw-item ${['created', 'ready'].includes(currentStage.id) ? 'highlight' : ''}`}>
                  <span className="arch-hw-chip-title">PCB / RUNQUEUE</span>
                  <span className="arch-hw-chip-sub">RAM Space</span>
                </div>
                <div className="arch-hw-line" />
                <div className={`arch-hw-item ${['dispatch', 'execution'].includes(currentStage.id) ? 'highlight' : ''}`}>
                  <span className="arch-hw-chip-title">CPU CORE #0</span>
                  <span className="arch-hw-chip-sub">ALU + Regs</span>
                </div>
                <div className="arch-hw-line" />
                <div className={`arch-hw-item ${['vaddress', 'tlb', 'pagetable'].includes(currentStage.id) ? 'highlight' : ''}`}>
                  <span className="arch-hw-chip-title">MMU // TLB</span>
                  <span className="arch-hw-chip-sub">Translation</span>
                </div>
                <div className="arch-hw-line" />
                <div className={`arch-hw-item ${['ram'].includes(currentStage.id) ? 'highlight' : ''}`}>
                  <span className="arch-hw-chip-title">DDR5 RAM</span>
                  <span className="arch-hw-chip-sub">Physical Memory</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
