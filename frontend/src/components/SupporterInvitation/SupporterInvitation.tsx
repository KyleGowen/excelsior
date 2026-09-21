import { Link } from 'react-router-dom';
import { IconChevronDown, IconHeart } from '../icons';
import './SupporterInvitation.css';

interface SupporterInvitationProps {
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}

export function SupporterInvitation({
  collapsed = false,
  onCollapsedChange,
}: SupporterInvitationProps) {
  const collapsible = Boolean(onCollapsedChange);

  if (collapsible && collapsed) {
    return (
      <div className="supporter-invitation supporter-invitation--collapsed">
        <button
          type="button"
          className="supporter-invitation__toggle supporter-invitation__toggle--collapsed-row"
          aria-expanded="false"
          aria-label="Expand supporter invitation"
          onClick={() => onCollapsedChange?.(false)}
        >
          <span className="supporter-invitation__toggle-icon-wrap">
            <IconChevronDown className="supporter-invitation__toggle-icon" aria-hidden />
          </span>
          <span className="supporter-invitation__toggle-line" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <section className="supporter-invitation" aria-label="Help support Excelsior">
      {collapsible ? (
        <button
          type="button"
          className="supporter-invitation__toggle"
          aria-expanded="true"
          aria-label="Collapse supporter invitation"
          onClick={() => onCollapsedChange?.(true)}
        >
          <span className="supporter-invitation__toggle-icon-wrap">
            <IconChevronDown
              className="supporter-invitation__toggle-icon is-expanded"
              aria-hidden
            />
          </span>
        </button>
      ) : null}
      <span className="supporter-invitation__mark" aria-hidden="true">
        <IconHeart filled />
      </span>
      <div className="supporter-invitation__message">
        <strong>Keep Excelsior free. Support what comes next.</strong>
        <span>Choose $3+/month · Same features at every amount · Change or cancel anytime</span>
      </div>
      <Link
        to="/supporter"
        className="btn btn-primary supporter-invitation__cta"
      >
        Become a Supporter
      </Link>
    </section>
  );
}
