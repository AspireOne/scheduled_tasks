import type { FunctionTool } from "openai/resources/responses/responses.js";

export function buildGoogleCalendarFunctionTools(): FunctionTool[] {
  return [
    {
      type: "function",
      name: "list_calendar_events",
      description:
        "List events on a Google Calendar within a required time range. Use this before creating an event if you need to check for duplicates.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          calendarId: {
            type: ["string", "null"],
            description: "Optional Google Calendar ID. Defaults to the primary calendar.",
          },
          startTime: {
            type: "string",
            description: "Required ISO 8601 start timestamp for the time window.",
          },
          endTime: {
            type: "string",
            description: "Required ISO 8601 end timestamp for the time window.",
          },
          query: {
            type: ["string", "null"],
            description: "Optional free-text search query applied within the time window.",
          },
          maxResults: {
            type: ["integer", "null"],
            description: "Optional maximum number of events to return. Defaults to 20.",
          },
        },
        required: ["calendarId", "startTime", "endTime", "query", "maxResults"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "get_calendar_event",
      description: "Get a specific Google Calendar event by ID.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          calendarId: {
            type: ["string", "null"],
            description: "Optional Google Calendar ID. Defaults to the primary calendar.",
          },
          eventId: {
            type: "string",
            description: "Required Google Calendar event ID.",
          },
        },
        required: ["calendarId", "eventId"],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "create_calendar_event",
      description: "Create a Google Calendar event.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          calendarId: {
            type: ["string", "null"],
            description: "Optional Google Calendar ID. Defaults to the primary calendar.",
          },
          summary: {
            type: "string",
            description: "Required event title.",
          },
          startTime: {
            type: "string",
            description:
              "Required ISO 8601 start timestamp. For all-day events, provide an ISO date like 2026-05-10.",
          },
          endTime: {
            type: "string",
            description:
              "Required ISO 8601 end timestamp. For all-day events, provide an ISO date like 2026-05-11.",
          },
          timeZone: {
            type: ["string", "null"],
            description: "Optional IANA timezone name, for example Europe/Prague.",
          },
          description: {
            type: ["string", "null"],
            description: "Optional event description.",
          },
          location: {
            type: ["string", "null"],
            description: "Optional event location.",
          },
          attendeeEmails: {
            type: ["array", "null"],
            items: { type: "string" },
            description: "Optional attendee email addresses.",
          },
          allDay: {
            type: ["boolean", "null"],
            description: "Optional. Set true only for all-day events using date-only values.",
          },
        },
        required: [
          "calendarId",
          "summary",
          "startTime",
          "endTime",
          "timeZone",
          "description",
          "location",
          "attendeeEmails",
          "allDay",
        ],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "update_calendar_event",
      description: "Update a Google Calendar event. This applies a partial update.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          calendarId: {
            type: ["string", "null"],
            description: "Optional Google Calendar ID. Defaults to the primary calendar.",
          },
          eventId: {
            type: "string",
            description: "Required Google Calendar event ID.",
          },
          summary: {
            type: ["string", "null"],
            description: "Optional new event title.",
          },
          startTime: {
            type: ["string", "null"],
            description:
              "Optional ISO 8601 start timestamp. If provided, endTime must also be provided.",
          },
          endTime: {
            type: ["string", "null"],
            description:
              "Optional ISO 8601 end timestamp. If provided, startTime must also be provided.",
          },
          timeZone: {
            type: ["string", "null"],
            description: "Optional IANA timezone name for updated event times.",
          },
          description: {
            type: ["string", "null"],
            description: "Optional new event description.",
          },
          location: {
            type: ["string", "null"],
            description: "Optional new event location.",
          },
          attendeeEmails: {
            type: ["array", "null"],
            items: { type: "string" },
            description:
              "Optional replacement attendee list. Use an empty array to clear attendees.",
          },
          allDay: {
            type: ["boolean", "null"],
            description: "Optional. Set true only when updating to an all-day event.",
          },
        },
        required: [
          "calendarId",
          "eventId",
          "summary",
          "startTime",
          "endTime",
          "timeZone",
          "description",
          "location",
          "attendeeEmails",
          "allDay",
        ],
        additionalProperties: false,
      },
    },
    {
      type: "function",
      name: "delete_calendar_event",
      description: "Delete a Google Calendar event by ID.",
      strict: true,
      parameters: {
        type: "object",
        properties: {
          calendarId: {
            type: ["string", "null"],
            description: "Optional Google Calendar ID. Defaults to the primary calendar.",
          },
          eventId: {
            type: "string",
            description: "Required Google Calendar event ID.",
          },
        },
        required: ["calendarId", "eventId"],
        additionalProperties: false,
      },
    },
  ];
}
