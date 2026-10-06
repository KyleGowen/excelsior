#!/usr/bin/env node
/**
 * Generates docs/insomnia/excelsior.cards-prod.insomnia.json for Insomnia import.
 * Run from repo root: node scripts/generate-excelsior-insomnia-export.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const outPath = path.join(root, 'docs', 'insomnia', 'excelsior.cards-prod.insomnia.json');

const now = Date.now();
const WS = 'wrk_excelsior_prod';
const ENV = 'env_excelsior_prod';

const authNone = { type: 'none' };
const authBearer = { type: 'bearer', token: '{{ jwt_access_token }}', prefix: 'Bearer', disabled: false };

function hdrAcceptJson() {
  return [{ name: 'Accept', value: 'application/json', disabled: false }];
}

function hdrContentJson() {
  return [
    { name: 'Accept', value: 'application/json', disabled: false },
    { name: 'Content-Type', value: 'application/json', disabled: false }
  ];
}

function req(id, parentId, name, method, url, opts = {}) {
  const {
    description = '',
    body = {},
    parameters = [],
    headers = hdrAcceptJson(),
    authentication = authNone,
    sendCookies = true,
    sortKey = -now
  } = opts;
  return {
    _id: id,
    parentId,
    modified: now,
    created: now,
    url,
    name,
    description,
    method,
    body,
    parameters,
    headers,
    authentication,
    metaSortKey: sortKey,
    isPrivate: false,
    settingStoreCookies: true,
    settingSendCookies: sendCookies,
    settingDisableRenderRequestUrl: false,
    settingEncodeUrl: true,
    settingRebuildPath: true,
    settingFollowRedirects: 'global',
    _type: 'request'
  };
}

function jsonBody(text) {
  return { mimeType: 'application/json', text };
}

function grp(id, parentId, name, description, sortKey) {
  return {
    _id: id,
    parentId,
    modified: now,
    created: now,
    name,
    description,
    environment: {},
    environmentPropertyOrder: null,
    metaSortKey: sortKey,
    _type: 'request_group'
  };
}

const B = '{{ base_url }}';

const workspaceDesc = [
  '## Production API (excelsior.cards)',
  '',
  '**Base URL** is `{{ base_url }}` (default https://excelsior.cards).',
  '',
  '### Bearer JWT (preferred for DBV + v1 /auth/me)',
  '1. Run **POST /api/v1/auth/login** with `username` / `password` in the environment.',
  '2. Copy `data.accessToken` from the JSON response into environment variable **jwt_access_token**.',
  '3. Use Bearer-backed folders: Auth (me), DBV Catalog, DBV Support.',
  '',
  '### Session cookie (decks, collections, guest, admin, legacy)',
  'Most **/api/v1/decks/**, **/api/v1/collections/**, **/api/v1/guest/**, **/api/v1/admin/**, and **legacy /api/auth/** routes expect the **sessionId** cookie.',
  'Run **Legacy — POST /api/auth/login** first (cookies enabled), then session-backed requests in the same workspace.',
  '',
  '### Legacy deck read compat',
  '`GET /api/decks/:id` and `GET /api/decks/:id/full` use the v1-style envelope but live under legacy paths; they require session auth.',
  ''
].join('\n');

let sort = -now;

const F_HEALTH = 'fld_health';
const F_LEGACY = 'fld_legacy_auth';
const F_LEGACY_DECKS = 'fld_legacy_deck_compat';
const F_V1_AUTH = 'fld_v1_auth';
const F_V1_DBV_CAT = 'fld_v1_dbv_catalog';
const F_V1_DBV_SUP = 'fld_v1_dbv_support';
const F_V1_DECKS = 'fld_v1_decks';
const F_V1_COLL = 'fld_v1_collections';
const F_V1_GUEST = 'fld_v1_guest_decks';
const F_V1_ADMIN = 'fld_v1_admin';
const F_PHASE2 = 'fld_phase2_smoke';
const F_PHASE3 = 'fld_phase3_smoke';

const resources = [
  {
    _id: WS,
    parentId: null,
    modified: now,
    created: now,
    name: 'Excelsior.cards — Production API',
    description: workspaceDesc,
    scope: 'collection',
    _type: 'workspace'
  },
  {
    _id: ENV,
    parentId: WS,
    modified: now,
    created: now,
    name: 'Production',
    data: {
      base_url: 'https://excelsior.cards',
      username: '',
      password: '',
      jwt_access_token: '',
      jwt_refresh_token: '',
      catalog_etag: '',
      catalog_data_version: '0',
      deck_id: 'REPLACE_DECK_ID',
      card_id: 'REPLACE_CARD_ID'
    },
    dataPropertyOrder: {
      '&': [
        'base_url',
        'username',
        'password',
        'jwt_access_token',
        'jwt_refresh_token',
        'catalog_etag',
        'catalog_data_version',
        'deck_id',
        'card_id'
      ]
    },
    color: null,
    isPrivate: false,
    metaSortKey: sort--,
    _type: 'environment'
  },

  grp(F_HEALTH, WS, '01 — Health & diagnostics', 'Server health (no auth).', sort--),
  req(
    'req_health',
    F_HEALTH,
    'GET /health',
    'GET',
    `${B}/health`,
    { description: 'Status, uptime, DB probe, git + migration info.', sortKey: sort-- }
  ),

  grp(
    F_LEGACY,
    WS,
    '02 — Legacy auth & config',
    'Session-based JSON API and client config. Run Login first for cookie-backed v1 deck/collection calls.',
    sort--
  ),
  req(
    'req_legacy_login',
    F_LEGACY,
    'POST /api/auth/login',
    'POST',
    `${B}/api/auth/login`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ username: '{{ username }}', password: '{{ password }}' }, null, 2)
      ),
      description: 'Sets session cookie (legacy envelope).',
      sortKey: sort--
    }
  ),
  req(
    'req_legacy_signup',
    F_LEGACY,
    'POST /api/auth/signup',
    'POST',
    `${B}/api/auth/signup`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          { username: 'newuser', password: 'password', email: 'user@example.com' },
          null,
          2
        )
      ),
      description: 'Adjust body fields to match AuthenticationService contract.',
      sortKey: sort--
    }
  ),
  req(
    'req_legacy_google',
    F_LEGACY,
    'POST /api/auth/google',
    'POST',
    `${B}/api/auth/google`,
    {
      headers: hdrContentJson(),
      body: jsonBody('{}'),
      description: 'Google sign-in token payload (see server handler).',
      sortKey: sort--
    }
  ),
  req(
    'req_legacy_logout',
    F_LEGACY,
    'POST /api/auth/logout',
    'POST',
    `${B}/api/auth/logout`,
    { sortKey: sort-- }
  ),
  req(
    'req_legacy_me',
    F_LEGACY,
    'GET /api/auth/me',
    'GET',
    `${B}/api/auth/me`,
    { description: 'Session validation (send cookies after login).', sortKey: sort-- }
  ),
  req(
    'req_legacy_firebase',
    F_LEGACY,
    'GET /api/config/firebase',
    'GET',
    `${B}/api/config/firebase`,
    { sortKey: sort-- }
  ),
  req(
    'req_legacy_app_config_js',
    F_LEGACY,
    'GET /js/app-config.js',
    'GET',
    `${B}/js/app-config.js`,
    {
      headers: [{ name: 'Accept', value: '*/*', disabled: false }],
      description: 'Returns JavaScript (not JSON): window.APP_CDN_BASE = ...',
      sortKey: sort--
    }
  ),
  req(
    'req_legacy_change_password',
    F_LEGACY,
    'POST /api/users/change-password',
    'POST',
    `${B}/api/users/change-password`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ newPassword: 'new-secure-password' }, null, 2)),
      description: 'Requires authenticated USER or ADMIN session.',
      sortKey: sort--
    }
  ),

  grp(
    F_LEGACY_DECKS,
    WS,
    '03 — Legacy deck read (v1 envelope)',
    'GET deck detail under legacy paths; session cookie required. Response uses v1-style envelope.',
    sort--
  ),
  req(
    'req_legacy_deck_get',
    F_LEGACY_DECKS,
    'GET /api/decks/:id',
    'GET',
    `${B}/api/decks/{{ deck_id }}`,
    { sortKey: sort-- }
  ),
  req(
    'req_legacy_deck_full',
    F_LEGACY_DECKS,
    'GET /api/decks/:id/full',
    'GET',
    `${B}/api/decks/{{ deck_id }}/full`,
    { sortKey: sort-- }
  ),

  grp(
    F_V1_AUTH,
    WS,
    '04 — v1 Auth (Bearer)',
    'Login is unauthenticated. /auth/me requires Bearer JWT (set jwt_access_token after login).',
    sort--
  ),
  req(
    'req_v1_login',
    F_V1_AUTH,
    'POST /api/v1/auth/login',
    'POST',
    `${B}/api/v1/auth/login`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ username: '{{ username }}', password: '{{ password }}' }, null, 2)
      ),
      description: 'Returns accessToken in data; copy to jwt_access_token.',
      sortKey: sort--
    }
  ),
  req(
    'req_v1_me',
    F_V1_AUTH,
    'GET /api/v1/auth/me',
    'GET',
    `${B}/api/v1/auth/me`,
    {
      authentication: authBearer,
      description: 'Bearer JWT only.',
      sortKey: sort--
    }
  ),
  req(
    'req_v1_logout',
    F_V1_AUTH,
    'POST /api/v1/auth/logout',
    'POST',
    `${B}/api/v1/auth/logout`,
    { description: 'No-op token revoke; informational.', sortKey: sort-- }
  ),

  grp(
    F_V1_DBV_CAT,
    WS,
    '05 — v1 DBV catalog',
    'GET card catalog payloads. Auth: Bearer JWT **or** session cookie (catalogAuth).',
    sort--
  ),
  ...[
    ['req_v1_cat_char', 'GET /api/v1/catalog/characters', '/api/v1/catalog/characters'],
    ['req_v1_cat_loc', 'GET /api/v1/catalog/locations', '/api/v1/catalog/locations'],
    ['req_v1_cat_spec', 'GET /api/v1/catalog/special-cards', '/api/v1/catalog/special-cards'],
    ['req_v1_cat_miss', 'GET /api/v1/catalog/missions', '/api/v1/catalog/missions'],
    ['req_v1_cat_evt', 'GET /api/v1/catalog/events', '/api/v1/catalog/events'],
    ['req_v1_cat_asp', 'GET /api/v1/catalog/aspects', '/api/v1/catalog/aspects'],
    ['req_v1_cat_adv', 'GET /api/v1/catalog/advanced-universe', '/api/v1/catalog/advanced-universe'],
    ['req_v1_cat_tw', 'GET /api/v1/catalog/teamwork', '/api/v1/catalog/teamwork'],
    ['req_v1_cat_ally', 'GET /api/v1/catalog/ally-universe', '/api/v1/catalog/ally-universe'],
    ['req_v1_cat_train', 'GET /api/v1/catalog/training', '/api/v1/catalog/training'],
    ['req_v1_cat_basic', 'GET /api/v1/catalog/basic-universe', '/api/v1/catalog/basic-universe'],
    ['req_v1_cat_power', 'GET /api/v1/catalog/power-cards', '/api/v1/catalog/power-cards'],
    ['req_v1_cat_foil', 'GET /api/v1/catalog/foil-card-map', '/api/v1/catalog/foil-card-map']
  ].map(([id, name, p], i) =>
    req(id, F_V1_DBV_CAT, name, 'GET', `${B}${p}`, {
      authentication: authBearer,
      sortKey: sort - i
    })
  ),

  grp(
    F_V1_DBV_SUP,
    WS,
    '06 — v1 DBV support',
    'Mission sets and deck backgrounds. Auth: Bearer **or** session.',
    sort--
  ),
  req(
    'req_v1_dbv_sets',
    F_V1_DBV_SUP,
    'GET /api/v1/dbv/sets',
    'GET',
    `${B}/api/v1/dbv/sets`,
    { authentication: authBearer, sortKey: sort-- }
  ),
  req(
    'req_v1_dbv_bg',
    F_V1_DBV_SUP,
    'GET /api/v1/dbv/deck-backgrounds',
    'GET',
    `${B}/api/v1/dbv/deck-backgrounds`,
    { authentication: authBearer, sortKey: sort-- }
  ),

  grp(
    F_V1_DECKS,
    WS,
    '07 — v1 Decks',
    '**Session cookie** (authenticateUser). Run Legacy or v1 login is NOT enough unless server also sets cookie — use **Legacy POST /api/auth/login** for cookie. GUEST cannot mutate most deck endpoints.',
    sort--
  ),
  req('req_v1_decks_list', F_V1_DECKS, 'GET /api/v1/decks', 'GET', `${B}/api/v1/decks`, { sortKey: sort-- }),
  req('req_v1_decks_stats', F_V1_DECKS, 'GET /api/v1/decks/stats', 'GET', `${B}/api/v1/decks/stats`, {
    sortKey: sort--
  }),
  req(
    'req_v1_decks_validate',
    F_V1_DECKS,
    'POST /api/v1/decks/validate',
    'POST',
    `${B}/api/v1/decks/validate`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ cards: [{ cardType: 'character', cardId: 'example', quantity: 1 }] }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_create',
    F_V1_DECKS,
    'POST /api/v1/decks',
    'POST',
    `${B}/api/v1/decks`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ name: 'New Deck', description: '', characters: [] }, null, 2)
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_cards_get',
    F_V1_DECKS,
    'GET /api/v1/decks/:id/cards',
    'GET',
    `${B}/api/v1/decks/{{ deck_id }}/cards`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_decks_cards_post',
    F_V1_DECKS,
    'POST /api/v1/decks/:id/cards',
    'POST',
    `${B}/api/v1/decks/{{ deck_id }}/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ cardType: 'character', cardId: 'example-id', quantity: 1 }, null, 2)
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_cards_put',
    F_V1_DECKS,
    'PUT /api/v1/decks/:id/cards',
    'PUT',
    `${B}/api/v1/decks/{{ deck_id }}/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          {
            cards: [{ cardType: 'character', cardId: 'example-id', quantity: 1, exclude_from_draw: false }]
          },
          null,
          2
        )
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_cards_del',
    F_V1_DECKS,
    'DELETE /api/v1/decks/:id/cards',
    'DELETE',
    `${B}/api/v1/decks/{{ deck_id }}/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ cardType: 'character', cardId: 'example-id', quantity: 1 }, null, 2)
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_full',
    F_V1_DECKS,
    'GET /api/v1/decks/:id/full',
    'GET',
    `${B}/api/v1/decks/{{ deck_id }}/full`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_decks_get',
    F_V1_DECKS,
    'GET /api/v1/decks/:id',
    'GET',
    `${B}/api/v1/decks/{{ deck_id }}`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_decks_put',
    F_V1_DECKS,
    'PUT /api/v1/decks/:id',
    'PUT',
    `${B}/api/v1/decks/{{ deck_id }}`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          {
            name: 'Updated name',
            description: null,
            is_limited: false,
            is_valid: true,
            reserve_character: null,
            display_mission_card_id: null,
            background_image_path: null
          },
          null,
          2
        )
      ),
      description: 'All fields optional; send only fields to change.',
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_ui_get',
    F_V1_DECKS,
    'GET /api/v1/decks/:id/ui-preferences',
    'GET',
    `${B}/api/v1/decks/{{ deck_id }}/ui-preferences`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_decks_ui_put',
    F_V1_DECKS,
    'PUT /api/v1/decks/:id/ui-preferences',
    'PUT',
    `${B}/api/v1/decks/{{ deck_id }}/ui-preferences`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ cardViewMode: 'list', sortOrder: 'name' }, null, 2)),
      description: 'Opaque JSON per DeckUIPreferencesService.',
      sortKey: sort--
    }
  ),
  req(
    'req_v1_decks_delete',
    F_V1_DECKS,
    'DELETE /api/v1/decks/:id',
    'DELETE',
    `${B}/api/v1/decks/{{ deck_id }}`,
    { sortKey: sort-- }
  ),

  grp(
    F_V1_COLL,
    WS,
    '08 — v1 Collections',
    'Saved views require a USER/ADMIN session or Bearer token. Device snapshot evaluation is public and stateless.',
    sort--
  ),
  req('req_v1_coll_me', F_V1_COLL, 'GET /api/v1/collections/me', 'GET', `${B}/api/v1/collections/me`, {
    sortKey: sort--
  }),
  req('req_v1_coll_view', F_V1_COLL, 'GET /api/v1/collections/me/view', 'GET', `${B}/api/v1/collections/me/view`, {
    description: 'Current owned cards, derived totals and capabilities in one no-store snapshot. USER/ADMIN only.',
    sortKey: sort--
  }),
  req('req_v1_coll_evaluate', F_V1_COLL, 'POST /api/v1/collections/evaluate', 'POST', `${B}/api/v1/collections/evaluate`, {
    description: 'Public stateless device snapshot; no saved-record writes. Identity/role/storage input is rejected.',
    headers: hdrContentJson(), body: jsonBody('{"entries":[]}'), sendCookies: false, sortKey: sort--
  }),
  req(
    'req_v1_coll_cards',
    F_V1_COLL,
    'GET /api/v1/collections/me/cards',
    'GET',
    `${B}/api/v1/collections/me/cards`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_coll_hist',
    F_V1_COLL,
    'GET /api/v1/collections/me/history',
    'GET',
    `${B}/api/v1/collections/me/history`,
    {
      parameters: [{ name: 'limit', value: '50', disabled: false }],
      sortKey: sort--
    }
  ),
  req(
    'req_v1_coll_cards_post',
    F_V1_COLL,
    'POST /api/v1/collections/me/cards',
    'POST',
    `${B}/api/v1/collections/me/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          {
            cardId: 'example',
            cardType: 'character',
            quantity: 1,
            imagePath: '/src/resources/cards/images/characters/example.png'
          },
          null,
          2
        )
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_coll_remove_one',
    F_V1_COLL,
    'POST /api/v1/collections/me/cards/remove-one',
    'POST',
    `${B}/api/v1/collections/me/cards/remove-one`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          {
            cardId: 'example',
            cardType: 'character',
            imagePath: '/src/resources/cards/images/characters/example.png'
          },
          null,
          2
        )
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_coll_put_card',
    F_V1_COLL,
    'PUT /api/v1/collections/me/cards/:cardId',
    'PUT',
    `${B}/api/v1/collections/me/cards/{{ card_id }}`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify(
          {
            quantity: 2,
            cardType: 'character',
            imagePath: '/src/resources/cards/images/characters/example.png',
            oldImagePath: ''
          },
          null,
          2
        )
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_coll_del_card',
    F_V1_COLL,
    'DELETE /api/v1/collections/me/cards/:cardId',
    'DELETE',
    `${B}/api/v1/collections/me/cards/{{ card_id }}`,
    {
      parameters: [{ name: 'cardType', value: 'character', disabled: false }],
      sortKey: sort--
    }
  ),

  grp(
    F_V1_GUEST,
    WS,
    '09 — v1 Guest decks',
    '**GUEST role + sessionId cookie** only. In-memory guest decks.',
    sort--
  ),
  req(
    'req_v1_guest_decks_post',
    F_V1_GUEST,
    'POST /api/v1/guest/decks',
    'POST',
    `${B}/api/v1/guest/decks`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ name: 'Guest Deck', description: '' }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_guest_decks_list',
    F_V1_GUEST,
    'GET /api/v1/guest/decks',
    'GET',
    `${B}/api/v1/guest/decks`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_guest_deck_get',
    F_V1_GUEST,
    'GET /api/v1/guest/decks/:id',
    'GET',
    `${B}/api/v1/guest/decks/{{ deck_id }}`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_guest_deck_put',
    F_V1_GUEST,
    'PUT /api/v1/guest/decks/:id',
    'PUT',
    `${B}/api/v1/guest/decks/{{ deck_id }}`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ name: 'Renamed', description: null }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_guest_cards_put',
    F_V1_GUEST,
    'PUT /api/v1/guest/decks/:id/cards',
    'PUT',
    `${B}/api/v1/guest/decks/{{ deck_id }}/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ cards: [] }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_guest_cards_post',
    F_V1_GUEST,
    'POST /api/v1/guest/decks/:id/cards',
    'POST',
    `${B}/api/v1/guest/decks/{{ deck_id }}/cards`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ cardType: 'character', cardId: 'x', quantity: 1 }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_guest_deck_del',
    F_V1_GUEST,
    'DELETE /api/v1/guest/decks/:id',
    'DELETE',
    `${B}/api/v1/guest/decks/{{ deck_id }}`,
    { sortKey: sort-- }
  ),

  grp(
    F_V1_ADMIN,
    WS,
    '10 — v1 Admin',
    '**ADMIN session** required (cookie after admin legacy login).',
    sort--
  ),
  req(
    'req_v1_admin_users',
    F_V1_ADMIN,
    'GET /api/v1/admin/users',
    'GET',
    `${B}/api/v1/admin/users`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_admin_users_post',
    F_V1_ADMIN,
    'POST /api/v1/admin/users',
    'POST',
    `${B}/api/v1/admin/users`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ username: 'newadmin', password: 'secure-password' }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_v1_admin_clear_cache',
    F_V1_ADMIN,
    'GET /api/v1/admin/debug/clear-cache',
    'GET',
    `${B}/api/v1/admin/debug/clear-cache`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_admin_clear_card',
    F_V1_ADMIN,
    'GET /api/v1/admin/debug/clear-card-cache',
    'GET',
    `${B}/api/v1/admin/debug/clear-card-cache`,
    { sortKey: sort-- }
  ),
  req(
    'req_v1_admin_db_status',
    F_V1_ADMIN,
    'GET /api/v1/admin/database/status',
    'GET',
    `${B}/api/v1/admin/database/status`,
    { sortKey: sort-- }
  ),

  grp(
    F_PHASE2,
    WS,
    '11 — Phase 2 smoke (refresh + audit)',
    [
      'Exercises the refresh-token rotation + reuse-detection flow.',
      '1. Run **POST /api/v1/auth/login** (this folder). Copy `data.accessToken` to `jwt_access_token` and `data.refreshToken` to `jwt_refresh_token`.',
      '2. Run **POST /api/v1/auth/refresh**. Copy the new `accessToken` + `refreshToken` values.',
      '3. Run **POST /api/v1/auth/refresh (reuse old)** — should 401 with `REFRESH_REUSED`.',
      '4. Run **POST /api/v1/auth/logout** — revokes the current refresh token.',
      'See docs/current/API_V1_AUTH_REFRESH.md and docs/current/API_V1_AUDIT_LOG.md.'
    ].join('\n'),
    sort--
  ),
  req(
    'req_phase2_login',
    F_PHASE2,
    '1) POST /api/v1/auth/login',
    'POST',
    `${B}/api/v1/auth/login`,
    {
      headers: hdrContentJson(),
      body: jsonBody(
        JSON.stringify({ username: '{{ username }}', password: '{{ password }}' }, null, 2)
      ),
      sortKey: sort--
    }
  ),
  req(
    'req_phase2_refresh',
    F_PHASE2,
    '2) POST /api/v1/auth/refresh',
    'POST',
    `${B}/api/v1/auth/refresh`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ refreshToken: '{{ jwt_refresh_token }}' }, null, 2)),
      sortKey: sort--
    }
  ),
  req(
    'req_phase2_refresh_reuse',
    F_PHASE2,
    '3) POST /api/v1/auth/refresh (reuse should 401)',
    'POST',
    `${B}/api/v1/auth/refresh`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ refreshToken: '{{ jwt_refresh_token }}' }, null, 2)),
      description: 'Sending the previously-rotated refresh token again revokes the family.',
      sortKey: sort--
    }
  ),
  req(
    'req_phase2_logout',
    F_PHASE2,
    '4) POST /api/v1/auth/logout',
    'POST',
    `${B}/api/v1/auth/logout`,
    {
      headers: hdrContentJson(),
      body: jsonBody(JSON.stringify({ refreshToken: '{{ jwt_refresh_token }}' }, null, 2)),
      sortKey: sort--
    }
  ),

  grp(
    F_PHASE3,
    WS,
    '12 — Phase 3 smoke (cache + compression)',
    [
      'Exercises Phase 3 caching and conditional GET.',
      '1. Run **GET /api/v1/catalog/characters** — copy the response `ETag` header into `catalog_etag` and `meta.catalogDataVersion` into `catalog_data_version`.',
      '2. Run **GET ... (conditional)** — should return **304 Not Modified**.',
      '3. Run **GET ... (since_version)** — demonstrates the `?since_version` query; response includes the current `meta.catalogDataVersion`.',
      'See docs/current/API_V1_CATALOG_CACHING.md. Compression (gzip/br) is auto-negotiated by Insomnia.'
    ].join('\n'),
    sort--
  ),
  req(
    'req_phase3_catalog_first',
    F_PHASE3,
    '1) GET /api/v1/catalog/characters',
    'GET',
    `${B}/api/v1/catalog/characters`,
    {
      headers: [
        ...hdrAcceptJson(),
        { name: 'Accept-Encoding', value: 'br, gzip', disabled: false }
      ],
      authentication: authBearer,
      sortKey: sort--
    }
  ),
  req(
    'req_phase3_catalog_conditional',
    F_PHASE3,
    '2) GET /api/v1/catalog/characters (If-None-Match → 304)',
    'GET',
    `${B}/api/v1/catalog/characters`,
    {
      headers: [
        ...hdrAcceptJson(),
        { name: 'If-None-Match', value: '{{ catalog_etag }}', disabled: false },
        { name: 'Accept-Encoding', value: 'br, gzip', disabled: false }
      ],
      authentication: authBearer,
      sortKey: sort--
    }
  ),
  req(
    'req_phase3_catalog_since',
    F_PHASE3,
    '3) GET /api/v1/catalog/characters?since_version={{ catalog_data_version }}',
    'GET',
    `${B}/api/v1/catalog/characters?since_version={{ catalog_data_version }}`,
    {
      headers: [
        ...hdrAcceptJson(),
        { name: 'Accept-Encoding', value: 'br, gzip', disabled: false }
      ],
      authentication: authBearer,
      sortKey: sort--
    }
  )
];

const exportDoc = {
  _type: 'export',
  __export_format: 4,
  __export_date: new Date().toISOString(),
  __export_source: 'excelsior-deckbuilder:scripts/generate-excelsior-insomnia-export.mjs',
  resources
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(exportDoc, null, 2), 'utf8');
console.log('Wrote', outPath, `(${resources.length} resources)`);
