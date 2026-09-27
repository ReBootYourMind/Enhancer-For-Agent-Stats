# Enhancer-For-Agent-Stats
This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/ 

# Installation

To use this javascript install Tampermonkey or a similar tool to your browser and intall the Enhancer-For-Agent-Stats.user.js script into it.

# Functionality 

- **Prediction Table Highlighting**: Fixes next medal prediction highlighting on `table#predictionTable` by identifying the single earliest upcoming medal for each medal tier column, while correctly handling recursion badges, missing projections, and `N/A` values.
- **Recursion Black Medal Predictions**: Adds a new column to the prediction table calculating when the next multiple of a black medal (black with recursion-frame) will be earned, and highlights the earliest upcoming recursion medal.

# TODO:

1. [x] Fix recursion medal breaking next medal highlighting
2. [x] Add new medal tier for Onyx with wings
3. [x] Add new medal tier for Onyx with multiple wings

# Version History

## 0.3

- Added a new prediction table column for predicting when the next multiple of a black medal (recursion frame) will be collected.
- Integrated recursion column into the earliest-medal highlighter so the next achievable recursion medal is automatically highlighted.

## 0.2

- Implemented next predicted medal highlighting logic on the prediction table, handling recursions and "N/A" values.

## 0.1

- Initial version with no functionality to make sure the js is being loaded properly.
