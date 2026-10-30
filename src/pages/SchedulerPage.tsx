import React from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { SchedulerLab } from '../components/Scheduler/SchedulerLab';

interface Props {
  onCommandCenter: () => void;
}

export const SchedulerPage: React.FC<Props> = ({ onCommandCenter }) => {
  return (
    <SimulationLayout
      moduleNumber="03"
      moduleTag="SCHEDULER // CPU DISPATCH"
      title="CPU // SCHEDULING DISPATCH LABORATORY"
      description="Interactive multi-algorithm CPU scheduling simulator. Evaluate FCFS, SJF, SRTF, Round Robin, and Priority scheduling with interactive Gantt charts, process configuration, and empirical performance metrics."
      onCommandCenter={onCommandCenter}
    >
      <SchedulerLab />
    </SimulationLayout>
  );
};
