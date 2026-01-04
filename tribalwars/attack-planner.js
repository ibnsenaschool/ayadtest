// ==UserScript==
// @name         مخطط هجومي لحرب القبائل
// @namespace    https://ae90.tribalwars.ae/
// @version      3.1
// @description  سكربت تخطيط حصري خاصا بالاحباب
// @author       مبرمج من زمن اخر
// @match        https://*.tribalwars.ae/game.php?*
// @grant        none
// ==/UserScript==

(async function () {
    'use strict';

    let worldSpeed = 1;
    let unitSpeed = 1;

    // جلب إعدادات العالم
    try {
        const response = await fetch('/interface.php?func=get_config');
        const text = await response.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(text, "text/xml");
        worldSpeed = parseFloat(xml.querySelector('speed')?.textContent || "1");
        unitSpeed = parseFloat(xml.querySelector('unit_speed')?.textContent || "1");
        console.log(`📦 إعدادات العالم: سرعة اللعبة = ${worldSpeed}, سرعة الوحدات = ${unitSpeed}`);
    } catch (err) {
        console.warn("⚠️ فشل تحميل إعدادات العالم:", err);
    }

    // كاش لتخزين id القرى
    const villageIdCache = {};

    // دالة جلب id القرية من الإحداثيات
    async function getVillageId(coord) {
        // إذا موجود في الكاش، أرجعه
        if (villageIdCache[coord]) {
            return villageIdCache[coord];
        }

        try {
            const [x, y] = coord.split('|').map(Number);
            
            // جلب بيانات القرية من صفحة info_village
            const infoResponse = await fetch(`/game.php?screen=info_village&ajax=target_selection&input=${encodeURIComponent(coord)}&type=coord`);
            const infoData = await infoResponse.json();
            
            if (infoData && infoData.villages && infoData.villages.length > 0) {
                const villageId = infoData.villages[0].id;
                villageIdCache[coord] = villageId;
                return villageId;
            }
            
            // طريقة بديلة: استخدام map_info
            const searchResponse = await fetch(`/game.php?screen=map&ajax=map_info&source=&x=${x}&y=${y}&_=${Date.now()}`);
            const searchData = await searchResponse.json();
            
            if (searchData && searchData.villages) {
                for (const village of Object.values(searchData.villages)) {
                    if (village.x == x && village.y == y) {
                        villageIdCache[coord] = village.id;
                        return village.id;
                    }
                }
            }
            
            return null;
        } catch (err) {
            console.warn(`⚠️ فشل جلب id للقرية ${coord}:`, err);
            return null;
        }
    }

    // دالة جلب id عدة قرى دفعة واحدة
    async function getMultipleVillageIds(coords) {
        const results = {};
        
        // جلب القرى غير الموجودة في الكاش
        const uncachedCoords = coords.filter(c => !villageIdCache[c]);
        
        if (uncachedCoords.length > 0) {
            // محاولة جلب من خريطة المنطقة
            try {
                const allCoords = [...new Set(uncachedCoords)];
                
                // جمع كل الإحداثيات x و y
                const xCoords = allCoords.map(c => parseInt(c.split('|')[0]));
                const yCoords = allCoords.map(c => parseInt(c.split('|')[1]));
                
                const minX = Math.min(...xCoords) - 5;
                const maxX = Math.max(...xCoords) + 5;
                const minY = Math.min(...yCoords) - 5;
                const maxY = Math.max(...yCoords) + 5;
                
                // جلب بيانات المنطقة
                const centerX = Math.floor((minX + maxX) / 2);
                const centerY = Math.floor((minY + maxY) / 2);
                
                const mapResponse = await fetch(`/game.php?screen=map&ajax=map_info&source=&x=${centerX}&y=${centerY}&width=${maxX - minX + 10}&height=${maxY - minY + 10}&_=${Date.now()}`);
                const mapData = await mapResponse.json();
                
                if (mapData && mapData.villages) {
                    for (const village of Object.values(mapData.villages)) {
                        const vCoord = `${village.x}|${village.y}`;
                        if (!villageIdCache[vCoord]) {
                            villageIdCache[vCoord] = village.id;
                        }
                    }
                }
            } catch (err) {
                console.warn("⚠️ فشل جلب بيانات الخريطة:", err);
            }
        }
        
        // جلب القرى المتبقية فردياً
        for (const coord of coords) {
            if (villageIdCache[coord]) {
                results[coord] = villageIdCache[coord];
            } else {
                const id = await getVillageId(coord);
                results[coord] = id;
            }
        }
        
        return results;
    }

    const unitSpeeds = {
        "رمح": 18, "سيف": 22, "فأس": 18, "كشاف": 9,
        "خفيف": 10, "ثقيل": 11, "مقلاع": 30,
        "نبيل": 35, "فارس قوس": 10
    };

    function calcDistance(coordA, coordB) {
        const [x1, y1] = coordA.split('|').map(Number);
        const [x2, y2] = coordB.split('|').map(Number);
        return Math.round(Math.hypot(x2 - x1, y2 - y1) * 100) / 100;
    }

    function calcTravelTime(distance, unitName) {
        const unitBase = unitSpeeds[unitName] || 1;
        const minutes = (distance * unitBase) / (worldSpeed * unitSpeed);
        const totalSeconds = Math.round(minutes * 60);
        const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
        const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
        const s = String(totalSeconds % 60).padStart(2, '0');
        return `${h}:${m}:${s}`;
    }

    function extractTargetCoordsFromText(text) {
        return Array.from(text.matchAll(/\((\d{3}\|\d{3})\)/g)).map(m => m[1]);
    }

    function copyToClipboard(text) {
        navigator.clipboard.writeText(text)
            .then(() => alert("✅ تم نسخ النتائج إلى الحافظة"))
            .catch(err => alert("❌ فشل النسخ: " + err));
    }

    const table = document.querySelector('#combined_table');
    if (!table) return;

    const rows = table.querySelectorAll('tbody tr');
    rows.forEach((row, index) => {
        const firstCell = row.querySelector('td');
        if (firstCell) {
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'village-checkbox';
            checkbox.dataset.rowIndex = index;
            firstCell.prepend(checkbox);
        }
    });

    const container = document.createElement('div');
    container.style.marginTop = '15px';
    container.style.padding = '10px';
    container.style.border = '1px solid #ccc';
    container.style.backgroundColor = '#F4A460';
    container.style.width = table.offsetWidth + 'px';

    const unitsList = Object.keys(unitSpeeds);
    const inputs = [];

    for (let i = 0; i < 4; i++) {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.gap = '5px';
        rowDiv.style.marginBottom = '6px';

        const textarea = document.createElement('textarea');
        textarea.rows = 2;
        textarea.style.width = '60%';
        const labels = ['تنظيف 1', 'تنظيف 2', 'نبلاء', 'دعم'];
        textarea.placeholder = `📍 ${labels[i]}`;

        rowDiv.appendChild(textarea);

        const unitSelect = document.createElement('select');
        unitSelect.style.width = '20%';
        unitsList.forEach(unit => {
            const option = document.createElement('option');
            option.value = unit;
            option.textContent = unit;
            unitSelect.appendChild(option);
        });
        rowDiv.appendChild(unitSelect);

        const noteInput = document.createElement('input');
        noteInput.type = 'text';
        noteInput.placeholder = '📝 ملاحظات';
        noteInput.style.width = '20%';
        rowDiv.appendChild(noteInput);

        const attackInput = document.createElement('input');
        attackInput.type = 'number';
        attackInput.min = '1';
        attackInput.value = '1';
        attackInput.style.width = '60px';
        attackInput.title = 'عدد الهجمات لكل هدف';
        rowDiv.appendChild(attackInput);

        const modeSelect = document.createElement('select');
        ['قريب', 'بعيد', 'عشوائي'].forEach(label => {
            const option = document.createElement('option');
            option.value = label;
            option.textContent = label;
            modeSelect.appendChild(option);
        });
        modeSelect.style.width = '80px';
        modeSelect.title = 'نوع توزيع القرى';
        rowDiv.appendChild(modeSelect);

        const countLabel = document.createElement('span');
        countLabel.textContent = '(0 قرى)';
        countLabel.style.marginLeft = '5px';
        rowDiv.appendChild(countLabel);

        const colorSelect = document.createElement('select');
        const colors = {
            'أسود': '#000000',
            'أحمر': '#ff0e0e',
            'أخضر': '#00b300',
            'أزرق': '#005eff',
            'أصفر': '#ffc700',
            'برتقالي': '#ff7b00'
        };
        for (const [name, hex] of Object.entries(colors)) {
            const opt = document.createElement('option');
            opt.value = hex;
            opt.textContent = name;
            if (hex === '#000000') opt.selected = true;
            colorSelect.appendChild(opt);
        }
        rowDiv.appendChild(colorSelect);

        textarea.addEventListener('input', () => {
            const count = textarea.value.split('\n').map(x => x.trim()).filter(Boolean).length;
            countLabel.textContent = `(${count} قرى)`;
        });

        inputs.push({ coordsBox: textarea, unitBox: unitSelect, noteBox: noteInput, attackCount: attackInput, modeSelect, colorBox: colorSelect });
        container.appendChild(rowDiv);
    }

    const select = document.createElement('select');
    for (let i = 0; i < 4; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `اختر مربع ${i + 1}`;
        select.appendChild(option);
    }
    container.appendChild(select);

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 نسخ المحدد إلى المربع المختار';
    copyBtn.style.marginLeft = '10px';
    container.appendChild(copyBtn);

    const extraRow = document.createElement('div');
    extraRow.style.display = 'flex';
    extraRow.style.gap = '8px';
    extraRow.style.marginTop = '15px';

    const targetsInput = document.createElement('textarea');
    targetsInput.rows = 2;
    targetsInput.style.width = '60%';
    targetsInput.placeholder = '📋 ضع هنا قائمة الأهداف';
    extraRow.appendChild(targetsInput);

    const extractCoordsBtn = document.createElement('button');
    extractCoordsBtn.textContent = '🧲 استخراج الإحداثيات';
    extractCoordsBtn.style.marginBottom = '8px';
    extractCoordsBtn.style.backgroundColor = '#C9C0BB';
    extractCoordsBtn.style.border = '1px solid #0a0';
    extractCoordsBtn.style.color = '#111';
    extractCoordsBtn.style.padding = '2.5px 12px';
    extractCoordsBtn.style.marginTop = '10px';
    extractCoordsBtn.style.fontWeight = 'bold';
    extractCoordsBtn.onclick = () => {
        const coords = extractTargetCoordsFromText(targetsInput.value);
        targetsInput.value = coords.join('\n');
        alert(`✅ تم استخراج ${coords.length} إحداثيات من النص.`);
    };
    container.appendChild(extractCoordsBtn);

    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.style.width = '20%';
    extraRow.appendChild(dateInput);

    const timeInput = document.createElement('input');
    timeInput.type = 'text';
    timeInput.placeholder = 'hh:mm:ss';
    timeInput.style.width = '20%';
    extraRow.appendChild(timeInput);

    const attackCountInput = document.createElement('input');
    attackCountInput.type = 'number';
    attackCountInput.placeholder = 'عدد الهجمات';
    attackCountInput.min = '1';
    attackCountInput.value = '1';
    attackCountInput.style.width = '100px';
    attackCountInput.style.marginLeft = '10px';
    extraRow.appendChild(attackCountInput);

    const modeSelect = document.createElement('select');
    ['قريب', 'بعيد', 'عشوائي'].forEach(label => {
        const option = document.createElement('option');
        option.value = label;
        option.textContent = label;
        modeSelect.appendChild(option);
    });
    modeSelect.style.marginLeft = '10px';
    extraRow.appendChild(modeSelect);

    container.appendChild(extraRow);

    const planBtn = document.createElement('button');
    planBtn.textContent = '🧠 تنفيذ التخطيط';
    planBtn.style.fontWeight = 'bold';
    planBtn.style.backgroundColor = '#E9967A';
    planBtn.style.marginTop = '10px';
    planBtn.style.padding = '6px 12px';
    container.appendChild(planBtn);

    // مؤشر التحميل
    const loadingSpan = document.createElement('span');
    loadingSpan.style.marginLeft = '10px';
    loadingSpan.style.display = 'none';
    loadingSpan.textContent = '⏳ جاري جلب بيانات القرى...';
    container.appendChild(loadingSpan);

    const resultBox = document.createElement('textarea');
    resultBox.rows = 10;
    resultBox.style.width = '100%';
    resultBox.style.marginTop = '10px';
    container.appendChild(resultBox);

    const copyResultsBtn = document.createElement('button');
    copyResultsBtn.textContent = '📄 نسخ النتائج';
    copyResultsBtn.style.marginTop = '5px';
    copyResultsBtn.style.padding = '6px 12px';
    copyResultsBtn.style.fontWeight = 'bold';
    copyResultsBtn.style.backgroundColor = '#98AFC7';

    copyResultsBtn.onclick = () => copyToClipboard(resultBox.value);
    container.appendChild(copyResultsBtn);

    table.parentNode.insertBefore(container, table.nextSibling);

    copyBtn.addEventListener('click', () => {
        const selectedRows = Array.from(document.querySelectorAll('.village-checkbox:checked')).map(cb => {
            const row = cb.closest('tr');
            return row ? row.innerText.trim() : '';
        }).filter(Boolean);

        const selectedBoxIndex = parseInt(select.value);
        const coords = selectedRows.flatMap(text => Array.from(text.matchAll(/\b\d{3}\|\d{3}\b/g)).map(m => m[0]));
        inputs[selectedBoxIndex].coordsBox.value = coords.join('\n');
        inputs[selectedBoxIndex].coordsBox.dispatchEvent(new Event('input'));

        alert(`✅ تم نسخ ${coords.length} إحداثيات إلى مربع ${selectedBoxIndex + 1}`);
    });

    planBtn.addEventListener('click', async () => {
        const targets = targetsInput.value.split(/\s+/).filter(Boolean);
        const dateStr = dateInput.value;
        const timeStr = timeInput.value;

        if (!dateStr || !timeStr) {
            alert("⚠️ الرجاء إدخال التاريخ والوقت أولاً.");
            return;
        }

        // جمع كل الإحداثيات لجلب الـ id
        const allCoords = new Set();
        targets.forEach(c => allCoords.add(c));
        inputs.forEach(({ coordsBox }) => {
            coordsBox.value.split('\n').map(c => c.trim()).filter(Boolean).forEach(c => allCoords.add(c));
        });

        // إظهار مؤشر التحميل
        loadingSpan.style.display = 'inline';
        planBtn.disabled = true;

        // جلب id القرى
        let villageIds = {};
        try {
            villageIds = await getMultipleVillageIds([...allCoords]);
        } catch (err) {
            console.warn("⚠️ فشل جلب بعض الـ ids:", err);
        }

        // إخفاء مؤشر التحميل
        loadingSpan.style.display = 'none';
        planBtn.disabled = false;

        const targetDateTime = new Date(`${dateStr}T${timeStr}`);
        const resultLines = [];

        inputs.forEach(({ coordsBox, unitBox, noteBox, attackCount, modeSelect, colorBox }) => {
            const coordsList = coordsBox.value.split('\n').map(c => c.trim()).filter(Boolean);
            const unit = unitBox.value;
            const note = noteBox.value.trim();
            const noteColor = colorBox.value;
            const count = parseInt(attackCount.value) || 1;
            const mode = modeSelect.value;

            const localAssigned = new Set();

            targets.forEach(toCoord => {
                let candidates = coordsList
                    .filter(fromCoord => !localAssigned.has(fromCoord))
                    .map(fromCoord => ({
                        fromCoord,
                        toCoord,
                        distance: calcDistance(fromCoord, toCoord)
                    }));

                if (mode === 'قريب') {
                    candidates.sort((a, b) => a.distance - b.distance);
                } else if (mode === 'بعيد') {
                    candidates.sort((a, b) => b.distance - a.distance);
                } else {
                    candidates.sort(() => Math.random() - 0.5);
                }

                let used = 0;
                for (let i = 0; i < candidates.length && used < count; i++) {
                    const { fromCoord, distance } = candidates[i];
                    if (localAssigned.has(fromCoord)) continue;

                    const travelTimeStr = calcTravelTime(distance, unit);
                    const [h, m, s] = travelTimeStr.split(':').map(Number);
                    const launchTime = new Date(targetDateTime - (h * 3600 + m * 60 + s) * 1000);
                    const launchStr = launchTime.toLocaleString();

                    const noteFormatted = note
                        ? ` | 📝 [color=${noteColor}]${note}[/color]`
                        : '';

                    // إضافة id القرى
                    const fromId = villageIds[fromCoord] || '?';
                    const toId = villageIds[toCoord] || '?';

                    resultLines.push({
                        launch: launchTime,
                        text: `${launchStr} | [color=${noteColor}]${unit}[/color] | من ${fromCoord} (id:${fromId}) إلى ${toCoord} (id:${toId})${noteFormatted}`
                    });

                    localAssigned.add(fromCoord);
                    used++;
                }
            });
        });

        const sortedResults = resultLines
            .sort((a, b) => a.launch - b.launch)
            .map(r => r.text);

        resultBox.value = sortedResults.join('\n');

        if (sortedResults.length > 0) {
            alert(`✅ تم إنشاء ${sortedResults.length} خطة هجوم`);
        }
    });

})();
