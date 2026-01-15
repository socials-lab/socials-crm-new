# Events

Source: https://developers.google.com/workspace/calendar/api/v3/reference/events/insert

## Create Event

HTTP request:

`POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events`

### Path Parameters

- `calendarId`: calendar identifier. Use `primary` for the user's primary calendar.

### Common Query Parameters

- `conferenceDataVersion` – set to `1` to create conference data.
- `sendUpdates` – controls attendee notifications (preferred over deprecated `sendNotifications`).

## Notes

The request body is an `Event` resource (includes summary, start/end, attendees, etc.).
