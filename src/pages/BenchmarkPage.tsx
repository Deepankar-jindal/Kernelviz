import React from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { AlgorithmBattle } from '../components/AlgorithmBattle/AlgorithmBattle';

interface Props {
  onCommandCenter: () => void;
}

export const BenchmarkPage: React.FC<Props> = ({ onCommandCenter }) => {
  return (
    <SimulationLayout
      moduleNumber="09"
      moduleTag="BENCHMARK // ALGORITHM BATTLE"
      title="BENCHMARK // MULTI-ALGORITHM PERFORMANCE COMPARISON"
      description="Head-to-head empirical evaluation across identical process workloads. Compare FCFS, SJF, SRTF, Round Robin, and Priority scheduling algorithms with normalized metric visualizations, comparison tables, and architectural trade-off analyses."
      onCommandCenter={onCommandCenter}
    >
      <AlgorithmBattle />

      {/* Algorithmic Trade-Off Deep Dive Explanations */}
      <div className="panel" style={{ padding: '24px', marginTop: '32px' }}>
        <div className="label label-gold" style={{ marginBottom: '16px' }}>
          ARCHITECTURAL ALGORITHM ANALYSIS & TRADE-OFF BREAKDOWN
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '4px', padding: '14px' }}>
            <div className="font-mono text-gold font-bold" style={{ fontSize: '12px', marginBottom: '6px' }}>
              01 // FIRST-COME, FIRST-SERVED (FCFS)
            </div>
            <p className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Non-preemptive FIFO queue. Simple with zero scheduler overhead, but highly susceptible to the <strong>Convoy Effect</strong> where short processes queue behind massive CPU-bound tasks, drastically elevating average waiting time.
            </p>
          </div>

          <div style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '4px', padding: '14px' }}>
            <div className="font-mono text-cyan font-bold" style={{ fontSize: '12px', marginBottom: '6px' }}>
              02 // SHORTEST JOB FIRST (SJF)
            </div>
            <p className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Non-preemptive optimal dispatcher for minimizing average waiting time. Proved mathematically optimal for batch systems, but requires future CPU burst knowledge and risks starving long jobs under heavy workload.
            </p>
          </div>

          <div style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '4px', padding: '14px' }}>
            <div className="font-mono text-gold font-bold" style={{ fontSize: '12px', marginBottom: '6px' }}>
              03 // SHORTEST REMAINING TIME FIRST (SRTF)
            </div>
            <p className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Preemptive variant of SJF. Preempts current running process if newly arrived task has smaller remaining burst. Minimizes turnaround latencies further at the expense of frequent context switch overhead.
            </p>
          </div>

          <div style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid rgba(34,211,238,0.15)', borderRadius: '4px', padding: '14px' }}>
            <div className="font-mono text-cyan font-bold" style={{ fontSize: '12px', marginBottom: '6px' }}>
              04 // ROUND ROBIN (RR)
            </div>
            <p className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Time-shared preemptive scheduler using fixed time quantum. Delivers superior average response time for interactive systems and guarantees zero starvation, balancing fairness against context switch frequency.
            </p>
          </div>

          <div style={{ background: 'rgba(7,7,9,0.7)', border: '1px solid rgba(212,175,55,0.15)', borderRadius: '4px', padding: '14px' }}>
            <div className="font-mono text-gold font-bold" style={{ fontSize: '12px', marginBottom: '6px' }}>
              05 // PRIORITY SCHEDULING
            </div>
            <p className="font-mono text-secondary" style={{ fontSize: '11px', lineHeight: 1.5 }}>
              Dispatches CPU to highest-priority tasks. Crucial for real-time and OS daemon prioritization. Solves low-priority starvation in production kernels via dynamic <em>aging</em> mechanisms.
            </p>
          </div>
        </div>
      </div>
    </SimulationLayout>
  );
};
