# Overlap

A world clock and availability planner for finding a time across cities. Compare time zones, see local working hours, and share your availability for interviews, meetings, or conversations.

**[Open Overlap](https://overlaps-time.vercel.app)** — no account required.

## Get started

1. **Add your cities.** Overlap uses your browser’s time zone to set your first **Home** clock. Choose **Add city** to add the places you want to coordinate with. Home represents your time zone; it does not use precise location tracking.
2. **Choose a calendar time zone.** Click a city’s name to view the calendar in its local time. Use the house icon to make a city Home. Events and saved availability keep the same actual time when you switch cities, including across daylight saving changes.
3. **Save your availability.** Click an empty calendar time to save 30 minutes, or drag within a day to save a longer range in half-hour steps. Times save immediately. Ranges that touch or overlap merge automatically.
4. **Review your times.** Select a saved block to see its details and the corresponding times in other cities in **Find a time**. The **Saved times** list shows all your saved availability.
5. **Copy and share.** Choose a **Time zone** under **Saved times**, then select **Copy times**. It copies all saved availability in that one time zone, grouped by date with time ranges. This choice is independent of the calendar’s viewing time zone.

Use the week navigation to plan ahead and **Today** to return to the current week. You can switch between 12-hour and 24-hour time.

### Edit saved availability

- Remove a range with **×** in the saved list or on its calendar block. The calendar’s remove button appears on hover or keyboard focus.
- Use **Clear all** to remove saved availability and the current selection. **Undo** restores them. Connected calendars and city settings are kept.
- Clicking outside the calendar and time panel clears the active selection without deleting saved times.

### Compare work hours

In the **Work hours** row, use each city’s eye control to show or hide its highlight. Home’s highlight starts hidden.

Open **Settings** at the right of that row to choose each city’s working days, start and end times, and color. Hours default to Monday–Friday, 9:00 AM–6:00 PM. An end time earlier than the start time creates an overnight shift. Save your changes to show the updated highlights.

The translucent bands let you see where work hours overlap. They are visual guides; they do not indicate whether someone has a calendar event or is free to meet.

## Add a calendar

Choose **Connect calendar** in the header. After importing, use **My calendars** to manage your sources. Calendar events are read-only: Overlap does not create, edit, or delete events in Apple or Google Calendar.

### Import an `.ics` file

Choose **Import a file**, then drop an `.ics` file into the dialog or select **Choose calendar file**. The dialog closes after a successful import.

- **Apple Calendar on Mac:** select a calendar, then choose **File → Export → Export**.
- **Google Calendar on a computer:** open **Settings → Import & export → Export**. Unzip the download and import an individual `.ics` file.

Files are parsed in your browser and are not uploaded. Imports are snapshots: to update one, choose **Update** beside its name in **My calendars** and select a fresh `.ics` export. The existing calendar is replaced without duplicating its events. Imports keep the current month and future events, using your selected city’s time zone. Files up to 50 MB can be read; earlier history is removed before the remaining calendar is checked against the 2 MB storage limit. Recurring series keep the rules and exceptions needed for future occurrences.

To try this without using your own calendar, download the [sample calendar](examples/overlap-sample.ics) using GitHub’s **Download raw file** button. It contains fictional events in the week of September 28, 2026; navigate to that week after importing it.

### Connect a Google Calendar feed

Choose **Google Calendar** in the dialog. In Google Calendar’s settings, select your calendar, open **Integrate calendar**, and copy its **Secret address in iCal format**. Paste that link into Overlap. Public Google iCal links also work when the calendar is publicly shared. Feed imports keep the current month and future events; earlier history is removed before applying the 2 MB limit.

Connected calendars update automatically every five minutes while Overlap is open and visible. Stale calendars also update when you return to the app or reconnect to the internet. Use **Update now** to update all connected feeds, or **Update** beside one calendar. You can turn automatic updates off in **My calendars**. Failed updates keep the last successful events and offer a retry; each successful update moves the import start to the beginning of the current month. There is no Google sign-in. If your account does not offer a secret link, use a file import instead.

### Connect an iCloud feed

Choose **iCloud link** and paste a public `webcal://` link. You can get one by enabling **Public Calendar** in your iCloud calendar’s sharing options. Automatic updates and **Update now** work the same way as Google feeds. Each successful update keeps the current month and future events.

Anyone with a public calendar link can access it. If you do not want to make your calendar public, use a file import instead. Overlap does not request your Apple password.

## Your data and privacy

- **Saved in this browser:** cities, preferences, availability, imported calendar contents, and connected feed links. There is no account or cross-device sync. Clearing the site’s browser data removes this information.
- **File imports stay local:** `.ics` files are read and processed entirely in your browser.
- **Feed imports use a server:** Google and iCloud links are sent to Overlap’s server to fetch calendar contents. The public app uses a Vercel-hosted endpoint. The app does not persist calendar contents or links on the server or write them to its application logs.
- **Links can grant calendar access:** keep Google secret links private. Removing a source in Overlap deletes its local copy and stored link; it does not revoke access at the provider. Reset a Google secret link or disable iCloud public sharing through the provider when needed.

Other visitors to the public app do not receive your saved data. Each browser and site address has separate storage, so the local development app and the published app do not share your calendars or availability.

Optional Google Analytics is loaded only after a visitor opts in, and only when a valid GA4 Measurement ID is configured for the production hostname. Visitors can change their choice in **Analytics preferences**. Fonts are bundled locally. On a shared device, remember that your saved information remains in that browser until you remove it or clear the site’s data.

## Run locally

Requires Node.js 22, version 22.12 or later in that release line.

```sh
git clone https://github.com/sue-kim/overlaps.git
cd overlaps
npm install
npm run dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). No environment variables, database, or calendar API credentials are required. The local Express server serves the app and its read-only calendar feed endpoint.

For a local production build:

```sh
npm run build
npm start
```

Use `PORT=3000 npm run dev` to choose another port. The local server listens on loopback only.

### Development checks

```sh
npm test
npm run build
```

Built with React, TypeScript, Vite, Luxon, ical.js, and Express.

### Deploy your own copy

The repository includes Vercel configuration for the frontend and calendar feed endpoint. From the project directory, run:

```sh
npx vercel@latest --prod
```

Follow the prompts to create or link a project in your Vercel account. Vercel builds the frontend into `dist` and runs `api/calendar.js` as a server function. No environment variables or database are required.

## Search and AI discovery

The homepage includes a product guide in its initial HTML, shown in a modal through the existing “How Overlap works” footer link. Direct guide links also open the modal. The Markdown guide at `/index.md` remains readable without JavaScript.

- `index.html` contains the canonical URL, search and sharing metadata, guide dialog, and WebApplication structured data.
- `public/robots.txt` allows public pages and assets to be crawled while excluding `/api/`. Calendar API responses also send `X-Robots-Tag: noindex, nofollow`.
- `public/sitemap.xml` lists the public homepage only.
- `public/llms.txt` and `public/index.md` provide a concise product summary and text guide for tools that support them. These are supplemental discovery aids, not a guarantee of inclusion in AI answers.
- `public/og-image.png` is the social sharing preview. To regenerate it, run `node scripts/render-social-preview.mjs` with Playwright Chromium installed, or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` to a local Chrome executable.

Keep the visible guide and Markdown guide aligned when features change. For a different deployment domain, replace `https://overlaps-time.vercel.app` in the metadata, discovery files, `vercel.json`, and local server canonical header before deploying.

The former URL-prefix property `https://overlaps-zeta.vercel.app/` was verified in Google Search Console on October 8, 2026 using the HTML meta tag in `index.html`. Keep that tag in place to retain verification; it works independently of analytics consent. The sitemap was submitted. At setup, Search Console reported “Couldn't fetch” despite successful public HTTP 200/XML checks, and rejected the homepage indexing request with “Quota Exceeded.” Retry the indexing request after the daily quota resets and check the sitemap report again; submission does not mean the page is indexed.

The Markdown guide includes interview and remote-team workflows, date-specific Seoul/San Francisco conversions, and daylight saving guidance. Keep the dated examples explicit instead of presenting one permanent city-to-city offset. Bing Webmaster Tools is not configured by this setup. Search rankings and AI citations depend on each service's crawl and indexing decisions. There are no fabricated ratings, testimonials, or usage claims in the structured data.

## Google Analytics

Set `VITE_GA_MEASUREMENT_ID` to the GA4 web stream Measurement ID (`G-...`) in the production deployment environment, then rebuild and deploy. `VITE_ANALYTICS_HOST` defaults to `overlaps-time.vercel.app`; set it to your production hostname when hosting elsewhere. Preview deployments and local development do not collect analytics by default. Without a valid Measurement ID, analytics and its consent controls stay disabled.

Visitors can allow or decline optional analytics. No Google tag is requested before consent. The choice is saved in browser storage; withdrawing consent clears the host-only `_ga` cookies and reloads to unload the Google script. Advertising storage, advertising personalization, and Google signals are disabled.

The app sends one page view per page load after consent and four generic action events: `city_added`, `availability_saved`, `availability_copied`, and `calendar_connected`. No custom event accepts data values. Page URLs omit query strings and fragments; referrers include their origin only. Calendar names, titles, feed links, dates, times, file contents, copied text, and input values are not included in the app's analytics events. Google can still process standard browser/device/network data.

In the GA4 web stream, turn **Enhanced measurement off** to keep collection limited to the app's explicit page and action events; those property-side settings cannot be controlled by the Measurement ID. Do not enable user-provided data collection. After activating, verify a consented visit in GA4 Realtime or Tag Assistant. The Measurement ID is a public client-side identifier, not an API secret.
