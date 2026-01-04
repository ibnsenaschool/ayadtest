// ==UserScript==
// @name         مخطط هجومي لحرب القبائل (مع ID الهدف)
// @namespace    https://ae90.tribalwars.ae/
// @version      3.1
// @description  تخطيط هجمات مع إظهار ID قرى الإرسال والهدف تلقائيًا
// @author       مبرمج
// @match        https://*.tribalwars.ae/game.php?*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    /* ================== إعدادات العالم ================== */
    let worldSpeed = 1;
    let unitSpeed = 1;

    try {
        const res = await fetch('/interface.php?func=get_config');
        const text = await res.text();
        const xml = new DOMParser().parseFromString(text, "text/xml");
        worldSpeed = parseFloat(xml.querySelector('speed')?.textContent || "1");
        unitSpeed = parseFloat(xml.querySelector('unit_speed')?.textContent || "1");
    } catch (e) {
        console.warn('فشل تحميل إعدادات العالم');
    }

    /* ================== سرعات الوحدات ================== */
    const unitSpeeds = {
        "رمح": 18, "سيف": 22, "فأس": 18, "كشاف": 9,
        "خفيف": 10, "ثقيل": 11, "مقلاع": 30,
        "نبيل": 35, "فارس قوس": 10
    };

    /* ================== دوال مساعدة ================== */
    function calcDistance(a, b) {
        const [x1, y1] = a.split('|').map(Number);
        const [x2, y2] = b.split('|').map(Number);
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function calcTravelTime(dist, unit) {
        const min = (dist * unitSpeeds[unit]) / (worldSpeed * unitSpeed);
        const sec = Math.round(min * 60);
        const h = String(Math.floor(sec / 3600)).padStart(2, '0');
        const m = String(Math.floor((sec % 3600) / 60)).padStart(2, '0');
        const s = String(sec % 60).padStart(2, '0');
        return [h, m, s];
    }

    function getVillageIdFromRow(row) {
        const link = row.querySelector('a[href*="village="]');
        if (!link) return null;
        const m = link.href.match(/village=(\d+)/);
        return m ? m[1] : null;
    }

    async function getTargetVillageId(coord) {
        const [x, y] = coord.split('|');
        try {
            const res = await fetch(`/interface.php?func=get_village_info&x=${x}&y=${y}`);
            const text = await res.text();
            const xml = new DOMParser().parseFromString(text, "text/xml");
            const id = xml.querySelector('village > id');
            return id ? id.textContent : null;
        } catch {
            return null;
        }
    }

    /* ================== إضافة Checkboxes ================== */
    const table = document.querySelector('#combined_table');
    if (!table) return;

    table.querySelectorAll('tbody tr').forEach(row => {
        const td = row.querySelector('td');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'village-cb';
        td.prepend(cb);
    });

    /* ================== واجهة التحكم ================== */
    const box = document.createElement('div');
    box.style.border = '1px solid #999';
    box.style.padding = '10px';
    box.style.marginTop = '10px';
    box.style.background = '#f4f4f4';

    const fromBox = document.createElement('textarea');
    fromBox.rows = 4;
    fromBox.style.width = '100%';
    fromBox.placeholder = 'قراك (يتم إدخالها تلقائيًا)';
    box.appendChild(fromBox);

    const targetBox = document.createElement('textarea');
    targetBox.rows = 3;
    targetBox.style.width = '100%';
    targetBox.placeholder = 'أدخل إحداثيات الأهداف فقط\nمثال:\n500|500';
    box.appendChild(targetBox);

    const unitSel = document.createElement('select');
    Object.keys(unitSpeeds).forEach(u => {
        const o = document.createElement('option');
        o.value = u;
        o.textContent = u;
        unitSel.appendChild(o);
    });
    box.appendChild(unitSel);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    box.appendChild(dateInput);

    const timeInput = document.createElement('input');
    timeInput.placeholder = 'hh:mm:ss';
    box.appendChild(timeInput);

    const btn = document.createElement('button');
    btn.textContent = '🧠 تنفيذ التخطيط';
    btn.style.fontWeight = 'bold';
    box.appendChild(btn);

    const resultBox = document.createElement('textarea');
    resultBox.rows = 10;
    resultBox.style.width = '100%';
    box.appendChild(resultBox);

    table.parentNode.insertBefore(box, table.nextSibling);

    /* ================== نسخ القرى المختارة ================== */
    document.addEventListener('change', () => {
        const lines = [];
        document.querySelectorAll('.village-cb:checked').forEach(cb => {
            const row = cb.closest('tr');
            const coord = row.innerText.match(/\d{3}\|\d{3}/)?.[0];
            const id = getVillageIdFromRow(row);
            if (coord && id) lines.push(`${coord}#${id}`);
        });
        fromBox.value = lines.join('\n');
    });

    /* ================== تنفيذ التخطيط ================== */
    btn.addEventListener('click', async () => {
        if (!dateInput.value || !timeInput.value) {
            alert('أدخل التاريخ والوقت');
            return;
        }

        const launchAt = new Date(`${dateInput.value}T${timeInput.value}`);
        const fromList = fromBox.value.split('\n').map(l => {
            const [coord, id] = l.split('#');
            return { coord, id };
        }).filter(v => v.coord && v.id);

        const targets = targetBox.value.split('\n').map(t => t.trim()).filter(Boolean);
        const results = [];

        for (const target of targets) {
            const targetId = await getTargetVillageId(target);

            for (const from of fromList) {
                const dist = calcDistance(from.coord, target);
                const [h, m, s] = calcTravelTime(dist, unitSel.value);
                const sendTime = new Date(launchAt - (h * 3600 + m * 60 + s) * 1000);

                results.push(
                    `${sendTime.toLocaleString()} | ${unitSel.value} | من ${from.coord} (ID:${from.id}) → ${target}${targetId ? ` (ID:${targetId})` : ''}`
                );
            }
        }

        resultBox.value = results.join('\n');
    });

})();
