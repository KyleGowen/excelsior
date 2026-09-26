import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SlideOutPanel } from '../components/SlideOutPanel/SlideOutPanel';

const meta = {
  title: 'Overlays/Slide Out Panel',
  component: SlideOutPanel,
  args: { open: true, onClose: () => {}, title: 'Card details', children: <p>Excelsior panel content</p> },
  parameters: { layout: 'fullscreen' },
  render: (args) => {
    const [open, setOpen] = useState(args.open);
    return (
      <>
        <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>Open panel</button>
        <SlideOutPanel {...args} open={open} onClose={() => setOpen(false)} />
      </>
    );
  },
} satisfies Meta<typeof SlideOutPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const RightSide: Story = {};
export const BottomSheet: Story = { args: { side: 'bottom' } };
