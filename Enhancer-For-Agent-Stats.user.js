// ==UserScript==
// @name         Enhancer for Agent Stats
// @namespace    https://github.com/ReBootYourMind
// @version      1.01
// @description  This fixes and enhances functionality of Agent Stats https://www.agent-stats.com/
// @author       ReBootYourMind
// @match        https://www.agent-stats.com/
// @match        https://www.agent-stats.com/?sort_rank=*&sort_order=*
// @match        https://www.agent-stats.com/index.php*
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

    const MEDAL_IMAGE_NAMES = {
        missionday: 'missionday',
        nl1331meetups: 'nl-1331-meetups'
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

    const UNUSED_MEDALS = [
        'cryptic_memories_op',
        'operation_chronos',
        'prime_challenge'
    ];

    const NORMALIZED_UNUSED_MEDALS = new Set(
        UNUSED_MEDALS.map(name => normalizeMedalName(name))
    );

    function isUnusedMedal(medalName) {
        if (!medalName) return false;
        return NORMALIZED_UNUSED_MEDALS.has(normalizeMedalName(medalName));
    }

    function getPredictionTableLayout(table) {
        const row = Array.from(table.querySelectorAll('tbody tr')).find(candidate => {
            return candidate.cells.length >= 11 && !candidate.querySelector('th');
        });
        const enhancedCells = row
            ? Array.from(row.cells).filter(cell => cell.dataset.enhancerCol).length
            : 0;
        const baseCellCount = row ? row.cells.length - enhancedCells : 0;
        const playerCount = baseCellCount >= 21 ? 2 : 1;

        return {
            playerCount,
            latestIndex: player => 1 + player,
            diffIndex: player => 1 + playerCount + player,
            weekIndex: player => 1 + playerCount * 2 + player,
            monthIndex: player => 1 + playerCount * 3 + player,
            totalIndex: player => 1 + playerCount * 4 + player,
            medalIndex: (player, tier) => 1 + playerCount * 5 + tier * playerCount + player
        };
    }

    // Extrapolate the base date and interval window (in days) using existing server-generated predictions
    function detectPredictionParameters(table, layout = getPredictionTableLayout(table)) {
        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 11 && !row.querySelector('th');
        });

        const points = [];
        for (const row of rows) {
            for (let player = 0; player < layout.playerCount; player++) {
                const diffText = row.cells[layout.diffIndex(player)].innerText.replace(/,/g, '').trim();
                const diff = parseFloat(diffText);
                if (!diff || diff <= 0) continue;

                for (let tier = 0; tier < 5; tier++) {
                    const cell = row.cells[layout.medalIndex(player, tier)];
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

    function getRowRecursionSortKey(row, columnKey) {
        const cell = row.querySelector(`td[data-enhancer-col="${columnKey}"]`);
        if (!cell) return { hasDate: false, dateStr: '', short: Infinity };

        const dateMatch = cell.innerText.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        const shortMatch = cell.innerText.match(/([\d,]+)\s+short/);
        const shortVal = shortMatch ? parseFloat(shortMatch[1].replace(/,/g, '')) : Infinity;

        if (dateMatch) {
            return {
                hasDate: true,
                dateStr: dateMatch[1],
                short: shortVal
            };
        }
        return {
            hasDate: false,
            dateStr: '',
            short: shortVal
        };
    }

    function getNativePredictionSort() {
        const url = new URL(window.location.href);
        const rank = url.searchParams.get('sort_rank');
        const rawOrder = url.searchParams.get('sort_order');
        if (!rank || !rawOrder) return null;
        return {
            rank,
            user: url.searchParams.get('sort_user'),
            order: rawOrder.toLowerCase().includes('desc') ? 'desc' : 'asc'
        };
    }

    function getHeaderColumnIndex(table, targetHeader) {
        const occupied = [];
        const headerRows = Array.from(table.querySelectorAll('thead tr'));

        for (let rowIndex = 0; rowIndex < headerRows.length; rowIndex++) {
            const row = headerRows[rowIndex];
            occupied[rowIndex] = occupied[rowIndex] || [];
            let columnIndex = 0;

            for (const header of Array.from(row.cells)) {
                while (occupied[rowIndex][columnIndex]) columnIndex++;

                const startColumn = columnIndex;
                const colSpan = Math.max(1, header.colSpan);
                const rowSpan = Math.max(1, header.rowSpan);
                for (let rowOffset = 0; rowOffset < rowSpan; rowOffset++) {
                    const targetRow = rowIndex + rowOffset;
                    occupied[targetRow] = occupied[targetRow] || [];
                    for (let columnOffset = 0; columnOffset < colSpan; columnOffset++) {
                        occupied[targetRow][startColumn + columnOffset] = true;
                    }
                }

                if (header === targetHeader) {
                    return colSpan === 1 ? startColumn : null;
                }
                columnIndex += colSpan;
            }
        }
        return null;
    }

    function getPredictionSortKey(cell) {
        const text = cell.innerText.trim();
        const dateMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
        const shortMatch = text.match(/([\d,]+)\s+short/i);
        if (dateMatch) {
            return {
                missing: false,
                date: dateMatch[1],
                numeric: shortMatch ? parseFloat(shortMatch[1].replace(/,/g, '')) : null,
                text: ''
            };
        }

        const numericText = text.replace(/,/g, '').trim();
        const numeric = numericText !== '' ? Number(numericText) : NaN;
        if (Number.isFinite(numeric)) {
            return { missing: false, date: null, numeric, text: '' };
        }
        if (shortMatch) {
            return {
                missing: false,
                date: null,
                numeric: parseFloat(shortMatch[1].replace(/,/g, '')),
                text: ''
            };
        }
        if (!text || /^n\/a$/i.test(text)) {
            return { missing: true, date: null, numeric: null, text: '' };
        }
        return { missing: false, date: null, numeric: null, text: text.toLowerCase() };
    }

    function sortPredictionTable(table, columnIndex, order, activeHeader) {
        table.querySelectorAll('thead th .enhancer-sort-arrow').forEach(arrow => {
            arrow.textContent = '';
        });

        let arrow = activeHeader.querySelector('.enhancer-sort-arrow');
        if (!arrow) {
            arrow = document.createElement('span');
            arrow.className = 'enhancer-sort-arrow';
            arrow.style.marginLeft = '4px';
            arrow.style.fontSize = '13px';
            arrow.style.userSelect = 'none';
            activeHeader.appendChild(arrow);
        }
        arrow.textContent = order === 'asc' ? '↑' : '↓';

        for (const tbody of table.querySelectorAll('tbody')) {
            const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => {
                return !row.querySelector('th') && row.cells.length >= 11 && row.cells.length > columnIndex;
            });
            const keys = new Map(rows.map(row => [row, getPredictionSortKey(row.cells[columnIndex])]));
            rows.sort((rowA, rowB) => {
                const keyA = keys.get(rowA);
                const keyB = keys.get(rowB);
                if (keyA.missing || keyB.missing) {
                    if (keyA.missing !== keyB.missing) return keyA.missing ? 1 : -1;
                    return 0;
                }

                let result = 0;
                if (keyA.date !== null || keyB.date !== null) {
                    result = keyA.date === null ? 1 : keyB.date === null ? -1 : keyA.date.localeCompare(keyB.date);
                    if (result === 0 && Number.isFinite(keyA.numeric) && Number.isFinite(keyB.numeric)) {
                        result = keyA.numeric - keyB.numeric;
                    }
                } else if (Number.isFinite(keyA.numeric) && Number.isFinite(keyB.numeric)) {
                    result = keyA.numeric - keyB.numeric;
                } else {
                    result = keyA.text.localeCompare(keyB.text);
                }
                return order === 'asc' ? result : -result;
            });
            rows.forEach(row => tbody.appendChild(row));
        }

        highlightNextMedals(table);
    }

    function bindLocalPredictionSorting(table) {
        if (table._enhancerLocalSortBound) return;
        table._enhancerLocalSortBound = true;
        table._enhancerSortState = {
            mode: getNativePredictionSort() ? 'native' : 'none',
            nativeSort: getNativePredictionSort()
        };

        table.addEventListener('click', event => {
            const target = event.target;
            const anchor = target instanceof Element ? target.closest('a[href]') : null;
            if (!anchor || !table.contains(anchor) || anchor.closest('th[data-enhancer-col]')) return;

            const header = anchor.closest('th');
            if (!header) return;
            const destination = new URL(anchor.href, window.location.href);
            const rank = destination.searchParams.get('sort_rank');
            const user = destination.searchParams.get('sort_user');
            const requestedOrder = destination.searchParams.get('sort_order');
            if (!rank || !requestedOrder || destination.origin !== window.location.origin) return;

            const columnIndex = getHeaderColumnIndex(table, header);
            if (columnIndex === null) return;

            const state = table._enhancerSortState;
            const sameHeader = state.mode === 'native' &&
                state.nativeSort?.rank === rank &&
                state.nativeSort?.user === user;
            const order = sameHeader && state.nativeSort.order === 'asc' ? 'desc' : 'asc';

            event.preventDefault();
            event.stopImmediatePropagation();
            state.mode = 'native';
            state.nativeSort = { rank, user, order };
            sortPredictionTable(table, columnIndex, order, header);
        }, true);
    }

    function toggleRecursionSort(table, th) {
        if (!table._enhancerSortState) bindLocalPredictionSorting(table);
        table._enhancerSortState.mode = 'recursion';

        const columnKey = th.dataset.enhancerCol;
        const currentOrder = th.dataset.sortOrder;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        th.dataset.sortOrder = newOrder;

        // Clear sort arrows from other column headers
        table.querySelectorAll('thead th').forEach(otherTh => {
            if (otherTh !== th) {
                delete otherTh.dataset.sortOrder;
                if (otherTh.childNodes) {
                    otherTh.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && (node.textContent.includes('↑') || node.textContent.includes('↓'))) {
                            node.textContent = node.textContent.replace(/[↑↓]/g, '');
                        }
                    });
                }
                const arrow = otherTh.querySelector('.enhancer-sort-arrow');
                if (arrow) arrow.textContent = '';
            }
        });

        // Update arrow in recursion th
        const arrowSpan = th.querySelector('.enhancer-sort-arrow');
        if (arrowSpan) {
            arrowSpan.textContent = newOrder === 'asc' ? '↑' : '↓';
        }

        // Sort rows within each tbody
        const tbodies = table.querySelectorAll('tbody');
        tbodies.forEach(tbody => {
            const rows = Array.from(tbody.querySelectorAll('tr')).filter(row => {
                return !row.querySelector('th') && row.cells.length >= 11;
            });

            rows.sort((rowA, rowB) => {
                const keyA = getRowRecursionSortKey(rowA, columnKey);
                const keyB = getRowRecursionSortKey(rowB, columnKey);

                if (newOrder === 'asc') {
                    if (keyA.hasDate && keyB.hasDate) {
                        const d = keyA.dateStr.localeCompare(keyB.dateStr);
                        return d !== 0 ? d : keyA.short - keyB.short;
                    }
                    if (keyA.hasDate) return -1;
                    if (keyB.hasDate) return 1;
                    return keyA.short - keyB.short;
                } else {
                    if (keyA.hasDate && keyB.hasDate) {
                        const d = keyB.dateStr.localeCompare(keyA.dateStr);
                        return d !== 0 ? d : keyB.short - keyA.short;
                    }
                    if (keyA.hasDate) return -1;
                    if (keyB.hasDate) return 1;
                    return keyB.short - keyA.short;
                }
            });

            rows.forEach(r => tbody.appendChild(r));
        });

        highlightNextMedals(table);
    }

    function removeUnusedMedals(table = document.querySelector('table#predictionTable')) {
        if (!table) return false;

        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 1 && !row.querySelector('th');
        });

        for (const row of rows) {
            const rawName = row.cells[0].childNodes[0]?.textContent?.trim() || row.cells[0].innerText.split('\n')[0].trim();
            if (isUnusedMedal(rawName)) {
                const tbody = row.parentElement;
                row.remove();
                if (tbody && tbody.tagName.toLowerCase() === 'tbody' && tbody.children.length === 0) {
                    tbody.remove();
                }
            }
        }

        return true;
    }

    function keepPredictionLabelsVisible() {
        if (document.getElementById('enhancer-sticky-prediction-labels')) return;

        const style = document.createElement('style');
        style.id = 'enhancer-sticky-prediction-labels';
        style.textContent = '#predictionTable tbody td:first-child {' +
            'position: -webkit-sticky !important; position: sticky !important; left: 0 !important;' +
            'z-index: 2; background-color: #262626; background-clip: padding-box;' +
            'box-shadow: -8px 0 0 #262626, 2px 0 3px rgba(0, 0, 0, 0.35), inset 0 0 0 1px rgba(255, 255, 255, 0.25);' +
            '}';
        (document.head || document.documentElement).appendChild(style);
    }

    function addRecursionPredictionColumn(table) {
        if (!table) return false;
        bindLocalPredictionSorting(table);

        const theadRows = Array.from(table.querySelectorAll('thead tr'));
        if (!theadRows.length) return false;

        const layout = getPredictionTableLayout(table);
        for (let player = 0; player < layout.playerCount; player++) {
            const columnKey = layout.playerCount === 1 ? 'recursion' : `recursion-${player}`;
            if (table.querySelector(`th[data-enhancer-col="${columnKey}"]`)) continue;

            const colgroup = table.querySelector('colgroup');
            if (colgroup) {
                const col = document.createElement('col');
                col.dataset.enhancerCol = columnKey;
                if (colgroup.children.length >= 2 && colgroup.children.length % 2 === 0) {
                    col.classList.add('current');
                }
                col.style.width = '85px';
                col.style.minWidth = '85px';
                colgroup.appendChild(col);
            }

            const th = document.createElement('th');
            th.dataset.enhancerCol = columnKey;
            th.dataset.playerIndex = String(player);
            th.title = `Sort by Next Black Multiple (Recursion${layout.playerCount === 2 ? `: ${theadRows[0].cells[1 + player].innerText.trim()}` : ''})`;
            th.style.cursor = 'pointer';
            th.style.whiteSpace = 'nowrap';
            th.style.minWidth = '85px';
            th.style.padding = '8px 4px';
            th.style.boxSizing = 'border-box';
            th.style.textAlign = 'center';
            th.style.verticalAlign = 'middle';
            th.innerHTML = '<div style="display: inline-flex; align-items: center; justify-content: center; gap: 2px; max-width: 100%; vertical-align: middle;">' +
                '<a href="#predictionTable" style="text-decoration: none; cursor: pointer; display: inline-flex; align-items: center;">' +
                    '<div class="recursion-frame" style="display: inline-block; vertical-align: middle; width:48px;">' +
                        '<img alt="black" src="/img/black.png" height="32" width="32">' +
                    '</div>' +
                '</a>' +
                '<span class="enhancer-sort-arrow" style="display: inline-block; font-size: 13px; line-height: 1; user-select: none;"></span>' +
            '</div>';

            if (layout.playerCount === 2 && theadRows.length > 1) {
                th.colSpan = layout.playerCount;
                th.removeAttribute('data-enhancer-col');
                th.removeAttribute('data-player-index');
                th.removeAttribute('title');
                th.style.cursor = 'default';
                th.innerHTML = '<div style="display: inline-flex; align-items: center; justify-content: center; max-width: 100%; vertical-align: middle;">' +
                    '<div class="recursion-frame" style="display: inline-block; vertical-align: middle; width:48px;">' +
                        '<img alt="black" src="/img/black.png" height="32" width="32">' +
                    '</div>' +
                '</div>';

                const agentHeader = theadRows[0].cells[1 + player].cloneNode(true);
                agentHeader.dataset.enhancerAgentHeader = columnKey;
                agentHeader.dataset.enhancerCol = columnKey;
                agentHeader.dataset.playerIndex = String(player);
                agentHeader.title = `Sort by Next Black Multiple (Recursion: ${agentHeader.innerText.trim()})`;
                agentHeader.style.cursor = 'pointer';
                const agentLabel = agentHeader.querySelector('.enl');
                if (agentLabel) {
                    const arrow = document.createElement('span');
                    arrow.className = 'enhancer-sort-arrow';
                    arrow.style.marginLeft = '4px';
                    arrow.style.fontSize = '13px';
                    arrow.style.userSelect = 'none';
                    agentLabel.appendChild(arrow);
                }
                agentHeader.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleRecursionSort(table, agentHeader);
                });
                theadRows[0].appendChild(agentHeader);
                if (player === 0) {
                    theadRows[1].appendChild(th);
                    for (let rowIndex = 2; rowIndex < theadRows.length; rowIndex++) {
                        theadRows[rowIndex].appendChild(document.createElement('th'));
                    }
                }
            } else {
                th.addEventListener('click', (e) => {
                    e.preventDefault();
                    toggleRecursionSort(table, th);
                });
                theadRows[0].appendChild(th);
                for (let rowIndex = 1; rowIndex < theadRows.length; rowIndex++) {
                    theadRows[rowIndex].appendChild(document.createElement('th'));
                }
            }
        }

        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 1 + layout.playerCount * 10 && !row.querySelector('th');
        });

        if (!rows.length) return false;

        const { baseDate, windowDays } = detectPredictionParameters(table, layout);

        for (const row of rows) {
            const rawName = row.cells[0].childNodes[0]?.textContent?.trim() || row.cells[0].innerText.split('\n')[0].trim();
            const req = getBlackRequirement(rawName);
            for (let player = 0; player < layout.playerCount; player++) {
                const columnKey = layout.playerCount === 1 ? 'recursion' : `recursion-${player}`;
                if (row.querySelector(`td[data-enhancer-col="${columnKey}"]`)) continue;

                const total = parseFloat(row.cells[layout.totalIndex(player)].innerText.replace(/,/g, '').trim());
                const diff = parseFloat(row.cells[layout.diffIndex(player)].innerText.replace(/,/g, '').trim());
                const week = parseFloat(row.cells[layout.weekIndex(player)].innerText.replace(/,/g, '').trim());
                const month = parseFloat(row.cells[layout.monthIndex(player)].innerText.replace(/,/g, '').trim());

                let cellContent = 'N/A';
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
                td.dataset.enhancerCol = columnKey;
                td.dataset.playerIndex = String(player);
                td.style.whiteSpace = 'nowrap';
                td.style.padding = '8px 4px';
                td.style.boxSizing = 'border-box';
                if (nextMultiple) {
                    td.dataset.nextMultiple = String(nextMultiple);
                }
                if (cellTitle) {
                    td.title = cellTitle;
                }
                td.innerHTML = cellContent;
                row.appendChild(td);
            }
        }

        return true;
    }

    function highlightNextMedals(table = document.querySelector('table#predictionTable')) {
        if (!table) return false;

        const layout = getPredictionTableLayout(table);
        const rows = Array.from(table.querySelectorAll('tbody tr')).filter(row => {
            return row.cells.length >= 1 + layout.playerCount * 10 && !row.querySelector('th');
        });

        if (!rows.length) return false;

        // Clear any previous highlights (both server-rendered and enhancer-applied)
        table.querySelectorAll('tbody td.highlight, tbody td[data-enhancer-highlight="true"]').forEach(td => {
            td.classList.remove('highlight');
            td.style.backgroundColor = '';
            td.style.fontWeight = '';
            delete td.dataset.enhancerHighlight;
        });

        for (let player = 0; player < layout.playerCount; player++) {
            for (let tier = 0; tier < 5; tier++) {
                let earliestDate = null;
                let targetCell = null;

                for (const row of rows) {
                    const hasPositiveProgress = [
                        layout.diffIndex(player),
                        layout.weekIndex(player),
                        layout.monthIndex(player)
                    ].some(index => {
                        const value = parseFloat(row.cells[index].innerText.replace(/,/g, '').trim());
                        return value > 0;
                    });
                    if (!hasPositiveProgress) continue;

                    const currentCell = row.cells[layout.medalIndex(player, tier)];
                    if (!currentCell || currentCell.querySelector('img')) continue;

                    const match = currentCell.innerText.match(/\b\d{4}-\d{2}-\d{2}\b/);
                    if (!match) continue;

                    const dateStr = match[0];
                    if (!earliestDate || dateStr < earliestDate) {
                        earliestDate = dateStr;
                        targetCell = currentCell;
                    }
                }

                if (targetCell) {
                    targetCell.classList.add('highlight');
                }
            }
        }

        for (let player = 0; player < layout.playerCount; player++) {
            const recursionKey = layout.playerCount === 1 ? 'recursion' : `recursion-${player}`;
            let earliestRecursionDate = null;
            let nextRecursionCell = null;

            for (const row of rows) {
                const currentCell = row.querySelector(`td[data-enhancer-col="${recursionKey}"]`);
                if (!currentCell) continue;

                const match = currentCell.innerText.match(/\b\d{4}-\d{2}-\d{2}\b/);
                if (match && (!earliestRecursionDate || match[0] < earliestRecursionDate)) {
                    earliestRecursionDate = match[0];
                    nextRecursionCell = currentCell;
                }
            }

            if (nextRecursionCell) {
                nextRecursionCell.classList.add('highlight');
            }
        }

        return true;
    }

    function getHighchartsChart() {
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        return (typeof win.$ !== 'undefined' && win.$('#container').highcharts && win.$('#container').highcharts()) ||
               (typeof $ !== 'undefined' && $('#container').highcharts && $('#container').highcharts()) ||
               (typeof win.Highcharts !== 'undefined' && win.Highcharts.charts && win.Highcharts.charts.find(c => c)) ||
               (typeof Highcharts !== 'undefined' && Highcharts.charts && Highcharts.charts.find(c => c)) ||
               null;
    }

    function escapeHighchartsHtml(value) {
        return String(value).replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[char]);
    }

    function getRecursionCountForValue(medalName, value) {
        const requirement = getBlackRequirement(medalName);
        if (!requirement || value === null || value === undefined || value === '' ||
            !Number.isFinite(Number(value))) return null;

        const count = Math.floor(Number(value) / requirement);
        return count >= 2 ? count : null;
    }

    function getRecursionCountFromLabel(labelText) {
        const plainLabel = getPlainHighchartsLabelText(labelText);
        const match = plainLabel.match(/(?:^|\b)(\d+)\s*x\b/i) ||
            plainLabel.match(/\bx\s*(\d+)(?:\b|$)/i);
        const count = match ? Number(match[1]) : null;
        return Number.isInteger(count) && count >= 2 ? count : null;
    }

    function getMedalImageHtml(medalName, tier = 'bronze', recursionCount = null) {
        const imageName = MEDAL_IMAGE_NAMES[normalizeMedalName(medalName)] ||
            medalName.toLowerCase().trim()
                .replace(/\s+/g, '_')
                .replace(/[^a-z0-9_-]/g, '');
        if (!imageName) return '';

        if (tier === 'black' && Number.isInteger(recursionCount) && recursionCount >= 2) {
            return `<div class="recursion-frame" style="display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;box-sizing:border-box;width:28px;height:28px;padding:0;background-size:28px 28px;margin-right:4px;">` +
                `<span class="badge" style="position:relative;display:inline-flex;align-items:center;justify-content:center;line-height:0;">` +
                `<img src="/img/${imageName}-black.png" style="display:block;width:18px;height:18px">` +
                `<span style="position:absolute;top:-5px;right:-7px;z-index:1;display:block;width:16px;height:16px;border-radius:50%;background:#fdd73c;color:#000;font:11px/16px Arial,sans-serif;text-align:center;white-space:nowrap;">${recursionCount}</span>` +
                '</span></div>';
        }

        return `<img src="/img/${imageName}-${tier}.png" style="width:18px;height:18px;vertical-align:middle;margin-right:4px">`;
    }

    function getPlainHighchartsLabelText(labelText) {
        return String(labelText || '')
            .replace(/<[^>]*>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
    }

    function getTierFromMedalLabel(labelText, medalName) {
        const normalizedLabel = normalizeMedalName(getPlainHighchartsLabelText(labelText));
        const normalizedMedal = normalizeMedalName(medalName);
        if (!normalizedMedal || !normalizedLabel.startsWith(normalizedMedal)) return null;

        const suffix = normalizedLabel.slice(normalizedMedal.length);
        if (suffix.includes('bronze')) return 'bronze';
        if (suffix.includes('silver')) return 'silver';
        if (suffix.includes('gold')) return 'gold';
        if (suffix.includes('platinum')) return 'platinum';
        // Agent Stats calls the top medal Black; its image and recursion lines
        // retain that name even when describing the Onyx tier.
        if (suffix.includes('black') || suffix.includes('onyx')) return 'black';
        return null;
    }

    function getMedalTierRequirements(medalName, axis) {
        const requirements = new Map();
        const addPlotLines = plotLines => {
            if (!Array.isArray(plotLines)) return;
            for (const plotLine of plotLines) {
                const options = plotLine.options || plotLine;
                if (options.id?.startsWith('enhancer-recursed-onyx-')) continue;
                const tier = getTierFromMedalLabel(options.label?.text, medalName);
                const value = Number(options.value);
                if (tier && Number.isFinite(value)) {
                    requirements.set(tier, value);
                }
            }
        };

        if (axis) {
            addPlotLines(axis.options?.plotLines);
            addPlotLines(axis.plotLinesAndBands);
        }

        const blackRequirement = getBlackRequirement(medalName);
        if (blackRequirement && !requirements.has('black')) {
            requirements.set('black', blackRequirement);
        }
        return requirements;
    }

    function getMedalTierForValue(medalName, value, axis) {
        if (normalizeMedalName(medalName) === 'recursions') {
            if (value === null || value === undefined || value === '' ||
                !Number.isFinite(Number(value))) return null;
            return Number(value) >= 1 ? 'bronze' : null;
        }

        if (!getBlackRequirement(medalName) || value === null || value === undefined ||
            value === '' || !Number.isFinite(Number(value))) return null;

        const currentValue = Number(value);
        const requirements = getMedalTierRequirements(medalName, axis);
        let achievedTier = null;
        let achievedRequirement = -Infinity;
        for (const [tier, requirement] of requirements) {
            if (currentValue >= requirement && requirement >= achievedRequirement) {
                achievedTier = tier;
                achievedRequirement = requirement;
            }
        }
        return achievedTier;
    }

    function getLatestSeriesValue(series) {
        const points = getMilestoneSeriesPoints(series);
        return points.length ? points[points.length - 1].y : null;
    }

    function getHighchartsMedalName(seriesName) {
        return seriesName.split('(@')[0].trim();
    }

    function getPreviousHighchartsPoint(series, point) {
        if (!Number.isFinite(Number(point?.x))) return null;

        const previousPoints = getMilestoneSeriesPoints(series)
            .filter(candidate => candidate.x < Number(point.x));
        return previousPoints.length ? previousPoints[previousPoints.length - 1] : null;
    }

    function formatHighchartsElapsedTime(milliseconds) {
        const totalMinutes = Math.floor(milliseconds / 60000);
        const days = Math.floor(totalMinutes / 1440);
        const hours = Math.floor((totalMinutes % 1440) / 60);
        const minutes = totalMinutes % 60;
        const parts = [];

        if (days) parts.push(`${days}d`);
        if (hours) parts.push(`${hours}h`);
        if (minutes || parts.length === 0) parts.push(`${minutes}m`);
        return `(+${parts.join(' ')})`;
    }

    function synchronizeHighchartsMedalColors(chart) {
        if (!chart?.series || !chart.yAxis) return false;

        let changed = false;
        const styledAxes = new Set();

        for (const series of chart.series) {
            if (!series?.name || series.options?.showInLegend === false) continue;

            const medalName = getHighchartsMedalName(series.name);
            const axis = series.yAxis;
            if (!getBlackRequirement(medalName) || !axis || !series.color) continue;

            if (!styledAxes.has(axis)) {
                styledAxes.add(axis);
                const titleStyle = axis.options?.title?.style || {};
                const labelStyle = axis.options?.labels?.style || {};
                const plotLines = axis.options?.plotLines;
                let plotLinesChanged = false;
                const updatedPlotLines = Array.isArray(plotLines)
                    ? plotLines.map(plotLine => {
                        const tier = getTierFromMedalLabel(plotLine.label?.text, medalName);
                        if (!tier) return plotLine;

                        const plotLineLabelStyle = plotLine.label.style || {};
                        if (plotLine.color === series.color &&
                            plotLineLabelStyle.color === series.color) return plotLine;

                        plotLinesChanged = true;
                        return {
                            ...plotLine,
                            color: series.color,
                            label: {
                                ...plotLine.label,
                                style: { ...plotLineLabelStyle, color: series.color }
                            }
                        };
                    })
                    : plotLines;

                if (titleStyle.color !== series.color || labelStyle.color !== series.color ||
                    plotLinesChanged) {
                    const axisOptions = {
                        title: { style: { ...titleStyle, color: series.color } },
                        labels: { style: { ...labelStyle, color: series.color } }
                    };
                    if (plotLinesChanged) axisOptions.plotLines = updatedPlotLines;
                    axis.update(axisOptions, false);
                    changed = true;
                }
            }

            const extrapolationName = series.name.replace(/\)$/, ' extrapolation)');
            const extrapolation = chart.series.find(candidate => {
                return candidate?.name?.toLowerCase() === extrapolationName.toLowerCase();
            });
            if (extrapolation && extrapolation.color !== series.color) {
                extrapolation.update({ color: series.color }, false);
                changed = true;
            }
        }

        if (changed) chart.redraw();
        return changed;
    }

    function setupHighchartsTooltipWidth(chart) {
        const tooltip = chart?.tooltip;
        if (!tooltip || tooltip._enhancerWidthSetup || typeof tooltip.refresh !== 'function') return false;

        const originalRefresh = tooltip.refresh;
        const setTooltipWidth = () => {
            const tooltipElement = tooltip.label?.div;
            if (!(tooltipElement instanceof HTMLElement)) return;

            for (const element of [tooltipElement, tooltipElement.firstElementChild]) {
                if (!(element instanceof HTMLElement)) continue;
                element.style.setProperty('width', '320px', 'important');
                element.style.setProperty('min-width', '320px', 'important');
                element.style.setProperty('max-width', 'none', 'important');
                element.style.setProperty('box-sizing', 'border-box', 'important');
            }
        };

        tooltip.refresh = function() {
            const result = originalRefresh.apply(this, arguments);
            setTooltipWidth();
            requestAnimationFrame(setTooltipWidth);
            return result;
        };
        tooltip._enhancerWidthSetup = true;
        return true;
    }

    function setupTooltipPlotLineLabelCollision(chart) {
        const tooltip = chart?.tooltip;
        if (!tooltip || tooltip._enhancerPlotLineCollisionSetup ||
            typeof tooltip.refresh !== 'function' || typeof tooltip.hide !== 'function') return false;

        const originalRefresh = tooltip.refresh;
        const originalHide = tooltip.hide;
        const hiddenLabels = new Map();

        const restoreLabels = () => {
            for (const [label, visibility] of hiddenLabels) {
                if (!label.isConnected) continue;
                if (visibility.value) {
                    label.style.setProperty('visibility', visibility.value, visibility.priority);
                } else {
                    label.style.removeProperty('visibility');
                }
            }
            hiddenLabels.clear();
        };

        const hideOverlappingLabels = () => {
            restoreLabels();

            const tooltipElement = tooltip.label?.element;
            if (!tooltipElement || tooltipElement.getAttribute('visibility') === 'hidden' ||
                tooltipElement.getAttribute('opacity') === '0') return;

            const tooltipRect = tooltipElement.getBoundingClientRect();
            if (!tooltipRect.width || !tooltipRect.height) return;

            for (const label of chart.container.querySelectorAll('.highcharts-plot-line-label')) {
                const labelRect = label.getBoundingClientRect();
                const overlaps = labelRect.width > 0 && labelRect.height > 0 &&
                    labelRect.left < tooltipRect.right && labelRect.right > tooltipRect.left &&
                    labelRect.top < tooltipRect.bottom && labelRect.bottom > tooltipRect.top;
                if (!overlaps) continue;

                hiddenLabels.set(label, {
                    value: label.style.getPropertyValue('visibility'),
                    priority: label.style.getPropertyPriority('visibility')
                });
                label.style.setProperty('visibility', 'hidden', 'important');
            }
        };

        tooltip.refresh = function() {
            const result = originalRefresh.apply(this, arguments);
            hideOverlappingLabels();
            requestAnimationFrame(hideOverlappingLabels);
            return result;
        };
        tooltip.hide = function() {
            try {
                return originalHide.apply(this, arguments);
            } finally {
                restoreLabels();
            }
        };
        tooltip._enhancerPlotLineCollisionSetup = true;
        return true;
    }

    function addIconsToNativeMedalLabels(chart) {
        let changed = false;
        for (const axis of chart.yAxis || []) {
            const plotLines = axis.options?.plotLines;
            if (!Array.isArray(plotLines)) continue;

            let axisChanged = false;
            const updatedPlotLines = plotLines.map(plotLine => {
                const label = plotLine.label;
                if (!label || typeof label !== 'object') return plotLine;

                const plainLabel = typeof label.text === 'string'
                    ? getPlainHighchartsLabelText(label.text)
                    : null;
                const medalName = plainLabel && Object.keys(BLACK_MEDAL_REQUIREMENTS)
                    .sort((a, b) => b.length - a.length)
                    .find(name => getTierFromMedalLabel(plainLabel, name));
                if (!medalName) return plotLine;

                changed = true;
                axisChanged = true;
                const tier = getTierFromMedalLabel(plainLabel, medalName);
                const recursionCount = tier === 'black'
                    ? getRecursionCountFromLabel(plainLabel) ??
                        getRecursionCountForValue(medalName, plotLine.value)
                    : null;
                return {
                    ...plotLine,
                    label: {
                        ...label,
                        text: `${getMedalImageHtml(medalName, tier, recursionCount)}${escapeHighchartsHtml(plainLabel)}`,
                        useHTML: true
                    }
                };
            });

            if (axisChanged) {
                axis.update({ plotLines: updatedPlotLines }, false);
            }
        }

        return changed;
    }

    function setupHighchartsMedalIcons(chart) {
        if (!chart || chart._enhancerMedalIconsSetup) return false;

        const highcharts = (typeof unsafeWindow !== 'undefined' ? unsafeWindow : window).Highcharts || window.Highcharts;
        if (typeof highcharts?.numberFormat !== 'function' ||
            typeof highcharts?.dateFormat !== 'function') return false;

        chart.update({
            legend: {
                useHTML: true,
                labelFormatter: function() {
                    if (!this.name || this.options?.showInLegend === false) return escapeHighchartsHtml(this.name || '');
                    const medalName = getHighchartsMedalName(this.name);
                    const latestValue = getLatestSeriesValue(this);
                    const tier = getMedalTierForValue(medalName, latestValue, this.yAxis);
                    const recursionCount = tier === 'black'
                        ? getRecursionCountForValue(medalName, latestValue)
                        : null;
                    const icon = tier ? getMedalImageHtml(medalName, tier, recursionCount) : '';
                    return `${icon}${escapeHighchartsHtml(this.name)}`;
                }
            },
            tooltip: {
                useHTML: true,
                formatter: function() {
                    const points = this.points || [this];
                    const timestamp = this.x;
                    const date = highcharts.dateFormat('%Y-%m-%d', timestamp);
                    const previousPoint = points
                        .map(point => getPreviousHighchartsPoint(point.series, point))
                        .find(candidate => candidate);
                    const elapsedTime = previousPoint
                        ? ` ${formatHighchartsElapsedTime(timestamp - previousPoint.x)}`
                        : '';
                    const rows = points.map(point => {
                        const medalName = getHighchartsMedalName(point.series.name);
                        const tier = getMedalTierForValue(medalName, point.y, point.series.yAxis);
                        const recursionCount = tier === 'black'
                            ? getRecursionCountForValue(medalName, point.y)
                            : null;
                        const icon = tier ? getMedalImageHtml(medalName, tier, recursionCount) : '';
                        const previous = getPreviousHighchartsPoint(point.series, point);
                        const delta = previous ? Number(point.y) - previous.y : null;
                        const deltaText = Number.isFinite(delta)
                            ? ` (${delta >= 0 ? '+' : '-'}${highcharts.numberFormat(Math.abs(delta), 0)})`
                            : '';
                        const color = typeof point.color === 'string'
                            ? point.color
                            : typeof point.series.color === 'string' ? point.series.color : null;
                        const row = `<b>${escapeHighchartsHtml(point.series.name)}</b>: ` +
                            `${highcharts.numberFormat(point.y, 0)}${deltaText}`;
                        return `${icon}${color ? `<span style="color:${escapeHighchartsHtml(color)}">${row}</span>` : row}`;
                    });
                    return `<span>${date}${elapsedTime}</span><br>${rows.join('<br>')}`;
                }
            }
        }, false);
        addIconsToNativeMedalLabels(chart);
        setupHighchartsTooltipWidth(chart);
        setupTooltipPlotLineLabelCollision(chart);
        chart.redraw();
        chart._enhancerMedalIconsSetup = true;
        return true;
    }

    function getLifetimeApPoints(series) {
        const rawPoints = series.options?.data?.length
            ? series.options.data
            : (series.data?.length ? series.data : series.points);
        if (!Array.isArray(rawPoints)) return [];

        return rawPoints.map(point => {
            if (Array.isArray(point)) {
                return { x: Number(point[0]), y: Number(point[1]) };
            }
            return {
                x: Number(point?.x ?? point?.options?.x),
                y: Number(point?.y ?? point?.options?.y)
            };
        }).filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
            .sort((a, b) => a.x - b.x);
    }

    function updateJustGainedAp(chart = getHighchartsChart()) {
        if (!chart?.series) return false;

        let updatedAny = false;
        for (const summary of document.querySelectorAll('.predictionList')) {
            const usernameElement = summary.querySelector('p .enl');
            const username = usernameElement?.textContent.trim().replace(/^@/, '');
            if (!username) continue;

            const expectedName = `lifetime_ap (@${username})`.toLowerCase();
            const series = chart.series.find(candidate => candidate?.name?.toLowerCase() === expectedName);
            if (!series) continue;

            const points = getLifetimeApPoints(series);
            if (points.length < 2) continue;

            const previous = points[points.length - 2];
            const latest = points[points.length - 1];
            const gained = latest.y - previous.y;

            const justGainedItem = Array.from(summary.querySelectorAll('li'))
                .find(item => /just gained/i.test(item.textContent));
            const justGainedNode = justGainedItem && Array.from(justGainedItem.childNodes).find(node => {
                return node.nodeType === Node.TEXT_NODE && /just gained/i.test(node.textContent);
            });
            if (justGainedNode && Number.isFinite(gained) && gained >= 0) {
                const updatedText = justGainedNode.textContent.replace(
                    /(just gained\s+)[\d,]+(\s+AP)/i,
                    `$1${gained.toLocaleString('en-US')}$2`
                );
                if (updatedText !== justGainedNode.textContent) {
                    justGainedNode.textContent = updatedText;
                    updatedAny = true;
                }
            }

            const extremes = chart.xAxis?.[0]?.getExtremes?.();
            const selectedPoints = extremes && Number.isFinite(extremes.min) && Number.isFinite(extremes.max)
                ? points.filter(point => point.x >= extremes.min && point.x <= extremes.max)
                : points;
            if (selectedPoints.length < 2) continue;

            const selectedGain = selectedPoints[selectedPoints.length - 1].y - selectedPoints[0].y;
            if (!Number.isFinite(selectedGain) || selectedGain < 0) continue;

            const diffItem = Array.from(summary.querySelectorAll('li'))
                .find(item => /gains\s+-?[\d,]+\s+AP\s+every\s+diff/i.test(item.textContent));
            const diffNode = diffItem && Array.from(diffItem.childNodes).find(node => {
                return node.nodeType === Node.TEXT_NODE && /gains\s+-?[\d,]+\s+AP\s+every\s+diff/i.test(node.textContent);
            });
            if (diffNode) {
                const updatedText = diffNode.textContent.replace(
                    /(gains\s+)-?[\d,]+(\s+AP\s+every\s+diff)/i,
                    `$1${selectedGain.toLocaleString('en-US')}$2`
                );
                if (updatedText !== diffNode.textContent) {
                    diffNode.textContent = updatedText;
                    updatedAny = true;
                }
            }
        }

        return updatedAny;
    }

    function removeUnusedMedalsFromHighcharts(chart = getHighchartsChart()) {
        if (!chart || !chart.series) return false;

        let removedAny = false;
        for (let i = chart.series.length - 1; i >= 0; i--) {
            const serie = chart.series[i];
            if (!serie || !serie.name) continue;

            const rawName = serie.name.split('(')[0].trim();
            if (isUnusedMedal(rawName)) {
                serie.remove(false);
                removedAny = true;
            }
        }

        if (removedAny) {
            chart.redraw();
        }

        return removedAny;
    }

    function getMilestoneSeriesPoints(series) {
        const rawPoints = Array.isArray(series.options?.data) && series.options.data.length
            ? series.options.data
            : (series.data?.length ? series.data : series.points);
        if (!Array.isArray(rawPoints)) return [];

        return rawPoints.map((point, index) => {
            let x;
            let y;
            if (Array.isArray(point)) {
                x = point.length > 1 ? Number(point[0]) : index;
                y = Number(point.length > 1 ? point[1] : point[0]);
            } else if (typeof point === 'number') {
                x = index;
                y = point;
            } else {
                x = Number(point?.x ?? point?.options?.x ?? index);
                y = Number(point?.y ?? point?.options?.y);
            }
            return { x, y, index };
        }).filter(point => Number.isFinite(point.y))
            .sort((a, b) => a.x - b.x || a.index - b.index);
    }

    function updateOnyxMilestoneLines(chart) {
        if (!chart?.yAxis?.length) return false;

        const lineIdPrefix = 'enhancer-recursed-onyx-';
        const milestonesByAxis = new Map(chart.yAxis.map(axis => [axis, new Map()]));

        for (const series of chart.series) {
            if (!series || series.visible === false ||
                series.options?.showInLegend === false || !series.name) continue;

            const axis = series.yAxis || chart.yAxis[0];
            if (!axis?.addPlotLine || !axis.removePlotLine) continue;
            if (!milestonesByAxis.has(axis)) milestonesByAxis.set(axis, new Map());
            const milestones = milestonesByAxis.get(axis);

            const medalName = series.name.split('(')[0].trim();
            const requirement = getBlackRequirement(medalName);
            if (!requirement) continue;

            const extremes = axis.getExtremes?.();
            const min = Number.isFinite(extremes?.min) ? extremes.min : axis.min;
            const max = Number.isFinite(extremes?.max) ? extremes.max : axis.max;
            if (!Number.isFinite(min) || !Number.isFinite(max)) continue;

            const firstVisibleMultiple = Math.max(2, Math.ceil(min / requirement));
            const lastVisibleMultiple = Math.floor(max / requirement);
            for (let multiple = firstVisibleMultiple; multiple <= lastVisibleMultiple; multiple++) {
                const id = `${lineIdPrefix}${normalizeMedalName(medalName)}-${multiple}`;
                milestones.set(id, { id, medalName, multiple, requirement });
            }
        }

        let changed = false;

        for (const [axis, milestones] of milestonesByAxis) {
            if (!axis?.addPlotLine || !axis.removePlotLine) continue;

            const plotLines = axis.plotLinesAndBands || [];
            const existingLines = new Map(plotLines
                .filter(line => line.options?.id?.startsWith(lineIdPrefix))
                .map(line => [line.options.id, line.options]));

            for (const id of existingLines.keys()) {
                if (!milestones.has(id)) {
                    axis.removePlotLine(id);
                    changed = true;
                }
            }

            for (const milestone of milestones.values()) {
                const existing = existingLines.get(milestone.id);
                const desiredValue = milestone.multiple * milestone.requirement;
                const sourceLine = plotLines.find(line => {
                    const options = line.options;
                    const labelText = options?.label?.text;
                    return options && !options.id?.startsWith(lineIdPrefix) &&
                        options.value === milestone.requirement &&
                        typeof labelText === 'string' &&
                        getTierFromMedalLabel(labelText, milestone.medalName) === 'black';
                });
                const styleLine = sourceLine || plotLines.find(line => {
                    const options = line.options;
                    return options && !options.id?.startsWith(lineIdPrefix) &&
                        options.value === milestone.requirement;
                });
                const sourceOptions = styleLine?.options || {};
                const desiredLabelColor = sourceOptions.label?.style?.color;
                if (existing && existing.value === desiredValue &&
                    existing.color === sourceOptions.color &&
                    existing.label?.style?.color === desiredLabelColor) continue;
                if (existing) axis.removePlotLine(milestone.id);

                const labelOptions = { ...(sourceOptions.label || {}) };
                const existingLabel = getPlainHighchartsLabelText(sourceLine?.options?.label?.text);
                labelOptions.text = typeof existingLabel === 'string' && /(?:black|onyx)/i.test(existingLabel)
                    ? existingLabel.replace(/(?:black|onyx)/i, match => `${milestone.multiple}x ${match}`)
                    : `${milestone.medalName} ${milestone.multiple}x Black`;
                labelOptions.text = `${getMedalImageHtml(milestone.medalName, 'black', milestone.multiple)}${escapeHighchartsHtml(labelOptions.text)}`;
                labelOptions.useHTML = true;
                labelOptions.y = (Number.isFinite(labelOptions.y) ? labelOptions.y : 0) - 8;
                delete labelOptions.formatter;
                delete labelOptions.format;

                axis.addPlotLine({
                    ...sourceOptions,
                    id: milestone.id,
                    value: desiredValue,
                    dashStyle: 'Dash',
                    width: sourceOptions.width || 1,
                    label: labelOptions,
                    zIndex: sourceOptions.zIndex ?? 3
                });
                changed = true;
            }
        }

        if (changed) {
            chart._enhancerMilestoneRedraw = true;
            try {
                chart.redraw();
            } finally {
                chart._enhancerMilestoneRedraw = false;
            }
        }
        return changed;
    }

    function beginOnyxExtrapolation(chart = getHighchartsChart()) {
        if (!chart) return false;

        if (!chart._enhancerExtrapolationActive) {
            chart._enhancerExtrapolationActive = true;
            chart._enhancerOriginalAxisRanges = new Map(
                (chart.yAxis || []).map(axis => {
                    const extremes = axis.getExtremes?.() || {};
                    return [axis, {
                        userMin: Number.isFinite(extremes.userMin) ? extremes.userMin : null,
                        userMax: Number.isFinite(extremes.userMax) ? extremes.userMax : null
                    }];
                })
            );
        }

        return true;
    }

    function endOnyxExtrapolation(chart = getHighchartsChart()) {
        if (!chart) return false;

        chart._enhancerExtrapolationActive = false;
        const originalRanges = chart._enhancerOriginalAxisRanges;
        chart._enhancerOriginalAxisRanges = null;
        if (!(originalRanges instanceof Map)) return false;

        let restored = false;
        for (const [axis, range] of originalRanges) {
            if (!axis || typeof axis.setExtremes !== 'function') continue;
            axis.setExtremes(range.userMin, range.userMax, false, false);
            delete axis._enhancerMilestoneMax;
            restored = true;
        }
        return restored;
    }

    function setupOnyxMilestoneEvents(chart) {
        if (!chart || chart._enhancerMilestoneEventsBound) return false;

        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const highcharts = win.Highcharts || window.Highcharts;
        if (typeof highcharts?.addEvent !== 'function') return false;

        const scheduleUpdate = () => {
            if (chart._enhancerMilestoneRedraw) return;
            if (chart._enhancerMilestoneUpdateScheduled) return;
            chart._enhancerMilestoneUpdateScheduled = true;
            setTimeout(() => {
                chart._enhancerMilestoneUpdateScheduled = false;
                if (!chart.destroyed) {
                    updateOnyxMilestoneLines(chart);
                }
            }, 0);
        };

        highcharts.addEvent(chart, 'redraw', scheduleUpdate);
        for (const axis of chart.yAxis || []) {
            highcharts.addEvent(axis, 'afterSetExtremes', scheduleUpdate);
        }
        chart._enhancerMilestoneEventsBound = true;
        return true;
    }

    function setupOnyxExtrapolationEvents(chart) {
        if (!chart?.series || chart._enhancerOnyxExtrapolationEventsBound) return false;

        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const highcharts = win.Highcharts || window.Highcharts;
        if (typeof highcharts?.addEvent !== 'function') return false;

        for (const series of chart.series) {
            if (!series?.name || series.options?.showInLegend === false ||
                !getBlackRequirement(series.name.split('(')[0].trim())) continue;

            highcharts.addEvent(series, 'show', () => {
                if (!chart._enhancerExtrapolationActive ||
                    chart._enhancerOnyxExtrapolationUpdateScheduled) return;

                chart._enhancerOnyxExtrapolationUpdateScheduled = true;
                setTimeout(() => {
                    chart._enhancerOnyxExtrapolationUpdateScheduled = false;
                    if (!chart.destroyed && chart._enhancerExtrapolationActive) {
                        try {
                            updateOnyxExtrapolations(chart);
                            chart.redraw();
                        } catch (err) {
                            console.error('Enhancer error updating onyx extrapolations after medal selection:', err);
                        }
                    }
                }, 0);
            });
        }

        chart._enhancerOnyxExtrapolationEventsBound = true;
        return true;
    }

    function updateOnyxExtrapolations(chart = getHighchartsChart()) {
        if (!chart || !chart.series) return false;

        removeUnusedMedalsFromHighcharts(chart);
        updateOnyxMilestoneLines(chart);

        const extremes = chart.xAxis && chart.xAxis[0] ? chart.xAxis[0].getExtremes() : null;
        const min = extremes ? extremes.min : -Infinity;
        const max = extremes ? extremes.max : Infinity;

        for (let i = 0; i < chart.series.length; i++) {
            const serie = chart.series[i];
            const previous = chart.series[i - 1];

            if (!serie || serie.options.showInLegend !== false || !previous || !previous.visible) {
                continue;
            }

            if (!previous.data || !previous.data.length) {
                continue;
            }

            const rawName = previous.name.split('(')[0].trim();
            if (isUnusedMedal(rawName)) {
                continue;
            }

            const req = getBlackRequirement(rawName);
            if (!req) {
                continue;
            }

            const validPoints = previous.data.filter(p => p && typeof p.x === 'number' && typeof p.y === 'number');
            if (validPoints.length < 2) {
                continue;
            }

            const pCurrent = validPoints[validPoints.length - 1];
            const currentY = pCurrent.y;

            let nextMultiple;
            let targetY;

            if (currentY >= req) {
                const currentMultiples = Math.floor(currentY / req);
                nextMultiple = Math.max(2, currentMultiples + 1);
                targetY = nextMultiple * req;
            } else if (!serie.data || serie.data.length === 0) {
                nextMultiple = 1;
                targetY = req;
            } else {
                continue;
            }

            // Find points in active zoom window
            let winPoints = validPoints.filter(p => p.x >= min && p.x <= max);
            if (winPoints.length < 2) {
                winPoints = validPoints;
            }

            let pFirst = winPoints[0];
            let pLast = winPoints[winPoints.length - 1];
            let dx = pLast.x - pFirst.x;
            let dy = pLast.y - pFirst.y;

            // If no progress in window, fall back to entire dataset
            if (dx <= 0 || dy <= 0) {
                pFirst = validPoints[0];
                pLast = pCurrent;
                dx = pLast.x - pFirst.x;
                dy = pLast.y - pFirst.y;
            }

            if (dx <= 0 || dy <= 0) {
                continue;
            }

            const rate = dy / dx;
            const short = targetY - currentY;
            const timeNeeded = short / rate;
            const targetX = Math.round(pCurrent.x + timeNeeded);

            serie.setData([
                { x: pCurrent.x, y: pCurrent.y, progress: "", period: "" },
                { x: targetX, y: targetY, progress: "", period: "", name: `${nextMultiple}x Black` }
            ], false);
            if (chart._enhancerExtrapolationActive && !serie.visible) {
                serie.setVisible(true, false);
            }
        }

        return true;
    }

    function setupHighchartsExtrapolation() {
        const win = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        let hooked = false;

        function hookExtrapolateFn() {
            if (typeof win.extrapolate === 'function' && !win.extrapolate._enhancerHooked) {
                const origExtrapolate = win.extrapolate;
                const hookedFn = function() {
                    try {
                        beginOnyxExtrapolation();
                        updateOnyxExtrapolations();
                    } catch (err) {
                        console.error('Enhancer error updating onyx extrapolations:', err);
                    }
                    return origExtrapolate.apply(this, arguments);
                };
                hookedFn._enhancerHooked = true;
                win.extrapolate = hookedFn;
                return true;
            }
            return false;
        }

        function hookUnextrapolateFn() {
            if (typeof win.unextrapolate === 'function' && !win.unextrapolate._enhancerHooked) {
                const origUnextrapolate = win.unextrapolate;
                const hookedFn = function() {
                    try {
                        endOnyxExtrapolation();
                    } catch (err) {
                        console.error('Enhancer error restoring the original graph axis:', err);
                    }
                    return origUnextrapolate.apply(this, arguments);
                };
                hookedFn._enhancerHooked = true;
                win.unextrapolate = hookedFn;
                return true;
            }
            return false;
        }

        if (hookExtrapolateFn()) {
            hooked = true;
        } else if (!win._enhancerExtrapolateDefined) {
            win._enhancerExtrapolateDefined = true;
            let currentFn = win.extrapolate;
            Object.defineProperty(win, 'extrapolate', {
                configurable: true,
                enumerable: true,
                get() {
                    return currentFn;
                },
                set(fn) {
                    if (typeof fn === 'function' && !fn._enhancerHooked) {
                        currentFn = function() {
                            try {
                                beginOnyxExtrapolation();
                                updateOnyxExtrapolations();
                            } catch (err) {
                                console.error('Enhancer error in extrapolate:', err);
                            }
                            return fn.apply(this, arguments);
                        };
                        currentFn._enhancerHooked = true;
                    } else {
                        currentFn = fn;
                    }
                }
            });
            hooked = true;
        }
        if (hookUnextrapolateFn()) {
            hooked = true;
        } else if (!win._enhancerUnextrapolateDefined) {
            win._enhancerUnextrapolateDefined = true;
            let currentFn = win.unextrapolate;
            Object.defineProperty(win, 'unextrapolate', {
                configurable: true,
                enumerable: true,
                get() {
                    return currentFn;
                },
                set(fn) {
                    if (typeof fn === 'function' && !fn._enhancerHooked) {
                        currentFn = function() {
                            try {
                                endOnyxExtrapolation();
                            } catch (err) {
                                console.error('Enhancer error restoring the original graph axis:', err);
                            }
                            return fn.apply(this, arguments);
                        };
                        currentFn._enhancerHooked = true;
                    } else {
                        currentFn = fn;
                    }
                }
            });
            hooked = true;
        }

        const btn = document.getElementById('extrapolate');
        if (btn && !btn._enhancerBound) {
            btn._enhancerBound = true;
            btn.addEventListener('click', () => {
                try {
                    beginOnyxExtrapolation();
                    updateOnyxExtrapolations();
                } catch (err) {
                    console.error('Enhancer error on extrapolate click:', err);
                }
            }, true);
            hooked = true;
        }
        const unextrapolateBtn = document.getElementById('unextrapolate');
        if (unextrapolateBtn && !unextrapolateBtn._enhancerBound) {
            unextrapolateBtn._enhancerBound = true;
            unextrapolateBtn.addEventListener('click', () => {
                try {
                    endOnyxExtrapolation();
                } catch (err) {
                    console.error('Enhancer error restoring the original graph axis:', err);
                }
            }, true);
            hooked = true;
        }

        const chart = getHighchartsChart();
        if (chart) {
            synchronizeHighchartsMedalColors(chart);
            setupHighchartsMedalIcons(chart);
            removeUnusedMedalsFromHighcharts(chart);
            setupOnyxMilestoneEvents(chart);
            setupOnyxExtrapolationEvents(chart);
            updateOnyxMilestoneLines(chart);
        }

        return hooked;
    }

    function enhanceAgentStats() {
        let tableDone = false;
        const table = document.querySelector('table#predictionTable');
        if (table) {
            keepPredictionLabelsVisible();
            removeUnusedMedals(table);
            addRecursionPredictionColumn(table);
            highlightNextMedals(table);
            tableDone = true;
        }

        const justGainedDone = updateJustGainedAp();
        const chartDone = setupHighchartsExtrapolation();

        return tableDone || justGainedDone || chartDone;
    }

    function init() {
        enhanceAgentStats();

        // Highcharts may initialize series slightly after initial DOM load
        let chartPollCount = 0;
        const chartPollTimer = setInterval(() => {
            chartPollCount++;
            const chart = getHighchartsChart();
            if (chart && chart.series && chart.series.length > 0) {
                setupHighchartsMedalIcons(chart);
                removeUnusedMedalsFromHighcharts(chart);
                updateJustGainedAp(chart);
                setupHighchartsExtrapolation();
            }
            // A chart instance can exist before its series have populated their full
            // options.data/points arrays. Keep retrying briefly instead of treating a
            // non-empty series list as proof that the chart is fully initialized.
            if (chartPollCount >= 20) {
                clearInterval(chartPollTimer);
            }
        }, 300);

        const observer = new MutationObserver((mutations, obs) => {
            if (enhanceAgentStats()) {
                const chart = getHighchartsChart();
                if (chart && chart.series && chart.series.length > 0) {
                    obs.disconnect();
                }
            }
        });
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
