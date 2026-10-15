# Technical Details

This project is a browser userscript that enhances [Agent Stats](https://www.agent-stats.com/) with better medal prediction logic, more readable comparison views, and richer Highcharts overlays.

For deep details about the chart system itself, see [HIGHCHARTS.md](./HIGHCHARTS.md).

## Overview

The script runs client-side against the live Agent Stats pages and augments the site without replacing its base data model. In practice, it does three main things:

- recalculates upcoming medal milestones and highlights the most relevant one
- adds recursion-aware logic for Black and Onyx projections
- improves graph readability with labels, plot lines, icons, and tooltip context

## Core systems

### Prediction table enhancements

The prediction table is recalculated to find the earliest dated medal milestone with positive reported progress for each tier and agent. Each tier is evaluated independently, so an upcoming lower tier does not prevent a higher-tier prediction from being considered. This logic handles:

- normal medal progressions
- Black/Onyx recursion multiples
- missing or incomplete projection data
- N/A placeholders when no valid estimate exists
- comparison pages that show multiple agents at once

The table also keeps row labels visible when horizontally scrolling so the leftmost metadata stays readable.

Sortable prediction-table headers reorder the rows locally instead of requesting a new server-sorted page. This applies to native medal-prediction columns and the custom Black-multiple prediction column. For native medal predictions, selecting a different agent or tier starts ascending; clicking the same agent-and-tier header again reverses the sort.

### Recursion-aware milestone logic

The script estimates future medal thresholds using the selected graph time window or, if needed, the full dataset. This is used to project milestones such as:

- 2x Black
- 3x Black
- higher recursion multiples as the data allows

### Highcharts integration

The chart layer adds and updates live graph data, guide lines, and labels for milestone thresholds. Relevant behaviors include:

- extrapolated series generation beyond the current data window
- dashed guide lines for visible recursion milestones
- medal icons in legends and tooltips
- matching styling for native and generated guide labels
- per-agent handling in comparison charts

See [HIGHCHARTS.md](./HIGHCHARTS.md) for the chart architecture, data model, and implementation notes.

### Comparison and UI support

The userscript also adjusts comparison views so each agent can be processed independently while still sharing the same page layout and controls. That includes:

- per-agent prediction columns
- per-agent recursion calculations
- consistent row labeling and sticky columns
- matching of comparison-series styling across charts

### AP calculations

AP values are recalculated to be safe across recursion resets. Instead of relying on a single naive delta, the script uses the relevant lifetime history and selected time window to avoid impossible negative gains.

## Documentation map

- [README.md](./README.md) — project overview and installation
- [TECHNICAL.md](./TECHNICAL.md) — contributor-friendly implementation overview
- [HIGHCHARTS.md](./HIGHCHARTS.md) — detailed chart internals and reverse-engineered behavior
- [TODO.md](./TODO.md) — backlog and planned improvements

## Notes for contributors

When updating medal logic, be careful with:

- how recursion milestones are calculated
- whether a value is represented as a count, date projection, or extrapolated target
- label generation for comparison charts
- chart redraw events and axis range changes
- compatibility with Agent Stats native controls and series structure
