import React from 'react';
import { SimulationLayout } from '../components/SimulationLayout/SimulationLayout';
import { PagingLab } from '../components/Paging/PagingLab';

interface Props {
  onCommandCenter: () => void;
}

export const PagingPage: React.FC<Props> = ({ onCommandCenter }) => {
  return (
    <SimulationLayout
      moduleNumber="06"
      moduleTag="PAGING // VIRTUAL ADDRESS TRANSLATION"
      title="PAGING // VIRTUAL TO PHYSICAL ADDRESS TRANSLATION"
      description="Hardware MMU page table address translation. Configure page size and physical RAM, inspect virtual pages, page table entries, physical frames, and follow step-by-step bitwise address decomposition."
      onCommandCenter={onCommandCenter}
    >
      <PagingLab />
    </SimulationLayout>
  );
};
