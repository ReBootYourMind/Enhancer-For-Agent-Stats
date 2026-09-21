# Enhancer-For-Agent-Stats
This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/ 

# Installation

To use this javascript install Tampermonkey or a similar tool to your browser and intall the Enhancer-For-Agent-Stats.user.js script into it.

# Functionality 

- **Prediction Table Highlighting**: Fixes next medal prediction highlighting on `table#predictionTable` by finding the next unearned tier per row while ignoring `N/A` and empty prediction cells (such as those affected by recursions).

# TODO:

1. [x] Fix recursion medal breaking next medal highlighting
2. Add new medal tier for Onyx with wings
3. Add new medal tier for Onyx with multiple wings

# Version History

## 0.2

- Implemented next predicted medal highlighting logic on the prediction table, handling recursions and "N/A" values.

## 0.1

Initial version with no functionality to make sure the js is being loaded properly.
