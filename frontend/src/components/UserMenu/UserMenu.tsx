import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../app/AuthProvider';
import { IconChevronDown } from '../icons';
import { ProfileMenuContent } from '../ProfileMenu/ProfileMenuContent';
import { resolveUserDisplayName } from '../../lib/auth/resolveUserDisplayName';
import { HelpFeedbackFlow } from '../HelpFeedback';
import './UserMenu.css';

export function UserMenu() {
  const { user, isGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!user) return null;

  const shownName = isGuest ? 'Guest' : resolveUserDisplayName(user);
  const initial = (shownName || '?').charAt(0).toUpperCase();

  const openHelp = () => {
    setOpen(false);
    setHelpOpen(true);
  };

  return (
    <>
      <div className="user-menu" ref={ref}>
        <button
          type="button"
          className="user-menu__toggle"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="user-menu__avatar" aria-hidden="true">{initial}</span>
          <span className="user-menu__name">{shownName}</span>
          <IconChevronDown className="user-menu__caret" />
        </button>

        {open ? (
          <div className="user-menu__dropdown" role="menu">
            <ProfileMenuContent
              onClose={() => setOpen(false)}
              onOpenHelp={openHelp}
              variant="dropdown"
            />
          </div>
        ) : null}
      </div>
      <HelpFeedbackFlow open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  );
}
