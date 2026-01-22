import express from 'express';
import { transformDeckList } from '../api/deckTransform';

type DeckRoutesDeps = {
  deckRepository: {
    getDecksByUserId: (userId: string) => Promise<any[]>;
  };
  authenticateUser: any;
};

export function createDeckRoutes(deps: DeckRoutesDeps) {
  const router = express.Router();

  router.get('/decks', deps.authenticateUser, async (req: any, res) => {
    try {
      const decks = await deps.deckRepository.getDecksByUserId(req.user.id);

      // Transform deck data to match frontend expectations
      // Note: getDecksByUserId now returns decks with metadata columns for performance
      const transformedDecks = transformDeckList(decks);

      res.json({ success: true, data: transformedDecks });
    } catch (error) {
      console.error('Error fetching decks:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch decks' });
    }
  });

  return router;
}

