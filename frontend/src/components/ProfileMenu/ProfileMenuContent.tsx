import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../app/AuthProvider';
import { fetchDecksForUser } from '../../lib/api/decks';
import { changeEmail, changePassword, setDisplayName } from '../../lib/api/account';
import { resolveUserDisplayName } from '../../lib/auth/resolveUserDisplayName';
import { isValidEmail } from '../../lib/validation/email';
import { PasswordInput } from '../PasswordInput/PasswordInput';
import { IconAnalytics, IconChartBar, IconPlus, IconLogout, IconLock, IconSettings, IconProfile, IconHelp } from '../icons';
import './ProfileMenuContent.css';

type OpenForm = 'displayName' | 'email' | 'password' | null;

export interface ProfileMenuContentProps {
  onClose: () => void;
  onOpenHelp: () => void;
  variant?: 'dropdown' | 'sheet';
}

export function ProfileMenuContent({
  onClose,
  onOpenHelp,
  variant = 'dropdown',
}: ProfileMenuContentProps) {
  const { user, isGuest, logout, refresh } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [openForm, setOpenForm] = useState<OpenForm>(null);
  const [emailValue, setEmailValue] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailBusy, setEmailBusy] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordBusy, setPasswordBusy] = useState(false);

  const [displayNameValue, setDisplayNameValue] = useState('');
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameBusy, setDisplayNameBusy] = useState(false);

  const userId = user?.id ?? '';

  const decksQuery = useQuery({
    queryKey: ['decks', 'mine', userId],
    queryFn: () => fetchDecksForUser(isGuest),
    enabled: Boolean(userId),
  });

  useEffect(() => {
    if (!isGuest && user && !user.email) {
      void refresh();
    }
  }, [isGuest, user, refresh]);

  useEffect(() => {
    // Google users can't change email/password, but they CAN set a display name.
    if (user?.authProvider === 'google' && (openForm === 'email' || openForm === 'password')) {
      setOpenForm(null);
    }
  }, [user?.authProvider, openForm]);

  if (!user) return null;

  const isGoogleUser = user.authProvider === 'google';
  const headerName = isGuest ? 'Guest' : resolveUserDisplayName(user);
  const deckCount = decksQuery.data?.length ?? 0;
  const deckLabel = deckCount === 1 ? '1 deck' : `${deckCount} decks`;
  const canChangeAccountSettings = !isGuest && !isGoogleUser;
  const canSetDisplayName = !isGuest;
  // Password users edit their (unique) username; SSO users set a separate display name.
  const displayNameFieldLabel = isGoogleUser ? 'Display name' : 'Username';
  const displayNameHint = isGoogleUser
    ? 'Shown on your public decks. You still sign in with Google.'
    : 'This is your unique name and your sign-in id.';

  const toggleForm = (form: OpenForm) => {
    setOpenForm((current) => (current === form ? null : form));
    setEmailError(null);
    setPasswordError(null);
    setDisplayNameError(null);
    if (form === 'email') {
      setEmailValue(user.email ?? '');
    }
    if (form === 'password') {
      setNewPassword('');
      setConfirmPassword('');
    }
    if (form === 'displayName') {
      setDisplayNameValue(isGoogleUser ? (user.displayName ?? '') : user.username);
    }
  };

  const handleCreateDeck = () => {
    onClose();
    navigate(`/users/${user.id}/decks?create=1`);
  };

  const handleUserAnalytics = () => {
    onClose();
    navigate('/admin/user-analytics');
  };

  const handleBizOpsDashboard = () => {
    onClose();
    navigate('/admin/biz-ops');
  };

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate('/login');
  };

  const handleEmailSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = emailValue.trim();
    if (!trimmed) {
      setEmailError('Email is required.');
      return;
    }
    if (!isValidEmail(trimmed)) {
      setEmailError('Invalid email address.');
      return;
    }
    setEmailBusy(true);
    setEmailError(null);
    try {
      await changeEmail(trimmed);
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setOpenForm(null);
    } catch (err) {
      setEmailError((err as Error)?.message || 'Could not change email');
    } finally {
      setEmailBusy(false);
    }
  };

  const handleDisplayNameSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = displayNameValue.trim();
    if (!trimmed) {
      setDisplayNameError('Name is required.');
      return;
    }
    setDisplayNameBusy(true);
    setDisplayNameError(null);
    try {
      await setDisplayName(trimmed);
      await refresh();
      await queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
      setOpenForm(null);
    } catch (err) {
      setDisplayNameError((err as Error)?.message || 'Could not update name');
    } finally {
      setDisplayNameBusy(false);
    }
  };

  const passwordsFilled = newPassword.length > 0 && confirmPassword.length > 0;
  const passwordsMatch = newPassword === confirmPassword;
  const showPasswordMismatch = passwordsFilled && !passwordsMatch;

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!passwordsFilled) {
      setPasswordError('Both fields are required.');
      return;
    }
    if (!passwordsMatch) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordBusy(true);
    setPasswordError(null);
    try {
      await changePassword(newPassword, confirmPassword);
      setOpenForm(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError((err as Error)?.message || 'Could not change password');
    } finally {
      setPasswordBusy(false);
    }
  };

  const rootClass = `profile-menu profile-menu--${variant}`;

  return (
    <div className={rootClass}>
      <div className="profile-menu__header">
        <div className="profile-menu__username">{headerName}</div>
        {!isGuest && user.email ? (
          <div className="profile-menu__email">{user.email}</div>
        ) : null}
        <div className="profile-menu__deck-count">{deckLabel}</div>
      </div>

      <div className="profile-menu__actions" role="menu">
        <button type="button" className="profile-menu__item" role="menuitem" onClick={handleCreateDeck}>
          <IconPlus /> Create New Deck
        </button>

        {user.role === 'ADMIN' ? (
          <>
            <button type="button" className="profile-menu__item" role="menuitem" onClick={handleUserAnalytics}>
              <IconAnalytics /> User Analytics
            </button>
            <button type="button" className="profile-menu__item" role="menuitem" onClick={handleBizOpsDashboard}>
              <IconChartBar /> Biz Ops Dashboard
            </button>
          </>
        ) : null}

        {canSetDisplayName ? (
          <>
            <button
              type="button"
              className={`profile-menu__item${openForm === 'displayName' ? ' is-active' : ''}`}
              role="menuitem"
              onClick={() => toggleForm('displayName')}
              aria-expanded={openForm === 'displayName'}
            >
              <IconProfile /> Set Display Name
            </button>
            {openForm === 'displayName' ? (
              <form className="profile-menu__subform" onSubmit={handleDisplayNameSubmit}>
                <label className="profile-menu__field">
                  <span>{displayNameFieldLabel}</span>
                  <input
                    type="text"
                    value={displayNameValue}
                    onChange={(e) => setDisplayNameValue(e.target.value)}
                    maxLength={255}
                    autoComplete="off"
                    required
                  />
                </label>
                <div className="profile-menu__hint">{displayNameHint}</div>
                {displayNameError ? (
                  <div className="profile-menu__error" role="alert">{displayNameError}</div>
                ) : null}
                <div className="profile-menu__subform-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpenForm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={displayNameBusy}>
                    {displayNameBusy ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : null}
          </>
        ) : null}

        {canChangeAccountSettings ? (
          <>
            <button
              type="button"
              className={`profile-menu__item${openForm === 'email' ? ' is-active' : ''}`}
              role="menuitem"
              onClick={() => toggleForm('email')}
              aria-expanded={openForm === 'email'}
            >
              <IconSettings /> Change Email
            </button>
            {openForm === 'email' ? (
              <form className="profile-menu__subform" onSubmit={handleEmailSubmit}>
                <label className="profile-menu__field">
                  <span>New email</span>
                  <input
                    type="email"
                    value={emailValue}
                    onChange={(e) => setEmailValue(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>
                {emailError ? <div className="profile-menu__error" role="alert">{emailError}</div> : null}
                <div className="profile-menu__subform-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpenForm(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={emailBusy}>
                    {emailBusy ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : null}

            <button
              type="button"
              className={`profile-menu__item${openForm === 'password' ? ' is-active' : ''}`}
              role="menuitem"
              onClick={() => toggleForm('password')}
              aria-expanded={openForm === 'password'}
            >
              <IconLock /> Change Password
            </button>
            {openForm === 'password' ? (
              <form className="profile-menu__subform" onSubmit={handlePasswordSubmit}>
                <PasswordInput
                  id="profile-new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={setNewPassword}
                />
                <PasswordInput
                  id="profile-confirm-password"
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                />
                {showPasswordMismatch ? (
                  <div className="profile-menu__error" role="alert">Passwords do not match.</div>
                ) : null}
                {passwordError && !showPasswordMismatch ? (
                  <div className="profile-menu__error" role="alert">{passwordError}</div>
                ) : null}
                <div className="profile-menu__subform-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setOpenForm(null)}>
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={passwordBusy || !passwordsFilled || !passwordsMatch}
                  >
                    {passwordBusy ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : null}
          </>
        ) : null}

        <button
          type="button"
          className="profile-menu__item"
          role="menuitem"
          onClick={onOpenHelp}
        >
          <IconHelp /> Help &amp; Feedback
        </button>
        <div className="profile-menu__divider" />
        <button
          type="button"
          className="profile-menu__item profile-menu__item--danger"
          role="menuitem"
          onClick={handleLogout}
        >
          <IconLogout /> {isGuest ? 'Exit Guest' : 'Log Out'}
        </button>
      </div>
    </div>
  );
}
