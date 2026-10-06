import type { CollectionCardRowV1Dto } from './CollectionCardRowV1Dto';
import type { CollectionEvaluationDto } from './CollectionEvaluationDto';
/** Cards and totals are derived from the same current-user snapshot. */
export interface CollectionViewDto {
  cards: CollectionCardRowV1Dto[];
  evaluation: CollectionEvaluationDto;
}
