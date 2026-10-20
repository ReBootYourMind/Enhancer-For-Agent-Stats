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

# Recent Releases

## 1.01 (19.10.2026)

- Restored elapsed time between data points and per-series value changes in Highcharts tooltips.
- Restored colored tooltip rows to match their medal series on the graph.

## 1.00 (15.10.2026)

- Fixed sorting switch when comparing and going between the same medal tier. Should now always apply ascending sort first.
- Fixed extrapolation toggle not always being remembered.
- Fixed highlight logic to ignore if previous tier has been unlocked.

[View full version history in CHANGELOG.md](./CHANGELOG.md)
