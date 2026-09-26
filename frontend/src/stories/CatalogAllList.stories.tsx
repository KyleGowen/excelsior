import type { Meta, StoryObj } from '@storybook/react-vite';
import { CatalogAllList } from '../components/CatalogAllList/CatalogAllList';
import { aspectCard, billy, eventCard, sherlock } from './fixtures';

const items = [
  { card: billy, catalogType: 'characters' as const },
  { card: sherlock, catalogType: 'characters' as const },
  { card: eventCard, catalogType: 'events' as const },
  { card: aspectCard, catalogType: 'aspects' as const },
];

const meta = {
  title: 'Database/Catalog All List',
  component: CatalogAllList,
  args: { items, onSelect: () => {} },
  decorators: [(Story) => <div style={{ width: 550 }}><Story /></div>],
} satisfies Meta<typeof CatalogAllList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Selected: Story = { args: { selectedId: billy.id } };
export const CollectionStyle: Story = {
  args: { typeBetweenNumberAndName: true, compactTypeLabels: true, renderTrailing: () => <span>2 owned</span> },
};
