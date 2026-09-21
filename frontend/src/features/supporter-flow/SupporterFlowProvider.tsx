import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import {
  createSupporterCheckout,
  createSupporterPortal,
  fetchSupporterStatus,
  type SupporterStatus,
} from '../../lib/api/supporter';
import { MonthlyContributionInput, type ContributionChoice } from './MonthlyContributionInput';
import { validateCustomContribution } from './contributionValidation';
import './SupporterFlow.css';

const RESTORED_AMOUNT_KEY = 'excelsior.supporter.monthlyContributionUsd';
const CONFIRMATION_POLL_MS = 2_000;
const CONFIRMATION_MAX_POLLS = 15;

interface SupporterFlowContextValue {
  openSupporter: () => void;
  status: SupporterStatus | null;
  statusResolved: boolean;
  showInvitation: boolean;
  profileLabel: 'Support Excelsior' | 'Manage monthly support' | 'Supporter status';
  billingPanel: ReactNode;
}

const SupporterFlowContext = createContext<SupporterFlowContextValue | null>(null);

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function SupporterFlowProvider({ children }: { children: ReactNode }) {
  const { user, isGuest, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<ContributionChoice>('3');
  const [customValue, setCustomValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmationTimedOut, setConfirmationTimedOut] = useState(false);

  const restoreSelection = useCallback(() => {
    const restored = sessionStorage.getItem(RESTORED_AMOUNT_KEY);
    if (restored === '3' || restored === '5' || restored === '10') {
      setChoice(restored);
    } else if (restored && /^\d+$/.test(restored)) {
      setChoice('other');
      setCustomValue(restored);
    }
  }, []);

  const statusQuery = useQuery({
    queryKey: ['supporter', 'status', user?.id ?? 'anonymous'],
    queryFn: ({ signal }) => fetchSupporterStatus(signal),
    staleTime: 15_000,
    retry: false,
  });
  const status = statusQuery.data ?? null;
  const refetchStatus = statusQuery.refetch;

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnState = params.get('supporter');
    if (!returnState) return;
    if (location.pathname !== '/supporter') {
      navigate(
        { pathname: '/supporter', search: params.toString() },
        { replace: true },
      );
      return;
    }
    restoreSelection();
    setConfirming(returnState === 'confirm');
    setConfirmationTimedOut(false);
    params.delete('supporter');
    navigate(
      { pathname: location.pathname, search: params.toString(), hash: location.hash },
      { replace: true },
    );
  }, [location.hash, location.pathname, location.search, navigate, restoreSelection]);

  useEffect(() => {
    if (!confirming) return undefined;
    let active = true;
    let polls = 0;
    const poll = async () => {
      polls += 1;
      const result = await refetchStatus();
      if (!active) return;
      if (result.data?.sources.includes('STRIPE')) {
        setConfirming(false);
        void queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        return;
      }
      if (polls >= CONFIRMATION_MAX_POLLS) {
        setConfirming(false);
        setConfirmationTimedOut(true);
        return;
      }
      window.setTimeout(() => void poll(), CONFIRMATION_POLL_MS);
    };
    void poll();
    return () => {
      active = false;
    };
  }, [confirming, queryClient, refetchStatus]);

  const openSupporter = useCallback(() => {
    navigate('/supporter');
  }, [navigate]);

  const minimum = status?.minimumMonthlyContributionUsd ?? 3;
  const maximum = status?.maximumMonthlyContributionUsd ?? 999_999;
  const customValidation = validateCustomContribution(customValue, minimum, maximum);
  const selectedAmount = choice === 'other' ? customValidation.amount : Number(choice);
  const validationError = choice === 'other' ? customValidation.error : null;
  const isPaid = Boolean(status?.paid && status.paid.state !== 'INACTIVE' && status.sources.includes('STRIPE'));
  const isComplimentary = Boolean(status?.sources.includes('COMPLIMENTARY'));

  const handleChoiceChange = (next: ContributionChoice) => {
    setChoice(next);
    setActionError(null);
    if (next !== 'other') sessionStorage.setItem(RESTORED_AMOUNT_KEY, next);
  };

  const handleCustomValueChange = (value: string) => {
    setCustomValue(value);
    setActionError(null);
    const validation = validateCustomContribution(value, minimum, maximum);
    if (validation.amount !== null) {
      sessionStorage.setItem(RESTORED_AMOUNT_KEY, String(validation.amount));
    }
  };

  const handlePrimaryAction = async () => {
    if (!status?.billingAvailable || busy) return;
    if (!user || isGuest) {
      if (selectedAmount !== null) sessionStorage.setItem(RESTORED_AMOUNT_KEY, String(selectedAmount));
      if (isGuest) await logout();
      navigate('/login?supporter=1');
      return;
    }
    if (isPaid) {
      setBusy(true);
      setActionError(null);
      try {
        const portal = await createSupporterPortal();
        window.location.assign(portal.url);
      } catch (error) {
        setActionError((error as Error).message || 'Membership management is unavailable.');
        setBusy(false);
      }
      return;
    }
    if (selectedAmount === null) return;
    setBusy(true);
    setActionError(null);
    try {
      const checkout = await createSupporterCheckout(selectedAmount);
      window.location.assign(checkout.url);
    } catch (error) {
      setActionError((error as Error).message || 'Checkout could not be started.');
      setBusy(false);
    }
  };

  const retryConfirmation = () => {
    setConfirmationTimedOut(false);
    setConfirming(true);
  };

  const showInvitation = Boolean(
    statusQuery.isSuccess
      && (status?.billingAvailable || import.meta.env.DEV)
      && !isAdmin
      && !status?.isSupporter,
  );
  const profileLabel = isPaid
    ? 'Manage monthly support'
    : isComplimentary
      ? 'Supporter status'
      : 'Support Excelsior';

  const paidRenewal = formatDate(status?.paid?.nextRenewalAt ?? null);
  const paidThrough = formatDate(status?.paid?.currentPeriodEnd ?? null);
  const complimentaryThrough = formatDate(status?.complimentaryExpiresAt ?? null);

  const billingPanel = (
    <div className="supporter-flow supporter-flow--embedded">
          {confirming ? (
            <section className="supporter-flow__state" aria-live="polite">
              <span className="supporter-flow__eyebrow">EXCELSIOR SUPPORTER</span>
              <h2>Confirming your support…</h2>
              <p>Stripe is finishing the handoff. Your account will update as soon as the verified payment reaches Excelsior.</p>
              <div className="supporter-flow__spinner" aria-hidden="true" />
            </section>
          ) : confirmationTimedOut ? (
            <section className="supporter-flow__state">
              <span className="supporter-flow__eyebrow">CONFIRMATION PENDING</span>
              <h2>Your support may need another moment.</h2>
              <p>No action is required. Refresh the verified status here, or come back shortly.</p>
              <button type="button" className="btn btn-primary" onClick={retryConfirmation}>
                Refresh status
              </button>
            </section>
          ) : isPaid && status?.paid ? (
            <section className="supporter-flow__state">
              <span className="supporter-flow__eyebrow">EXCELSIOR SUPPORTER</span>
              {status.paid.state === 'RECOVERY' ? (
                <>
                  <h2>Your latest payment needs attention.</h2>
                  <p>Supporter access remains available during the short recovery window.</p>
                </>
              ) : (
                <>
                  <h2>Thank you for supporting Excelsior.</h2>
                  <div className="supporter-flow__current-price">
                    <strong>${status.paid.monthlyContributionUsd}</strong><span>/month</span>
                  </div>
                  {status.paid.state === 'SCHEDULED_CANCELLATION' ? (
                    <p>Your Supporter access remains active through {paidThrough ?? 'the current paid period'}.</p>
                  ) : paidRenewal ? (
                    <p>Next renewal: {paidRenewal}</p>
                  ) : null}
                </>
              )}
              {isComplimentary ? (
                <p className="supporter-flow__source-note">
                  Complimentary access{complimentaryThrough ? ` through ${complimentaryThrough}` : ''} remains independent of paid support.
                </p>
              ) : null}
              {status.billingAvailable ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary supporter-flow__primary"
                    disabled={busy}
                    onClick={() => void handlePrimaryAction()}
                  >
                    {busy
                      ? 'Opening Stripe…'
                      : status.paid.state === 'RECOVERY'
                        ? 'Update payment details'
                        : status.paid.state === 'SCHEDULED_CANCELLATION'
                          ? 'Manage membership'
                          : 'Manage monthly contribution'}
                  </button>
                  <p className="supporter-flow__helper">Changes apply to your next renewal. Stripe won't charge or credit you today.</p>
                  <p className="supporter-flow__trust">You can reduce your support to $3/month or cancel.</p>
                </>
              ) : (
                <div className="supporter-flow__unavailable" role="status">
                  Membership management is temporarily unavailable. Your current access is unchanged.
                </div>
              )}
            </section>
          ) : isComplimentary ? (
            <section className="supporter-flow__state">
              <span className="supporter-flow__eyebrow">EXCELSIOR SUPPORTER</span>
              <h2>Thank you for supporting Excelsior.</h2>
              <p>
                Your complimentary Supporter access is active{complimentaryThrough ? ` through ${complimentaryThrough}` : ''}.
              </p>
              <p className="supporter-flow__trust">No paid membership is attached to this account.</p>
            </section>
          ) : (
            <section className="supporter-flow__state">
              <span className="supporter-flow__eyebrow">MONTHLY SUPPORT</span>
              <div className="supporter-flow__price-lockup" aria-label="$3 minimum per month">
                <strong>$3</strong>
                <span>/month</span>
              </div>
              <p>
                Start at $3.&nbsp; Or, if you really appreciate Excelsior, choose any monthly support amount you
                see fit.&nbsp; All supporters receive the same thank you features.
              </p>

              {status?.billingAvailable ? (
                <>
                  <MonthlyContributionInput
                    choice={choice}
                    customValue={customValue}
                    error={validationError}
                    disabled={busy}
                    onChoiceChange={handleChoiceChange}
                    onCustomValueChange={handleCustomValueChange}
                  />
                  <button
                    type="button"
                    className="btn btn-primary supporter-flow__primary"
                    disabled={busy || selectedAmount === null}
                    onClick={() => void handlePrimaryAction()}
                  >
                    {busy
                      ? 'Opening Stripe…'
                      : !user || isGuest
                        ? 'Sign in to become a supporter'
                        : `Become a Supporter — $${selectedAmount ?? 3}/month`}
                  </button>
                  <p className="supporter-flow__trust">Secure checkout by Stripe · Change or cancel anytime</p>
                </>
              ) : (
                <div className="supporter-flow__unavailable" role="status">
                  Monthly Supporter billing is temporarily unavailable.
                </div>
              )}
            </section>
          )}

          {actionError ? <div className="supporter-flow__error" role="alert">{actionError}</div> : null}
    </div>
  );

  const contextValue: SupporterFlowContextValue = {
    openSupporter,
    status,
    statusResolved: statusQuery.isSuccess || statusQuery.isError,
    showInvitation,
    profileLabel,
    billingPanel,
  };

  return (
    <SupporterFlowContext.Provider value={contextValue}>
      {children}
    </SupporterFlowContext.Provider>
  );
}

export function useSupporterFlow(): SupporterFlowContextValue {
  const context = useContext(SupporterFlowContext);
  if (!context) throw new Error('useSupporterFlow must be used within SupporterFlowProvider');
  return context;
}
