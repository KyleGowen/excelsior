/**
 * Service to copy a random GUEST account deck for new users on signup.
 * The copy is prefixed with "Sample: " and is an exact duplicate of cards and metadata.
 */

import { UserRepository } from '../repository/UserRepository';
import { DeckRepository } from '../repository/DeckRepository';
import type { DeckCard } from '../types';
import type { ValidationError } from './deckValidationService';

/** Full-deck legality check used to keep the copied deck's `is_valid` authoritative. */
export interface SampleDeckValidationPort {
  validateDeck: (cards: DeckCard[]) => Promise<ValidationError[]>;
}

/** Map DB card_type (underscores) to API cardType (hyphens) for replaceAllCardsInDeck */
function dbCardTypeToApi(dbType: string): string {
  const mapping: Record<string, string> = {
    ally_universe: 'ally-universe',
    basic_universe: 'basic-universe',
    advanced_universe: 'advanced-universe',
  };
  return mapping[dbType] ?? dbType;
}

export class NewUserSampleDeckService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly deckRepository: DeckRepository,
    private readonly deckValidation?: SampleDeckValidationPort
  ) {}

  /**
   * Copy a randomly selected GUEST account deck for a new user.
   * The deck name is prefixed with "Sample: ".
   * Returns the new deck ID, or null if copy failed (does not block signup).
   */
  async copyRandomGuestDeckForUser(newUserId: string): Promise<string | null> {
    try {
      const guestUser = await this.userRepository.getUserByUsername('guest');
      if (!guestUser) {
        console.warn('NewUserSampleDeck: guest user not found, skipping sample deck copy');
        return null;
      }

      const guestDecks = await this.deckRepository.getDecksByUserId(guestUser.id);
      if (!guestDecks || guestDecks.length === 0) {
        console.warn('NewUserSampleDeck: no guest decks found, skipping sample deck copy');
        return null;
      }

      const sourceDeck = guestDecks[Math.floor(Math.random() * guestDecks.length)];
      const sourceDeckId = sourceDeck.id;

      const fullDeck = await this.deckRepository.getDeckSummaryWithAllCards(sourceDeckId);
      if (!fullDeck) {
        console.warn('NewUserSampleDeck: could not load source deck', sourceDeckId);
        return null;
      }

      const newDeckName = `Sample: ${fullDeck.name}`;
      const newDeck = await this.deckRepository.createDeck(
        newUserId,
        newDeckName,
        fullDeck.description
      );
      const newDeckId = newDeck.id;

      const deckUpdates: Partial<typeof fullDeck> = { is_signup_starter_copy: true };
      if (fullDeck.ui_preferences !== undefined) deckUpdates.ui_preferences = fullDeck.ui_preferences;
      if (fullDeck.is_limited !== undefined) deckUpdates.is_limited = fullDeck.is_limited;
      if (fullDeck.reserve_character !== undefined) deckUpdates.reserve_character = fullDeck.reserve_character;
      if (fullDeck.display_mission_card_id !== undefined) deckUpdates.display_mission_card_id = fullDeck.display_mission_card_id;
      if (fullDeck.background_image_path !== undefined) deckUpdates.background_image_path = fullDeck.background_image_path;
      await this.deckRepository.updateDeck(newDeckId, deckUpdates);

      const sourceCards = await this.deckRepository.getDeckCards(sourceDeckId);
      const cardsForReplace = sourceCards.map((card) => {
        const entry: { cardType: string; cardId: string; quantity: number; exclude_from_draw?: boolean } = {
          cardType: dbCardTypeToApi(card.type),
          cardId: card.cardId,
          quantity: card.quantity,
        };
        if (card.exclude_from_draw !== undefined) {
          entry.exclude_from_draw = card.exclude_from_draw;
        }
        return entry;
      });

      await this.deckRepository.replaceAllCardsInDeck(newDeckId, cardsForReplace);

      // Keep decks.is_valid authoritative for the copied deck (server-owned legality):
      // the source is a full deck, so the copy may well be legal and must not stay
      // at the create-time DEFAULT false.
      if (this.deckValidation) {
        try {
          const cardsForValidation = sourceCards.map((card) => ({
            id: '',
            type: card.type,
            cardId: card.cardId,
            quantity: card.quantity,
          })) as DeckCard[];
          const errors = await this.deckValidation.validateDeck(cardsForValidation);
          await this.deckRepository.updateDeck(newDeckId, { is_valid: errors.length === 0 });
        } catch (error) {
          console.error('NewUserSampleDeck: failed to recompute is_valid for copied deck:', error);
        }
      }

      console.log(
        `NewUserSampleDeck: copied "${fullDeck.name}" as "${newDeckName}" for user ${newUserId}`
      );
      return newDeckId;
    } catch (error) {
      console.error('NewUserSampleDeck: failed to copy guest deck for new user:', error);
      return null;
    }
  }
}
