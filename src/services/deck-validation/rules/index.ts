import { DeckValidationRuleList } from '../deck-validation-rule-list';
import { AngryMobLimitRule } from './angry-mob-limit.rule';
import { BannedCardsRule } from './banned-cards.rule';
import { BattlegroundCountRule } from './battleground-count.rule';
import { CharacterCountRule } from './character-count.rule';
import { DeckSizeRule } from './deck-size.rule';
import { GdaAnyCharacterBattlegroundRule } from './gda-any-character-battleground.rule';
import { RainbowBridgeAnyCharacterBattlegroundRule } from './rainbow-bridge-any-character-battleground.rule';
import { LocationCountRule } from './location-count.rule';
import { MissionCountAndSetRule } from './mission-count-and-set.rule';
import { OnePerDeckRule } from './one-per-deck.rule';
import { PrePlacedBasicUniverseRule } from './pre-placed-basic-universe.rule';
import { PrePlacedTrainingRule } from './pre-placed-training.rule';
import { ThreatLevelRule } from './threat-level.rule';
import { UnusableAdvancedUniverseRule } from './unusable-advanced-universe.rule';
import { UnusableAllyUniverseRule } from './unusable-ally-universe.rule';
import { UnusableAspectRule } from './unusable-aspect.rule';
import { UnusableBasicUniverseRule } from './unusable-basic-universe.rule';
import { UnusableEventRule } from './unusable-event.rule';
import { UnusablePowerRule } from './unusable-power.rule';
import { UnusableSpecialRule } from './unusable-special.rule';
import { UnusableTeamworkRule } from './unusable-teamwork.rule';
import { UnusableTrainingRule } from './unusable-training.rule';

/**
 * Default rule chain — order is validation order (do not reorder without product intent).
 */
export function defaultDeckValidationRuleList(): DeckValidationRuleList {
    return DeckValidationRuleList.of(
        new CharacterCountRule(),
        new BannedCardsRule(),
        new MissionCountAndSetRule(),
        new LocationCountRule(),
        new BattlegroundCountRule(),
        new PrePlacedBasicUniverseRule(),
        new PrePlacedTrainingRule(),
        new ThreatLevelRule(),
        new DeckSizeRule(),
        new AngryMobLimitRule(),
        new UnusableSpecialRule(),
        new UnusableEventRule(),
        new OnePerDeckRule(),
        new UnusablePowerRule(),
        new UnusableTeamworkRule(),
        new UnusableBasicUniverseRule(),
        new UnusableTrainingRule(),
        new UnusableAllyUniverseRule(),
        new UnusableAdvancedUniverseRule(),
        new UnusableAspectRule(),
        new GdaAnyCharacterBattlegroundRule(),
        new RainbowBridgeAnyCharacterBattlegroundRule()
    );
}
