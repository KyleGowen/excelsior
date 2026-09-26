import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { KoToggleButton } from '../features/deck-editor/KoToggleButton';
import { ReserveCharacterButton } from '../features/deck-editor/ReserveCharacterButton';
import { AddCardsQtyOverlay } from '../features/deck-editor/AddCardsQtyOverlay';
import '../features/deck-editor/DeckEditorPage.css';

function DeckEditorControlsExample() {
  const [ko, setKo] = useState(false);
  const [reserve, setReserve] = useState(false);
  const [quantity, setQuantity] = useState(0);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
      <KoToggleButton active={ko} onToggle={() => setKo(!ko)} cardName="Billy the Kid" />
      <ReserveCharacterButton
        state={reserve ? 'active' : 'none'}
        cardName="Billy the Kid"
        onSelect={() => setReserve(true)}
        onDeselect={() => setReserve(false)}
      />
      <AddCardsQtyOverlay
        value={quantity}
        onIncrement={() => setQuantity(Math.min(4, quantity + 1))}
        onDecrement={() => setQuantity(Math.max(0, quantity - 1))}
        max={4}
      />
    </div>
  );
}

const meta = {
  title: 'Decks/Deck Editor Controls',
  component: DeckEditorControlsExample,
} satisfies Meta<typeof DeckEditorControlsExample>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {};
