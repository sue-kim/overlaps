# Overlap

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
A job seeker currently staying in Korea, coordinating interviews with San Francisco, New York, and other cities.

## Product Purpose
See the same moment in multiple cities, switch a calendar's display timezone, and turn selected times into clear interview availability.

## Stack
Implementation assumption pending optional user preference: React, TypeScript, Vite, and a small local Express server for read-only iCloud and Google Calendar iCal feeds.

## Capabilities and Constraints
Single-screen desktop planner with responsive mobile layout, multiple city clocks, date-aware timezone conversion, weekly calendar, locally saved availability, ICS export/import, and read-only public iCloud links and Google Calendar public/secret iCal links. No private Apple account authentication, Google OAuth, or calendar write-back. No calendar is connected by default. Settings and imported events stay in this browser; public feed URLs are sent to the local server only when connecting or refreshing.

## Product Principles
- Make dates and day changes as visible as clock times.
- Preserve actual instants when changing the calendar's displayed city.
- Use named timezones so daylight saving changes follow the selected date.
- Clearly distinguish availability from imported calendar events.

## Brand Commitments
User requested a cyan base palette. Use pale cyan surfaces and deep teal for primary actions and text accents.
