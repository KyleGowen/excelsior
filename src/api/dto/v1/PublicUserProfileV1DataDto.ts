import type { TopDeckAccountV1DataDto } from './TopDeckAccountV1DataDto';

/** Explicit public allowlist. Never include email, role, or auth-provider data. */
export interface PublicUserProfileV1DataDto extends TopDeckAccountV1DataDto {
  id: string;
  displayName: string;
}
