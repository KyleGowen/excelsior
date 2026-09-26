import type { Meta, StoryObj } from '@storybook/react-vite';
import { PreviewTextTile } from '../components/TournamentCharts/PreviewTextTile';
import { StatsChartTile } from '../components/TournamentCharts/StatsChartTile';
import { TournamentBarChart } from '../components/TournamentCharts/TournamentBarChart';
import { TournamentCharacterListTile } from '../components/TournamentCharts/TournamentCharacterListTile';
import { TournamentHighlightTile } from '../components/TournamentCharts/TournamentHighlightTile';
import { TournamentPlacardTile } from '../components/TournamentCharts/TournamentPlacardTile';
import { TournamentPlacardCarouselTile } from '../components/TournamentCharts/TournamentPlacardCarouselTile';
import { TournamentPodiumDecksTile } from '../components/TournamentCharts/TournamentPodiumDecksTile';
import type { TournamentEventMeta } from '../lib/tournaments/types';
import { billy, sampleDeck, sherlock } from './fixtures';

const event: TournamentEventMeta = {
  id: 'storybook-event',
  title: 'Example Regional',
  subtitle: 'Tournament preview',
  date: '2026-09-01',
  playerCount: 24,
  winnerName: 'Example winner',
  seasonLabel: 'Season 1',
};

const characters = [
  { name: 'Billy the Kid', count: 18, catalogType: 'characters' as const },
  { name: 'Sherlock Holmes', count: 14, catalogType: 'characters' as const },
];

const podiumEntries = [
  { placement: '1st' as const, playerName: 'Example winner', deck: sampleDeck, deckId: sampleDeck.metadata.id, userId: sampleDeck.metadata.userId },
];

const meta = {
  title: 'Dashboard/Tournament Tiles',
  parameters: { layout: 'centered' },
  decorators: [(Story) => <div style={{ width: 380, height: 490 }}><Story /></div>],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

export const TextTile: Story = {
  render: () => <PreviewTextTile title="Example Regional" subtitle="Season 1" sections={[{ label: 'Players', value: '24' }, { label: 'Winner', value: 'Example winner', variant: 'accent' }]} />,
};

export const ChartTile: Story = {
  render: () => <StatsChartTile title="Top characters"><TournamentBarChart data={characters} /></StatsChartTile>,
};

export const CharacterList: Story = {
  render: () => (
    <TournamentCharacterListTile
      title="Top characters"
      entries={characters}
      onEntryClick={() => {}}
      resolveCard={(entry) => entry.name === 'Billy the Kid' ? billy : sherlock}
      isClickable={() => true}
    />
  ),
};

export const Highlight: Story = {
  render: () => <TournamentHighlightTile label="Most played" cardName="Billy the Kid" card={billy} catalogType="characters" onClick={() => {}} />,
};

export const Placard: Story = {
  render: () => <TournamentPlacardTile meta={event} podiumEntries={podiumEntries} onOpenPodiumDeck={() => {}} />,
};

export const PlacardCarousel: Story = {
  render: () => <TournamentPlacardCarouselTile slides={[{ id: 'one', label: 'Example Regional', meta: event }, { id: 'two', label: 'Another Regional', meta: { ...event, id: 'storybook-event-two', title: 'Another Regional' } }]} />,
};

export const PodiumDecks: Story = {
  render: () => <TournamentPodiumDecksTile entries={podiumEntries} onOpenDeck={() => {}} />,
};
