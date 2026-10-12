# Highcharts Architecture & Interoperability Notes

This document details the reverse-engineered structure and behavior of Highcharts on [Agent Stats](https://www.agent-stats.com/). Use this as a technical reference when maintaining or implementing graph-related enhancements (e.g. TODOs #6, #7, #8, #9, #11, and #13).

---

## 1. Environment & Global Access

- **Library Version**: Highcharts `9.1.2`
- **Container DOM Element**: `<div id="container">`
- **Global Instance Access**:
  ```javascript
  const chart = $("#container").highcharts() 
             || Highcharts.charts.find(c => c);
  ```
- **Controls DOM Elements**:
  - `<div id="graphControls">`: Container for graph buttons underneath the chart.
  - `<button id="extrapolate" onclick="javascript: extrapolate();" style="display: inline;">Extrapolate</button>`
  - `<button id="unextrapolate" onclick="javascript: unextrapolate();" style="display: none;">Unextrapolate</button>`

---

## 2. Series Architecture: Sequential Pairs

Agent Stats structures its graph series as **sequential pairs** for each tracked metric / medal:

1. **Base Series** (Index $2n$):
   - **Name format**: `"<medal_name> (@<username>)"` (e.g., `"translator (@Rebootyourmind)"`)
   - **Visibility**: Toggleable by the user via the chart legend.
   - **Data**: Historical progression points recorded from user stat uploads.
   - **`showInLegend`**: `true` (or default).

2. **Extrapolation Series** (Index $2n + 1$):
   - **Name format**: `"<medal_name> (@<username> extrapolation)"` (e.g., `"translator (@Rebootyourmind extrapolation)"`)
   - **Visibility**: Controlled primarily by the Extrapolate / Unextrapolate buttons.
   - **`showInLegend`**: `false` (hidden from the chart legend).
   - **Data**: A 2-point projection line `[pCurrent, pTarget]`.

### Server Preload Limitation
The server pre-generates extrapolation data points **only up to 1x Black/Onyx tier**.
- If a user has **not yet earned Black/Onyx** (e.g. Explorer at 13,318 vs 30,000 threshold), `extra.options.data` contains 2 points: the current upload and the projected 1x Black date.
- If a user **already has Black/Onyx** (e.g. Translator at 444,624 vs 50,000 threshold), the server provides an empty array: `extra.options.data = []`.

---

## 3. Data Point Schema

Highcharts points in Agent Stats use standard millisecond timestamps (`x`) and numeric metric values (`y`):

```json
{
  "x": 1791422048000,
  "y": 13318,
  "progress": "",
  "period": "",
  "name": "2x Black"
}
```

- `x`: UTC timestamp in milliseconds (e.g. `new Date(x)`).
- `y`: Numerical stat value.
- `progress` and `period`: String properties used internally by the site's server format (default to empty string `""`).
- `name`: Optional label (useful for tooltip display, e.g. `"9x Black"`).

---

## 4. Time Window & Zoom Mechanics

The active time window is determined by the primary x-axis extremes:

```javascript
const extremes = chart.xAxis[0].getExtremes();
// extremes.min: Start timestamp of active visible window
// extremes.max: End timestamp of active visible window
// extremes.dataMin: Earliest timestamp in full dataset
// extremes.dataMax: Latest timestamp in full dataset
```

### Rate / Slope Formula
To project future milestones based on activity within the selected time window:
1. Filter base series points where $x \ge \text{min}$ and $x \le \text{max}$.
2. If fewer than 2 points exist in the window (or if progress $dy \le 0$), fall back to all points in the dataset.
3. Calculate rate:
   $$\text{rate} = \frac{y_{\text{last}} - y_{\text{first}}}{x_{\text{last}} - x_{\text{first}}} \quad (\text{units per millisecond})$$
4. Given current value $y_{\text{current}}$ and target value $y_{\text{target}}$:
   $$\text{short} = y_{\text{target}} - y_{\text{current}}$$
   $$\text{timeNeeded} = \frac{\text{short}}{\text{rate}} \quad (\text{in milliseconds})$$
   $$x_{\text{target}} = x_{\text{current}} + \text{timeNeeded}$$

---

## 5. Site's Native Toggle Functions

The site defines two global functions for extrapolation:

```javascript
function extrapolate() {
    $("#extrapolate")[0].style.display = "none";
    $("#unextrapolate")[0].style.display = "inline";
    $("#container").highcharts().redraw();
    for (i = 0 ; i < $("#container").highcharts().series.length ; i++) {
        var serie = $("#container").highcharts().series[i];
        var previous = $("#container").highcharts().series[i - 1];
        if (serie && serie.options.showInLegend == false && previous && previous.visible) {
            serie.setVisible(true, false);
        }
    }
    $("#container").highcharts().redraw();
}

function unextrapolate() {
    $("#unextrapolate")[0].style.display = "none";
    $("#extrapolate")[0].style.display = "inline";
    $.each($("#container").highcharts().series, function(key, value) {
        if (value && value.options.showInLegend == false) {
            value.setVisible(false, false);
        }
    });
    $("#container").highcharts().redraw();
}
```

Notice:
- `extrapolate()` simply toggles `serie.setVisible(true, false)` on any extrapolation series whose base series (`previous`) is visible.
- It does not dynamically compute new points on its own; it relies entirely on whatever data is already in `serie.data`.
- `unextrapolate()` hides all series with `showInLegend: false` and redraws the chart.

---

## 6. How the Enhancer Userscript Hooks Highcharts

In [`Enhancer-For-Agent-Stats.user.js`](Enhancer-For-Agent-Stats.user.js):
1. **Hooking `extrapolate()`**:
   - Replaces `window.extrapolate` with a wrapper that calls `updateOnyxExtrapolations()` before running the original function.
   - Also attaches a capture-phase click listener to `<button id="extrapolate">` as a failsafe.
   - Uses an `Object.defineProperty` setter on `window.extrapolate` in case the site defines the function after the userscript initializes.
2. **Injecting Multiple-Onyx Data**:
   - Inspects each visible base series.
   - For medals with an Onyx requirement where the player has reached or exceeded 1x Black ($y \ge \text{req}$), or where the server provided no extrapolation data (`extra.data.length === 0`):
     - Computes the next milestone ($(\lfloor y / \text{req} \rfloor + 1) \times \text{req}$).
     - Calculates the slope from the active time window.
     - Calls `serie.setData([pCurrent, pTarget], false)`.
   - The original `extrapolate()` loop then marks `serie.setVisible(true, false)` and calls `chart.redraw()`.
3. **Adding Recursed-Medal Guide Lines**:
   - Adds dashed horizontal y-axis plot lines for every recursed milestone inside the current axis range for each visible medal series, whether or not extrapolation is active. A milestone outside the current range is omitted.
   - Lines are keyed by normalized medal name and multiple, so comparison charts get one shared guide line per milestone rather than duplicate lines per player.
   - When available, the line copies the native 1x Black plot line's styling and label format (for example, `explorer black` becomes `explorer 2x black`). Otherwise it uses a dashed line and a generated label.
   - The native plot lines are available on each axis's `plotLinesAndBands`; generated lines are added and removed through `axis.addPlotLine()` and `axis.removePlotLine()`. A private ID prefix keeps enhancer-owned lines separate from site lines. Use each series's assigned `series.yAxis`, not an assumed first axis.
   - `series.data` is not a complete source of medal history: Highcharts only instantiates points as needed and can crop points outside the current view. The enhancer therefore reads the full `series.options.data` first (including `[x, y]` tuples), falling back to instantiated points only when source data is unavailable.
   - Highcharts clips a plot line when its value is outside the y-axis extremes, and plot lines do not themselves expand those extremes. The enhancer never changes axis extremes to force a guide into view.
   - `updateOnyxMilestoneLines(chart)` runs when the chart is initialized and is rescheduled after chart redraws and `afterSetExtremes`, because legend visibility and extrapolation change the active axis range. It only adds guides within the current range for visible base medal series, is idempotent, and removes guides that are no longer within range or whose medal series is hidden.

---

## 7. Roadmap & Follow-up Tasks

### TODO #11: Add Medal Icons to Highcharts [Completed]
- **Legend**: A medal series displays the icon for the highest tier reached by its latest data point. Each comparison series is evaluated independently, and a value at or above Black/Onyx (including further recursion multiples) continues to use the Black icon.
- **Tooltip**: Each medal point uses its own y-value and axis tier thresholds, so historical points and extrapolated predictions show the tier reached at that point. Recursed Black/Onyx icons use the prediction table's `recursion-frame` and `badge` styling. The graph frame is 28px square with its 18px medal centered inside, keeping the medal the same size as other graph icons; an explicit yellow bubble displays the achieved multiple from 2x onward, including in Highcharts HTML labels and tooltips. Non-medal series remain text-only.
- **Milestone Labels**: Native Bronze, Silver, Gold, Platinum, and Black/Onyx plot-line labels use the corresponding medal-tier icon. Generated recursive Black/Onyx guide labels use the Black icon. Since Highcharts renders `useHTML` plot-line labels in an HTML overlay that can cover the SVG tooltip regardless of the label's configured z-index, the enhancer temporarily hides only labels overlapping the visible tooltip and restores them when the tooltip closes. HTML labels omit the unsupported `alt` attribute to avoid Highcharts' invalid-attribute warning.

### TODO #7: Remove Old Unused Medals from Highcharts [Completed in v0.8]
- **Implementation**: [`removeUnusedMedalsFromHighcharts(chart)`](Enhancer-For-Agent-Stats.user.js) iterates backwards through `chart.series` and calls `serie.remove(false)` for any series matching `isUnusedMedal(name)`.
- **Pairing Guarantee**: Because each unused medal is removed along with its paired extrapolation series (both sharing the same medal prefix before `(`), the sequential $2n / 2n+1$ pairing for all remaining medals is strictly preserved.
- **Triggering**: Executed immediately on chart discovery, polled during page load for asynchronous chart initialization, and verified before any extrapolation calculations.

### TODO #8: Fix Medals Not Getting a Label When Selected on Highcharts
- **Context**: Certain series or points on the graph fail to show labels/tooltips when clicked or hovered.
- **Approach**: Investigate series `dataLabels` and tooltip formatters (`chart.options.tooltip.formatter` or `series.options.tooltip`) to ensure all series have consistent label mappings.

### TODO #9: Make Medal Selection Better on Highcharts
- **Context**: Highcharts legend with dozens of medals is cluttered, requiring scrolling or multiple clicks.
- **Approach**: Provide group selection controls (e.g. "Select All", "Deselect All", "Black Badges Only", "Badges in Progress") or a quick-search filter for graph series.

### TODO #13: Add Horizontal Lines for Extrapolated Onyxes [Completed]
- **Implementation**: [`updateOnyxMilestoneLines(chart)`](Enhancer-For-Agent-Stats.user.js) adds labeled horizontal guides for recursed medal multiples, styled from the site's corresponding 1x Black plot line when possible.
- **Milestone Range**: Adds 2x through one multiple above the highest current value, with at least the 2x line when chart data is below 1x. The 1x line remains the site's existing line.
