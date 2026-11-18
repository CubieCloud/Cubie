"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AccessRevokedError: () => AccessRevokedError,
  AccountInactiveError: () => AccountInactiveError,
  CUBIE_BASE_URL: () => CUBIE_BASE_URL,
  CubieClient: () => CubieClient,
  CubieOAuthError: () => CubieOAuthError,
  InternalError: () => InternalError,
  InvalidClientError: () => InvalidClientError,
  InvalidGrantError: () => InvalidGrantError,
  InvalidRedirectUriError: () => InvalidRedirectUriError,
  InvalidTokenError: () => InvalidTokenError,
  NotVerifiedError: () => NotVerifiedError,
  RateLimitedError: () => RateLimitedError,
  UserNotFoundError: () => UserNotFoundError
});
module.exports = __toCommonJS(index_exports);

// src/errors/CubieOAuthError.ts
var CubieOAuthError = class extends Error {
  status;
  code;
  payload;
  constructor(status, code, message, payload = {}) {
    super(message);
    this.name = "CubieOAuthError";
    this.status = status;
    this.code = code;
    this.payload = payload;
  }
};
var InvalidClientError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "invalid_client", "Invalid public or secret credentials.", payload);
  }
};
var InvalidRedirectUriError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "invalid_redirect_uri", "redirect_uri is not registered for this application.", payload);
  }
};
var InvalidGrantError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "invalid_grant", "The authorization code is invalid, expired, or already used.", payload);
  }
};
var InvalidTokenError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "invalid_token", "The access token is invalid, expired, or belongs to another application.", payload);
  }
};
var UserNotFoundError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "user_not_found", "User not found.", payload);
  }
};
var AccountInactiveError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "account_inactive", "The account is inactive or in recovery.", payload);
  }
};
var AccessRevokedError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "access_revoked", "Authorization revoked.", payload);
  }
};
var NotVerifiedError = class extends CubieOAuthError {
  isVerified = false;
  constructor(status, payload) {
    super(status, "not_verified", "The account email is not verified.", payload);
  }
};
var RateLimitedError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "rate_limited", payload.message || "Too many requests. Please wait and try again.", payload);
  }
};
var InternalError = class extends CubieOAuthError {
  constructor(status, payload) {
    super(status, "internal_error", "OAuth server internal error.", payload);
  }
};

// src/http.ts
async function readResponse(response) {
  let payload = {};
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { success: false, message: text };
    }
  }
  if (response.ok) {
    return payload;
  }
  if (payload.isVerified === false) {
    throw new NotVerifiedError(response.status, payload);
  }
  const code = typeof payload.error === "string" ? payload.error : "unknown_error";
  const message = typeof payload.message === "string" ? payload.message : code;
  switch (code) {
    case "invalid_client":
      throw new InvalidClientError(response.status, payload);
    case "invalid_redirect_uri":
      throw new InvalidRedirectUriError(response.status, payload);
    case "invalid_grant":
      throw new InvalidGrantError(response.status, payload);
    case "invalid_token":
      throw new InvalidTokenError(response.status, payload);
    case "user_not_found":
      throw new UserNotFoundError(response.status, payload);
    case "account_inactive":
      throw new AccountInactiveError(response.status, payload);
    case "access_revoked":
      throw new AccessRevokedError(response.status, payload);
    case "rate_limited":
      throw new RateLimitedError(response.status, payload);
    case "internal_error":
      throw new InternalError(response.status, payload);
    default:
      throw new CubieOAuthError(response.status, code, message, payload);
  }
}

// src/client.ts
var CUBIE_BASE_URL = "https://cubie.com.br";
var CubieClient = class {
  publicKey;
  secretKey;
  fetchImpl;
  constructor(options) {
    if (!options.publicKey?.trim()) throw new TypeError("publicKey is required");
    if (!options.secretKey?.trim()) throw new TypeError("secretKey is required");
    this.publicKey = options.publicKey;
    this.secretKey = options.secretKey;
    this.fetchImpl = options.fetch || globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error("Native fetch is unavailable. Use Node.js 18 or provide options.fetch.");
    }
  }
  async post(path, body, headers = {}) {
    const response = await this.fetchImpl(`${CUBIE_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers
      },
      body: JSON.stringify(body)
    });
    return readResponse(response);
  }
  async createAuthorizationRequest(options) {
    if (!options.redirectUri?.trim()) throw new TypeError("redirectUri is required");
    const body = {
      public_key: this.publicKey,
      secret_key: this.secretKey,
      redirect_uri: options.redirectUri
    };
    if (options.state !== void 0) body.state = options.state;
    return this.post("/oauth/api/create-request", body);
  }
  async exchangeCode(options) {
    if (!/^[a-f0-9]{64}$/.test(options.code || "")) throw new TypeError("code must contain 64 hexadecimal characters");
    if (!options.redirectUri?.trim()) throw new TypeError("redirectUri is required");
    return this.post("/oauth/api/token", {
      public_key: this.publicKey,
      secret_key: this.secretKey,
      code: options.code,
      redirect_uri: options.redirectUri
    });
  }
  async getUserInfo(accessToken) {
    if (!/^[a-f0-9]{64}$/i.test(accessToken || "")) throw new TypeError("accessToken must contain 64 hexadecimal characters");
    return this.post("/oauth/api/userinfo", {
      public_key: this.publicKey,
      secret_key: this.secretKey
    }, {
      Authorization: `Bearer ${accessToken}`
    });
  }
  parseAuthorizationCallback(urlOrSearch) {
    const url = typeof urlOrSearch === "string" ? new URL(urlOrSearch.startsWith("http") ? urlOrSearch : `https://callback.local${urlOrSearch.startsWith("?") ? "" : "?"}${urlOrSearch}`) : urlOrSearch;
    const get = (key) => {
      const value = url.searchParams.get(key);
      return value === null ? void 0 : value;
    };
    const result = {};
    const code = get("code");
    const state = get("state");
    const success = get("success");
    const error = get("error");
    const isVerified = get("isVerified");
    if (code !== void 0) result.code = code;
    if (state !== void 0) result.state = state;
    if (success === "true" || success === "false") result.success = success;
    if (error === "access_denied") result.error = error;
    if (isVerified === "true" || isVerified === "false") result.isVerified = isVerified;
    return result;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AccessRevokedError,
  AccountInactiveError,
  CUBIE_BASE_URL,
  CubieClient,
  CubieOAuthError,
  InternalError,
  InvalidClientError,
  InvalidGrantError,
  InvalidRedirectUriError,
  InvalidTokenError,
  NotVerifiedError,
  RateLimitedError,
  UserNotFoundError
});
//# sourceMappingURL=index.cjs.map