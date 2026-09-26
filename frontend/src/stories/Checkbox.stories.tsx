import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '../components/Checkbox/Checkbox';

const meta = {
  title: 'Controls/Checkbox',
  component: Checkbox,
  args: { checked: false, onChange: () => {}, label: 'Include foil cards' },
  render: (args) => {
    const [checked, setChecked] = useState(args.checked);
    return <Checkbox {...args} checked={checked} onChange={setChecked} />;
  },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Checked: Story = { args: { checked: true } };
export const Disabled: Story = { args: { disabled: true } };
export const LabelFirst: Story = { args: { labelPosition: 'end' } };
