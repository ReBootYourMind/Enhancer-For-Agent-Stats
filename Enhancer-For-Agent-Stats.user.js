// ==UserScript==
// @name         Enhancer for Agent Stats
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/
// @author       ReBootYourMind
// @match        https://www.agent-stats.com/
// @match        https://www.agent-stats.com/?sort_rank=*&sort_order=*
// @exclude      https://www.agent-stats.com/about.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=agent-stats.com
// @downloadURL  https://raw.githubusercontent.com/ReBootYourMind/Enhancer-For-Agent-Stats/refs/heads/main/Enhancer-For-Agent-Stats.user.js
// @updateURL    https://raw.githubusercontent.com/ReBootYourMind/Enhancer-For-Agent-Stats/refs/heads/main/Enhancer-For-Agent-Stats.user.js
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function highlightNextMedals() {
        const rows = document.querySelectorAll('table#predictionTable tbody tr');
        if (!rows.length) return false;

        rows.forEach(row => {
            if (row.cells.length < 11 || row.querySelector('th')) {
                return;
            }

            const medalCells = Array.from(row.cells).slice(6, 11);

            // Find the first cell that is not already earned (no img)
            // and is not invalid (empty or contains N/A)
            const nextMedal = medalCells.find(cell => {
                const text = cell.innerText.trim();
                const hasImg = cell.querySelector('img');
                return !hasImg && text !== '' && !text.includes('N/A');
            });

            if (nextMedal) {
                nextMedal.style.backgroundColor = 'rgba(253, 215, 60, 0.2)';
                nextMedal.style.fontWeight = 'bold';
            }
        });

        return true;
    }

    function init() {
        if (!highlightNextMedals()) {
            const observer = new MutationObserver((mutations, obs) => {
                if (highlightNextMedals()) {
                    obs.disconnect();
                }
            });
            observer.observe(document.body || document.documentElement, {
                childList: true,
                subtree: true
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
