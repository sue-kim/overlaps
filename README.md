# Overlap

A personal world clock and interview availability planner for coordinating across Korea, San Francisco, New York, and other cities.

Live app: [overlaps-zeta.vercel.app](https://overlaps-zeta.vercel.app)

## Run locally

Requires Node.js 22.12+.

```sh
npm install
npm run dev
```

Open http://127.0.0.1:5173. The Express server hosts Vite in development and supplies the read-only iCloud and Google Calendar feed endpoint. To run a production build locally:

```sh
npm run build
npm start
```

Use `PORT=3000 npm run dev` to choose another port. The local server binds to loopback.

## Publish on Vercel

The Vite frontend is served from `dist`; `api/calendar.js` runs the shared read-only calendar endpoint as a Vercel Function. Node.js 22 is selected in `package.json`. No environment variables or database are required.

```sh
npx vercel@latest link --project overlaps
npx vercel@latest --prod
```

The published app is public, with no sign-in. Each visitor's calendars, saved times, and settings stay in that visitor's browser storage; deployment does not transfer data from the local app. The local and published URLs have separate storage, so import calendars again on the published site. Calendar files are parsed entirely in the browser. Calendar feed links pass through the Vercel-hosted endpoint to fetch events, without app-side persistence or logging of their contents.

## Plan an interview

1. Add cities with **Add city**. Seoul, San Francisco, and New York are preselected.
2. Make a city **Home** or click its name to change the calendar’s time zone. Events keep their actual instant.
3. Click a calendar slot to save 30 minutes immediately, or drag up or down within a day to preview a range in half-hour steps and save it when you release. The calendar scrolls when you drag near its edges, and **Find a time** shows the selected range. Every new click saves 30 minutes, even after viewing or dragging a longer range. Arrow keys preview times; Enter or Space saves 30 minutes at the focused time.
4. Saved ranges that touch or overlap merge into one block. Newly saved times stay selected with their details in **Find a time**; click an existing block to view its details without saving a duplicate. **Saved times** in the right panel lists every range included in **Copy times**, shown in the chosen city's time zone, with a remove button for each range. The calendar **×** appears on hover or keyboard focus. **Clear all** removes saved availability and the current selection, with **Undo** to restore them.
5. Choose a **Time zone** under **Saved times** to display and copy availability in just that city's time zone, independently of the calendar view. Your choice is remembered. **Copy times** prepares a formal message grouped by day. Adjoining or overlapping slots become one range, while separate ranges on the same day share a line. UTC offsets are omitted. With nothing saved, **Copy time** copies the selected time in the calendar's current city.
6. Use the house icon on a city to make it the home city, which sets the calendar’s display zone and defines relative day/time differences.

Daylight saving is calculated for the selected date. Missing spring-forward times are rejected, and repeated fall-back times expose an explicit offset choice. In **Work hours**, click a city’s eye control to show or hide its colored band. Home starts hidden. **Settings** at the right of this row lets you choose each city’s color, working days, and local start/end times; **Save changes** applies your edits and shows the edited cities, including Home. Earlier end times extend into the next day. Defaults are 09:00–18:00, Monday–Friday. Bands follow local dates and daylight saving, and your colors, hours, and visibility choices are saved in this browser. Each continuous band has one city label that stays visible as you scroll within it; controls remain above the calendar. The underlying muted cells indicate outside the configured working hours in the calendar’s viewing city; these highlights do not represent imported busy events.

## Calendars

No calendar is connected by default, and no real events are fabricated.

### Private file import

In Apple Calendar on a Mac, select a calendar and use **File → Export → Export** to create an `.ics` file. Open **Connect calendar → Import a file**. The file is parsed in the browser and stored locally; it is not uploaded. Floating event times use the calendar's stated timezone, or the city selected when importing. Imports are snapshots; remove the old import and import a fresh export to update it.

### Read-only iCloud public links

Open **Connect calendar → iCloud link** and paste a public `webcal://` link. The app server fetches it from an allowlisted iCloud host and sends the calendar to the browser. Public calendars are accessible to anyone with their link. Use a private file import when that is unsuitable. The app does not log in to Apple, request a password, or modify your Apple calendar. Refresh a connected source from the calendar dialog to fetch updates.

### Google Calendar

Open **Connect calendar → Google Calendar**. On a computer, go to Google Calendar **Settings → your calendar → Integrate calendar** and paste its **Secret address in iCal format**. A public iCal feed link also works. This imports a read-only snapshot; use Refresh beside the calendar to fetch changes. There is no Google OAuth login or calendar write-back.

Secret links grant access to their calendars. They are hidden in the input, stored in this browser, and sent to the app server to fetch from Google. On Vercel, this server runs on Vercel's infrastructure. The app does not write links or calendar contents to server logs or files. Remove a connected calendar to delete its stored source and link; reset its secret address in Google Calendar if it was exposed.

Alternatively, export from Google Calendar on a computer using **Settings → Import & export → Export**, unzip the download, and import an individual `.ics` file under **Import a file**. A Workspace administrator may restrict exports or secret links. See [Google’s read-only connection guide](https://support.google.com/calendar/answer/37648?hl=en) and [export guide](https://support.google.com/calendar/answer/37111?hl=en).

The feed fetch path has URL allowlisting, no redirect following, same-origin checks, a timeout, a 2 MB size limit, and no server-side calendar persistence. The source URL and imported calendar content are stored in this browser. Removing a source removes its saved local data. A real iCloud feed requires a link supplied by the user and has not been end-to-end verified against their account.

ICS parsing supports timezones, all-day events, recurrence exclusions, and overridden occurrences. Extremely large recurrence sets produce a visible error rather than silently dropping events. Calendar events are read-only. Overlapping events fill the day column and layer over one another; hover or keyboard-focus an event to bring it forward, and click for its full details. Arrow keys move between calendar times, and a keyboard shortcut link skips directly to the time controls.

Apple references: [Sharing calendars](https://support.apple.com/en-ca/guide/icloud/mm6b1a9479/1.0/icloud/1.0), [Importing and exporting](https://support.apple.com/en-gb/guide/calendar/-icl1023/mac).

## Storage and checks

Cities, time format, saved slots, calendar sources, and preferred display city are saved in browser local storage. There is no account, analytics, or external font request. Storage errors are surfaced; clearing browser data removes saved information.

```sh
npm test
npm run build
```

Critical tests cover Korea/US day changes, seasonal offsets, missing/repeated DST times, fractional timezones, copy/export correctness, ICS recurrence, embedded timezone definitions, and iCloud and Google feed URL restrictions.
