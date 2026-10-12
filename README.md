# Enhancer-For-Agent-Stats
This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/ 

# Installation

1. Install a userscript manager for your browser:
   - [Tampermonkey](https://www.tampermonkey.net/)
   - [Violentmonkey](https://violentmonkey.github.io/get-it/)
2. Open the [raw Enhancer-For-Agent-Stats.user.js script](https://raw.githubusercontent.com/ReBootYourMind/Enhancer-For-Agent-Stats/main/Enhancer-For-Agent-Stats.user.js).
3. Your userscript manager should show an installation page. Select **Install** to add the script.
4. If you are using Chrome make sure you have Developer mode turned on from the [Extension page](chrome://extensions/) 
5. From the same Extensions page open details of the userscript manager extension and enable "Allow User Scripts" toggle.
6. Open or refresh [Agent Stats](https://www.agent-stats.com/) to use the enhancements.

If the installation page does not open automatically, copy the raw script URL from step 2 and add it as a new script in your userscript manager.

# Functionality 

- **Prediction Table Highlighting**: Fixes next medal prediction highlighting on `table#predictionTable` by identifying the single earliest upcoming medal for each medal tier column, while correctly handling recursion badges, missing projections, and `N/A` values.
- **Recursion Black Medal Predictions**: Adds a new column to the prediction table calculating when the next multiple of a black medal (black with recursion-frame) will be earned, and highlights the earliest upcoming recursion medal.
- **Client-Side Recursion Sorting**: Clicking the header image of the Recursion Prediction Column sorts rows in ascending order (earliest projected date first), and clicking again switches to descending order (and back), with an active sort indicator arrow (`↑` or `↓`).
- **Comparison Table Support**: Applies prediction highlighting and adds an independently calculated and sortable recursion prediction column for each agent when comparing stats. The label for each row will stick to the left edge of the screen.
- **Remove Expired Event Medals**: Automatically removes deprecated and expired event medals (`cryptic_memories_op`, `operation_chronos`, `prime_challenge`) from the prediction table and the Highcharts graph.
- **Highcharts Recursed Medal Guides**: Displays labeled dashed guides for recursed medal thresholds that fit within the current graph y-axis range. Guides do not expand the axis.
- **Highcharts Medal Icons**: Displays each medal's currently achieved tier icon beside its graph legend (using each agent's own latest value on comparison charts) and the tier reached at each hovered data point, including extrapolated points. Black icons show a recursion frame and count from the relevant value (or milestone multiple), while values below 2x Black retain the standard icon. Native Bronze-through-Black/Onyx guide labels and generated recursion milestones use the matching medal-tier icon.
- **Recursion-Safe AP Gain**: Calculates each agent's "just gained" AP from the latest two lifetime AP points and "every diff" AP from the selected Highcharts time window, so recursion resets do not produce negative gains.

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
10. [x] Change unavailable recursion predictions from "-" to "N/A"
11. [x] Add medal icons into the Highcharts graph axis, mouse over and labels.
12. [x] Change @match so that script runs when comparing stats with another player and make sure everything still works.
13. [x] Add horizontal lines to the Highchart graph for extrapolated onyxes
14. [x] Change "just gained" numbers to calculate from all time ap so they work even when recursed. (to avoid gaining negative AP)
15. [ ] Find a proper place and add "copy scanner link" for other agents. This is to open their profile ingame. For example this should work at the sharelist and when comparing with an agent.
16. [x] Make it so that when the prediction table is too wide for the screen the labels for each row are always still visible when scrolling to the right.
17. [ ] Fix switching from recursed sorting back to whatever sorting you had before that. Currently the site "toggles" that sorting instead of turning it back on.
18. [ ] Add recursion medal image for the graph recursion `/img/recursions-bronze.png` It has just one level.
19. [ ] Make readme feature list easier to read, Technical details can be somewhere else. The top of the readme should be like an ad for the project.
20. [ ] Move todos away from the readme file.

# Version History

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
