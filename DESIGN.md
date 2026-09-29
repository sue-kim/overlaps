---
name: Overlap
description: A quiet calendar desk for comparing the same moment across cities.
colors:
  teal: "#0e7185"
  teal-hover: "#0b5b6c"
  ink: "#243f47"
  secondary-text: "#506b74"
  paper: "#f2f8fa"
  surface: "#ffffff"
  rule: "#dce7eb"
  active-city: "#e5f4f8"
  selection: "#d2eef4e8"
  availability: "#d9eff3"
  availability-ink: "#326775"
  imported: "#e9e6f4"
  imported-ink: "#696087"
  current-time: "#c3855f"
  focus: "#168398"
typography:
  clock:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "38px"
    fontWeight: 450
    lineHeight: 1.15
    letterSpacing: "-1.6px"
  headline:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "25px"
    fontWeight: 550
    lineHeight: 1.3
    letterSpacing: "-0.8px"
  title:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "16px"
    fontWeight: 550
    letterSpacing: "-0.3px"
  body:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "14px"
    fontWeight: 400
  button:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "12px"
    fontWeight: 550
  label:
    fontFamily: "'DM Sans Variable', 'DM Sans', sans-serif"
    fontSize: "10px"
    fontWeight: 400
rounded:
  event: "4px"
  icon-control: "5px"
  field: "6px"
  control: "7px"
  panel: "11px"
  dialog: "16px"
spacing:
  compact-gap: "6px"
  control-gap: "9px"
  group-gap: "14px"
  section-gap: "20px"
  desktop-gutter: "40px"
components:
  button-primary:
    backgroundColor: "{colors.teal}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  button-primary-hover:
    backgroundColor: "{colors.teal-hover}"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "11px 14px"
  button-icon:
    textColor: "{colors.secondary-text}"
    rounded: "{rounded.icon-control}"
    size: "28px"
    padding: "0"
  time-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "6px 8px"
  city-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.panel}"
    padding: "15px 19px 0"
  city-card-active:
    backgroundColor: "{colors.active-city}"
  home-badge:
    backgroundColor: "#d3e4e8"
    textColor: "#446167"
    rounded: "{rounded.event}"
    padding: "3px 5px"
  calendar-tab:
    textColor: "{colors.secondary-text}"
    padding: "10px 1px 12px"
  selected-time:
    backgroundColor: "{colors.selection}"
    textColor: "#285866"
    rounded: "{rounded.event}"
    padding: "5px 7px"
---

# Design System: Overlap

## Overview

**Creative North Star: "The Quiet Calendar Desk"**

Overlap uses soft paper, teal accents, restrained typography, and fine rules to make a dense time planner feel orderly. This name describes the implemented visual system; it is not a record of a separate user approval.

The system gives the largest type to clock times and uses compact supporting labels for dates, offsets, and calendar structure. Circular analog clocks provide a recognizable timekeeping motif. This document captures `src/styles.css` and the rendered component structure; source values take precedence over earlier direction notes.

**Key Characteristics:**

- Paper background and white working surfaces.
- Teal actions, pale cyan selection, and lavender imported events.
- One locally bundled variable sans family and aligned clock numerals.
- Fine rules, gently curved controls, and circular clock faces.

## Colors

The palette is muted and cool, with color carrying selection and event origin.

### Primary

Teal identifies the primary action. Its darker hover state provides immediate feedback. Active City marks the calendar's display city; Selection marks the chosen time; Availability marks saved slots.

### Secondary

Imported and Imported Ink distinguish calendar events from saved availability. Current Time is the warm line that marks the present moment. These roles remain distinct from the selected-time state.

### Neutral

Paper surrounds white working surfaces. Ink carries primary text; Secondary Text carries most supporting labels. Rule separates regions without adding heavy outlines. The unused root `--muted` value is not the supporting-text standard.

**The Event Origin Rule.** Keep imported events lavender and saved availability cyan, with visible text and a calendar legend explaining their meanings.

The sidecar's tonal ramps are generated swatch previews. They are not additional shipped colors or a new application color scale.

## Typography

**Display Font:** DM Sans Variable, with DM Sans and sans-serif fallbacks.  
**Body Font:** The same locally bundled family. No separate mono family is used.

The variable weights create a restrained hierarchy without switching typefaces. Clock values and comparison times use tabular numerals. Normal supporting copy generally sits at 11–12px; the root body size is a baseline rather than a claim that every text block is 14px.

### Hierarchy

- **Clock:** Largest numeric role; 33px in compact desktop conditions, 36px on mobile, and 43px on wide screens.
- **Headline:** Main page title; becomes 23px below 1000px or on desktops at most 950px tall, and 22px below 760px.
- **Title:** Time panel heading. Calendar headings use 12–14px; dialog headings use 20–21px.
- **Body:** Root baseline, with component-specific compact copy.
- **Label:** Calendar metadata and legends. Its current density is documented, not an accessibility certification or a general minimum for future screens.

**The Aligned Time Rule.** Use tabular numerals for clock and comparison values so changing digits do not move the layout.

## Layout

