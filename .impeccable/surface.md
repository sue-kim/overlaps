# Main planner
Mode: Operate. One-screen desktop calendar with internal time-grid scrolling; mobile rearranges city clocks, selection, and calendar without page overflow.

## Direction contract
THESIS: A shared calendar moment stays aligned across cities, with no mental timezone arithmetic.
OWN-WORLD: Cool paper, deep teal actions and pale cyan selection, warm muted afternoon bands, restrained type, fine structural rules, and small circular analog clocks.
STORY: Scan city times, choose a city for the calendar, select an interview slot, compare local dates, save or copy availability.
FIRST VIEWPORT: Compact wordmark bar; title and calendar action; horizontal city strip; weekly calendar occupying the left two thirds and an integrated time-selection panel on the right.
FORM: A calendar desk with aligned timeline columns. The concept engine was unavailable, so this is an implementation assumption derived directly from the brief, not a generated assignment.
SIGNATURE: Selecting a calendar slot changes every city clock and the time-comparison panel together. All movement is brief state feedback and respects reduced motion.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

Work-hours refinement: a compact master switch and per-city pressed buttons control side-by-side labeled calendar bands for each city’s weekday 09:00–18:00. Preserve local weekday/daylight-saving boundaries; preferences persist. Bands are below events and ignore pointer input.

Direct calendar save: a selected slot exposes Save time next to its range. The button becomes disabled Saved when the same start and duration are already in the shortlist. Keep the action inside the time grid, including midnight and short selections.
