# Overlap — Free Time Zone Meeting Planner & World Clock

Find a time across cities without changing your laptop's time zone.

Scheduling with someone in another time zone should not mean changing your computer's clock or calculating dates in your head. Overlap is a free time zone meeting planner: compare cities and working hours, see your calendar events, and share availability in the other person's local time. No account needed.

Official app: https://overlaps-time.vercel.app/

## What you can do

- Compare world clocks for Seoul, San Francisco, New York, London, and other cities. Dates and daylight saving offsets follow the selected day.
- View a weekly calendar in any selected city's time zone without changing your device's system time zone.
- Configure working days and hours for each city, including overnight shifts.
- Connect read-only Google Calendar iCal feeds and public iCloud feeds, or import .ics files.
- Click to save 30 minutes of availability or drag for a longer range. Adjoining ranges are combined.
- Copy saved dates and time ranges in the time zone chosen under Saved times.

## How to use Overlap

1. Add the cities you are coordinating with. The first home clock uses your browser's time zone; it does not request precise location.
2. Select a city's name to display the calendar in its local time. Review work hours and optionally connect a calendar to see existing events.
3. Click or drag to save availability. Under Saved times, choose the recipient's time zone and select Copy times.

## Share availability across time zones

### Schedule an interview in the recruiter's time zone

Add your city and the recruiter's city, then choose the interview week. Check your existing calendar and save a few available time ranges. Under Saved times, choose the recruiter's city before copying. Your message will contain dates and times in their local time, while your laptop stays on your own time zone. Include the city or time zone in your message so there is no ambiguity.

### Find overlapping working hours for a remote team

Add each team location and set its working days and hours. Compare those hours on the date you want to meet, then check connected calendars for conflicts. If there is no shared workday window, discuss an earlier or later slot with the team. Overlap helps you compare the options visually; it does not automatically choose a time or check everyone's calendars.

## Find a meeting time between Seoul and San Francisco

Start by checking the date as well as the hour. A late-afternoon meeting in San Francisco can be the following morning in Seoul, so the two people may need to reserve different calendar dates.

| San Francisco | Seoul |
| --- | --- |
| Oct 8, 2026, 4:00 PM PDT | Oct 9, 2026, 8:00 AM KST |
| Dec 8, 2026, 4:00 PM PST | Dec 9, 2026, 9:00 AM KST |

These examples show why a fixed time difference is not enough: San Francisco's seasonal clock change affects the conversion. In Overlap, add both cities, navigate to your meeting date, and select a city's name to view the calendar in its local time. Save a suitable range, then copy it in the recipient's time zone.

The same approach works for other city pairs, including London and New York. For recurring meetings, check dates on both sides of a daylight saving change before assuming the local hour will stay the same. Use a city and the actual meeting date rather than a fixed UTC offset; Overlap uses named time zones to convert each date.

Copy times gives you text to paste into a message, not a meeting invitation. After everyone agrees on a slot, create the invitation in your calendar and check the date and time zone there.

## Calendars and updates

Google Calendar connections use a secret or public iCal feed URL. iCloud connections use a public calendar link. Overlap does not use Google OAuth or sign in to Apple. It does not create, edit, or delete events in the original calendar, and it does not book meetings.

Connected Google and iCloud feeds can refresh automatically every five minutes while the app is open and visible. Stale calendars refresh when you return or reconnect to the internet. My calendars includes Update now, a per-calendar Update action, and a switch to turn automatic updates off. Failed updates keep the last successful calendar.

An imported .ics file is a snapshot. To replace it, choose Update beside the calendar name and select a fresh export.

Imports keep the current month and future events. Files and feeds up to 50 MB can be read, then older history is removed before applying a 2 MB retained-calendar limit. Recurring series keep rules and exceptions needed for future events.

## Storage and privacy

No account is required. Cities, settings, imported calendars, connected feed URLs, and saved availability stay in this browser's storage. There is no cross-device sync. Clearing site data removes the local information.

File imports are read and parsed locally. For a connected feed, the link is sent to Overlap's server to retrieve events. The server does not store calendar contents. Secret links grant calendar access and should be kept private; public iCloud feeds can be accessed by anyone with their link.

## Availability

Overlap is free to use in a modern browser. The interactive planner requires JavaScript. The public product guide can be read without JavaScript.

## Creator and source

Designed and built by [Sue Kim](https://www.eunsukim.com/).

- [Project story](https://www.eunsukim.com/projects/overlap)
- [Source code and usage documentation](https://github.com/sue-kim/overlaps)

## Optional analytics

When Google Analytics is configured, it loads only after the visitor opts in. It measures page visits and general actions such as saving or copying availability. The app's analytics events omit calendar contents, feed links, selected dates and times, copied text, and entered values. Page URLs omit query strings and fragments, and referrers include only their origin. Google can also process standard browser, device, and network information. Visitors can decline or change their choice using Analytics preferences; the planner works either way.
