import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityStepper } from '../components/QuantityStepper/QuantityStepper';

const meta = {
  title: 'Controls/Quantity Stepper',
  component: QuantityStepper,
  args: { value: 2, onChange: () => {}, ariaLabel: 'Card quantity' },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <QuantityStepper {...args} value={value} onChange={setValue} />;
  },
} satisfies Meta<typeof QuantityStepper>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Small: Story = { args: { size: 'sm' } };
export const AtMinimum: Story = { args: { value: 0 } };
export const AtMaximum: Story = { args: { value: 5, max: 5 } };
