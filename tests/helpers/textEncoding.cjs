// jsdom omits the encoding globals used by the installed frontend router.
const { TextEncoder, TextDecoder } = require('node:util');
global.TextEncoder ??= TextEncoder;
global.TextDecoder ??= TextDecoder;
