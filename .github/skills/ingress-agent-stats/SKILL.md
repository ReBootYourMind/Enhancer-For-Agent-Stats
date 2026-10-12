---
name: ingress-agent-stats
description: 'Use when changing or explaining Ingress Agent Stats tracking, game terminology, AP and medal progression, recursion predictions, or medal behavior in this userscript.'
---

# Ingress Agent Stats Tracking

Use this skill for work on this repository's Ingress Agent Stats userscript, especially medal tracking, recursion forecasts, comparison pages, and chart overlays. Ground explanations and changes in the repository's current code and documentation rather than assuming the live site or game behaves a particular way.

## Terminology

- **Agent**: an Ingress player whose tracked statistics appear on Agent Stats. Comparison pages can show multiple agents; calculate and render their data independently.
- **AP (Action Points)**: an Ingress progression measure. In Agent Stats, distinguish lifetime AP, AP gained over a selected interval, and medal-specific statistics. Medal metrics do not all use AP as their unit.
- **Medal / badge**: an achievement tracked by Agent Stats. Standard displayed tiers are Bronze, Silver, Gold, Platinum, and Black; Black and Onyx are two names for the highest tier. In this repository they are treated as aliases for the top-tier requirement and icon.
- **Requirement**: the value needed for a medal tier. Black requirements differ by medal; the userscript's `BLACK_MEDAL_REQUIREMENTS` map is the local source of truth for supported top-tier thresholds. Do not apply one medal's threshold or assume all medal values are AP.
- **Recursed / winged Black**: 2x Black (double Black) is sometimes called a recursed or winged Black medal because its graphic gains the same red wings associated with agent Recursion. The userscript tracks repeated Black/Onyx requirement multiples (2x, 3x, and onward); use the numeric multiple when precision matters.
- **Recursion Wing**: Ingress also uses this phrase for a medal upgrade distinct from the Black/Onyx tier system. For example, official news for a special returning event medal described Agents who already held Gold receiving an upgrade with the “prestigious Recursion Wing” when Gold was the highest tier available for those Bounties. Do not mistake this event-medal upgrade for 2x Black.
- **Agent Recursion**: the Ingress account-level action that resets an agent's level and current AP amount. Lifetime AP is not touched when an agent recurses. Its visual motif is also the reason people describe 2x Black as “recursed” or “winged”; the shared name and imagery do not make account Recursion and medal-multiple tracking the same statistic.
- **Short**: the remaining metric value to a target threshold.
- **Prediction / extrapolation**: an estimated date or graph point derived from observed progress. It is not a guarantee or a server-provided fact.
- **Comparison**: a page/chart tracking two agents. Keep requirements, values, calculations, and visual state associated with the correct agent or series.

Ingress vocabulary such as Portal, Resonator, Link, Control Field, Hack, XM, faction, and glyph is useful context when interpreting tracked activity or medal names. Do not infer a statistic's exact definition or conversion from its game terminology alone; verify the Agent Stats data and current UI.

## Current Repository Behavior

### Prediction table

- Medal rows contain tier progression data; the userscript highlights the earliest dated upcoming tier that is eligible for each agent. A tier is eligible only after all earlier tiers in that row are earned. The next valid recursion prediction is highlighted separately.
- The repeated-Black-multiple prediction uses the medal-specific Black requirement. For total value `v` and requirement `r`, the next target is `max(2, floor(v / r) + 1) * r`; the target value remaining is `target - v`. The UI may call this a recursion prediction/column; describe it as a medal multiple when that avoids confusion with Agent Recursion or an event's Recursion Wing.
- The predicted date uses the detected prediction window and available positive progress rate. It falls back from the selected-window difference to month and then week rates. If there is no usable rate, show `N/A` while retaining the remaining-value detail when available. Missing requirements or totals also cannot produce a date.
- Recursion columns and sorting are per agent on comparisons. Preserve native table behavior and keep the displayed state synchronized when recalculating highlights.

### Charts

- Agent Stats chart data contains historical series and paired extrapolation series. Preserve the site's base-series/extrapolation pairing and visibility behavior.
- The userscript may project the next Black/Onyx multiple for a visible medal series. It estimates a rate from points inside the active time window, falling back to the full series when the window has too few points or no positive progress. Do not extrapolate without a valid positive rate.
- Recursed guide lines are generated for milestones within the current y-axis range. They should not force axis expansion, should update when visibility/ranges change, and should not duplicate across comparison series for the same medal and multiple on an axis.
- Medal icons reflect the tier represented by a value or label. Values at or beyond Black/Onyx retain the Black icon; values at 2x and above may display the achieved multiple.
- AP gain display logic must account for recursion resets: use lifetime history for “just gained” and the selected graph window for the interval difference as currently implemented, rather than trusting a possibly negative naive delta.

## Procedure for Changes

1. Read [the userscript](../../../Enhancer-For-Agent-Stats.user.js), [technical overview](../../../TECHNICAL.md), and, for chart changes, [Highcharts notes](../../../HIGHCHARTS.md). Check the actual current implementation before relying on this summary.
2. Identify the source metric, unit, medal requirement, and whether the requested behavior concerns Agent Recursion, the red-winged 2x Black medal, further Black/Onyx multiples, or an event-specific Recursion Wing. These terms are related in name or appearance but are not interchangeable; ask for clarification if the intended behavior is unclear.
3. Trace relevant behavior across table predictions, earned-tier detection, comparisons, and chart rendering. Reuse existing normalization and calculation helpers; keep Black/Onyx naming consistent.
4. Make the smallest complete change, preserving Agent Stats and userscript-manager compatibility. Do not invent requirements, infer AP conversions, or silently treat missing/invalid values as successful predictions.
5. Validate the modified script and the relevant behavior. Update directly related documentation when the implementation's behavior changes.

## Reference

- [Project overview and terminology context](../../../README.md)
- [Prediction, recursion, and AP implementation overview](../../../TECHNICAL.md)
- [Chart series, extrapolation, and milestone behavior](../../../HIGHCHARTS.md)
