import { logger } from "@/shared/logger";
import { getGoogleCalendarAccessToken } from "./auth";

const log = logger.withContext("calendar-client");

const GOOGLE_CALENDAR_API_BASE_URL = "https://www.googleapis.com/calendar/v3";
const REQUEST_TIMEOUT_MS = 15_000;
const DEFAULT_CALENDAR_ID = "primary";
const DEFAULT_SEND_UPDATES = "none";

type CalendarDateTime = {
  date?: string;
  dateTime?: string;
  timeZone?: string;
};

type CalendarApiEvent = {
  id?: unknown;
  status?: unknown;
  summary?: unknown;
  description?: unknown;
  location?: unknown;
  htmlLink?: unknown;
  start?: CalendarDateTime | null;
  end?: CalendarDateTime | null;
  attendees?: { email?: unknown }[] | null;
  organizer?: { email?: unknown } | null;
};

type GoogleCalendarApiErrorPayload = {
  error?: {
    code?: unknown;
    message?: unknown;
    errors?: { reason?: unknown }[];
  };
};

type GoogleCalendarEventTimeInput = {
  allDay: boolean | undefined;
  timeZone: string | undefined;
  value: string;
};

type GoogleCalendarEvent = {
  attendeeEmails: string[];
  calendarId: string;
  description: string | null;
  end: CalendarDateTime | null;
  htmlLink: string | null;
  id: string | null;
  location: string | null;
  organizerEmail: string | null;
  start: CalendarDateTime | null;
  status: string | null;
  summary: string | null;
};

type ListGoogleCalendarEventsArgs = {
  calendarId?: string;
  endTime: string;
  maxResults?: number;
  query?: string;
  startTime: string;
};

type GetGoogleCalendarEventArgs = {
  calendarId?: string;
  eventId: string;
};

type CreateGoogleCalendarEventArgs = {
  allDay?: boolean;
  attendeeEmails?: string[];
  calendarId?: string;
  description?: string;
  endTime: string;
  location?: string;
  startTime: string;
  summary: string;
  timeZone?: string;
};

type UpdateGoogleCalendarEventArgs = {
  allDay?: boolean;
  attendeeEmails?: string[];
  calendarId?: string;
  description?: string | null;
  endTime?: string;
  eventId: string;
  location?: string | null;
  startTime?: string;
  summary?: string;
  timeZone?: string;
};

type DeleteGoogleCalendarEventArgs = {
  calendarId?: string;
  eventId: string;
};

export async function listGoogleCalendarEvents(
  args: ListGoogleCalendarEventsArgs,
): Promise<GoogleCalendarEvent[]> {
  const calendarId = normalizeCalendarId(args.calendarId);
  const query = new URLSearchParams({
    maxResults: String(args.maxResults ?? 20),
    orderBy: "startTime",
    singleEvents: "true",
    timeMax: args.endTime,
    timeMin: args.startTime,
  });

  if (args.query) {
    query.set("q", args.query);
  }

  const payload = await requestGoogleCalendarApi<{ items?: CalendarApiEvent[] | null }>({
    path: `/calendars/${encodeURIComponent(calendarId)}/events`,
    query,
  });

  return (payload.items ?? []).map((event) => normalizeGoogleCalendarEvent(event, calendarId));
}

export async function getGoogleCalendarEvent(
  args: GetGoogleCalendarEventArgs,
): Promise<GoogleCalendarEvent> {
  const calendarId = normalizeCalendarId(args.calendarId);
  const payload = await requestGoogleCalendarApi<CalendarApiEvent>({
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
  });

  return normalizeGoogleCalendarEvent(payload, calendarId);
}

export async function createGoogleCalendarEvent(
  args: CreateGoogleCalendarEventArgs,
): Promise<GoogleCalendarEvent> {
  const calendarId = normalizeCalendarId(args.calendarId);
  const payload = await requestGoogleCalendarApi<CalendarApiEvent>({
    method: "POST",
    path: `/calendars/${encodeURIComponent(calendarId)}/events`,
    query: new URLSearchParams({
      sendUpdates: DEFAULT_SEND_UPDATES,
    }),
    body: {
      ...(args.attendeeEmails
        ? { attendees: args.attendeeEmails.map((email) => ({ email })) }
        : {}),
      ...(args.description !== undefined ? { description: args.description } : {}),
      ...(args.location !== undefined ? { location: args.location } : {}),
      end: buildGoogleCalendarEventTime({
        allDay: args.allDay,
        timeZone: args.timeZone,
        value: args.endTime,
      }),
      start: buildGoogleCalendarEventTime({
        allDay: args.allDay,
        timeZone: args.timeZone,
        value: args.startTime,
      }),
      summary: args.summary,
    },
  });

  return normalizeGoogleCalendarEvent(payload, calendarId);
}

