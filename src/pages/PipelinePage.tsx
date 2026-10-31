import React, { useState, useEffect, useRef } from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { ScrollSequence } from '../components/ScrollSequence/ScrollSequence';
import { Play, Pause, ChevronRight, ChevronLeft, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import './PipelinePage.css';

type HazardMode = 'raw_stall' | 'raw_forwarding' | 'load_use' | 'branch_flush';

interface Instruction {
  id: string;
  asm: string;
  desc: string;
  destReg?: string;
  srcRegs?: string[];
}

interface Props {
  onCommandCenter: () => void;
}

export const PipelinePage: React.FC<Props> = ({ onCommandCenter }) => {
  const [hazardMode, setHazardMode] = useState<HazardMode>('raw_forwarding');
  const [currentCycle, setCurrentCycle] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Instructions sets per hazard mode
  const instructionConfigs: Record<HazardMode, Instruction[]> = {
    raw_stall: [
      { id: 'I1', asm: 'ADD R1, R2, R3', desc: 'Computes R1 = R2 + R3 (Writes to R1 in WB stage)', destReg: 'R1', srcRegs: ['R2', 'R3'] },
      { id: 'I2', asm: 'SUB R4, R1, R5', desc: 'RAW Hazard: Needs R1! Stalls in ID until I1 finishes WB', destReg: 'R4', srcRegs: ['R1', 'R5'] },
      { id: 'I3', asm: 'AND R6, R1, R7', desc: 'Reads R1 after WB completion', destReg: 'R6', srcRegs: ['R1', 'R7'] },
      { id: 'I4', asm: 'OR  R8, R4, R9', desc: 'Reads R4 from I2', destReg: 'R8', srcRegs: ['R4', 'R9'] },
    ],
    raw_forwarding: [
      { id: 'I1', asm: 'ADD R1, R2, R3', desc: 'Computes R1 = R2 + R3 (ALU result ready at EX stage)', destReg: 'R1', srcRegs: ['R2', 'R3'] },
      { id: 'I2', asm: 'SUB R4, R1, R5', desc: 'Data Forwarding: R1 forwarded directly from EX to EX! Zero stalls.', destReg: 'R4', srcRegs: ['R1', 'R5'] },
      { id: 'I3', asm: 'AND R6, R4, R7', desc: 'Data Forwarding: R4 forwarded directly from EX/MEM to EX! Zero stalls.', destReg: 'R6', srcRegs: ['R4', 'R7'] },
      { id: 'I4', asm: 'XOR R8, R6, R9', desc: 'Data Forwarding: R6 forwarded directly from EX to EX!', destReg: 'R8', srcRegs: ['R6', 'R9'] },
    ],
    load_use: [
      { id: 'I1', asm: 'LW  R1, 0(R2)',  desc: 'Memory Read: Data from RAM only becomes available at end of MEM stage!', destReg: 'R1', srcRegs: ['R2'] },
      { id: 'I2', asm: 'SUB R4, R1, R3', desc: 'Load-Use Hazard: Needs R1 immediately! Must stall 1 cycle even with forwarding.', destReg: 'R4', srcRegs: ['R1', 'R3'] },
      { id: 'I3', asm: 'AND R5, R4, R6', desc: 'Receives R4 via forwarding from EX/MEM stage.', destReg: 'R5', srcRegs: ['R4', 'R6'] },
      { id: 'I4', asm: 'ADD R7, R5, R8', desc: 'Receives R5 via forwarding.', destReg: 'R7', srcRegs: ['R5', 'R8'] },
    ],
    branch_flush: [
      { id: 'I1', asm: 'ADD R1, R2, R3', desc: 'Preliminary computation', destReg: 'R1', srcRegs: ['R2', 'R3'] },
      { id: 'I2', asm: 'BEQ R1, R0, +8', desc: 'Branch condition evaluated in EX stage: Branch is TAKEN!', srcRegs: ['R1', 'R0'] },
      { id: 'I3', asm: 'SUB R4, R5, R6', desc: 'Speculatively fetched instruction — FLUSHED / DISCARDED (Bubble)!', destReg: 'R4', srcRegs: ['R5', 'R6'] },
      { id: 'I4', asm: 'LW  R7, 4(SP)',  desc: 'Target instruction fetched from branch target address after flush', destReg: 'R7' },
    ],
  };

  const instructions = instructionConfigs[hazardMode];

  // Precomputed pipeline schedules per mode: mapping (instIndex, cycle) -> Stage
  // Stages: 'IF' | 'ID' | 'EX' | 'MEM' | 'WB' | 'STALL' | 'FLUSH' | null
  const getStageForCell = (instIdx: number, cycle: number): string | null => {
    if (hazardMode === 'raw_forwarding') {
      // Standard 1-cycle stagger with perfect forwarding
      const startCycle = instIdx + 1;
      const offset = cycle - startCycle;
      if (offset < 0) return null;
      const stages = ['IF', 'ID', 'EX', 'MEM', 'WB'];
      return offset < stages.length ? stages[offset] : null;
    }

    if (hazardMode === 'raw_stall') {
      // I1: starts 1 -> IF(1), ID(2), EX(3), MEM(4), WB(5)
      // I2: IF(2), ID(3), STALL(4), STALL(5), EX(6), MEM(7), WB(8)
      // I3: starts IF(6), ID(7), EX(8), MEM(9), WB(10)
      // I4: starts IF(7), ID(8), EX(9), MEM(10), WB(11)
      if (instIdx === 0) {
        const s = ['IF', 'ID', 'EX', 'MEM', 'WB'];
        return s[cycle - 1] || null;
      }
      if (instIdx === 1) {
        if (cycle === 2) return 'IF';
        if (cycle === 3) return 'ID';
        if (cycle === 4 || cycle === 5) return 'STALL';
        if (cycle === 6) return 'EX';
        if (cycle === 7) return 'MEM';
        if (cycle === 8) return 'WB';
        return null;
      }
      if (instIdx === 2) {
        const s: Record<number, string> = { 6: 'IF', 7: 'ID', 8: 'EX', 9: 'MEM', 10: 'WB' };
        return s[cycle] || null;
      }
      if (instIdx === 3) {
        const s: Record<number, string> = { 7: 'IF', 8: 'ID', 9: 'EX', 10: 'MEM', 11: 'WB' };
        return s[cycle] || null;
      }
    }

    if (hazardMode === 'load_use') {
      // I1: IF(1), ID(2), EX(3), MEM(4), WB(5)
      // I2: IF(2), ID(3), STALL(4), EX(5), MEM(6), WB(7)
      // I3: IF(4), ID(5), EX(6), MEM(7), WB(8)
      // I4: IF(5), ID(6), EX(7), MEM(8), WB(9)
      if (instIdx === 0) {
        return ['IF', 'ID', 'EX', 'MEM', 'WB'][cycle - 1] || null;
      }
      if (instIdx === 1) {
        if (cycle === 2) return 'IF';
        if (cycle === 3) return 'ID';
        if (cycle === 4) return 'STALL';
        if (cycle === 5) return 'EX';
        if (cycle === 6) return 'MEM';
        if (cycle === 7) return 'WB';
        return null;
      }
      if (instIdx === 2) {
        const s: Record<number, string> = { 4: 'IF', 5: 'ID', 6: 'EX', 7: 'MEM', 8: 'WB' };
        return s[cycle] || null;
      }
      if (instIdx === 3) {
        const s: Record<number, string> = { 5: 'IF', 6: 'ID', 7: 'EX', 8: 'MEM', 9: 'WB' };
        return s[cycle] || null;
      }
    }

    if (hazardMode === 'branch_flush') {
      // I1: IF(1), ID(2), EX(3), MEM(4), WB(5)
      // I2 (branch): IF(2), ID(3), EX(4: Taken!), MEM(5), WB(6)
      // I3 (speculative): IF(3), ID(4), FLUSH(5)
      // I4 (target): IF(5), ID(6), EX(7), MEM(8), WB(9)
      if (instIdx === 0) return ['IF', 'ID', 'EX', 'MEM', 'WB'][cycle - 1] || null;
      if (instIdx === 1) {
        const s: Record<number, string> = { 2: 'IF', 3: 'ID', 4: 'EX', 5: 'MEM', 6: 'WB' };
        return s[cycle] || null;
      }
      if (instIdx === 2) {
        if (cycle === 3) return 'IF';
        if (cycle === 4) return 'ID';
        if (cycle === 5) return 'FLUSH';
        return null;
      }
      if (instIdx === 3) {
        const s: Record<number, string> = { 5: 'IF', 6: 'ID', 7: 'EX', 8: 'MEM', 9: 'WB' };
        return s[cycle] || null;
      }
    }

    return null;
  };

  const maxCycles = hazardMode === 'raw_stall' ? 12 : 10;
  const cyclesArray = Array.from({ length: maxCycles }, (_, i) => i + 1);

  // Play / Pause timer
  useEffect(() => {
    if (!isPlaying) return;
    playTimerRef.current = setInterval(() => {
      setCurrentCycle(c => {
        if (c >= maxCycles) {
          setIsPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 900);
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, maxCycles]);

  // Determine which instruction is currently in each physical hardware stage at `currentCycle`
  const getHardwareOccupant = (stageName: string) => {
    for (let i = 0; i < instructions.length; i++) {
      const st = getStageForCell(i, currentCycle);
      if (st === stageName) {
        return { inst: instructions[i], isStall: false };
      }
      if (st === 'STALL' && stageName === 'ID') {
        return { inst: instructions[i], isStall: true };
      }
    }
    return null;
  };

  // Metrics calculations
  const totalInstructions = instructions.length;
  const stallsCount = hazardMode === 'raw_stall' ? 2 : hazardMode === 'load_use' ? 1 : 0;
  const cpi = ((maxCycles - 1) / totalInstructions).toFixed(2);
  const ipc = (totalInstructions / (maxCycles - 1)).toFixed(2);

  return (
    <SimulationLayout
      moduleNumber="02"
      moduleTag="PIPELINE // INSTRUCTION EXECUTION"
      title="INSTRUCTION PIPELINE // 5-STAGE RISC & HAZARD SIMULATOR"
      description="Step-by-step instruction pipeline execution over time. Observe instruction movement through IF, ID, EX, MEM, and WB stages with RAW data hazards, load-use delays, forwarding bypasses, and branch flushes."
      onCommandCenter={onCommandCenter}
    >
      {/* Controls & Mode Selection */}
      <div className="pipe-controls-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentCycle(c => Math.max(1, c - 1))}
            disabled={currentCycle <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>PREV CYCLE</span>
          </button>

          <button
            className={`btn btn-sm ${isPlaying ? 'btn-lime' : 'btn-primary'}`}
            onClick={() => setIsPlaying(p => !p)}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'PAUSE CLOCK' : 'PLAY CLOCK'}</span>
          </button>

          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setCurrentCycle(c => Math.min(maxCycles, c + 1))}
            disabled={currentCycle >= maxCycles}
          >
            <span>NEXT CYCLE</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            className="btn btn-sm"
            onClick={() => { setCurrentCycle(1); setIsPlaying(false); }}
          >
            <RefreshCw className="w-4 h-4" />
            <span>RESET</span>
          </button>
        </div>

        <div className="label font-mono" style={{ marginLeft: '12px', fontSize: '12px' }}>
          CLOCK CYCLE: <span className="text-cyan font-bold" style={{ fontSize: '15px' }}>CC {currentCycle}</span> / {maxCycles}
        </div>

        {/* Hazard Modes */}
        <div className="pipe-mode-selector" style={{ marginLeft: 'auto' }}>
          <button
            className={`pipe-mode-btn ${hazardMode === 'raw_forwarding' ? 'active' : ''}`}
            onClick={() => { setHazardMode('raw_forwarding'); setCurrentCycle(1); setIsPlaying(false); }}
          >
            <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-cyan" />
            RAW WITH FORWARDING
          </button>
          <button
            className={`pipe-mode-btn ${hazardMode === 'raw_stall' ? 'active' : ''}`}
            onClick={() => { setHazardMode('raw_stall'); setCurrentCycle(1); setIsPlaying(false); }}
          >
            <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-coral" />
            RAW WITH STALLS (BUBBLES)
          </button>
          <button
            className={`pipe-mode-btn ${hazardMode === 'load_use' ? 'active' : ''}`}
            onClick={() => { setHazardMode('load_use'); setCurrentCycle(1); setIsPlaying(false); }}
          >
            LOAD-USE HAZARD (1-CYCLE STALL)
          </button>
          <button
            className={`pipe-mode-btn ${hazardMode === 'branch_flush' ? 'active' : ''}`}
            onClick={() => { setHazardMode('branch_flush'); setCurrentCycle(1); setIsPlaying(false); }}
          >
            BRANCH MISPREDICTION (FLUSH)
          </button>
        </div>
      </div>

      {/* Hardware Stage Visualization (Snapshot at Current Cycle) */}
      <div className="panel pipe-hw-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="label label-gold">PHYSICAL HARDWARE PIPELINE REGISTERS // AT CC {currentCycle}</div>
          <div className="label font-mono text-cyan">INSPECTION AT CYCLE {currentCycle}</div>
        </div>

        <div className="pipe-stages-flow">
          {[
            { id: 'IF', name: 'IF // FETCH', sub: 'Program Counter ➔ I-Cache' },
            { id: 'ID', name: 'ID // DECODE', sub: 'Instruction Register ➔ Reg Read' },
            { id: 'EX', name: 'EX // EXECUTE', sub: 'ALU Op / Branch Eval' },
            { id: 'MEM', name: 'MEM // MEMORY', sub: 'RAM / D-Cache Access' },
            { id: 'WB', name: 'WB // WRITEBACK', sub: 'Commit to Reg File' },
          ].map(stage => {
            const occupant = getHardwareOccupant(stage.id);
            return (
              <div
                key={stage.id}
                className={`pipe-stage-card ${occupant ? (occupant.isStall ? 'stage-stall' : 'stage-busy') : ''}`}
              >
                <div className="pipe-stage-name">{stage.name}</div>
                <div className="pipe-stage-sub">{stage.sub}</div>

                <div className="pipe-stage-slot">
                  {occupant ? (
                    <>
                      <div className="pipe-stage-inst">
                        {occupant.isStall ? '⚠️ PIPELINE STALL' : occupant.inst.asm}
                      </div>
                      <div className="pipe-stage-detail">
                        {occupant.isStall ? 'Bubble inserted' : `${occupant.inst.id} active`}
                      </div>
                    </>
                  ) : (
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>IDLE CYCLE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Hazard Explanation Callout */}
        <div style={{ background: 'rgba(7, 7, 9, 0.6)', border: '1px solid rgba(212, 175, 55, 0.15)', borderRadius: '4px', padding: '12px 16px' }}>
          <div className="label font-mono text-gold" style={{ marginBottom: '4px' }}>
            ARCHITECTURAL STATUS // {hazardMode.toUpperCase().replace('_', ' ')}
          </div>
          <div className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
            {hazardMode === 'raw_forwarding' &&
              'Data Forwarding (Bypassing) enables the ALU output of ADD R1 to be routed straight to SUB R4 execution input without stalling for Write-Back, achieving optimal 1.0 IPC.'}
            {hazardMode === 'raw_stall' &&
              'Without hardware forwarding units, SUB R4 must stall (injecting 2 bubble cycles) until ADD R1 reaches the Write-Back stage to ensure register file coherence.'}
            {hazardMode === 'load_use' &&
              'Load-Use Data Hazard: LW data is retrieved from D-Cache at the MEM stage. SUB R4 requires it at EX, causing a mandatory 1-cycle stall bubble before forwarding can occur.'}
            {hazardMode === 'branch_flush' &&
              'Control Hazard: The branch outcome is resolved during EX. The speculatively fetched instruction I3 is invalidated (flushed with bubble) and execution restarts at the branch target.'}
          </div>
        </div>
      </div>

      {/* Execution Over Time Matrix */}
      <div className="panel pipe-matrix-panel">
        <div className="label label-cyan" style={{ marginBottom: '14px' }}>
          CLOCK CYCLE EXECUTION MATRIX // INSTRUCTION × TIME TIMELINE
        </div>

        <table className="pipe-matrix-table">
          <thead>
            <tr>
              <th>INSTRUCTION STREAM</th>
              {cyclesArray.map(c => (
                <th key={c} className={c === currentCycle ? 'pipe-col-active' : ''}>
                  CC {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {instructions.map((inst, iIdx) => (
              <tr key={inst.id}>
                <td>
                  <div style={{ color: '#ffffff', fontWeight: 700 }}>{inst.id}: {inst.asm}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-muted)', marginTop: '2px' }}>{inst.desc}</div>
                </td>
                {cyclesArray.map(c => {
                  const stage = getStageForCell(iIdx, c);
                  const isCurrent = c === currentCycle;
                  return (
                    <td key={c} className={isCurrent ? 'pipe-col-active' : ''}>
                      {stage && (
                        <span className={`pipe-cell-stage stage-${stage.toLowerCase()} ${stage === 'STALL' ? 'stage-stall-tag' : stage === 'FLUSH' ? 'stage-stall-tag' : ''}`}>
                          {stage}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Telemetry */}
      <div className="pipe-telemetry-grid">
        <div className="pipe-stat-box">
          <div className="label">TOTAL CLOCK CYCLES</div>
          <div className="pipe-stat-num text-cyan font-mono">{maxCycles - 1}</div>
        </div>
        <div className="pipe-stat-box">
          <div className="label">INSTRUCTIONS RETIRED</div>
          <div className="pipe-stat-num text-gold font-mono">{totalInstructions}</div>
        </div>
        <div className="pipe-stat-box">
          <div className="label">CYCLES PER INSTRUCTION (CPI)</div>
          <div className="pipe-stat-num font-mono">{cpi}</div>
        </div>
        <div className="pipe-stat-box">
          <div className="label">INSTRUCTIONS PER CYCLE (IPC)</div>
          <div className="pipe-stat-num text-cyan font-mono">{ipc}</div>
        </div>
        <div className="pipe-stat-box">
          <div className="label">PIPELINE STALL BUBBLES</div>
          <div className="pipe-stat-num font-mono" style={{ color: stallsCount > 0 ? '#ef4444' : '#10b981' }}>
            {stallsCount}
          </div>
        </div>
      </div>

      {/* Reusable 8-Stage Architecture Flow Walkthrough */}
      <div style={{ marginTop: '48px' }}>
        <ScrollSequence />
      </div>
    </SimulationLayout>
  );
};
