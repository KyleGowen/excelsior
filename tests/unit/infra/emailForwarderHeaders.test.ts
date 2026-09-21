// @ts-expect-error The Lambda helper is deployed as CommonJS JavaScript.
import { selectForwardReplyTo, stripResigningHeaders } from '../../../infra/email_forwarder_headers';

describe('stripResigningHeaders', () => {
  it('removes every DKIM header and its folded continuation lines', () => {
    const rawEmail = [
      'From: kyle@excelsior.cards',
      'To: kyle@excelsior.cards',
      'DKIM-Signature: v=1; d=excelsior.cards;',
      ' bh=first-signature;',
      'DKIM-Signature: v=1; d=amazonses.com;',
      '\tbh=second-signature;',
      'X-SES-DKIM-Signature: v=1; d=amazonses.com;',
      'Subject: Feedback test',
      '\twith a folded subject',
      '',
      'The body can mention DKIM-Signature: without being changed.'
    ].join('\r\n');

    const result = stripResigningHeaders(rawEmail);

    expect(result).not.toMatch(/^DKIM-Signature:/im);
    expect(result).not.toMatch(/^X-SES-DKIM-Signature:/im);
    expect(result).not.toContain('first-signature');
    expect(result).not.toContain('second-signature');
    expect(result).toContain('Subject: Feedback test\r\n\twith a folded subject');
    expect(result).toContain('The body can mention DKIM-Signature: without being changed.');
  });

  it('leaves a message without signing headers unchanged', () => {
    const rawEmail = 'From: sender@example.com\nSubject: Hello\n\nBody';

    expect(stripResigningHeaders(rawEmail)).toBe(rawEmail);
  });
});

describe('selectForwardReplyTo', () => {
  it('preserves a sender-provided reply-to address', () => {
    expect(selectForwardReplyTo(' player@example.com ', 'kyle@excelsior.cards')).toBe('player@example.com');
  });

  it('falls back to the original from address', () => {
    expect(selectForwardReplyTo('', ' Sender <sender@example.com> ')).toBe('Sender <sender@example.com>');
  });
});
