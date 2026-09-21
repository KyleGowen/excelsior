import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../app/AuthProvider';
import { AppBackground } from '../../components/AppBackground';
import { Logo } from '../../components/Logo';
import { IconBuild, IconCollection, IconDatabase, IconEye, IconEyeOff, IconGoogle, IconProfile, IconLock } from '../../components/icons';
import { describeGoogleSignInError } from '../../lib/auth/googleSignInErrors';
import { useLayoutMode } from '../../lib/layout/LayoutModeProvider';
import './LoginPage.css';

const CALLOUTS = [
  { icon: <IconBuild />, title: 'Build', copy: 'Assemble decks and share them with the community.' },
  { icon: <IconCollection />, title: 'Collect', copy: 'Track your OverPower collection.' },
  { icon: <IconDatabase />, title: 'Database', copy: 'Quickly search and filter all modern OverPower cards.' },
];

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const {
    user,
    login,
    signUp,
    loginAsGuest,
    signInWithGoogle,
    signInWithGoogleRedirect,
    isGoogleSignInReady,
    googleRedirectError,
    clearGoogleRedirectError,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const postAuthDestination = searchParams.get('supporter') === '1'
    ? '/supporter?supporter=open'
    : '/home';
  const { isMobile } = useLayoutMode();

  const [mode, setMode] = useState<Mode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offerGoogleRedirect, setOfferGoogleRedirect] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) navigate(postAuthDestination, { replace: true });
  }, [user, navigate, postAuthDestination]);

  useEffect(() => {
    if (!googleRedirectError) return;
    setError(googleRedirectError);
    setOfferGoogleRedirect(false);
    clearGoogleRedirectError();
  }, [googleRedirectError, clearGoogleRedirectError]);

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    setOfferGoogleRedirect(false);
    try {
      await fn();
      navigate(postAuthDestination, { replace: true });
    } catch (err) {
      setError((err as Error)?.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (mode === 'login') {
      void run(() => login(username.trim(), password));
    } else {
      void run(() => signUp(username.trim(), email.trim(), password));
    }
  };

  const handleGoogleSignIn = () => {
    if (busy || !isGoogleSignInReady) return;
    setBusy(true);
    setError(null);
    setOfferGoogleRedirect(false);
    void signInWithGoogle()
      .then(() => navigate(postAuthDestination, { replace: true }))
      .catch((signInError: unknown) => {
        const info = describeGoogleSignInError(signInError);
        setError(info.message);
        setOfferGoogleRedirect(info.offerRedirect);
      })
      .finally(() => setBusy(false));
  };

  const handleGoogleRedirect = () => {
    if (busy || !isGoogleSignInReady) return;
    setBusy(true);
    setError(null);
    setOfferGoogleRedirect(false);
    void signInWithGoogleRedirect()
      .catch((signInError: unknown) => {
        setError(describeGoogleSignInError(signInError).message);
      })
      .finally(() => setBusy(false));
  };

  const credentialsForm = (
    <form className="login__form" onSubmit={handleSubmit}>
      <label className="login__field">
        <span className="login__label">{mode === 'login' ? 'Email or Username' : 'Username'}</span>
        <div className="login__input-wrap">
          <IconProfile className="login__input-icon" />
          <input
            type="text"
            autoComplete="username"
            placeholder={mode === 'login' ? 'Enter your email or username' : 'Choose a username'}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
      </label>

      {mode === 'signup' ? (
        <label className="login__field">
          <span className="login__label">Email</span>
          <div className="login__input-wrap">
            <IconProfile className="login__input-icon" />
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </label>
      ) : null}

      <label className="login__field">
        <span className="login__label">Password</span>
        <div className="login__input-wrap">
          <IconLock className="login__input-icon" />
          <input
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="login__eye"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
      </label>

      {error ? (
        <div className="login__error" role="alert">
          <span>{error}</span>
          {offerGoogleRedirect ? (
            <button
              type="button"
              className="login__error-action"
              onClick={handleGoogleRedirect}
              disabled={busy || !isGoogleSignInReady}
            >
              Continue with Google in this window
            </button>
          ) : null}
        </div>
      ) : null}

      <button type="submit" className="btn btn-primary login__submit" disabled={busy}>
        {busy ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
      </button>
    </form>
  );

  const divider = <div className="login__divider"><span>OR</span></div>;

  const googleButton = (
    <button
      type="button"
      className="btn btn-secondary login__google"
      onClick={handleGoogleSignIn}
      disabled={busy || !isGoogleSignInReady}
    >
      <IconGoogle /> Sign in with Google
    </button>
  );

  return (
    <div className="login">
      <AppBackground variant="hero" className="login__bg" />

      <aside className="login__brand">
        <Logo height={210} className="login__brand-logo" />
        <h1 className="login__tagline">Build. Battle. OverPower.</h1>
        <p className="login__brand-sub">
          Excelsior is an independently developed and operated OverPower database and deck
          builder, built for the Modern OverPower community.&nbsp; Browse tournament-winning lists,
          study community builds, and craft Venture-ready decks using the full modern card pool.
        </p>
        <ul className="login__callouts">
          {CALLOUTS.map((c) => (
            <li className="login__callout" key={c.title}>
              <span className="login__callout-icon">{c.icon}</span>
              <span>
                <strong>{c.title}</strong>
                <span className="login__callout-copy">{c.copy}</span>
              </span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="login__card-logo">
        <Logo height={250} className="login__card-logo-img" alt="Excelsior" />
      </div>

      <main className="login__card panel">
        <div className="login__card-header">
          <h2 className="login__heading">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <p className="login__subheading">
            {mode === 'login'
              ? 'Log in to access your decks, collections, and card database.'
              : 'Join the Excelsior community and start building.'}
          </p>
        </div>

        {isMobile ? (
          <>
            {googleButton}
            {divider}
            {credentialsForm}
          </>
        ) : (
          <>
            {credentialsForm}
            {divider}
            {googleButton}
          </>
        )}

        <div className="login__alt-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => void run(() => loginAsGuest())}
            disabled={busy}
          >
            <IconProfile /> Continue as Guest
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setError(null);
              setMode((m) => (m === 'login' ? 'signup' : 'login'));
            }}
            disabled={busy}
          >
            {mode === 'login' ? 'Create Account' : 'Have an account? Log In'}
          </button>
        </div>

        <p className="login__support">
          For support or feedback, email <a href="mailto:kyle@excelsior.cards">kyle@excelsior.cards</a>
          <br />
          or message me on Discord:{' '}
          <a
            href="https://discord.com/users/414971289267339274"
            target="_blank"
            rel="noopener noreferrer"
          >
            @GirlsGoneKyle
          </a>
        </p>
      </main>
    </div>
  );
}
