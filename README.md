# Enhancer-For-Agent-Stats
This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/ 

# Installation

To use this javascript install Tampermonkey or a similar tool to your browser and intall the Enhancer-For-Agent-Stats.user.js script into it.

# Functionality 

- **Prediction Table Highlighting**: Fixes next medal prediction highlighting on `table#predictionTable` by identifying the single earliest upcoming medal for each medal tier column, while correctly handling recursion badges, missing projections, and `N/A` values.
- **Recursion Black Medal Predictions**: Adds a new column to the prediction table calculating when the next multiple of a black medal (black with recursion-frame) will be earned, and highlights the earliest upcoming recursion medal.
- **Client-Side Recursion Sorting**: Clicking the header image of the Recursion Prediction Column sorts rows in ascending order (earliest projected date first), and clicking again switches to descending order (and back), with an active sort indicator arrow (`↑` or `↓`).
- **Remove Expired Event Medals**: Automatically removes deprecated and expired event medals (`cryptic_memories_op`, `operation_chronos`, `prime_challenge`) from the prediction table and the Highcharts graph.
- **Highcharts Multiple Onyx Extrapolations**: Extends the site's Highcharts graph extrapolation to calculate and display projections for multiples of Black/Onyx medals (e.g. 2x, 3x, etc.) based on user progress in the selected time window.

# TODO:

1. [x] Fix recursion medal breaking next medal highlighting
2. [x] Add new medal tier for Onyx with wings
3. [x] Add new medal tier for Onyx with multiple wings
4. [x] Make prediction table highlights match the site style
5. [x] Remove old unused medals from prediction table
6. [x] Add functionality to extrapolate onyx with multiple wings in the Highcharts graphs
7. [x] Remove old unused medals from highcharts
8. [ ] Fix some medals not getting a label when selected on highcharts
9. [ ] Make medal selection better on highcharts
10. [ ] Change unavailable recursion predictions from "-" to "N/A"
11. [ ] Add medal icons into the Highcharts graph axis, mouse over and labels.
12. [ ] Change @match so that script runs when comparing stats with another player and make sure everything still works.
13. [ ] Add horizontal lines to the Highchart graph for extrapolated onyxes
14. [ ] Change "just gained" numbers to calculate from all time ap so they work even when recursed. (to avoid gaining negative AP)
15. [ ] Find a proper place and add "copy scanner link" for other agents. This is to open their profile ingame. For example this should work at the sharelist and when comparing with an agent.
16. [ ] Make it so that when the prediction table is too wide for the screen the labels for each row are always still visible when scrolling to the right.

# Version History

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
