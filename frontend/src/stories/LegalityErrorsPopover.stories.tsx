import type { Meta, StoryObj } from '@storybook/react-vite';
import { LegalityErrorsPopover } from '../components/LegalityErrorsPopover/LegalityErrorsPopover';

const meta = {
  title: 'Decks/Legality Errors Popover',
  component: LegalityErrorsPopover,
  args: {
    errors: ['Deck must contain four characters.', 'Deck has more than the allowed number of power cards.'],
    children: <button className="btn btn-danger" type="button">Not Legal</button>,
  },
} satisfies Meta<typeof LegalityErrorsPopover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const HoverOrFocus: Story = {};
export const PressAndHold: Story = { args: { pressAndHold: true } };
