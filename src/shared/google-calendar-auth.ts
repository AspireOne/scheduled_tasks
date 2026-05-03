import { getEnv } from "@/shared/env";
import { logger } from "@/shared/logger";

const log = logger.withContext("google-calendar-auth");

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REFRESH_SKEW_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_REFRESH_ATTEMPTS = 2;

type CachedAccessToken = {
  accessToken: string;
  expiresAt: number;
};

type GoogleTokenResponse = {
  access_token?: unknown;
  expires_in?: unknown;
  error?: unknown;
  error_description?: unknown;
};

let cachedAccessToken: CachedAccessToken | null = null;
let inFlightRefresh: Promise<string> | null = null;

export async function getGoogleCalendarAccessToken(): Promise<string> {
  if (hasUsableCachedToken()) {
    return cachedAccessToken!.accessToken;
  }

  if (!inFlightRefresh) {
    inFlightRefresh = refreshGoogleCalendarAccessToken().finally(() => {
      inFlightRefresh = null;
    });
  }

  return inFlightRefresh;
}

function hasUsableCachedToken(): boolean {
  if (!cachedAccessToken) {
    return false;
  }

  return cachedAccessToken.expiresAt - REFRESH_SKEW_MS > Date.now();
}

async function refreshGoogleCalendarAccessToken(): Promise<string> {
  const env = getEnv();

  for (let attempt = 1; attempt <= MAX_REFRESH_ATTEMPTS; attempt += 1) {
    try {
      const accessToken = await requestGoogleCalendarAccessToken({
        clientId: env.GOOGLE_CALENDAR_CLIENT_ID,
        clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET,
        refreshToken: env.GOOGLE_CALENDAR_REFRESH_TOKEN,
      });

      return accessToken;
    } catch (error) {
      const isFinalAttempt = attempt === MAX_REFRESH_ATTEMPTS;

      if (isFinalAttempt || !isRetryableGoogleAuthError(error)) {
        throw error;
      }

      log.warn(`Google token refresh attempt ${attempt} failed, retrying once`, error);
    }
  }

  throw new Error("Google token refresh failed unexpectedly");
}

async function requestGoogleCalendarAccessToken(props: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<string> {
  const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: props.clientId,
      client_secret: props.clientSecret,
      refresh_token: props.refreshToken,
      grant_type: "refresh_token",
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const payload = (await response.json()) as GoogleTokenResponse;

  if (!response.ok) {
    const errorCode = typeof payload.error === "string" ? payload.error : "unknown_error";
    const errorDescription =
      typeof payload.error_description === "string"
        ? payload.error_description
        : "No error description returned by Google";

    throw new GoogleAuthError(
      `Google token refresh failed: ${errorCode} (${response.status}) ${errorDescription}`,
      {
        code: errorCode,
        status: response.status,
        retryable: response.status >= 500,
      },
    );
  }

  if (typeof payload.access_token !== "string" || typeof payload.expires_in !== "number") {
    throw new Error("Google token refresh response is missing access_token or expires_in");
  }

  cachedAccessToken = {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
  };

  return cachedAccessToken.accessToken;
}

function isRetryableGoogleAuthError(error: unknown): boolean {
  if (error instanceof GoogleAuthError) {
    return error.retryable;
  }

  return error instanceof Error;
}

class GoogleAuthError extends Error {
  readonly code: string;
  readonly retryable: boolean;
  readonly status: number;

  constructor(message: string, props: { code: string; retryable: boolean; status: number }) {
    super(message);
    this.name = "GoogleAuthError";
    this.code = props.code;
    this.retryable = props.retryable;
    this.status = props.status;
  }
}
