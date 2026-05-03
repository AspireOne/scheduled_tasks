import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  getGoogleCalendarEvent,
  listGoogleCalendarEvents,
  updateGoogleCalendarEvent,
} from "./client";

type CalendarFunctionHandler = (rawArguments: string) => Promise<string>;

type CreateCalendarEventArgs = {
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

type DeleteCalendarEventArgs = {
  calendarId?: string;
  eventId: string;
};

type GetCalendarEventArgs = {
  calendarId?: string;
  eventId: string;
};

type ListCalendarEventsArgs = {
  calendarId?: string;
  endTime: string;
  maxResults?: number;
  query?: string;
  startTime: string;
};

type UpdateCalendarEventArgs = {
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

export function createGoogleCalendarFunctionHandlers(): Record<string, CalendarFunctionHandler> {
  return {
    create_calendar_event: async (rawArguments) => {
      const args = parseCreateCalendarEventArgs(rawArguments);
      const event = await createGoogleCalendarEvent(args);
      return JSON.stringify({ event, ok: true });
    },
    delete_calendar_event: async (rawArguments) => {
      const args = parseDeleteCalendarEventArgs(rawArguments);
      const result = await deleteGoogleCalendarEvent(args);
      return JSON.stringify(result);
    },
    get_calendar_event: async (rawArguments) => {
      const args = parseGetCalendarEventArgs(rawArguments);
      const event = await getGoogleCalendarEvent(args);
      return JSON.stringify({ event, ok: true });
    },
    list_calendar_events: async (rawArguments) => {
      const args = parseListCalendarEventsArgs(rawArguments);
      const events = await listGoogleCalendarEvents(args);
      return JSON.stringify({
        calendarId: args.calendarId ?? "primary",
        events,
        ok: true,
      });
    },
    update_calendar_event: async (rawArguments) => {
      const args = parseUpdateCalendarEventArgs(rawArguments);
      const event = await updateGoogleCalendarEvent(args);
      return JSON.stringify({ event, ok: true });
    },
  };
}

function parseCreateCalendarEventArgs(rawArguments: string): CreateCalendarEventArgs {
  const value = parseObject(rawArguments);
  const allDay = getOptionalBoolean(value, "allDay");
  const attendeeEmails = getOptionalStringArray(value, "attendeeEmails");
  const calendarId = getOptionalString(value, "calendarId");
  const description = getOptionalNullableString(value, "description");
  const location = getOptionalNullableString(value, "location");
  const timeZone = getOptionalString(value, "timeZone");

  return {
    ...(allDay !== undefined ? { allDay } : {}),
    ...(attendeeEmails !== undefined ? { attendeeEmails } : {}),
    ...(calendarId !== undefined ? { calendarId } : {}),
    ...(description !== undefined && description !== null ? { description } : {}),
    ...(location !== undefined && location !== null ? { location } : {}),
    ...(timeZone !== undefined ? { timeZone } : {}),
    endTime: getRequiredString(value, "endTime"),
    startTime: getRequiredString(value, "startTime"),
    summary: getRequiredString(value, "summary"),
  };
}

function parseDeleteCalendarEventArgs(rawArguments: string): DeleteCalendarEventArgs {
  const value = parseObject(rawArguments);
  const calendarId = getOptionalString(value, "calendarId");

  return {
    ...(calendarId !== undefined ? { calendarId } : {}),
    eventId: getRequiredString(value, "eventId"),
  };
}

function parseGetCalendarEventArgs(rawArguments: string): GetCalendarEventArgs {
  const value = parseObject(rawArguments);
  const calendarId = getOptionalString(value, "calendarId");

  return {
    ...(calendarId !== undefined ? { calendarId } : {}),
    eventId: getRequiredString(value, "eventId"),
  };
}

function parseListCalendarEventsArgs(rawArguments: string): ListCalendarEventsArgs {
  const value = parseObject(rawArguments);
  const calendarId = getOptionalString(value, "calendarId");
  const maxResults = getOptionalPositiveInteger(value, "maxResults");
  const query = getOptionalString(value, "query");

  return {
    ...(calendarId !== undefined ? { calendarId } : {}),
    ...(maxResults !== undefined ? { maxResults } : {}),
    ...(query !== undefined ? { query } : {}),
    endTime: getRequiredString(value, "endTime"),
    startTime: getRequiredString(value, "startTime"),
  };
}

function parseUpdateCalendarEventArgs(rawArguments: string): UpdateCalendarEventArgs {
  const value = parseObject(rawArguments);
  const allDay = getOptionalBoolean(value, "allDay");
  const attendeeEmails = getOptionalStringArray(value, "attendeeEmails");
  const calendarId = getOptionalString(value, "calendarId");
  const description = getOptionalNullableString(value, "description");
  const startTime = getOptionalString(value, "startTime");
  const endTime = getOptionalString(value, "endTime");
  const location = getOptionalNullableString(value, "location");
  const summary = getOptionalString(value, "summary");
  const timeZone = getOptionalString(value, "timeZone");

  if ((startTime && !endTime) || (!startTime && endTime)) {
    throw new Error("startTime and endTime must be provided together when updating event times");
  }

  if ((allDay !== undefined || timeZone !== undefined) && (!startTime || !endTime)) {
    throw new Error(
      "allDay and timeZone can only be updated together with both startTime and endTime",
    );
  }

  const args: UpdateCalendarEventArgs = {
    ...(allDay !== undefined ? { allDay } : {}),
    ...(attendeeEmails !== undefined ? { attendeeEmails } : {}),
    ...(calendarId !== undefined ? { calendarId } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(endTime !== undefined ? { endTime } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(startTime !== undefined ? { startTime } : {}),
    ...(summary !== undefined ? { summary } : {}),
    ...(timeZone !== undefined ? { timeZone } : {}),
    eventId: getRequiredString(value, "eventId"),
  };

  if (
    args.summary === undefined &&
    args.description === undefined &&
    args.location === undefined &&
    args.startTime === undefined &&
    args.endTime === undefined &&
    args.attendeeEmails === undefined &&
    args.allDay === undefined &&
    args.timeZone === undefined
  ) {
    throw new Error("update_calendar_event requires at least one field to update");
  }

  return args;
}

function getOptionalBoolean(value: Record<string, unknown>, key: string): boolean | undefined {
  const candidate = value[key];

  if (candidate === undefined || candidate === null) {
    return undefined;
  }

  if (typeof candidate !== "boolean") {
    throw new Error(`Expected "${key}" to be a boolean`);
  }

  return candidate;
}

function getOptionalPositiveInteger(
  value: Record<string, unknown>,
  key: string,
): number | undefined {
  const candidate = value[key];

  if (candidate === undefined || candidate === null) {
    return undefined;
  }

  if (typeof candidate !== "number" || !Number.isInteger(candidate) || candidate <= 0) {
    throw new Error(`Expected "${key}" to be a positive integer`);
  }

  return candidate;
}

function getOptionalString(value: Record<string, unknown>, key: string): string | undefined {
  const candidate = value[key];

  if (candidate === undefined || candidate === null) {
    return undefined;
  }

  if (typeof candidate !== "string") {
    throw new Error(`Expected "${key}" to be a string`);
  }

  return candidate;
}

function getOptionalNullableString(
  value: Record<string, unknown>,
  key: string,
): string | null | undefined {
  const candidate = value[key];

  if (candidate === undefined) {
    return undefined;
  }

  if (candidate === null) {
    return null;
  }

  if (typeof candidate !== "string") {
    throw new Error(`Expected "${key}" to be a string or null`);
  }

  return candidate;
}

function getOptionalStringArray(value: Record<string, unknown>, key: string): string[] | undefined {
  const candidate = value[key];

  if (candidate === undefined || candidate === null) {
    return undefined;
  }

  if (!Array.isArray(candidate) || !candidate.every((item) => typeof item === "string")) {
    throw new Error(`Expected "${key}" to be an array of strings`);
  }

  return candidate;
}

function getRequiredString(value: Record<string, unknown>, key: string): string {
  const candidate = value[key];

  if (typeof candidate !== "string" || candidate.length === 0) {
    throw new Error(`Expected "${key}" to be a non-empty string`);
  }

  return candidate;
}

function parseObject(rawArguments: string): Record<string, unknown> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawArguments);
  } catch {
    throw new Error("Tool arguments are not valid JSON");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Tool arguments must be a JSON object");
  }

  return parsed as Record<string, unknown>;
}