Desktop uses a viewport-height shell, a horizontally scrollable city strip, and a flexible calendar beside a 290px comparison panel. The main container caps at 1800px. Wide screens use a 315px panel; narrower desktop layouts use 267–270px. Main gutters reduce from 40px to 24px and then 16px.

The weekly grid has seven equal day columns and a 64px, 100px, or 140px timezone rail, depending on whether one, two, or three cities appear. Hours are 48px tall, with half-hour cells. Sticky day headings remain above the scrolling grid. The calendar preserves its internal width instead of compressing every day label.

At 1000px and below, the shell becomes page-height and the calendar is 570px tall. At 760px and below, the comparison panel moves above the 550px calendar; the city strip and calendar scroll horizontally within their regions. The mobile grid has a 670px minimum inner width. Desktop comparison lists size to their content with a 200px maximum before internal scrolling; mobile allows 280px. Desktop hides the redundant panel description. At desktop heights of 950px or less, actions share one row and panel spacing tightens to keep the controls visible.

## Elevation & Depth

Surface tone and one-pixel borders carry most structure. Calendar panels and city cards are flat. Small shadows support clock faces, event blocks, and the active time-format segment; stronger diffuse shadows separate dialogs and toast feedback.

### Shadow Vocabulary

- **Clock:** `0 2px 5px #2d3e4208`.
- **Selected time:** `0 2px 5px #4260660b`.
- **Calendar event:** `0 2px 4px #213b400a`.
- **Active format:** `0 1px 3px #26313312`.
- **Toast:** `0 6px 24px #1a303427`.
- **Dialog:** `0 18px 80px #1f343823`, with a tinted, blurred backdrop.

## Shapes

Rounded rectangular controls sit inside larger rounded panels. Event blocks and badges use the smallest corners; dialogs use the broadest. Circular analog faces, current-day markers, and tiny status dots repeat the clock motif. Calendar cells remain square to preserve alignment. Borders are predominantly one pixel; dashed borders identify add-city and upload affordances.

## Components

### Buttons

Compact and restrained. Primary buttons use Teal with white text; secondary buttons use white with a fine border; icon controls use a transparent resting surface. Default buttons have a 39px minimum height, while compact panel actions use 35px on desktop and 39px on mobile. Hover changes tone and border; keyboard focus is a two-pixel Focus outline with a three-pixel offset. Disabled buttons use half opacity. Color feedback lasts 160ms with `ease`.

### Chips

The Home badge has a pale cyan fill, small house icon, and compact label. Day-change chips show the date relationship beside each city's date. These are descriptive markers, not filters.

### Cards / Containers

City cards use white surfaces and fine borders; the active city gains a pale cyan fill and stronger green border. Actions appear on hover or keyboard focus on desktop and remain visible at 1000px and below. The calendar and comparison panel share the panel corner shape. Comparison-panel padding is 17px on taller desktops, 14px on desktops at most 950px tall, and 18px on mobile. Comparison rows use 8px vertical padding on taller desktops and 7px on the shorter desktop layout.

### Inputs / Fields

Date and time inputs use white fill, fine green-gray borders, and compact corners. Mobile fields grow to 39px high with 13px text. Shared focus outlines remain visible; search uses a containing focus ring. Error messages add explicit text on a warm pale surface. The time scrubber uses the teal family and a horizontal adjustment cursor.

### Navigation

Week navigation combines previous/next icon buttons with a bordered Today control. Calendar-connection tabs use a fine bottom rule and an active green underline. The 12h/24h segmented control gives its active value a white inset surface. Navigation is compact; it does not introduce a separate visual language. Keyboard focus reveals a skip link above the calendar so users can reach the time controls directly.

### Synchronized Clocks and Calendar

Circular analog clocks accompany large numeric times, explicit dates, and day-change labels. A selected calendar block shares its moment with all city clocks and comparison rows. Imported and saved event blocks have separate tones and sit below the selected block. The current-time line is a thin warm rule with a dot. A warm note explains weeks with daylight-saving offset changes. Illustrative previews in the sidecar are static component samples, not a replacement for this application behavior.

Lucide SVG icons use a 1.7 stroke width. The identity mark and clock faces are CSS geometry; there are no shipping raster assets. Toast entry lasts 180ms, and loading rotation lasts one second per cycle. Reduced-motion preference removes transitions and animations.

## Do's and Don'ts

### Do:

- **Do** retain dates and day-change labels alongside city clock times.
- **Do** preserve separate colors and labels for imported events, saved availability, and the current selection.
- **Do** keep visible keyboard focus and honor reduced-motion preference.
- **Do** preserve calendar alignment through internal scrolling on narrow screens.

### Don't:

- **Don't** substitute the unused muted root variable for the darker supporting-text treatment.
- **Don't** hide city actions behind hover on the mobile layout.
- **Don't** treat static preview ramps or component examples as new application tokens or behavior.
- **Don't** interpret this source-derived record as an engine review or a complete accessibility audit.

Documentation note: the source scan produced this document; the final extensions sidecar was completed by the main task after the documenter was interrupted. The Impeccable engine was unavailable. Desktop/mobile review passed the bounded correction list; a live iCloud feed, assistive technology, and 200% zoom were not verified.
