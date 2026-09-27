// ==UserScript==
// @name         Enhancer for Agent Stats
// @namespace    http://tampermonkey.net/
// @version      0.3
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

    const BLACK_MEDAL_REQUIREMENTS = {
        'Explorer': 30000,
        'Seer': 5000,
        'Recon': 10000,
        'Scout': 6000,
        'Scout Controller': 12000,
        'Builder': 200000,
        'Connector': 100000,
        'Mind Controller': 40000,
        'Illuminator': 4000000,
        'Recharger': 25000000,
        'Liberator': 40000,
        'Pioneer': 20000,
        'Engineer': 50000,
        'Hacker': 200000,
        'Maverick': 10000,
        'Translator': 50000,
        'Sojourner': 360,
        'Epoch': 60,
        'Purifier': 300000,
        'Reclaimer': 40000,
        'Trekker': 2500,
        'SpecOps': 500,
        'Mission Day': 20,
        'NL-1331 Meetups': 50,
        'Recruiter': 100,
        'Stealth Ops': 20,
        'Urban Ops': 20,
        'OPR Live': 20,
        'OCF': 20,
        'Intel Ops': 20,
        'IFS': 36,
        'Second Sunday': 36,
        'Drone Explorer': 30000,
        'Drone Distance': 500,
        'Collector': 200000000,
        'Crafter': 700,
        'Binder': 1800,
        'Country Master': 5000000,
        'Overclocker': 7500,
        'Neutralizer': 40000,
        'Disruptor': 100000,
        'Salvator': 40000,
        'BB Combatant': 4000,
        'Red Disruptor': 50000,
        'Red Purifier': 150000,
        'Red Neutralizer': 20000,
        'Guardian': 150,
        'Smuggler': 75,
        'Link Master': 1000,
        'Controller': 50,
        'Field Master': 1000000,
        'Drone Recalls': 1000,
        'Drone Sender': 1200,
        'Research Bounties': 5000,
        'Research Days': 360
    };

    function normalizeMedalName(name) {
        return name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    }

    const NORMALIZED_REQUIREMENTS = {};
    for (const [key, value] of Object.entries(BLACK_MEDAL_REQUIREMENTS)) {
        NORMALIZED_REQUIREMENTS[normalizeMedalName(key)] = value;
    }

    function getBlackRequirement(medalName) {
        if (!medalName) return null;
        const norm = normalizeMedalName(medalName);
        return NORMALIZED_REQUIREMENTS[norm] ?? BLACK_MEDAL_REQUIREMENTS[medalName.trim()] ?? null;
    }

    // Extrapolate the base date and interval window (in days) using existing server-generated predictions
    function detectPredictionParameters(table) {
        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 11 && !row.querySelector('th');
        });

        const points = [];
        for (const row of rows) {
            const diffText = row.cells[2].innerText.replace(/,/g, '').trim();
            const diff = parseFloat(diffText);
            if (!diff || diff <= 0) continue;

            for (let col = 6; col <= 10; col++) {
                const cell = row.cells[col];
                if (cell.querySelector('img')) continue;

                const dateMatch = cell.innerText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
                const shortMatch = cell.innerText.match(/([\d,]+)\s+short/);
                if (dateMatch && shortMatch) {
                    const date = new Date(dateMatch[1] + 'T00:00:00Z');
                    const short = parseFloat(shortMatch[1].replace(/,/g, ''));
                    if (!isNaN(date.getTime()) && short > 0) {
                        points.push({
                            date,
                            short,
                            diff,
                            r: short / diff
                        });
                    }
                }
            }
        }

        let bestWindowDays = null;
        let bestBaseDate = null;

        if (points.length >= 2) {
            let maxDr = 0;
            let bestPair = null;
            for (let i = 0; i < points.length; i++) {
                for (let j = i + 1; j < points.length; j++) {
                    const dr = Math.abs(points[i].r - points[j].r);
                    if (dr > maxDr) {
                        maxDr = dr;
                        bestPair = [points[i], points[j]];
                    }
                }
            }
            if (bestPair && maxDr > 0.5) {
                const p1 = bestPair[0];
                const p2 = bestPair[1];
                const windowMs = (p2.date.getTime() - p1.date.getTime()) / (p2.r - p1.r);
                const windowDays = windowMs / (1000 * 60 * 60 * 24);
                if (windowDays > 0.5 && windowDays < 365) {
                    const baseMs = p1.date.getTime() - p1.r * windowMs;
                    bestWindowDays = windowDays;
                    bestBaseDate = new Date(baseMs);
                }
            }
        }

        if (!bestWindowDays && points.length === 1) {
            bestBaseDate = new Date();
            bestBaseDate.setUTCHours(0, 0, 0, 0);
            const p = points[0];
            const days = (p.date.getTime() - bestBaseDate.getTime()) / (1000 * 60 * 60 * 24);
            if (days > 0 && p.r > 0) {
                bestWindowDays = days / p.r;
            }
        }

        if (!bestBaseDate) {
            bestBaseDate = new Date();
            bestBaseDate.setUTCHours(0, 0, 0, 0);
        }
        if (!bestWindowDays) {
            bestWindowDays = 30.0;
        }

        return { baseDate: bestBaseDate, windowDays: bestWindowDays };
    }

    function addRecursionPredictionColumn(table) {
        if (!table) return false;

        const theadRow = table.querySelector('thead tr');
        if (!theadRow) return false;

        // Ensure column header is added once
        if (!table.querySelector('th[data-enhancer-col="recursion"]')) {
            const colgroup = table.querySelector('colgroup');
            if (colgroup && !colgroup.querySelector('col[data-enhancer-col="recursion"]')) {
                const col = document.createElement('col');
                col.dataset.enhancerCol = 'recursion';
                colgroup.appendChild(col);
            }

            const th = document.createElement('th');
            th.dataset.enhancerCol = 'recursion';
            th.title = 'Next Black Multiple (Recursion)';
            th.innerHTML = '<div class="recursion-frame"><img alt="black" src="/img/black.png" height="32" width="32"></div>';
            theadRow.appendChild(th);
        }

        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 11 && !row.querySelector('th');
        });

        if (!rows.length) return false;

        const { baseDate, windowDays } = detectPredictionParameters(table);

        for (const row of rows) {
            if (row.querySelector('td[data-enhancer-col="recursion"]')) {
                continue;
            }

            const rawName = row.cells[0].childNodes[0]?.textContent?.trim() || row.cells[0].innerText.split('\n')[0].trim();
            const req = getBlackRequirement(rawName);

            const totalText = row.cells[5].innerText.replace(/,/g, '').trim();
            const total = parseFloat(totalText);

            const diffText = row.cells[2].innerText.replace(/,/g, '').trim();
            const diff = parseFloat(diffText);

            const weekText = row.cells[3].innerText.replace(/,/g, '').trim();
            const week = parseFloat(weekText);

            const monthText = row.cells[4].innerText.replace(/,/g, '').trim();
            const month = parseFloat(monthText);

            let cellContent = '-';
            let cellTitle = '';
            let nextMultiple = null;

            if (req && !isNaN(total)) {
                const currentMultiples = Math.floor(total / req);
                nextMultiple = Math.max(2, currentMultiples + 1);
                const target = nextMultiple * req;
                const short = target - total;

                let dailyRate = 0;
                if (diff > 0 && windowDays > 0) {
                    dailyRate = diff / windowDays;
                } else if (month > 0) {
                    dailyRate = month / 30;
                } else if (week > 0) {
                    dailyRate = week / 7;
                }

                if (dailyRate > 0) {
                    const daysNeeded = short / dailyRate;
                    const targetDate = new Date(baseDate.getTime() + daysNeeded * 86400000);
                    const yyyy = targetDate.getUTCFullYear();
                    const mm = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
                    const dd = String(targetDate.getUTCDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    cellContent = `${dateStr}<div class="details">${short.toLocaleString('en-US')} short</div>`;
                } else {
                    cellContent = `N/A<div class="details">${short.toLocaleString('en-US')} short</div>`;
                }
                cellTitle = `${nextMultiple}x Black: ${short.toLocaleString('en-US')} short of ${target.toLocaleString('en-US')}`;
            }

            const td = document.createElement('td');
            td.dataset.enhancerCol = 'recursion';
            if (nextMultiple) {
                td.dataset.nextMultiple = String(nextMultiple);
            }
            if (cellTitle) {
                td.title = cellTitle;
            }
            td.innerHTML = cellContent;
            row.appendChild(td);
        }

        return true;
    }

    function highlightNextMedals(table = document.querySelector('table#predictionTable')) {
        if (!table) return false;

        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 11 && !row.querySelector('th');
        });

        if (!rows.length) return false;

        // Clear any previous highlights applied by this enhancer
        table.querySelectorAll('td[data-enhancer-highlight="true"]').forEach(td => {
            td.style.backgroundColor = '';
            td.style.fontWeight = '';
            delete td.dataset.enhancerHighlight;
        });

        const totalCols = rows[0].cells.length;

        // For each medal tier column (starting at column 6: Bronze, Silver, Gold, Platinum, Black, Recursion),
        // find the single next upcoming medal across all rows.
        for (let col = 6; col < totalCols; col++) {
            let earliestDate = null;
            let targetCell = null;

            for (const row of rows) {
                // 1. All prior tiers must already be earned (contain an <img>)
                let allPreviousEarned = true;
                for (let prev = 6; prev < col; prev++) {
                    if (!row.cells[prev].querySelector('img')) {
                        allPreviousEarned = false;
                        break;
                    }
                }

                if (!allPreviousEarned) {
                    continue;
                }

                const currentCell = row.cells[col];

                // 2. Current tier must not already be earned
                if (currentCell.querySelector('img')) {
                    continue;
                }

                // 3. Must contain a valid prediction date (YYYY-MM-DD), ignoring N/A, empty, or '?'
                const match = currentCell.innerText.match(/\b\d{4}-\d{2}-\d{2}\b/);
                if (!match) {
                    continue;
                }

                const dateStr = match[0];
                if (!earliestDate || dateStr < earliestDate) {
                    earliestDate = dateStr;
                    targetCell = currentCell;
                }
            }

            // Highlight the single earliest upcoming medal for this tier column
            if (targetCell) {
                targetCell.style.backgroundColor = 'rgba(253, 215, 60, 0.2)';
                targetCell.style.fontWeight = 'bold';
                targetCell.dataset.enhancerHighlight = 'true';
            }
        }

        return true;
    }

    function enhanceAgentStats() {
        const table = document.querySelector('table#predictionTable');
        if (!table) return false;

        addRecursionPredictionColumn(table);
        highlightNextMedals(table);
        return true;
    }

    function init() {
        if (!enhanceAgentStats()) {
            const observer = new MutationObserver((mutations, obs) => {
                if (enhanceAgentStats()) {
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