export async function updateGoogleCalendarEvent(
  args: UpdateGoogleCalendarEventArgs,
): Promise<GoogleCalendarEvent> {
  const calendarId = normalizeCalendarId(args.calendarId);
  const payload = await requestGoogleCalendarApi<CalendarApiEvent>({
    method: "PATCH",
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
    query: new URLSearchParams({
      sendUpdates: DEFAULT_SEND_UPDATES,
    }),
    body: {
      ...(args.attendeeEmails
        ? { attendees: args.attendeeEmails.map((email) => ({ email })) }
        : {}),
      ...(args.attendeeEmails?.length === 0 ? { attendees: [] } : {}),
      ...(args.description !== undefined
        ? { description: normalizeNullableTextPatch(args.description) }
        : {}),
      ...(args.location !== undefined
        ? { location: normalizeNullableTextPatch(args.location) }
        : {}),
      ...(args.summary !== undefined ? { summary: args.summary } : {}),
      ...(args.startTime && args.endTime
        ? {
            end: buildGoogleCalendarEventTime({
              allDay: args.allDay,
              timeZone: args.timeZone,
              value: args.endTime,
            }),
            start: buildGoogleCalendarEventTime({
              allDay: args.allDay,
              timeZone: args.timeZone,
              value: args.startTime,
            }),
          }
        : {}),
    },
  });

  return normalizeGoogleCalendarEvent(payload, calendarId);
}

export async function deleteGoogleCalendarEvent(
  args: DeleteGoogleCalendarEventArgs,
): Promise<{ calendarId: string; eventId: string; ok: true }> {
  const calendarId = normalizeCalendarId(args.calendarId);

  await requestGoogleCalendarApi({
    method: "DELETE",
    path: `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(args.eventId)}`,
    query: new URLSearchParams({
      sendUpdates: DEFAULT_SEND_UPDATES,
    }),
  });

  return {
    calendarId,
    eventId: args.eventId,
    ok: true,
  };
}

class GoogleCalendarApiError extends Error {
  readonly reason: string | null;
  readonly status: number;

  constructor(message: string, props: { reason: string | null; status: number }) {
    super(message);
    this.name = "GoogleCalendarApiError";
    this.reason = props.reason;
    this.status = props.status;
  }
}

function buildGoogleCalendarEventTime(args: GoogleCalendarEventTimeInput): CalendarDateTime {
  if (args.allDay) {
    return {
      date: args.value,
      ...(args.timeZone ? { timeZone: args.timeZone } : {}),
    };
  }

  return {
    dateTime: args.value,
    ...(args.timeZone ? { timeZone: args.timeZone } : {}),
  };
}

async function requestGoogleCalendarApi<T>(args: {
  body?: Record<string, unknown>;
  method?: "DELETE" | "GET" | "PATCH" | "POST";
  path: string;
  query?: URLSearchParams;
}): Promise<T> {
  const accessToken = await getGoogleCalendarAccessToken();
  const url = new URL(`${GOOGLE_CALENDAR_API_BASE_URL}${args.path}`);

  if (args.query) {
    url.search = args.query.toString();
  }

  const response = await fetch(url, {
    method: args.method ?? "GET",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      ...(args.body ? { "content-type": "application/json" } : {}),
    },
    ...(args.body ? { body: JSON.stringify(args.body) } : {}),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await response.text();
  const payload = parseJsonResponse(text);

  if (!response.ok) {
    const error = buildGoogleCalendarApiError(response.status, payload);
    log.error("Google Calendar API request failed", {
      message: error.message,
      path: args.path,
      reason: error.reason,
      status: error.status,
    });
    throw error;
  }

  return payload as T;
}

function buildGoogleCalendarApiError(status: number, payload: unknown): GoogleCalendarApiError {
  const parsed = payload as GoogleCalendarApiErrorPayload | null;
  const reason =
    Array.isArray(parsed?.error?.errors) && typeof parsed.error.errors[0]?.reason === "string"
      ? parsed.error.errors[0].reason
      : null;
  const message =
    typeof parsed?.error?.message === "string"
      ? parsed.error.message
      : "Google Calendar API request failed";

  return new GoogleCalendarApiError(`${message} (status ${status})`, {
    reason,
    status,
  });
}

function normalizeNullableTextPatch(value: string | null): string {
  return value ?? "";
}

function normalizeCalendarId(calendarId?: string): string {
  return calendarId ?? DEFAULT_CALENDAR_ID;
}

function normalizeGoogleCalendarEvent(
  event: CalendarApiEvent,
  calendarId: string,
): GoogleCalendarEvent {
  return {
    attendeeEmails: (event.attendees ?? [])
      .map((attendee) => (typeof attendee.email === "string" ? attendee.email : null))
      .filter((email): email is string => email !== null),
    calendarId,
    description: typeof event.description === "string" ? event.description : null,
    end: isCalendarDateTime(event.end) ? event.end : null,
    htmlLink: typeof event.htmlLink === "string" ? event.htmlLink : null,
    id: typeof event.id === "string" ? event.id : null,
    location: typeof event.location === "string" ? event.location : null,
    organizerEmail: typeof event.organizer?.email === "string" ? event.organizer.email : null,
    start: isCalendarDateTime(event.start) ? event.start : null,
    status: typeof event.status === "string" ? event.status : null,
    summary: typeof event.summary === "string" ? event.summary : null,
  };
}

function isCalendarDateTime(value: unknown): value is CalendarDateTime {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as CalendarDateTime;
  return (
    typeof candidate.date === "string" ||
    typeof candidate.dateTime === "string" ||
    typeof candidate.timeZone === "string"
  );
}

function parseJsonResponse(text: string): unknown {
  if (text.length === 0) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
