import React from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { PageReplacementLab } from '../components/PageReplacement/PageReplacementLab';

interface Props {
  onCommandCenter: () => void;
}

export const ReplacementPage: React.FC<Props> = ({ onCommandCenter }) => {
  return (
    <SimulationLayout
      moduleNumber="07"
      moduleTag="REPLACEMENT // FAULT ANALYSIS"
      title="PAGE REPLACEMENT // FRAME EVICTION & FAULT ANALYSIS"
      description="Simulate virtual memory page replacement policies: First-In First-Out (FIFO), Least Recently Used (LRU), and Belady's Optimal. Animate frame substitutions across arbitrary reference strings and evaluate empirical fault frequencies."
      onCommandCenter={onCommandCenter}
    >
      <PageReplacementLab />
    </SimulationLayout>
  );
};
