import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordInput } from '../components/PasswordInput/PasswordInput';

const meta = {
  title: 'Controls/Password Input',
  component: PasswordInput,
  args: { id: 'storybook-password', label: 'Password', value: '', onChange: () => {} },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    return <div style={{ width: 320 }}><PasswordInput {...args} value={value} onChange={setValue} /></div>;
  },
} satisfies Meta<typeof PasswordInput>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Filled: Story = { args: { value: 'excelsior-example' } };
