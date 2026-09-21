const RESIGNING_HEADERS = new Set([
    'dkim-signature',
    'x-ses-dkim-signature'
]);

/**
 * Remove signatures from the received message before SES signs the forwarded
 * copy. Header continuations must be removed with their parent header or SES
 * will reject the raw message as malformed or duplicated.
 */
function stripResigningHeaders(rawEmail) {
    const email = String(rawEmail);
    const lineEnding = email.includes('\r\n') ? '\r\n' : '\n';
    const lines = email.split(lineEnding);
    const keptLines = [];
    let inHeaders = true;
    let skippingHeader = false;

    for (const line of lines) {
        if (!inHeaders) {
            keptLines.push(line);
            continue;
        }

        if (line.trim() === '') {
            inHeaders = false;
            skippingHeader = false;
            keptLines.push(line);
            continue;
        }

        if (/^[ \t]/.test(line)) {
            if (!skippingHeader) keptLines.push(line);
            continue;
        }

        const colonIndex = line.indexOf(':');
        const headerName = colonIndex >= 0
            ? line.slice(0, colonIndex).trim().toLowerCase()
            : '';
        skippingHeader = RESIGNING_HEADERS.has(headerName);

        if (!skippingHeader) keptLines.push(line);
    }

    return keptLines.join(lineEnding);
}

/**
 * Keep the sender-provided reply target when forwarding into Gmail. Messages
 * without Reply-To should continue to reply to their original From address.
 */
function selectForwardReplyTo(originalReplyTo, originalFrom) {
    const replyTo = String(originalReplyTo || '').trim();
    return replyTo || String(originalFrom || '').trim();
}

module.exports = { selectForwardReplyTo, stripResigningHeaders };
