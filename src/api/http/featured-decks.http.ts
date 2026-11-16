import type { IRouter } from 'express';
import { getFeaturedDecksUserId } from '../../constants/featuredDecksUser';
import type { AccountDeckService } from '../services/accountDeckService';
import { sendV1Json, sendV1Success } from './v1Envelope';

export function registerFeaturedDecksV1HttpRoutes(
  router: IRouter,
  service: Pick<AccountDeckService, 'listFeatured'>,
): void {
  router.get('/decks/featured', async (_req, res) => {
    res.set('Cache-Control', 'no-store');
    const userId = getFeaturedDecksUserId();
    try {
      sendV1Success(res, userId ? await service.listFeatured(userId) : []);
    } catch {
      sendV1Json(res, 503, null, [{
        code: 'FEATURED_DECKS_UNAVAILABLE',
        message: 'Featured decks are unavailable. Please retry.',
      }]);
    }
  });
}
