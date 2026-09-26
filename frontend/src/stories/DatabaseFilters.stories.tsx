import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CatalogFilterRail } from '../features/database/components/CatalogFilterRail';
import { DbvFunctionIconStrip } from '../features/database/components/DbvFunctionIconStrip';
import { DbvPowerTypeStrip } from '../features/database/components/DbvPowerTypeStrip';
import { DbvMissionSetSelect } from '../features/database/components/DbvMissionSetSelect';
import { useDbvFilters } from '../features/database/filters/useDbvFilters';
import '../features/database/components/DbvFilterRail.css';

function DatabaseFiltersExample() {
  const [collapsed, setCollapsed] = useState(false);
  const filters = useDbvFilters('power-cards');
  return (
    <CatalogFilterRail
      ariaLabel="Card filters"
      collapsed={collapsed}
      onCollapsedChange={setCollapsed}
      controls={(
        <>
          <DbvPowerTypeStrip
            powerTypeKeys={['Energy', 'Combat', 'Brute Force', 'Intelligence', 'Any-Power', 'Multi-Power']}
            filters={filters}
          />
          <DbvFunctionIconStrip filters={filters} />
          <DbvMissionSetSelect options={['Mission Set A', 'Mission Set B']} filters={filters} />
        </>
      )}
      trailing={<button type="button" className="btn btn-secondary" onClick={filters.clearAll}>Clear</button>}
    />
  );
}

const meta = {
  title: 'Database/Filter Rail',
  component: DatabaseFiltersExample,
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div style={{ padding: 24 }}><Story /></div>],
} satisfies Meta<typeof DatabaseFiltersExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};
export const Mobile: Story = { parameters: { viewport: { defaultViewport: 'mobile' } } };
