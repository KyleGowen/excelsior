import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IconHeart } from '../../components/icons';
import {
  fetchAdminUsers,
  updateSupporterEntitlement,
  type AdminUser,
  type SupporterGrantDuration,
} from '../../lib/api/adminUsers';
import { compareAlphabetically } from '../../lib/sort/alphabetical';

const USER_QUERY_KEY = ['admin', 'users'] as const;

const DURATION_LABELS: Record<SupporterGrantDuration, string> = {
  '30_DAYS': '30 days',
  '90_DAYS': '90 days',
  '1_YEAR': 'One year',
  CUSTOM: 'Custom expiration',
  PERMANENT: 'Permanent',
};

function formatExpiry(value: string | null): string {
  if (!value) return 'No expiration';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function minimumLocalDateTime(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function SupporterAccessManager() {
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState('');
  const [duration, setDuration] = useState<SupporterGrantDuration>('30_DAYS');
  const [customExpiresAt, setCustomExpiresAt] = useState('');
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const usersQuery = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: ({ signal }) => fetchAdminUsers(signal),
    staleTime: 60 * 1000,
  });
  const users = useMemo(
    () => (usersQuery.data ?? [])
      .filter((user) => user.role === 'USER')
      .sort((a, b) => compareAlphabetically(a.name, b.name)),
    [usersQuery.data],
  );
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? null;
  const hasComplimentaryGrant = selectedUser?.supporterSources.includes('COMPLIMENTARY') ?? false;

  const mutation = useMutation({
    mutationFn: (input: Parameters<typeof updateSupporterEntitlement>[1]) =>
      updateSupporterEntitlement(selectedUserId, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<AdminUser[]>(USER_QUERY_KEY, (current = []) =>
        current.map((user) => user.id === updated.id ? updated : user));
      setReason('');
      setNotice(
        updated.supporterSources.includes('COMPLIMENTARY')
          ? `Complimentary Supporter access granted to ${updated.name}.`
          : `Complimentary Supporter access revoked for ${updated.name}.`,
      );
    },
    onError: (error: Error) => setNotice(error.message),
  });

  const submit = (action: 'grant' | 'revoke') => {
    if (!selectedUser || reason.trim().length < 3) return;
    setNotice(null);
    const input: Parameters<typeof updateSupporterEntitlement>[1] = {
      action,
      reason: reason.trim(),
    };
    if (action === 'grant') {
      input.duration = duration;
      if (duration === 'CUSTOM' && customExpiresAt) {
        input.customExpiresAt = new Date(customExpiresAt).toISOString();
      }
    }
    mutation.mutate(input);
  };

  return (
    <section className="supporter-access" aria-labelledby="supporter-access-title">
      <div className="supporter-access__heading">
        <span className="supporter-access__icon" aria-hidden="true"><IconHeart filled /></span>
        <div>
          <div className="user-analytics-eyebrow">ACCESS MANAGEMENT</div>
          <h2 id="supporter-access-title">Supporter entitlement</h2>
          <p>Grant complimentary Supporter access while Stripe-backed access remains independently managed.</p>
        </div>
      </div>

      <div className="supporter-access__form">
        <label>
          <span>User</span>
          <select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setNotice(null);
            }}
            disabled={usersQuery.isLoading || usersQuery.isError}
          >
            <option value="">{usersQuery.isLoading ? 'Loading users…' : 'Choose a user'}</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>{user.name} · {user.email}</option>
            ))}
          </select>
        </label>

        {selectedUser ? (
          <div className="supporter-access__status" aria-live="polite">
            <span className={selectedUser.isSupporter ? 'is-active' : ''}>
              {selectedUser.isSupporter ? 'SUPPORTER ACTIVE' : 'NOT A SUPPORTER'}
            </span>
            {selectedUser.supporterSources.length > 0 ? (
              <small>
                Sources: {selectedUser.supporterSources.map((source) =>
                  source === 'COMPLIMENTARY' ? 'complimentary' : 'Stripe').join(' + ')}
                {hasComplimentaryGrant ? ` · ${formatExpiry(selectedUser.complimentarySupporterExpiresAt)}` : ''}
              </small>
            ) : null}
          </div>
        ) : null}

        {!hasComplimentaryGrant ? (
          <label>
            <span>Grant length</span>
            <select value={duration} onChange={(event) => setDuration(event.target.value as SupporterGrantDuration)}>
              {Object.entries(DURATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        ) : null}

        {!hasComplimentaryGrant && duration === 'CUSTOM' ? (
          <label>
            <span>Expires</span>
            <input
              type="datetime-local"
              value={customExpiresAt}
              min={minimumLocalDateTime()}
              onChange={(event) => setCustomExpiresAt(event.target.value)}
            />
          </label>
        ) : null}

        <label className="supporter-access__reason">
          <span>Reason <small>required for the audit record</small></span>
          <input
            type="text"
            value={reason}
            maxLength={500}
            placeholder={hasComplimentaryGrant ? 'Why is this access being revoked?' : 'Why is this access being granted?'}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <button
          type="button"
          className={`btn ${hasComplimentaryGrant ? 'btn-secondary' : 'btn-primary'}`}
          disabled={
            !selectedUser
            || reason.trim().length < 3
            || mutation.isPending
            || (!hasComplimentaryGrant && duration === 'CUSTOM' && !customExpiresAt)
          }
          onClick={() => submit(hasComplimentaryGrant ? 'revoke' : 'grant')}
        >
          {mutation.isPending
            ? 'Updating…'
            : hasComplimentaryGrant
              ? 'Revoke complimentary access'
              : 'Grant Supporter access'}
        </button>
      </div>

      {usersQuery.isError ? <p className="supporter-access__notice is-error">Could not load users.</p> : null}
      {notice ? <p className={`supporter-access__notice${mutation.isError ? ' is-error' : ''}`}>{notice}</p> : null}
    </section>
  );
}
