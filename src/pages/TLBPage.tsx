import React from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { TLBLab } from '../components/TLB/TLBLab';

interface Props {
  onCommandCenter: () => void;
}

export const TLBPage: React.FC<Props> = ({ onCommandCenter }) => {
  return (
    <SimulationLayout
      moduleNumber="05"
      moduleTag="CACHE // TRANSLATION LOOKASIDE BUFFER"
      title="TLB // HARDWARE CACHE HIERARCHY & EAT CALCULATOR"
      description="4-way set associative Translation Lookaside Buffer simulation. Query virtual page numbers, observe cache hits and page table lookup misses, and calculate Effective Access Time (EAT) under configurable hardware latency assumptions."
      onCommandCenter={onCommandCenter}
    >
      <TLBLab />
    </SimulationLayout>
  );
};
