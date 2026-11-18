# cubie

Official SDK for CubieID OAuth integrations.

## Installation

```bash
npm install cubie
```

Requirements: Node.js 18 or newer with native `fetch` support.

## Configuration

```ts
import { CubieClient } from 'cubie';

const cubie = new CubieClient({
  publicKey: process.env.CUBIE_PUBLIC_KEY!,
  secretKey: process.env.CUBIE_SECRET_KEY!,
});
```

`publicKey` and `secretKey` are server credentials. Never expose `secretKey` in browser code. The API base URL is fixed to `https://cubie.com.br`.

## Authorization flow

```ts
const request = await cubie.createAuthorizationRequest({
  redirectUri: 'https://app.example.com/oauth/callback',
  state: 'optional-value-returned-in-the-callback',
});

// redirectUri must exactly match a redirect_urls entry registered for the app
res.redirect(request.url);
```

Server parameters:

- `public_key`: required
- `secret_key`: required
- `redirect_uri`: required and must exactly match a registered application URL
- `state`: optional, limited by the server to 512 characters

Authorization requests expire after 300 seconds. The SDK does not send a `scope` parameter; application permission groups are defined in the application registration.

## Callback handling

```ts
const callback = cubie.parseAuthorizationCallback(req.url);

if (callback.error === 'access_denied') {
  // The user denied authorization
}

if (callback.success === 'false' && callback.isVerified === 'false') {
  // The account email is not verified
}

if (callback.code) {
  const token = await cubie.exchangeCode({
    code: callback.code,
    redirectUri: 'https://app.example.com/oauth/callback',
  });
}
```

The authorization URL can redirect with:

- `code` and `state` after authorization
- `success=false&error=access_denied&state=...` after denial
- `success=false&isVerified=false&state=...` when the account email is not verified

Authorization codes contain 64 hexadecimal characters, are single-use, and expire after 60 seconds.

## Exchange a code for an access token

```ts
const token = await cubie.exchangeCode({
  code: callback.code!,
  redirectUri: 'https://app.example.com/oauth/callback',
});

console.log(token.access_token);
console.log(token.token_type); // Bearer
console.log(token.expires_in);
console.log(token.scope);
```

Example response:

```json
{
  "success": true,
  "access_token": "<64 hexadecimal characters>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "scope": ["luna.profile", "luna.status"]
}
```

## Retrieve user information

```ts
const result = await cubie.getUserInfo(token.access_token);
console.log(result.user);
```

The SDK sends the access token in `Authorization: Bearer <access_token>` and the credentials in the JSON body.

Possible fields:

| Field | Source |
|---|---|
| `luna.id` | Always returned |
| `luna.isBanned` | Always returned |
| `luna.username` | `luna.profile` |
| `luna.avatar` | `luna.profile` |
| `luna.created_at` | `luna.profile` |
| `luna.email` | `luna.contact` |
| `luna.country` | `luna.location` |
| `luna.state` | `luna.location` |
| `luna.city` | `luna.location` |
| `luna.isSuspended` | `luna.status` |

When location access is granted, country, state, and city are returned as `null` if not provided by the account.

Example:

```json
{
  "success": true,
  "user": {
    "luna.id": "...",
    "luna.isBanned": false,
    "luna.username": "user",
    "luna.avatar": null,
    "luna.created_at": "2026-01-01T00:00:00.000Z",
    "luna.isSuspended": false
  }
}
```

## Errors

Non-successful HTTP responses are converted to `CubieOAuthError` subclasses:

```ts
import { CubieOAuthError, InvalidGrantError } from 'cubie';

try {
  await cubie.exchangeCode({ code, redirectUri });
} catch (error) {
  if (error instanceof InvalidGrantError) {
    // Invalid, expired, or already-used code
  } else if (error instanceof CubieOAuthError) {
    console.log(error.status, error.code, error.payload);
  }
}
```

Available classes:

- `InvalidClientError`: `401 invalid_client`
- `InvalidRedirectUriError`: `400 invalid_redirect_uri`
- `InvalidGrantError`: `400 invalid_grant`
- `InvalidTokenError`: `401 invalid_token`
- `UserNotFoundError`: `404 user_not_found`
- `AccountInactiveError`: `403 account_inactive`
- `AccessRevokedError`: `403 access_revoked`
- `NotVerifiedError`: unverified account, returned with `isVerified: false`
- `RateLimitedError`: `429 rate_limited`
- `InternalError`: `500 internal_error`

## Implemented endpoints

| Operation | Method | Route |
|---|---|---|
| Create authorization request | `POST` | `/oauth/api/create-request` |
| Exchange code | `POST` | `/oauth/api/token` |
| Retrieve user information | `POST` | `/oauth/api/userinfo` |

The following features do not exist in the current plugin and are not added by the SDK:

- Access token refresh
- Server-to-server revocation
- User lookup by ID
- Client-provided scopes

Authorization is revoked by the user through `/account/oauth/:appId` in the account interface. The server immediately invalidates all access tokens associated with the user/application pair.

## Security

- Never expose `secretKey` in browser code.
- Use a `redirect_uri` registered in the application configuration.
- Validate the returned `state` against the value initiated in your session.
- Tokens and codes are opaque 64-character hexadecimal secrets.
- Access tokens are isolated by application and become invalid immediately after revocation.
