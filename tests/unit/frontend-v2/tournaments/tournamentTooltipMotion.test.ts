import fs from 'fs';
import path from 'path';

describe('tournament chart tooltip motion', () => {
  it.each(['TournamentBarChart.tsx', 'TournamentPieChart.tsx'])(
    'renders the %s tooltip directly at its active coordinate',
    (fileName) => {
      const source = fs.readFileSync(
        path.resolve(__dirname, '../../../../frontend/src/components/TournamentCharts', fileName),
        'utf8',
      );

      expect(source).toMatch(/<Tooltip\s+isAnimationActive=\{false\}/);
    },
  );
});
