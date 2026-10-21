import { api } from './client';
import type { TopDeckAccount } from './types';

export function setTopDeckHandle(topdeckHandle: string | null): Promise<TopDeckAccount> {
  return api.post<TopDeckAccount>('/api/v1/users/topdeck', { topdeckHandle });
}

export async function changeEmail(email: string): Promise<{ email: string }> {
  return api.post<{ email: string }>('/api/v1/users/change-email', { email });
}

export async function changePassword(
  newPassword: string,
  confirmPassword: string
): Promise<{ message: string }> {
  return api.post<{ message: string }>('/api/v1/users/change-password', {
    newPassword,
    confirmPassword,
  });
}

export interface SetDisplayNameResult {
  username: string;
  displayName: string | null;
  resolvedName: string;
}

/**
 * Set the user's public name. For password users this renames their (unique)
 * username/login id; for SSO users it sets display_name only.
 */
export async function setDisplayName(displayName: string): Promise<SetDisplayNameResult> {
  return api.post<SetDisplayNameResult>('/api/v1/users/display-name', { displayName });
}
