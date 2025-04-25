(function() {
    'use strict';

    // ────────────── Constants & Storage Keys ──────────────
    const SCRIPT_VERSION = "v2.6.0";
    const ALERT_THRESHOLD_STORAGE_KEY = 'sniperAlertThresholdSeconds_sarg3a_v2';
    const SIGIL_VALUE_STORAGE_KEY      = 'snipe_sigil_value_sarg3a_v2';
    const DEFAULT_ALERT_THRESHOLD_SECONDS = 59;
    // … (other existing constants) …

    // ────────────── Utilities ──────────────
    function addGlobalStyle(css) {
        const head = document.head || document.getElementsByTagName('head')[0];
        if (!head) return;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    // ────────────── New: Styles for Targets UI ──────────────
    addGlobalStyle(`
        #sniper-targets-container .sniper-target {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr auto;
            gap: 10px;
            align-items: center;
            margin-bottom: 10px;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 8px;
            background: #f5f5f5;
        }
        #sniper-targets-container .sniper-target input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #aaa;
            border-radius: 4px;
            font-size: 14px;
            padding: 5px;
        }
        #add-sniper-target {
            margin-bottom: 20px;
        }
        /* ensure existing styles remain intact */
    `);

    // ────────────── New: Create one target input row ──────────────
    function createTargetInput(targetData = {}) {
        const container = document.createElement('div');
        container.className = 'sniper-target';
        container.innerHTML = `
            <input type="text" class="sniper-target-coord" value="${targetData.coord||''}" placeholder="xxx|yyy" required>
            <input type="text" class="sniper-target-date"  value="${targetData.date||''}"  placeholder="dd.mm.yyyy" required>
            <input type="text" class="sniper-target-time"  value="${targetData.time||''}"  placeholder="hh:mm:ss" required>
            <input type="number" class="sniper-target-sigil" value="${targetData.sigil||0}" min="0" step="0.1" placeholder="سرعة%">
            <button class="remove-sniper-target btn" style="background:red;color:white;padding:5px 10px;">× حذف</button>
        `;
        container.querySelector('.remove-sniper-target')
            .addEventListener('click', () => container.remove());
        return container;
    }

    // ────────────── New: Gather all targets from UI ──────────────
    function getAllTargets() {
        const targets = [];
        document.querySelectorAll('#sniper-targets-container .sniper-target')
            .forEach(div => {
                const coord = div.querySelector('.sniper-target-coord').value.trim();
                const date  = div.querySelector('.sniper-target-date').value.trim();
                const time  = div.querySelector('.sniper-target-time').value.trim();
                const sigil = parseFloat(div.querySelector('.sniper-target-sigil').value) || 0;
                if (coord && date && time) {
                    targets.push({ coord, date, time, sigil });
                }
            });
        return targets;
    }

    // ────────────── Inject Targets UI into Planner ──────────────
    const originalRysujPlaner = window.rysujPlaner;
    window.rysujPlaner = function() {
        originalRysujPlaner();

        const planner = document.getElementById('planer_klinow');
        if (!planner) return;

        // Insert targets section at top
        const section = document.createElement('div');
        section.id = 'sniper-targets-section';
        section.innerHTML = `
            <h4>الأهداف:</h4>
            <div id="sniper-targets-container"></div>
            <button id="add-sniper-target" class="btn">➕ إضافة هدف</button>
        `;
        planner.querySelector('.controls-container')
               .insertAdjacentElement('afterend', section);

        // Add first empty target
        document.getElementById('sniper-targets-container')
                .appendChild(createTargetInput());

        // Add button listener
        document.getElementById('add-sniper-target')
            .addEventListener('click', () => {
                document.getElementById('sniper-targets-container')
                        .appendChild(createTargetInput());
            });
    };

    // ────────────── Update Calculation Function for Multiple Targets ──────────────
    const originalWypisz = window.wypiszMozliwosci;
    window.wypiszMozliwosci = function() {
        // gather targets
        const allTargets = getAllTargets();
        if (allTargets.length === 0) {
            UI.ErrorMessage("لم يتم إدخال أي هدف.", 3000);
            return;
        }

        // gather villages data (mojeWioski, wojska, etc.) – existing code
        // …

        let resultObjects = [];

        // iterate each target
        allTargets.forEach(target => {
            const [tx, ty] = target.coord.split('|').map(Number);
            const [dd, mm, yyyy] = target.date.split('.').map(Number);
            const [hh, min, ss] = target.time.split(':').map(Number);
            const sigilRatio = 1 + (target.sigil / 100);

            const arrivalDate = new Date(yyyy, mm - 1, dd, hh, min, ss);
            const serverTimeEl = document.getElementById('serverTime');
            const serverDateEl = document.getElementById('serverDate');
            const t_now = serverTimeEl.textContent.match(/\d+/g);
            const d_now = serverDateEl.textContent.match(/\d+/g);
            const now = new Date(d_now[2], d_now[1] - 1, d_now[0], t_now[0], t_now[1], t_now[2]);
            const remaining = (arrivalDate - now) / 1000;
            if (remaining <= 0) return; // skip past targets

            // for each village, compute if possible and build row
            mojeWioski.forEach((coords, i) => {
                if (!pokazWies[i]) return;
                const originX = Number(coords[0]), originY = Number(coords[1]);
                let najwolniejsza = 0, unitIndex = -1;
                let troopCells = '', bbParts = {}, totalTroops = false;

                obrazki.forEach((img, j) => {
                    const count = parseInt(wojska[i][j]) || 0;
                    const dist = Math.hypot(tx - originX, ty - originY);
                    const travelSec = (dist * dane.predkosci[j] * 60) / sigilRatio;
                    const canSend = count > 0 && travelSec <= remaining + 1;
                    troopCells += `<td${!canSend?' class="faded"':''}>${count}</td>`;
                    if (canSend) {
                        totalTroops = true;
                        if (travelSec > najwolniejsza) { najwolniejsza = travelSec; unitIndex = j; }
                        bbParts[img] = count;
                    }
                });

                if (!totalTroops) return;
                const depart = new Date(arrivalDate.getTime() - Math.round(najwolniejsza*1000));
                resultObjects.push({
                    departure: depart.getTime(),
                    targetCoord: target.coord,
                    villageLink: `${dane.linkDorozkazu}${id[i]}&screen=place&x=${tx}&y=${ty}`,
                    html: `
                        <tr>
                          <td>${target.coord}</td>
                          <td><a href="${dane.linkDoPrzegladuWioski}${id[i]}" target="_blank">${nazwyWiosek[i]}</a></td>
                          ${troopCells}
                          <td>${formatDateTimeForDisplay(depart)}</td>
                          <td><span class="countdown-timer" data-departure="${depart.getTime()}">--:--:--</span></td>
                          <td><a href="${dane.linkDorozkazu}${id[i]}&screen=place&x=${tx}&y=${ty}&${Object.entries(bbParts).map(([u,c])=>`att_${u}=${c}`).join('&')}" target="_blank" class="btn btn-attack">هجوم</a></td>
                        </tr>
                    `
                });
            });
        });

        // sort by earliest departure
        resultObjects.sort((a,b) => a.departure - b.departure);

        // render table
        const tbody = document.querySelector('#sniper-results-table tbody');
        if (!tbody) return;
        tbody.innerHTML = resultObjects.map(o => o.html).join('\n');
        document.querySelector('#sniper-results-count b').textContent = `${resultObjects.length}/${pokazWies.filter(Boolean).length}`;

        startCountdownTimers();  // existing function to update timers
    };

    // ────────────── END Script ──────────────
    // باقي الوظائف والتهيئة كما في النسخة السابقة (attachEventListeners, countdown, إلخ.)

})();
