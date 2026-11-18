type CubieScope = 'luna.profile' | 'luna.contact' | 'luna.location' | 'luna.status';
interface CreateAuthorizationRequestOptions {
    redirectUri: string;
    state?: string;
}
interface CreateAuthorizationRequestResponse {
    success: true;
    url: string;
    expires_in: 300;
}
interface ExchangeCodeOptions {
    code: string;
    redirectUri: string;
}
interface TokenResponse {
    success: true;
    access_token: string;
    token_type: 'Bearer';
    expires_in: number;
    scope: CubieScope[];
}
interface CubieUser {
    'luna.id': string;
    'luna.isBanned': boolean;
    'luna.username'?: string;
    'luna.avatar'?: string | null;
    'luna.email'?: string;
    'luna.isSuspended'?: boolean;
    'luna.created_at'?: string;
    'luna.country'?: string | null;
    'luna.state'?: string | null;
    'luna.city'?: string | null;
}
interface UserInfoResponse {
    success: true;
    user: CubieUser;
}
interface AuthorizationCallback {
    code?: string;
    state?: string;
    success?: 'true' | 'false';
    error?: 'access_denied';
    isVerified?: 'true' | 'false';
}

declare const CUBIE_BASE_URL = "https://cubie.com.br";
interface CubieClientOptions {
    publicKey: string;
    secretKey: string;
    fetch?: typeof fetch;
}
declare class CubieClient {
    readonly publicKey: string;
    readonly secretKey: string;
    private readonly fetchImpl;
    constructor(options: CubieClientOptions);
    private post;
    createAuthorizationRequest(options: CreateAuthorizationRequestOptions): Promise<CreateAuthorizationRequestResponse>;
    exchangeCode(options: ExchangeCodeOptions): Promise<TokenResponse>;
    getUserInfo(accessToken: string): Promise<UserInfoResponse>;
    parseAuthorizationCallback(urlOrSearch: string | URL): AuthorizationCallback;
}

interface CubieApiErrorPayload {
    success?: false;
    error?: string;
    message?: string;
    isVerified?: boolean;
}
declare class CubieOAuthError extends Error {
    readonly status: number;
    readonly code: string;
    readonly payload: CubieApiErrorPayload;
    constructor(status: number, code: string, message: string, payload?: CubieApiErrorPayload);
}
declare class InvalidClientError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class InvalidRedirectUriError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class InvalidGrantError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class InvalidTokenError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class UserNotFoundError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class AccountInactiveError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class AccessRevokedError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class NotVerifiedError extends CubieOAuthError {
    readonly isVerified = false;
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class RateLimitedError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}
declare class InternalError extends CubieOAuthError {
    constructor(status: number, payload: CubieApiErrorPayload);
}

export { AccessRevokedError, AccountInactiveError, type AuthorizationCallback, CUBIE_BASE_URL, type CreateAuthorizationRequestOptions, type CreateAuthorizationRequestResponse, type CubieApiErrorPayload, CubieClient, type CubieClientOptions, CubieOAuthError, type CubieScope, type CubieUser, type ExchangeCodeOptions, InternalError, InvalidClientError, InvalidGrantError, InvalidRedirectUriError, InvalidTokenError, NotVerifiedError, RateLimitedError, type TokenResponse, type UserInfoResponse, UserNotFoundError };
