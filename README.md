# Enhancer-For-Agent-Stats

A cleaner, smarter Agent Stats experience for players who want better medal tracking, clearer recursion data, and easier-to-read charts.

## Features

- Clear next-medal tracking and prediction
- Better Black/Onyx recursion milestone visibility
- Faster local sorting for medal predictions and cleaner comparison tables
- Easier-to-read charts, icons, and tooltips
- Accurate AP gain calculations across recursion resets

## Installation

1. Install a userscript manager for your browser:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/get-it/)
2. Open the [raw Enhancer-For-Agent-Stats.user.js script](https://raw.githubusercontent.com/ReBootYourMind/Enhancer-For-Agent-Stats/main/Enhancer-For-Agent-Stats.user.js).
3. Your userscript manager should show an installation page. Select **Install** to add the script.
4. If you are using Chrome, make sure Developer mode is turned on from the [Extension page](chrome://extensions/).
5. From the same extensions page, open the userscript manager and enable **Allow User Scripts**.
6. Open or refresh [Agent Stats](https://www.agent-stats.com/) to use the enhancements.

If the installation page does not open automatically, copy the raw script URL from step 2 and add it as a new script in your userscript manager.

## Documentation

- [Technical details](./TECHNICAL.md)
- [Highcharts notes](./HIGHCHARTS.md)
- [Project TODO](./TODO.md)

# Version History

## 0.12

- Added faster local sorting for the prediction table for all medal tiers.
- Fixed medals icons for medals that had inconsistent names.
- Fixed prediction table sorting when switching between recursed medals and other medals.
- Fixed bug from the original agent-stats site where some medals lacked labels and consistent colors on the highchart graph.


## 0.11

- Shows recursed-medal guide lines when a visible extrapolation reaches those milestones.
- Shows every recursed medal guide within the current y-axis range without expanding the axis.
- Added medal icons to highcharts graph.

## 0.10

- Added dashed, labeled Highcharts guide lines for earned and next Black/Onyx recursion multiples.

## 0.9

- Recalculated each agent's "just gained" AP from their latest lifetime AP history and "every diff" AP from the selected graph time window, including on comparison pages.
- Added support for agent comparisons.
- Prediction tables first column will stick to the left edge of the screen if the table is scrolled to the right

## 0.8

- Removed expired and unused event medals (`cryptic_memories_op`, `operation_chronos`, `prime_challenge`) from the Highcharts graph and legend.

## 0.7

- Added support for multiple Black/Onyx extrapolations in the Highcharts graphs, projecting upcoming multiples (2x, 3x, etc.) based on user activity within the selected time window.

## 0.6

- Removed expired and unused event medals (`cryptic_memories_op`, `operation_chronos`, `prime_challenge`) from the prediction table.

## 0.5

- Updated prediction table highlights to match the native site style (`class="highlight"`) instead of custom inline styles.
- Ensured any previous or server-rendered highlights are cleared when recalculating earliest upcoming medals.

## 0.4

- Added client-side sorting for the Recursion Prediction Column, toggling between ascending and descending order on header click, with active sort arrow indicators.
- Fixed sort indicator arrow positioning and cell containment so arrows stay neatly inside the header cell without overlapping table borders.

## 0.3

- Added a new prediction table column for predicting when the next multiple of a black medal (recursion frame) will be collected.
- Integrated recursion column into the earliest-medal highlighter so the next achievable recursion medal is automatically highlighted.

## 0.2

- Implemented next predicted medal highlighting logic on the prediction table, handling recursions and "N/A" values.

## 0.1

- Initial version with no functionality to make sure the js is being loaded properly.
