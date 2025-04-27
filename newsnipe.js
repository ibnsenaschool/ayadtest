(function() {
    'use strict';

    const SCRIPT_VERSION = "v2.5.3";
    const BEEF_FREQUENCY = 880;
    const BEEF_DURATION = 0.1;
    const BEEF_VOLUME = 0.3;
    const ALERT_THRESHOLD_STORAGE_KEY = 'sniperAlertThresholdSeconds_sarg3a_v2';
    const SIGIL_VALUE_STORAGE_KEY = 'snipe_sigil_value_sarg3a_v2';
    const ACTIVE_UNITS_COOKIE_KEY = "atkjed";
    const DEFAULT_ALERT_THRESHOLD_SECONDS = 59;

    let audioContext = null;
    let alertThresholdSeconds = DEFAULT_ALERT_THRESHOLD_SECONDS;
    let savedSigilValue = 0;
    let originalPageTitle = document.title;
    var konfiguracja, mobile, dane = {}, pobieram = true, pobraneGrupy = false;
    var sort_malejaco = true, img_wojsk, minimalna_ilosc_wojsk = [];
    var id = [], wojska = [], mojeWioski = [], nazwyWiosek = [], pokazWies = [];
    var obrazki = [], aktywneJednostki = [], predkosc_swiata;
    var wszystkieWojska, countdownInterval = null;
    var unitColReadOrder = [];
    window.sniperLastBBContent = "";
    window.sniperTargetArrivalTimeBB = "";
    const bbCodeTableHeader = `[**]Ø§Ù„Ù‚Ø±ÙŠØ© Ø§Ù„Ù…Ù‡Ø§Ø¬Ù…Ø©[||]Ø§Ù„Ù‡Ø¯Ù[||]Ø§Ù„ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ù…Ø±Ø³Ù„Ø©[||]ÙˆÙ‚Øª Ø§Ù„Ø¥Ø±Ø³Ø§Ù„[||]Ø§Ù„Ù‡Ø¬ÙˆÙ…[/**]`;

    function gebi(id) { return document.getElementById(id); }
    function qsa(selector, parent = document) { return parent.querySelectorAll(selector); }
    function qs(selector, parent = document) { return parent.querySelector(selector); }

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css;
        head.appendChild(style);
    }

    function playBeep() {
        try {
            if (!audioContext || audioContext.state === 'closed') { audioContext = new (window.AudioContext || window.webkitAudioContext)(); }
            if (audioContext.state === 'suspended') { audioContext.resume().catch(err => console.warn("AudioContext resume failed:", err)); }
            if (audioContext.state !== 'running') return;

            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            gainNode.gain.setValueAtTime(BEEF_VOLUME, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(BEEF_FREQUENCY, audioContext.currentTime);
            oscillator.type = 'sine';

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + BEEF_DURATION);
        } catch (e) {
            console.warn("Could not play beep sound:", e);
        }
    }

    function formatujCzas(s) {
        if (isNaN(s) || s < 0) return "00:00:00";
        s = Math.round(s);
        var h = Math.floor(s / 3600);
        s %= 3600;
        var m = Math.floor(s / 60);
        s %= 60;
        return String(h).padStart(2, '0') + ":" + String(m).padStart(2, '0') + ":" + String(s).padStart(2, '0');
    }

    function formatDateTimeForDisplay(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­";
        let d = String(dateObj.getDate()).padStart(2, '0');
        let m = String(dateObj.getMonth() + 1).padStart(2, '0');
        let y = dateObj.getFullYear();
        let h = String(dateObj.getHours()).padStart(2, '0');
        let min = String(dateObj.getMinutes()).padStart(2, '0');
        let s = String(dateObj.getSeconds()).padStart(2, '0');
        return `${d}.${m}.${y}\u00A0${h}:${min}:${s}`;
    }

    function formatDateForInput(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        let d = String(dateObj.getDate()).padStart(2, '0');
        let m = String(dateObj.getMonth() + 1).padStart(2, '0');
        let y = dateObj.getFullYear();
        return `${d}.${m}.${y}`;
    }

    function formatTimeForInput(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "";
        let h = String(dateObj.getHours()).padStart(2, '0');
        let min = String(dateObj.getMinutes()).padStart(2, '0');
        let s = String(dateObj.getSeconds()).padStart(2, '0');
        return `${h}:${min}:${s}`;
    }

    function formatDepartureTimeForBBCode(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­";
        let d = String(dateObj.getDate()).padStart(2, '0');
        let m = String(dateObj.getMonth() + 1).padStart(2, '0');
        let y = dateObj.getFullYear();
        let h = String(dateObj.getHours()).padStart(2, '0');
        let min = String(dateObj.getMinutes()).padStart(2, '0');
        let s = String(dateObj.getSeconds()).padStart(2, '0');
        return `[b]${h}:${min}:${s}[/b] ${d}.${m}.${y}`;
    }

    function formatTargetArrivalTimeForBBCode(dateObj) {
        if (!dateObj || isNaN(dateObj.getTime())) return "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­";
        let d = String(dateObj.getDate()).padStart(2, '0');
        let m = String(dateObj.getMonth() + 1).padStart(2, '0');
        let y = dateObj.getFullYear();
        let h = String(dateObj.getHours()).padStart(2, '0');
        let min = String(dateObj.getMinutes()).padStart(2, '0');
        let s = String(dateObj.getSeconds()).padStart(2, '0');
        return `ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ \n  [b]${h}:${min}:${s}[/b] ${d}.${m}.${y}`;
    }

    function poprawDate(inputElement, separator) {
        let value = inputElement.value.trim();
        const parts = value.split(separator);
        inputElement.classList.remove('input-error');
        inputElement.style.borderColor = '';

        if (parts.length === 3) {
            let p1_str = String(parts[0]).trim();
            let p2_str = String(parts[1]).trim();
            let p3_str = String(parts[2]).trim();
            let p1 = String(p1_str).padStart(2, '0');
            let p2 = String(p2_str).padStart(2, '0');
            let p3 = (separator === '.') ? p3_str : String(p3_str).padStart(2, '0');
            let invalid = false;

            if (separator === '.') {
                let day = parseInt(p1, 10);
                let month = parseInt(p2, 10);
                let year = parseInt(p3, 10);
                if (isNaN(day) || isNaN(month) || isNaN(year) ||
                    month < 1 || month > 12 || day < 1 || day > 31 ||
                    String(year).length < 4) {
                    invalid = true;
                }
            } else if (separator === ':') {
                let hour = parseInt(p1, 10);
                let minute = parseInt(p2, 10);
                let second = parseInt(p3, 10);
                if (isNaN(hour) || isNaN(minute) || isNaN(second) ||
                    hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
                    invalid = true;
                }
            }

            if (invalid) {
                inputElement.classList.add('input-error');
            } else {
                inputElement.value = p1 + separator + p2 + separator + p3;
            }
        } else {
            inputElement.classList.add('input-error');
        }
    }

    async function konfiguracjaSwiata() {
        try {
            const response = await fetch('/interface.php?func=get_config', { signal: AbortSignal.timeout(10000) });
            if (!response.ok) {
                throw new Error(`Ø®Ø·Ø£ HTTP: ${response.status}`);
            }
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            const errorNode = xmlDoc.querySelector('parsererror');
            if (errorNode) {
                throw new Error(`Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù„ÙŠÙ„ XML: ${errorNode.textContent}`);
            }
            if (!xmlDoc || !xmlDoc.querySelector('config')) {
                 throw new Error("Ù…Ù„Ù Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª XML ØºÙŠØ± ØµØ§Ù„Ø­ Ø£Ùˆ ÙØ§Ø±Øº.");
            }
            return xmlDoc;
        } catch (error) {
            let errorMsg = `ÙØ´Ù„ ØªØ­Ù…ÙŠÙ„ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø¹Ø§Ù„Ù…: ${error.message}. Ù‚Ø¯ Ù„Ø§ ØªØ¹Ù…Ù„ Ø§Ù„Ø£Ø¯Ø§Ø© Ø¨Ø´ÙƒÙ„ ØµØ­ÙŠØ­.`;
            if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                UI.ErrorMessage(errorMsg, 5000);
            } else {
                alert(errorMsg);
            }
            return null;
        }
    }

    function setCookie(cname, cvalue, exdays) {
        var d = new Date();
        d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
        var expires = "expires=" + d.toUTCString();
        document.cookie = cname + "=" + encodeURIComponent(cvalue) + ";" + expires + ";path=/;SameSite=Lax";
    }

    function getCookie(cname) {
        var name = cname + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var ca = decodedCookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) == 0) {
                return c.substring(name.length, c.length);
            }
        }
        return "";
    }

    function parseArrivalDateTime(rawHtml, serverNow) {
        let text = rawHtml
            .replace(/<span class="grey small">\d+<\/span>/gi, '')
            .replace(/[.,:]\d{3}$/, '')
            .replace(/<span.*?>.*?<\/span>/gi, '')
            .replace(/<\/?(b|i)[^>]*>/gi, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const timeMatch = text.match(/(\d{1,2}):(\d{1,2}):(\d{1,2})/);
        if (!timeMatch) {
            console.warn("Could not extract time from:", text);
            return null;
        }
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        const seconds = parseInt(timeMatch[3], 10);

        if (isNaN(hours) || hours < 0 || hours > 23 ||
            isNaN(minutes) || minutes < 0 || minutes > 59 ||
            isNaN(seconds) || seconds < 0 || seconds > 59) {
            console.warn("Invalid time extracted:", timeMatch[0]);
            return null;
        }

        let arrivalDate = new Date(serverNow.getTime());
        arrivalDate.setHours(hours, minutes, seconds, 0);

        let dateDetermined = false;

        const dateMatch = text.match(/(\d{1,2})\.(\d{1,2})\.?(\d{4})?/);
        if (dateMatch) {
            let day = parseInt(dateMatch[1], 10);
            let month = parseInt(dateMatch[2], 10) - 1;
            let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : serverNow.getFullYear();

            if (!isNaN(day) && !isNaN(month) && !isNaN(year) && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
                const tempDateForValidation = new Date(year, month, day);
                if (!isNaN(tempDateForValidation.getTime()) && tempDateForValidation.getMonth() === month) {
                    arrivalDate.setFullYear(year, month, day);
                    if (!dateMatch[3] && arrivalDate.getTime() < serverNow.getTime() - (60 * 60 * 1000)) {
                        arrivalDate.setFullYear(year + 1);
                    }
                    dateDetermined = true;
                } else {
                     console.warn("Invalid day for month:", dateMatch[0]);
                }
            } else {
                 console.warn("Invalid date components parsed:", dateMatch[0]);
            }
        }

        if (!dateDetermined) {
            const lowerText = text.toLowerCase();
            const tomorrowKeywords = ['ØºØ¯Ø§', 'tomorrow', 'morgen', 'demain', 'maÃ±ana', 'domani'];
            const todayKeywords = ['Ø§Ù„ÙŠÙˆÙ…', 'today', 'heute', "aujourd'hui", 'hoy', 'oggi'];

            let isTomorrow = false;
            for (const keyword of tomorrowKeywords) {
                if (lowerText.includes(keyword)) {
                    isTomorrow = true;
                    break;
                }
            }

            if (isTomorrow) {
                let tomorrow = new Date(serverNow);
                tomorrow.setDate(serverNow.getDate() + 1);
                arrivalDate.setFullYear(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
                dateDetermined = true;
            } else {
                let isToday = false;
                for (const keyword of todayKeywords) {
                    if (lowerText.includes(keyword)) {
                        isToday = true;
                        break;
                    }
                }
                if (isToday) {
                    arrivalDate.setFullYear(serverNow.getFullYear(), serverNow.getMonth(), serverNow.getDate());
                    dateDetermined = true;
                }
            }
        }

        if (!dateDetermined) {
             if (arrivalDate.getTime() < serverNow.getTime()) {
                 arrivalDate.setDate(arrivalDate.getDate() + 1);
             }
        }

        if (isNaN(arrivalDate.getTime())) {
            UI.ErrorMessage('ÙØ´Ù„ Ø­Ø³Ø§Ø¨ ØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ù†Ù‡Ø§Ø¦ÙŠ.', 3000);
            console.error("Final arrivalDate is invalid. Text was:", text);
            return null;
        }

        return arrivalDate;
    }


    function rysujPlaner() {
        var cel = `${game_data.village.x}|${game_data.village.y}`;
        if (game_data.screen == "info_village" && game_data.village.id != game_data.player.id) {
             try {
                let coordsElement = qs("#content_value .vis:first-of-type tr:nth-child(3) td:nth-child(2)")
                                    || qs("#content_value .vis:first-of-type tr > td:first-child + td", Array.from(qsa('#content_value .vis:first-of-type tr')).find(tr => tr.cells[0]?.textContent.match(/Ø§Ù„Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª:|Coordinates:/i)))
                                    || Array.from(qsa(".mobileKeyValue")).find(el => el.textContent.match(/Ø§Ù„Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª:|Coordinates:/i))?.querySelector('div');
                let coordsText = coordsElement ? coordsElement.textContent : '';
                let coordMatch = coordsText ? coordsText.match(/(\d+\|\d+)/) : null;
                if (coordMatch) cel = coordMatch[0];
            } catch (e) {
                 console.warn("Could not automatically detect target coordinates from info_village:", e);
            }
        }

        let serverTimeEl = gebi('serverTime');
        let serverDateEl = gebi('serverDate');
        var t = serverTimeEl ? serverTimeEl.textContent.match(/\d+/g) : ['0', '0', '0'];
        var d = serverDateEl ? serverDateEl.textContent.match(/\d+/g) : ['01', '01', '2023'];
        var defaultTime = new Date(d[2], d[1] - 1, d[0], t[0], t[1], t[2]);

        var lastNobleArrival = 0;
        qsa("#commands_incomings .command-row[data-command-type='attack']:has(img[src*='unit_snob'])").forEach(row => {
            let timer = row.querySelector('td span[data-endtime]');
            if (timer && timer.dataset.endtime) {
                let endtime = parseInt(timer.dataset.endtime, 10);
                if (!isNaN(endtime)) {
                    let arrivalTimestamp = endtime * 1000;
                    if (arrivalTimestamp > lastNobleArrival) lastNobleArrival = arrivalTimestamp;
                }
            }
        });
        if (lastNobleArrival > 0 && lastNobleArrival >= defaultTime.getTime()) {
             defaultTime = new Date(lastNobleArrival + 1000);
        }

        let defaultDateStr = formatDateForInput(defaultTime);
        let defaultTimeStr = formatTimeForInput(defaultTime);

        var elemHTML = `
        <div class='vis vis_item' id='planer_klinow'>
            <h3>
                <span class="title-text"><img src="${img_wojsk}unit_snob.png" alt="Noble"> Ø³ÙƒØ±Ø¨Øª Ø§Ù„Ù‚Ù†Øµ</span>
                <span class="updater-tag">(Ù…Ø­Ø¯Ø« Ø¨ÙˆØ§Ø³Ø·Ø© sarg3a )</span>
            </h3>
            <div class="controls-container">
                <div class="control-group">
                    <label for="sniper-coord-target">Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø§Ù„Ù‡Ø¯Ù:</label>
                    <input size=8 type='text' value='${cel}' id='sniper-coord-target' placeholder='xxx|yyy' required aria-label="Target Coordinates" />
                </div>
                <div class="control-group">
                    <label for="sniper-arrival-date">ØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆØµÙˆÙ„:</label>
                    <input size=10 type='text' value='${defaultDateStr}' id='sniper-arrival-date' placeholder='dd.mm.yyyy' required aria-label="Arrival Date" />
                </div>
                <div class="control-group">
                    <label for="sniper-arrival-time">ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„:</label>
                    <input size=8 type='text' value='${defaultTimeStr}' id='sniper-arrival-time' placeholder='hh:mm:ss' required aria-label="Arrival Time" />
                </div>
                <div class="control-group">
                    <label for="sniper-group-select">Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©:</label>
                    <select id='sniper-group-select' aria-label="Village Group">
                        <option value='${wszystkieWojska}'>-- Ø§Ù„Ø¬Ù…ÙŠØ¹ --</option>
                    </select>
                </div>

                  <div class="control-group">
    <label for="sniper-extra-1">نص إضافي 1:</label>
    <input size="15" type="text" id="sniper-extra-1" placeholder="مربع نص إضافي 1" />
</div>
<div class="control-group">
    <label for="sniper-extra-2">نص إضافي 2:</label>
    <input size="15" type="text" id="sniper-extra-2" placeholder="مربع نص إضافي 2" />
</div>
<div class="control-group">
    <label for="sniper-extra-3">نص إضافي 3:</label>
    <input size="15" type="text" id="sniper-extra-3" placeholder="مربع نص إضافي 3" />
</div>
<div class="control-group">
    <label for="sniper-extra-4">نص إضافي 4:</label>
    <input size="15" type="text" id="sniper-extra-4" placeholder="مربع نص إضافي 4" />
</div>
<div class="control-group">
    <label for="sniper-extra-5">نص إضافي 5:</label>
    <input size="15" type="text" id="sniper-extra-5" placeholder="مربع نص إضافي 5" />
</div>




                
                <div class="control-group sigil-group">
                    <label for="sniper-sigil-percentage" title="Ø£Ø¯Ø®Ù„ Ù†Ø³Ø¨Ø© Ø²ÙŠØ§Ø¯Ø© Ø§Ù„Ø³Ø±Ø¹Ø© Ù…Ù† Ø§Ù„Ø®ØªÙ… (Ù…Ø«Ø§Ù„: 10 Ù„Ù€ 10%). Ø§ØªØ±ÙƒÙ‡ 0 Ø¥Ø°Ø§ Ù„Ø§ ÙŠÙˆØ¬Ø¯.">Ø§Ù„Ø³Ø±Ø¹Ø© (%):</label>
                    <input type='number' value='${savedSigilValue}' id='sniper-sigil-percentage' min='0' step='0.1' aria-label="Sigil Speed Bonus Percentage" />
                </div>
                 <div class="control-group alert-threshold-group">
                    <label for="sniper-alert-threshold" title="ØªØ´ØºÙŠÙ„ ØµÙˆØª ØªÙ†Ø¨ÙŠÙ‡ Ø¹Ù†Ø¯Ù…Ø§ ÙŠÙƒÙˆÙ† Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ Ù„Ù„Ø¥Ø±Ø³Ø§Ù„ Ø£Ù‚Ù„ Ù…Ù† Ù‡Ø°Ù‡ Ø§Ù„Ù‚ÙŠÙ…Ø© (Ø¨Ø§Ù„Ø«ÙˆØ§Ù†ÙŠ)">ÙˆÙ‚Øª Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ (Ø«):</label>
                    <input type='number' value='${alertThresholdSeconds}' id='sniper-alert-threshold' min='1' max='300' required aria-label="Alert Threshold Seconds" />
                 </div>
                 <div id="sniper-filter-toggle" class="filter-toggle-container" role="button" tabindex="0" aria-pressed="false" aria-controls="sniper-filter-container sniper-results-container sniper-bb-export-container">
                     <span id='sniper-filter-toggle-arrow' class='icon header arr_down' aria-hidden="true"></span>
                     <span>Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„ÙÙ„ØªØ±</span>
                 </div>
                 <input type='button' value='Ø­Ø³Ø§Ø¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬' id='sniper-calculate-button' class="btn">
            </div>
            <div id='sniper-loading' style='display: none;' role="status" aria-live="polite"><img src='${image_base}throbber.gif' alt=""/> Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</div>
            <div class="filter-table-container" id="sniper-filter-container" style="display: none;">
                <table class='vis' id='sniper-filter-table' width='100%'>
                    <caption>ÙÙ„ØªØ± Ø§Ø®ØªÙŠØ§Ø± Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ù‡Ø§Ø¬Ù…Ø©</caption>
                    <tbody><tr><td>Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù‚Ø±Ù‰...</td></tr></tbody>
                </table>
            </div>
             <div id="sniper-bb-export-container" style="display: none;">
                <a href='#' id="bb-show-hide-link" role="button" aria-expanded="false"><img src='${image_base}igm/export.png' alt=""> Ø¥Ø¸Ù‡Ø§Ø±/Ø¥Ø®ÙØ§Ø¡ Ø£ÙƒÙˆØ§Ø¯ BB</a>
                <button class="btn btn-copy-bb" id="bb-copy-button" title="Ù†Ø³Ø® Ø£ÙƒÙˆØ§Ø¯ BB Ù„Ù„Ø¬Ø¯ÙˆÙ„ ÙƒØ§Ù…Ù„Ø§Ù‹" disabled>Ù†Ø³Ø® Ø§Ù„ÙƒÙ„</button>
            </div>
            <div class="results-table-container" id="sniper-results-container" style="display: block;">
                 <div id="sniper-results-filter-header" role="group" aria-labelledby="results-filter-label">
                     <b id="results-filter-label">ÙÙ„ØªØ±Ø© Ø§Ù„Ù†ØªØ§Ø¦Ø¬:</b>
                     <label><input type="checkbox" class="sniper-result-filter-cb" value="-1" checked> Ø§Ù„ÙƒÙ„</label>
                 </div>
                <table class='vis' id='sniper-results-table' width='100%'>
                    <thead>
                        <tr>
                            <th id='sniper-results-count' scope="col"><b>0/0</b> <span class='icon header village' title='Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø­Ø³ÙˆØ¨Ø© / Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©'></span></th>
                            ${obrazki.map((img, i) => `<th scope="col" style="cursor:pointer;" data-unit="${img}" class="${aktywneJednostki[i] == "0" ? "faded" : ""}" title="${dane.nazwyWojsk[i]}"><img src="${img_wojsk}unit_${img}.png" alt="${dane.nazwyWojsk[i]}"></th>`).join('')}
                            <th scope="col">ØªÙˆÙ‚ÙŠØª Ø§Ù„Ø¥Ø±Ø³Ø§Ù„</th>
                            <th scope="col"><span class='icon header time' title='Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ Ù„Ù„Ø¥Ø±Ø³Ø§Ù„'></span></th>
                            <th scope="col"><b>Ù‡Ø¬ÙˆÙ…</b></th>
                            <th scope="col"><span class="icon header friend_forum_thread_locked" title="Ù†Ø³Ø® ÙƒÙˆØ¯ BB Ù„Ù„ØµÙ"></span></th>
                        </tr>
                    </thead>
                    <tbody>
                         <tr><td colspan="${obrazki.length + 5}">Ø£Ø¯Ø®Ù„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª ÙˆØ§Ø¶ØºØ· Ø¹Ù„Ù‰ "Ø­Ø³Ø§Ø¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬".</td></tr>
                    </tbody>
                </table>
            </div>
        </div>`;

        let targetContainer = mobile ? gebi("mobileContent") : gebi("contentContainer");
        if (!targetContainer) targetContainer = gebi("content_value");
        if (!targetContainer) {
            UI.ErrorMessage("Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù…ÙƒØ§Ù† Ù„ÙˆØ¶Ø¹ ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø³ÙƒØ±Ø¨Øª!", 5000);
            return;
        }
        let plannerDiv = document.createElement('div');
        plannerDiv.innerHTML = elemHTML.trim();
        const plannerNode = plannerDiv.firstChild;
        if (plannerNode) {
            targetContainer.insertBefore(plannerNode, targetContainer.firstChild);
            addResultsFilterCheckboxes();
            attachEventListeners();
        }
    }

    function copyTextToClipboard(text, successMessage, buttonElement) {
        const displaySuccess = (msg) => {
             if (successMessage) UI.InfoMessage(msg || successMessage, 1500);
        };
        const displayError = (msg = 'ÙØ´Ù„ Ø§Ù„Ù†Ø³Ø®') => {
            UI.ErrorMessage(msg + ' Ø­Ø§ÙˆÙ„ Ø§Ù„Ù†Ø³Ø® Ø§Ù„ÙŠØ¯ÙˆÙŠ.', 3000);
        };

        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(() => {
                displaySuccess();
            }).catch((err) => {
                console.error('Clipboard API Error:', err);
                displayError('ÙØ´Ù„ Ø§Ù„Ù†Ø³Ø® Ø§Ù„ØªÙ„Ù‚Ø§Ø¦ÙŠ.');
            });
        } else {
            try {
                let tempInput = document.createElement("textarea");
                tempInput.style.position = 'absolute';
                tempInput.style.left = '-9999px';
                tempInput.value = text;
                document.body.appendChild(tempInput);
                tempInput.select();
                tempInput.setSelectionRange(0, 99999);
                let successful = document.execCommand("copy");
                document.body.removeChild(tempInput);
                if (successful) {
                    displaySuccess();
                } else {
                     throw new Error('document.execCommand("copy") returned false');
                }
            } catch (err) {
                console.error('Legacy Copy Error:', err);
                displayError('ÙØ´Ù„ Ø§Ù„Ù†Ø³Ø® Ø¥Ù„Ù‰ Ø§Ù„Ø­Ø§ÙØ¸Ø©.');
            }
        }
    }

    function attachEventListeners() {
        const planner = gebi("planer_klinow");
        if (!planner) {
            console.error("Sniper Planner UI not found, cannot attach listeners.");
            return;
        }

        planner.addEventListener('change', function(e) {
            const target = e.target;

            if (target.matches('#sniper-coord-target')) {
                pokazOdleglosc();
            }
            else if (target.matches('#sniper-arrival-date')) {
                poprawDate(target, '.');
            }
            else if (target.matches('#sniper-arrival-time')) {
                poprawDate(target, ':');
            }
            else if (target.matches('#sniper-group-select')) {
                zmienGrupe();
            }
            else if (target.matches('#sniper-sigil-percentage')) {
                const input = target;
                let newValue = parseFloat(input.value);
                if (isNaN(newValue) || newValue < 0) {
                    newValue = 0;
                    input.value = newValue;
                }
                savedSigilValue = newValue;
                try {
                    localStorage.setItem(SIGIL_VALUE_STORAGE_KEY, savedSigilValue.toString());
                     input.style.transition = 'background-color 0.3s ease';
                     input.style.backgroundColor = '#d4ffbc';
                     setTimeout(() => { if (input) input.style.backgroundColor = ''; }, 500);
                } catch (err) {
                     UI.ErrorMessage("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ù‚ÙŠÙ…Ø© Ø§Ù„Ø®ØªÙ….", 3000);
                     console.error("Error saving sigil value:", err);
                }
            }
            else if (target.matches('#sniper-alert-threshold')) {
                const input = target;
                let newValue = parseInt(input.value, 10);
                const minVal = parseInt(input.min, 10) || 1;
                const maxVal = parseInt(input.max, 10) || 300;

                if (isNaN(newValue) || newValue < minVal || newValue > maxVal) {
                    newValue = DEFAULT_ALERT_THRESHOLD_SECONDS;
                    input.value = newValue;
                    input.classList.add('input-error');
                    UI.ErrorMessage(`Ù‚ÙŠÙ…Ø© Ø­Ø¯ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡ ØºÙŠØ± ØµØ§Ù„Ø­Ø©. ÙŠØ¬Ø¨ Ø£Ù† ØªÙƒÙˆÙ† Ø¨ÙŠÙ† ${minVal} Ùˆ ${maxVal}. ØªÙ… Ø¥Ø¹Ø§Ø¯ØªÙ‡Ø§ Ø¥Ù„Ù‰ ${newValue} Ø«.`, 3000);
                } else {
                    input.classList.remove('input-error');
                }

                alertThresholdSeconds = newValue;
                try {
                    localStorage.setItem(ALERT_THRESHOLD_STORAGE_KEY, alertThresholdSeconds.toString());
                    input.style.transition = 'background-color 0.3s ease';
                    input.style.backgroundColor = '#d4ffbc';
                    setTimeout(() => { if (input) input.style.backgroundColor = ''; }, 500);
                } catch (err) {
                    UI.ErrorMessage("Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ø­ÙØ¸ Ø­Ø¯ Ø§Ù„ØªÙ†Ø¨ÙŠÙ‡.", 3000);
                    console.error("Error saving alert threshold:", err);
                }
            }
            else if (target.matches('.sniper-result-filter-cb')) {
                 const checkbox = target;
                 const unitIndex = parseInt(checkbox.value, 10);
                 const filterHeader = gebi("sniper-results-filter-header");
                 if (!filterHeader) return;

                 if (unitIndex === -1) {
                     const isChecked = checkbox.checked;
                     qsa('.sniper-result-filter-cb', filterHeader).forEach(cb => {
                         if (cb !== checkbox) {
                             cb.checked = isChecked;
                             const idx = parseInt(cb.value, 10);
                             if (idx >= 0 && idx < aktywneJednostki.length) {
                                 aktywneJednostki[idx] = isChecked ? "1" : "0";
                                 const th = qs(`#sniper-results-table thead th[data-unit="${obrazki[idx]}"]`);
                                 if (th) th.classList.toggle('faded', !isChecked);
                             }
                         }
                     });
                 }
                 else {
                     if (unitIndex >= 0 && unitIndex < aktywneJednostki.length) {
                         aktywneJednostki[unitIndex] = checkbox.checked ? "1" : "0";
                         const th = qs(`#sniper-results-table thead th[data-unit="${obrazki[unitIndex]}"]`);
                         if (th) th.classList.toggle('faded', !checkbox.checked);
                     }
                     if (!checkbox.checked) {
                        const allCb = qs('.sniper-result-filter-cb[value="-1"]', filterHeader);
                        if (allCb) allCb.checked = false;
                     }
                 }

                 try {
                     if (aktywneJednostki.length > 0) {
                         setCookie(ACTIVE_UNITS_COOKIE_KEY, parseInt(aktywneJednostki.join(""), 2).toString(36), 30);
                     }
                 } catch (err) {
                      console.warn("Could not save active units cookie:", err);
                 }
                 applyResultsFilter();
            }
        });

        planner.addEventListener('input', function(e) {
            if (e.target.matches('#sniper-filter-table thead input[type="number"][data-unit-index]')) {
                chowaj_wojska(e.target.dataset.unitIndex, e.target.value);
            }
        });

        planner.addEventListener('click', function(e) {
             const target = e.target;
             const closest = (selector) => target.closest(selector);

             if (closest('#sniper-filter-toggle')) {
                 zmienStrzalke();
                 const fC = qs('.filter-table-container', planner);
                 const rC = qs('.results-table-container', planner);
                 const bC = gebi('sniper-bb-export-container');
                 const isFilterVisible = fC && fC.style.display !== 'none';

                 if (fC) fC.style.display = isFilterVisible ? 'none' : 'block';
                 if (rC) rC.style.display = isFilterVisible ? 'block' : 'none';

                 const hasResults = qs('#sniper-results-table tbody tr:not(:has(td[colspan]))');
                 if (bC) bC.style.display = (isFilterVisible || !hasResults) ? 'none' : 'flex';

                 if (rC) {
                     const isBbVisible = bC && bC.style.display !== 'none';
                     rC.style.marginTop = isBbVisible ? '0' : '15px';
                     rC.style.borderRadius = isBbVisible ? '0 0 3px 3px' : '3px';
                     rC.style.borderTop = isBbVisible ? 'none' : '1px solid #c1a264';
                 }
                 if(fC && fC.style.display !== 'none') {
                     fC.style.marginTop = '15px';
                     fC.style.borderRadius = '3px';
                     fC.style.borderTop = '1px solid #c1a264';
                 }

                 if (fC && fC.style.display === 'none') {
                     zapiszWybrane();
                 }
                 const toggleButton = gebi('sniper-filter-toggle');
                 if(toggleButton) toggleButton.setAttribute('aria-pressed', !isFilterVisible);
             }
             else if (target.matches('#sniper-calculate-button')) {
                 wypiszMozliwosci();
             }
             else if (target.matches('#sniper-filter-table thead a') && (target.textContent.includes("ØªØµÙÙŠØ±") || target.textContent.includes("Zeruj"))) {
                 e.preventDefault();
                 ustaw_min(0);
             }
             else if (closest('#sniper-filter-table thead th[data-sort-col]')) {
                 const th = closest('th[data-sort-col]');
                 sortowanie_przegladu(th.dataset.sortCol);
             }
             else if (target.matches('#sniper-select-all-checkbox')) {
                 zaznaczWszystko(target);
             }
             else if (closest('#sniper-results-table thead th[data-unit]')) {
                 const th = closest('th[data-unit]');
                 th.classList.toggle('faded');
                 const unitIndex = obrazki.indexOf(th.dataset.unit);
                 if (unitIndex !== -1 && unitIndex < aktywneJednostki.length) {
                     aktywneJednostki[unitIndex] = th.classList.contains("faded") ? "0" : "1";
                     const fCb = qs(`#sniper-results-filter-header .sniper-result-filter-cb[value="${unitIndex}"]`);
                     if(fCb) fCb.checked = !th.classList.contains("faded");

                     try {
                         if (aktywneJednostki.length > 0) {
                              setCookie(ACTIVE_UNITS_COOKIE_KEY, parseInt(aktywneJednostki.join(""), 2).toString(36), 30);
                         }
                     } catch (err) {
                          console.warn("Could not save active units cookie:", err);
                     }
                     applyResultsFilter();
                 }
             }
             else if (closest('#bb-show-hide-link')) {
                 e.preventDefault();
                 let bbECont = gebi('sniper-bb-export-container');
                 if (!bbECont) return;
                 let txtArea = bbECont.querySelector('textarea');
                 const link = gebi('bb-show-hide-link');

                 if (!txtArea) {
                     let targetTimeStr = window.sniperTargetArrivalTimeBB || "";
                     let tableContent = window.sniperLastBBContent || "";
                     let bbTxt = (tableContent)
                        ? (targetTimeStr && targetTimeStr !== "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­" ? `[size=12][color=black]${targetTimeStr}[/color][/size]\n\n` : "") +
                          `[table]\n${bbCodeTableHeader}\n${tableContent}\n[/table]`
                        : "Ù„Ø§ ØªÙˆØ¬Ø¯ Ù†ØªØ§Ø¦Ø¬ Ù„ØªØµØ¯ÙŠØ±Ù‡Ø§.";

                     let newTxtArea = document.createElement('textarea');
                     newTxtArea.readOnly = true;
                     newTxtArea.onclick = function() { this.select(); };
                     newTxtArea.value = bbTxt.replace(/'/g, "'");
                     newTxtArea.setAttribute('aria-label', 'BBCode Export');
                     bbECont.appendChild(newTxtArea);
                     newTxtArea.style.height = `${Math.min(150, newTxtArea.scrollHeight + 10)}px`;
                     newTxtArea.select();
                     if(link) link.setAttribute('aria-expanded', 'true');
                 } else {
                     txtArea.remove();
                      if(link) link.setAttribute('aria-expanded', 'false');
                 }
             }
             else if (target.matches('#bb-copy-button')) {
                 e.preventDefault();
                 const button = target;
                 let bbECont = gebi('sniper-bb-export-container');
                 if (!bbECont) return;
                 let txtArea = bbECont.querySelector('textarea');
                 let bbCopy = "";
                 let targetTimeStr = window.sniperTargetArrivalTimeBB || "";
                 let tableContent = window.sniperLastBBContent || "";

                 if (txtArea) {
                     bbCopy = txtArea.value;
                 } else {
                     bbCopy = (tableContent && targetTimeStr && targetTimeStr !== "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­" ? `[size=12][color=black]${targetTimeStr}[/color][/size]\n\n` : "") +
                              (tableContent ? `[table]\n${bbCodeTableHeader}\n${tableContent}\n[/table]` : "");
                     bbCopy = bbCopy.replace(/'/g, "'");
                 }

                 if (bbCopy && tableContent) {
                     copyTextToClipboard(bbCopy, 'ØªÙ… Ù†Ø³Ø® Ø£ÙƒÙˆØ§Ø¯ BB Ù„Ù„Ø¬Ø¯ÙˆÙ„ ÙƒØ§Ù…Ù„Ø§Ù‹!', button);
                 } else {
                     UI.InfoMessage('Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù†Øµ Ù„Ù†Ø³Ø®Ù‡ (Ø§Ø­Ø³Ø¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬ Ø£ÙˆÙ„Ø§Ù‹).', 2000);
                 }
             }
             else if (closest('.btn-copy-row-bb')) {
                 e.preventDefault();
                 const button = closest('.btn-copy-row-bb');
                 const rowBBCodeTable = button.dataset.bbcode;
                 if (rowBBCodeTable) {
                    copyTextToClipboard(rowBBCodeTable, 'ØªÙ… Ù†Ø³Ø® Ø¬Ø¯ÙˆÙ„ BB Ù„Ù„Ù‡Ø¬Ù…Ø©!', button);
                 } else {
                    UI.ErrorMessage('Ø®Ø·Ø£: Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ ÙƒÙˆØ¯ BB Ù„Ù‡Ø°Ø§ Ø§Ù„ØµÙ.', 2000);
                 }
             }
        });

        document.body.addEventListener('click', function(e) {
            const row = e.target.closest('#commands_incomings .command-row, #commands_outgoings .command-row');
            if (!row) return;

            if (e.target.matches('a, input, button') || e.target.closest('a, input, button')) return;

            const isOutgoing = row.closest('#commands_outgoings') !== null;

            let arrivalTimeCell = null;
            const cells = row.cells;
            for(let i = 0; i < cells.length; i++) {
                if (cells[i].querySelector('span.timer[data-endtime]')) {
                    arrivalTimeCell = cells[i];
                    break;
                }
                if (cells[i].textContent.match(/\b\d{1,2}:\d{1,2}:\d{1,2}\b/) && !cells[i].querySelector('span[data-endtime]')) {
                     arrivalTimeCell = cells[i];
                }
            }
            if (!arrivalTimeCell) {
                 const arrivalTimeCellIndex = isOutgoing ? 2 : 1;
                 if (cells.length > arrivalTimeCellIndex) {
                    arrivalTimeCell = cells[arrivalTimeCellIndex];
                 }
             }
            if (!arrivalTimeCell) {
                UI.ErrorMessage('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø®Ù„ÙŠØ© ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ ÙÙŠ Ø§Ù„ØµÙ Ø§Ù„Ù…Ø­Ø¯Ø¯.', 3000);
                return;
            }

            let serverTimeEl = gebi('serverTime');
            let serverDateEl = gebi('serverDate');
            if (!serverTimeEl || !serverDateEl) {
                 UI.ErrorMessage("Ø®Ø·Ø£: Ù„Ø§ ÙŠÙ…ÙƒÙ† Ù‚Ø±Ø§Ø¡Ø© ÙˆÙ‚Øª Ø§Ù„Ø®Ø§Ø¯Ù… Ø§Ù„Ø­Ø§Ù„ÙŠ.", 3000);
                 return;
            }
            var t_now_click = serverTimeEl.textContent.match(/\d+/g);
            var d_now_click = serverDateEl.textContent.match(/\d+/g);
            if (!t_now_click || !d_now_click || t_now_click.length < 3 || d_now_click.length < 3) {
                 UI.ErrorMessage("Ø®Ø·Ø£: ØªÙ†Ø³ÙŠÙ‚ ÙˆÙ‚Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± ØµØ§Ù„Ø­.", 3000);
                 return;
            }
            var serverNow = new Date(d_now_click[2], d_now_click[1] - 1, d_now_click[0], t_now_click[0], t_now_click[1], t_now_click[2]);

            const parsedDate = parseArrivalDateTime(arrivalTimeCell.innerHTML, serverNow);

            if (parsedDate && !isNaN(parsedDate.getTime())) {
                let arrivalTimeInput = gebi('sniper-arrival-time');
                let arrivalDateInput = gebi('sniper-arrival-date');

                if (arrivalTimeInput && arrivalDateInput) {
                    arrivalTimeInput.value = formatTimeForInput(parsedDate);
                    arrivalDateInput.value = formatDateForInput(parsedDate);

                    arrivalTimeInput.classList.remove('input-error');
                    arrivalDateInput.classList.remove('input-error');
                    arrivalTimeInput.style.borderColor = '';
                    arrivalDateInput.style.borderColor = '';

                    qsa('.sniper-highlight-incoming, .sniper-highlight-outgoing').forEach(el => el.classList.remove('sniper-highlight-incoming', 'sniper-highlight-outgoing'));
                    row.classList.add(isOutgoing ? 'sniper-highlight-outgoing' : 'sniper-highlight-incoming');

                    if (typeof UI !== 'undefined' && UI.InfoMessage) {
                        UI.InfoMessage('ØªÙ… ØªØ­Ø¯ÙŠØ« ØªØ§Ø±ÙŠØ® ÙˆÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„.', 2000);
                    }
                } else {
                     UI.ErrorMessage('Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø­Ù‚ÙˆÙ„ Ø§Ù„ØªØ§Ø±ÙŠØ®/Ø§Ù„ÙˆÙ‚Øª ÙÙŠ Ø§Ù„Ø£Ø¯Ø§Ø©.', 3000);
                }
            } else {
                 UI.ErrorMessage('ÙØ´Ù„ ÙÙŠ ØªØ­Ù„ÙŠÙ„ ØªØ§Ø±ÙŠØ® ÙˆÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ Ù…Ù† Ø§Ù„ØµÙ Ø§Ù„Ù…Ø­Ø¯Ø¯.', 3000);
            }
        });

    }


    function wypiszMozliwosci() {
         let slowestUnitData = [];

         if (pobieram) {
             const loadingDiv = gebi('sniper-loading');
             if (loadingDiv) {
                 loadingDiv.innerHTML = `<img src='${image_base}throbber.gif' alt=""/> Ø§Ù†ØªØ¸Ø±ØŒ ÙŠØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª...`;
                 loadingDiv.style.display = 'flex';
             }
             setTimeout(wypiszMozliwosci, 500);
             return;
         }

         const filterContainer = qs('#planer_klinow .filter-table-container');
         const resultsContainer = qs('#planer_klinow .results-table-container');
         const bbContainer = gebi('sniper-bb-export-container');
         const copyBtn = gebi('bb-copy-button');
         if (filterContainer && filterContainer.style.display !== 'none') {
             zmienStrzalke();
             filterContainer.style.display = 'none';
             if (resultsContainer) resultsContainer.style.display = 'block';
             zapiszWybrane();
         }

         clearInterval(countdownInterval);
         countdownInterval = null;
         document.title = originalPageTitle;

         const coordTargetInput = gebi('sniper-coord-target');
         const arrivalTimeInput = gebi('sniper-arrival-time');
         const arrivalDateInput = gebi('sniper-arrival-date');
         const sigilInput = gebi('sniper-sigil-percentage');
         const resultsTableBody = qs('#sniper-results-table tbody');
         const resultsCountEl = gebi('sniper-results-count');
         const loadingDiv = gebi('sniper-loading');

         if (bbContainer) bbContainer.style.display = 'none';
         if (copyBtn) copyBtn.disabled = true;
         if(resultsContainer) {
             resultsContainer.style.marginTop = '15px';
             resultsContainer.style.borderRadius = '3px';
             resultsContainer.style.borderTop = '1px solid #c1a264';
         }
         window.sniperLastBBContent = "";
         window.sniperTargetArrivalTimeBB = "";

         if (!coordTargetInput || !arrivalTimeInput || !arrivalDateInput || !sigilInput || !resultsTableBody || !resultsCountEl || !loadingDiv) {
             UI.ErrorMessage("Ø®Ø·Ø£: Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø¹Ù†Ø§ØµØ± Ø§Ù„ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø£Ø³Ø§Ø³ÙŠØ© Ù„Ø­Ø³Ø§Ø¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬.", 4000);
             if(loadingDiv) loadingDiv.style.display = 'none';
             return;
         }

         loadingDiv.innerHTML = `<img src='${image_base}throbber.gif' alt=""/> Ø¬Ø§Ø±ÙŠ Ø­Ø³Ø§Ø¨ Ø§Ù„Ù†ØªØ§Ø¦Ø¬...`;
         loadingDiv.style.display = 'flex';

         var celInput = coordTargetInput.value.trim();
         var godzinaWejsciaStr = arrivalTimeInput.value.trim();
         var dataWejsciaStr = arrivalDateInput.value.trim();
         var sigilPercentage = parseFloat(sigilInput.value) || 0;
         var sigilRatio = 1 + (sigilPercentage / 100);

         var cel = celInput ? celInput.match(/(\d+)\|(\d+)/) : null;
         var godzinaWejscia = godzinaWejsciaStr ? godzinaWejsciaStr.match(/^(\d{1,2}):(\d{1,2}):(\d{1,2})$/) : null;
         var dataWejscia = dataWejsciaStr ? dataWejsciaStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/) : null;
         let errorMsg = "";
         let isValid = true;

         [coordTargetInput, arrivalDateInput, arrivalTimeInput].forEach(el => el.classList.remove('input-error'));

         if (!cel || cel.length < 3) {
             errorMsg += "Ø¥Ø­Ø¯Ø§Ø«ÙŠØ§Øª Ø§Ù„Ù‡Ø¯Ù ØºÙŠØ± ØµØ­ÙŠØ­Ø©. ";
             coordTargetInput.classList.add('input-error');
             isValid = false;
         }
         if (!dataWejscia || dataWejscia.length < 4) {
             errorMsg += "ØªØ§Ø±ÙŠØ® Ø§Ù„ÙˆØµÙˆÙ„ ØºÙŠØ± ØµØ­ÙŠØ­ (Ø§Ù„ØªÙ†Ø³ÙŠÙ‚: dd.mm.yyyy). ";
             arrivalDateInput.classList.add('input-error');
             isValid = false;
         }
         if (!godzinaWejscia || godzinaWejscia.length < 4) {
             errorMsg += "ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ ØºÙŠØ± ØµØ­ÙŠØ­ (Ø§Ù„ØªÙ†Ø³ÙŠÙ‚: hh:mm:ss). ";
             arrivalTimeInput.classList.add('input-error');
             isValid = false;
         }

         var czasWejsciaDate;
         if (isValid) {
             try {
                 czasWejsciaDate = new Date(dataWejscia[3], dataWejscia[2] - 1, dataWejscia[1], godzinaWejscia[1], godzinaWejscia[2], godzinaWejscia[3]);
                 if (isNaN(czasWejsciaDate.getTime())) throw new Error("ÙƒØ§Ø¦Ù† ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­ ØªÙ… Ø¥Ù†Ø´Ø§Ø¤Ù‡");
                 window.sniperTargetArrivalTimeBB = formatTargetArrivalTimeForBBCode(czasWejsciaDate);
             } catch(dateError) {
                 errorMsg += `Ø§Ù„ØªØ§Ø±ÙŠØ®/Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…Ø¯Ø®Ù„ ØºÙŠØ± ØµØ§Ù„Ø­ (${dateError.message}). `;
                 arrivalDateInput.classList.add('input-error');
                 arrivalTimeInput.classList.add('input-error');
                 isValid = false;
                 window.sniperTargetArrivalTimeBB = "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­";
             }
         } else {
             window.sniperTargetArrivalTimeBB = "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­";
         }

         const columnCount = obrazki.length + 5;
         var serverTimeEl = gebi('serverTime');
         var serverDateEl = gebi('serverDate');
         var t_now = serverTimeEl ? serverTimeEl.textContent.match(/\d+/g) : null;
         var d_now = serverDateEl ? serverDateEl.textContent.match(/\d+/g) : null;

         if (!t_now || !d_now || t_now.length < 3 || d_now.length < 3) {
              UI.ErrorMessage("Ø®Ø·Ø£: Ù„Ø§ ÙŠÙ…ÙƒÙ† Ù‚Ø±Ø§Ø¡Ø© ÙˆÙ‚Øª Ø§Ù„Ø®Ø§Ø¯Ù….", 4000);
              loadingDiv.style.display = 'none';
              document.title = originalPageTitle;
              resultsTableBody.innerHTML = `<tr><td colspan="${columnCount}">Ø®Ø·Ø£ ÙÙŠ Ù‚Ø±Ø§Ø¡Ø© ÙˆÙ‚Øª Ø§Ù„Ø®Ø§Ø¯Ù….</td></tr>`;
              return;
         }
         var obecnyCzas = new Date(d_now[2], d_now[1] - 1, d_now[0], t_now[0], t_now[1], t_now[2]);

         if (!isValid) {
             UI.ErrorMessage("Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø¥Ø¯Ø®Ø§Ù„: " + errorMsg, 4000);
             loadingDiv.style.display = 'none';
             resultsTableBody.innerHTML = `<tr><td colspan="${columnCount}">Ø§Ù„Ø±Ø¬Ø§Ø¡ ØªØµØ­ÙŠØ­ Ø§Ù„Ø£Ø®Ø·Ø§Ø¡ ÙÙŠ Ø§Ù„Ø¥Ø¯Ø®Ø§Ù„ Ø£Ø¹Ù„Ø§Ù‡.</td></tr>`;
             resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
             document.title = originalPageTitle;
             return;
         }
          var roznicaSekund = (czasWejsciaDate - obecnyCzas) / 1000;

         if (roznicaSekund <= 0) {
             UI.InfoMessage('ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ø­Ø¯Ø¯ Ù‚Ø¯ Ù…Ø¶Ù‰.', 3000, 'warning');
             loadingDiv.style.display = 'none';
             resultsTableBody.innerHTML = `<tr><td colspan="${columnCount}">ÙˆÙ‚Øª Ø§Ù„ÙˆØµÙˆÙ„ Ø§Ù„Ù…Ø­Ø¯Ø¯ (${formatDateTimeForDisplay(czasWejsciaDate)}) Ù‚Ø¯ Ù…Ø¶Ù‰.</td></tr>`;
             resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
             document.title = originalPageTitle;
             return;
         }

         var ilosc_wiosek = 0;
         var villagesCheckedCount = pokazWies.filter(Boolean).length;

          if (!Array.isArray(aktywneJednostki) || aktywneJednostki.length !== obrazki.length) {
              aktywneJednostki = new Array(obrazki.length).fill("1");
              qsa('#sniper-results-table thead th[data-unit]').forEach((th, i) => {
                  th.classList.toggle('faded', aktywneJednostki[i] === '0');
              });
              qsa('#sniper-results-filter-header .sniper-result-filter-cb').forEach(cb => {
                  const idx = parseInt(cb.value, 10);
                  if(idx >= 0 && idx < aktywneJednostki.length) cb.checked = (aktywneJednostki[idx] === '1');
                  else if(idx === -1) cb.checked = true;
              });
              applyResultsFilter();
         }

         let tempHtmlArray = [];
         let tempBBArrayFull = [];
         let tempCzasWyjscia = [];
         let tempSlowestUnit = [];

         for (let i = 0; i < mojeWioski.length; i++) {
             if (!pokazWies[i]) continue;

             let villageCoords = mojeWioski[i];
             if (!villageCoords || villageCoords.length < 2) continue;
             let originX = Number(villageCoords[0]);
             let originY = Number(villageCoords[1]);
             if (isNaN(originX) || isNaN(originY)) continue;

             let tempHtmlRowStart = `<tr><td><a href="${dane.linkDoPrzegladuWioski}${id[i]}" target="_blank" title="${originX}|${originY}">${nazwyWiosek[i].replace(/\s+/g, "\u00A0")}</a></td>`;
             let najwolniejsza = 0;
             let jednostkaNajwolniejszaIndex = -1;
             let hasValidUnit = false;
             let troopCellsHtml = "";
             let queryParams = {};
             let troopBBStringParts = [];

             for (let j = 0; j < obrazki.length; j++) {
                 let currentTroopCount = (wojska[i] && typeof wojska[i][j] !== 'undefined') ? (parseInt(wojska[i][j]) || 0) : 0;

                 if (aktywneJednostki[j] == "1") {
                     if (currentTroopCount > 0) {
                         let a = Math.abs(Number(cel[1]) - originX);
                         let b = Math.abs(Number(cel[2]) - originY);
                         let distance = Math.sqrt(a * a + b * b);
                         let baseTravelTimeSeconds = distance * dane.predkosci[j] * 60;
                         let czasPrzejscia = baseTravelTimeSeconds / sigilRatio;

                         if (czasPrzejscia <= roznicaSekund + 1) {
                             hasValidUnit = true;
                             troopCellsHtml += `<td class="possible">${currentTroopCount}</td>`;
                             queryParams[`att_${obrazki[j]}`] = currentTroopCount;
                             troopBBStringParts.push(`[unit]${obrazki[j]}[/unit] ${currentTroopCount}`);

                             if (czasPrzejscia > najwolniejsza) {
                                 najwolniejsza = czasPrzejscia;
                                 jednostkaNajwolniejszaIndex = j;
                             }
                         } else {
                             troopCellsHtml += `<td>${currentTroopCount}</td>`;
                         }
                     } else {
                         troopCellsHtml += `<td class="faded">0</td>`;
                     }
                 } else {
                     troopCellsHtml += `<td class="faded">${currentTroopCount > 0 ? currentTroopCount : 0}</td>`;
                 }
             }

             if (hasValidUnit && jednostkaNajwolniejszaIndex !== -1) {
                 let tmpDate = new Date(czasWejsciaDate.getTime());
                 tmpDate.setSeconds(tmpDate.getSeconds() - Math.round(najwolniejsza));

                 tempCzasWyjscia.push(tmpDate);
                 tempSlowestUnit.push(jednostkaNajwolniejszaIndex);

                 let ddd = formatDateTimeForDisplay(tmpDate);
                 let countdownPlaceholder = `<span data-departure="${tmpDate.getTime()}" class="countdown-timer">--:--:--</span>`;

                 let mozliwewojskaQuery = "&from=simulator" + Object.entries(queryParams).map(([k, v]) => `&${k}=${v}`).join('');
                 let rallyPointLink = `${dane.linkDorozkazu}${id[i]}&screen=place&x=${cel[1]}&y=${cel[2]}${mozliwewojskaQuery}`;

                 let troopBBString = troopBBStringParts.join(' ');
                 let bbCodeAttackLink = `[url=${window.location.origin}${rallyPointLink}]Ù‡Ø¬ÙˆÙ…[/url]`;
                 let dddBBFormatted = formatDepartureTimeForBBCode(tmpDate);
                 let singleRowBBCodeContent = `[coord]${originX}|${originY}[/coord] [|] [coord]${cel[1]}|${cel[2]}[/coord] [|] ${troopBBString} [|] ${dddBBFormatted} [|] ${bbCodeAttackLink}`;

                 let targetTimeStrBB = window.sniperTargetArrivalTimeBB || "";
                 let singleRowBBCodeTable = (targetTimeStrBB && targetTimeStrBB !== "ØªØ§Ø±ÙŠØ® ØºÙŠØ± ØµØ§Ù„Ø­" ? `[size=12][color=black]${targetTimeStrBB}[/color][/size]\n\n` : "") +
                                            `[table]\n${bbCodeTableHeader}\n[*]${singleRowBBCodeContent}\n[/table]`;

                 let escapedBBCode = singleRowBBCodeTable.replace(/'/g, "&apos;").replace(/"/g, "&quot;");
                 let copyButtonHtml = `<td><button class="btn-copy-row-bb" data-bbcode="${escapedBBCode}" title="Ù†Ø³Ø® Ø¬Ø¯ÙˆÙ„ BB Ù„Ù‡Ø°Ù‡ Ø§Ù„Ù‡Ø¬Ù…Ø©"><img src="${image_base}igm/export.png" alt="Ù†Ø³Ø® BB"></button></td>`;
                 let attackButtonHtml = `<td><a href='${rallyPointLink}' target="_blank" class="btn btn-attack"><img src="/graphic/command/attack.png" alt=""> <span>Ù‡Ø¬ÙˆÙ…</span></a></td>`;


                 tempHtmlArray.push(tempHtmlRowStart + troopCellsHtml + `<td>${ddd}</td><td>${countdownPlaceholder}</td>${attackButtonHtml}${copyButtonHtml}</tr>`);

                 tempBBArrayFull.push("[*]" + singleRowBBCodeContent);

                 ilosc_wiosek++;
             }
         }

         resultsCountEl.innerHTML = `<b>${ilosc_wiosek}/${villagesCheckedCount}</b> <span class='icon header village' title='Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø­Ø³ÙˆØ¨Ø© / Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©'></span>`;

         if (ilosc_wiosek > 0) {
             var resultObjects = [];
             for (let i = 0; i < ilosc_wiosek; i++) {
                 resultObjects.push({
                     departure: tempCzasWyjscia[i],
                     html: tempHtmlArray[i],
                     bbFullRow: tempBBArrayFull[i],
                     slowest: tempSlowestUnit[i]
                 });
             }
             resultObjects.sort((a, b) => a.departure - b.departure);

             let html = resultObjects.map(obj => obj.html);
             window.sniperLastBBContent = resultObjects.map(obj => obj.bbFullRow).join('\n');
             slowestUnitData = resultObjects.map(obj => obj.slowest);

             resultsTableBody.innerHTML = html.join("\n");

              qsa('#sniper-results-table tbody tr').forEach((row, i) => {
                  row.classList.add(i % 2 ? "row_a" : "row_b");
                  if (typeof slowestUnitData[i] !== 'undefined') {
                      row.dataset.slowestUnit = slowestUnitData[i];
                  }
                  row.dataset.alertPlayed = "false";
             });

             if (bbContainer) {
                bbContainer.style.display = 'flex';
                const existingTextarea = bbContainer.querySelector('textarea');
                if (existingTextarea) existingTextarea.remove();
             }
             if (copyBtn) copyBtn.disabled = false;
             if(resultsContainer) {
                 resultsContainer.style.marginTop = '0';
                 resultsContainer.style.borderRadius = '0 0 3px 3px';
                 resultsContainer.style.borderTop = 'none';
             }

             startCountdownTimers();
             applyResultsFilter();

         } else {
             window.sniperLastBBContent = "";
             let message = villagesCheckedCount === 0 ? 'Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø§Ø®ØªÙŠØ§Ø± Ù‚Ø±Ù‰ Ù…Ù† Ø§Ù„ÙÙ„ØªØ± Ø£ÙˆÙ„Ø§Ù‹.' : 'Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù†ØªØ§Ø¦Ø¬ Ù…Ø·Ø§Ø¨Ù‚Ø©.';
             resultsTableBody.innerHTML = `<tr><td colspan="${columnCount}">${message}</td></tr>`;
             if (villagesCheckedCount > 0) {
                 UI.InfoMessage('Ù„Ù„Ø£Ø³ÙØŒ Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚Ø±Ù‰ ÙŠÙ…ÙƒÙ†Ù‡Ø§ Ø§Ù„ÙˆØµÙˆÙ„ ÙÙŠ Ø§Ù„ÙˆÙ‚Øª Ø§Ù„Ù…Ø­Ø¯Ø¯ Ø¨Ø§Ù„ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ù…Ø®ØªØ§Ø±Ø©.', 3000, 'warning');
             }
             if (bbContainer) bbContainer.style.display = 'none';
             if (copyBtn) copyBtn.disabled = true;
             document.title = originalPageTitle;
         }

         loadingDiv.style.display = 'none';
    }

    function addResultsFilterCheckboxes() {
        const filterHeader = gebi("sniper-results-filter-header");
        if (!filterHeader) return;

        qsa('.sniper-result-filter-cb', filterHeader).forEach(cb => {
             if (cb.value !== "-1") {
                 cb.parentElement.remove();
             }
        });

          if (!Array.isArray(aktywneJednostki) || aktywneJednostki.length !== obrazki.length) {
              aktywneJednostki = new Array(obrazki.length).fill("1");
          }

        obrazki.forEach((unitImg, index) => {
            let unitName = dane.nazwyWojsk[index];
            let label = document.createElement('label');
            label.title = unitName;
            let isChecked = (aktywneJednostki[index] === "1");
            label.innerHTML = `<input type="checkbox" class="sniper-result-filter-cb" value="${index}" ${isChecked ? 'checked' : ''}> <img src="${img_wojsk}unit_${unitImg}.png" alt="${unitName}" style="height: 12px; vertical-align: middle;">`;
            filterHeader.appendChild(label);
        });
        applyResultsFilter();
    }

    function applyResultsFilter() {
        const resultsTableBody = qs('#sniper-results-table tbody');
        if (!resultsTableBody) return;
        const filterHeader = gebi("sniper-results-filter-header");
        if (!filterHeader) return;

        const filterCheckboxes = qsa('.sniper-result-filter-cb', filterHeader);
        const showAllCheckbox = qs('.sniper-result-filter-cb[value="-1"]', filterHeader);

        let selectedUnitIndices = [];
        let showAll = showAllCheckbox ? showAllCheckbox.checked : true;
        let allSpecificChecked = true;
        let anySpecificChecked = false;

        filterCheckboxes.forEach(cb => {
            if (cb !== showAllCheckbox) {
                 if (cb.checked) {
                    selectedUnitIndices.push(cb.value);
                    anySpecificChecked = true;
                 } else {
                     allSpecificChecked = false;
                 }
            }
        });

        qsa('tr[data-slowest-unit]', resultsTableBody).forEach(row => {
            const slowestUnitIndex = row.dataset.slowestUnit;
            const shouldShow = showAll || selectedUnitIndices.includes(slowestUnitIndex);
            row.style.display = shouldShow ? '' : 'none';
        });

         if (showAllCheckbox) {
            if (anySpecificChecked && !allSpecificChecked) {
                 showAllCheckbox.checked = false;
                 showAllCheckbox.indeterminate = true;
             } else if (allSpecificChecked && anySpecificChecked) {
                 showAllCheckbox.checked = true;
                 showAllCheckbox.indeterminate = false;
             } else {
                 showAllCheckbox.checked = !anySpecificChecked;
                 showAllCheckbox.indeterminate = false;
             }
         }
         updateCountdownTimers();
    }

    function startCountdownTimers() {
        clearInterval(countdownInterval);
        updateCountdownTimers();
        countdownInterval = setInterval(updateCountdownTimers, 1000);
    }

     function updateCountdownTimers() {
        var serverTimeEl = gebi('serverTime');
        var serverDateEl = gebi('serverDate');
        if (!serverTimeEl || !serverDateEl) {
             document.title = originalPageTitle;
             clearInterval(countdownInterval);
             countdownInterval = null;
             return;
        }

        var t_now = serverTimeEl.textContent.match(/\d+/g);
        var d_now = serverDateEl.textContent.match(/\d+/g);
        if (!t_now || !d_now || t_now.length < 3 || d_now.length < 3) {
            document.title = originalPageTitle;
            clearInterval(countdownInterval);
            countdownInterval = null;
            return;
        }

        var obecnyCzasMs = new Date(d_now[2], d_now[1] - 1, d_now[0], t_now[0], t_now[1], t_now[2]).getTime();
        let activeTimers = 0;
        let earliestDepartureMs = Infinity;
        let hasVisibleRows = false;

        qsa('#sniper-results-table tbody .countdown-timer').forEach(timerSpan => {
             const parentRow = timerSpan.closest('tr');
             if (!parentRow || !timerSpan.dataset.departure) return;

             const departureMs = parseInt(timerSpan.dataset.departure, 10);
             if (isNaN(departureMs)) return;

             const roznicaSekund = Math.round((departureMs - obecnyCzasMs) / 1000);

             if (parentRow.style.display === 'none') {
                 if(roznicaSekund >= 0) {
                     activeTimers++;
                 }
                 return;
             }

             if (roznicaSekund >= 0) {
                 activeTimers++;
                 hasVisibleRows = true;
                 earliestDepartureMs = Math.min(earliestDepartureMs, departureMs);

                 timerSpan.className = 'countdown-timer';
                 timerSpan.style.animation = '';
                 timerSpan.style.color = '';
                 timerSpan.style.fontWeight = '';

                 if (roznicaSekund > 0 && roznicaSekund <= alertThresholdSeconds && parentRow.dataset.alertPlayed !== "true") {
                     playBeep();
                     parentRow.dataset.alertPlayed = "true";
                 }

                 if (roznicaSekund <= 10) {
                     timerSpan.textContent = roznicaSekund + " Ø«";
                     timerSpan.classList.add('countdown-soon');
                 } else if (roznicaSekund <= 60) {
                     timerSpan.textContent = roznicaSekund + " Ø«";
                     timerSpan.classList.add('countdown-active');
                     timerSpan.style.color = '#b70000';
                     timerSpan.style.fontWeight = 'bold';
                 } else {
                     timerSpan.textContent = formatujCzas(roznicaSekund);
                     timerSpan.classList.add('countdown-active');
                 }
             } else {
                 parentRow.style.display = 'none';
                 parentRow.dataset.alertPlayed = "false";
             }
        });

        if (earliestDepartureMs !== Infinity && hasVisibleRows) {
            const roznicaSekundEarliest = Math.round((earliestDepartureMs - obecnyCzasMs) / 1000);
            if (roznicaSekundEarliest >= 0) {
                let titleTime;
                let titlePrefix = "â³";
                if (roznicaSekundEarliest <= 60) {
                    titleTime = `${roznicaSekundEarliest} Ø«`;
                    titlePrefix = "ðŸ”´";
                } else {
                    titleTime = formatujCzas(roznicaSekundEarliest);
                }
                 document.title = `${titlePrefix} ${titleTime}`;
            } else {
                document.title = originalPageTitle;
            }
        } else {
             document.title = originalPageTitle;
        }

         const resultsTableBody = qs('#sniper-results-table tbody');
         if (resultsTableBody) {
             const firstRow = resultsTableBody.rows[0];
             const noValidResults = !firstRow || (firstRow.cells.length > 0 && firstRow.cells[0].colSpan >= 2);

             if ((activeTimers === 0 && !noValidResults) || noValidResults) {
                 if (countdownInterval) {
                     clearInterval(countdownInterval);
                     countdownInterval = null;
                     document.title = originalPageTitle;
                 }
             }
         } else if (countdownInterval) {
             clearInterval(countdownInterval);
             countdownInterval = null;
             document.title = originalPageTitle;
         }
    }
    function zmienGrupe() {
        const loadingDiv = gebi('sniper-loading');
        const resultsBody = qs('#sniper-results-table tbody');
        const filterTable = gebi('sniper-filter-table');
        const resultsCountEl = gebi('sniper-results-count');
        const groupSelect = gebi('sniper-group-select');
        const bbContainer = gebi('sniper-bb-export-container');
        const copyBtn = gebi('bb-copy-button');

        if (loadingDiv) {
            loadingDiv.innerHTML = `<img src='${image_base}throbber.gif' alt=""/> Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©...`;
            loadingDiv.style.display = 'flex';
        }
        wojska = []; id = []; mojeWioski = []; nazwyWiosek = []; pokazWies = [];
        if (resultsBody) resultsBody.innerHTML = '';
        if (filterTable) filterTable.innerHTML = '<tbody><tr><td>Ø¬Ø§Ø±ÙŠ Ø§Ù„ØªØ­Ù…ÙŠÙ„...</td></tr></tbody>';
        if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
        if (bbContainer) bbContainer.style.display = 'none';
        if (copyBtn) copyBtn.disabled = true;
        window.sniperLastBBContent = "";
        window.sniperTargetArrivalTimeBB = "";
        document.title = originalPageTitle;
        clearInterval(countdownInterval); countdownInterval = null;

        if (groupSelect) {
             dane.linkDoWojska = groupSelect.value;
        } else {
            dane.linkDoWojska = wszystkieWojska;
        }

        pobieram = true;
        pobierzDane();
    }

    function zaznaczWszystko(sourceCheckbox) {
        let isChecked = sourceCheckbox.checked;
        qsa('#sniper-filter-table tbody tr:not([style*="display: none"]) input[name="wybierz"]').forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        zapiszWybrane();
    }

    function ustaw_min(n) {
         let numValue = parseInt(n, 10) || 0;
         let changed = false;
         qsa('#sniper-filter-table thead input[type="number"][data-unit-index]').forEach(input => {
             let index = parseInt(input.dataset.unitIndex, 10);
             if (!isNaN(index) && index < minimalna_ilosc_wojsk.length) {
                 if (minimalna_ilosc_wojsk[index] !== numValue) changed = true;
                 input.value = numValue;
                 minimalna_ilosc_wojsk[index] = numValue;
             }
         });
         if (changed) chowaj_wojska();
    }

    function chowaj_wojska(specificIndex, specificValue) {
         if (typeof specificIndex !== 'undefined') {
             let index = parseInt(specificIndex, 10);
             let numValue = parseInt(specificValue, 10);
             if (!isNaN(index) && index < minimalna_ilosc_wojsk.length) {
                 if (!isNaN(numValue)) {
                     minimalna_ilosc_wojsk[index] = Math.max(0, numValue);
                 } else {
                     minimalna_ilosc_wojsk[index] = 0;
                     const inputEl = qs(`#sniper-filter-table thead input[data-unit-index="${index}"]`);
                     if (inputEl) inputEl.value = 0;
                 }
             }
         }

        let visibleCount = 0;
        const filterTableBody = qs("#sniper-filter-table tbody");
        if (!filterTableBody) return;

        const rows = filterTableBody.querySelectorAll('tr');
        rows.forEach((row, i) => {
             if (row.cells.length === 0 || i >= wojska.length) {
                 row.style.display = 'none';
                 return;
             }
             let showRow = true;
             for (let j = 0; j < minimalna_ilosc_wojsk.length; j++) {
                 let troopCount = (wojska[i] && typeof wojska[i][j] !== 'undefined') ? (parseInt(wojska[i][j], 10) || 0) : 0;
                 if (troopCount < minimalna_ilosc_wojsk[j]) {
                     showRow = false;
                     break;
                 }
             }
             row.style.display = showRow ? '' : 'none';
             if (showRow) {
                 visibleCount++;
             } else {
                 const checkbox = row.querySelector("input[name='wybierz']");
                 if (checkbox) checkbox.checked = false;
             }
        });

        let headerCheckbox = gebi('sniper-select-all-checkbox');
        if (headerCheckbox) {
            let numVisibleChecked = qsa('#sniper-filter-table tbody tr:not([style*="display: none"]) input[name="wybierz"]:checked').length;
            headerCheckbox.checked = visibleCount > 0 && numVisibleChecked === visibleCount;
            headerCheckbox.indeterminate = numVisibleChecked > 0 && numVisibleChecked < visibleCount;
        }

        zapiszWybrane();
    }

    function sortowanie_przegladu(ktory) {
        let colIndex = parseInt(ktory, 10);
        let cellIndex = colIndex + 1;

        var tabela = gebi("sniper-filter-table");
        if (!tabela || !tabela.tBodies || tabela.tBodies.length === 0) return;
        var tbody = tabela.tBodies[0];
        var headerRow = tabela.querySelector('thead tr:has(th[data-sort-col])');
        if (!headerRow) return;
        var targetTh = headerRow.querySelector(`th[data-sort-col="${ktory}"]`);
        if (!targetTh) return;

        headerRow.querySelectorAll('img.sort-arrow').forEach(img => img.remove());
        headerRow.querySelectorAll('th[data-sort-col]').forEach(th => th.removeAttribute('data-sort-dir'));

        var sortIconSrc;
        let currentSortDir = targetTh.dataset.sortPrev === 'desc' ? 'asc' : 'desc';
        sort_malejaco = currentSortDir === 'desc';

        targetTh.dataset.sortDir = currentSortDir;
        targetTh.dataset.sortPrev = currentSortDir;
        sortIconSrc = currentSortDir === 'desc' ? image_base + "list-down.png" : image_base + "list-up.png";

        let sortIcon = document.createElement('img');
        sortIcon.src = sortIconSrc;
        sortIcon.className = 'sort-arrow';
        sortIcon.alt = currentSortDir === 'desc' ? 'ÙØ±Ø² ØªÙ†Ø§Ø²Ù„ÙŠ' : 'ÙØ±Ø² ØªØµØ§Ø¹Ø¯ÙŠ';
        targetTh.appendChild(sortIcon);

        var rows = Array.from(tbody.rows).filter(row => row.cells.length > 0);

        var checkedState = {};
        rows.forEach((row) => {
             let cb = row.querySelector('input[name="wybierz"]');
             let rowId = cb ? cb.value : null;
             if (rowId) {
                 checkedState[rowId] = cb ? cb.checked : false;
             }
        });

        rows.sort(function(rowA, rowB) {
            let cellA_el = rowA.cells[cellIndex];
            let cellB_el = rowB.cells[cellIndex];
            if (!cellA_el || !cellB_el) return 0;

            let valA, valB;
            if (colIndex === -1) {
                 valA = cellA_el.textContent.trim().toLowerCase();
                 valB = cellB_el.textContent.trim().toLowerCase();
                 return sort_malejaco ? valB.localeCompare(valA) : valA.localeCompare(valB);
            }
            else {
                valA = parseFloat(cellA_el.textContent.trim().replace(/[^0-9.]/g, '')) || 0;
                valB = parseFloat(cellB_el.textContent.trim().replace(/[^0-9.]/g, '')) || 0;
                return sort_malejaco ? valB - valA : valA - valB;
            }
        });

        rows.forEach((row, index) => {
            row.className = index % 2 ? "row_a" : "row_b";
            tbody.appendChild(row);
            let cb = row.querySelector('input[name="wybierz"]');
            let rowId = cb ? cb.value : null;
            if (cb && rowId && typeof checkedState[rowId] !== 'undefined') {
                 cb.checked = checkedState[rowId];
            }
        });

        zapiszWybrane();
    }

    function wybieranieWiosek() {
        const filterTable = gebi('sniper-filter-table');
        if (!filterTable) return;
        const resultsCountEl = gebi('sniper-results-count');
        const bbContainer = gebi('sniper-bb-export-container');

        if (!wojska || wojska.length === 0 || !id || id.length === 0 || wojska.length !== id.length) {
             filterTable.innerHTML = '<tbody><tr><td>Ù„Ø§ ØªÙˆØ¬Ø¯ Ø¨ÙŠØ§Ù†Ø§Øª Ù‚Ø±Ù‰ Ù„Ø¹Ø±Ø¶Ù‡Ø§ Ø­Ø§Ù„ÙŠØ§Ù‹ Ø£Ùˆ Ø­Ø¯Ø« Ø®Ø·Ø£.</td></tr></tbody>';
             if(resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
             if(bbContainer) bbContainer.style.display = 'none';
             console.warn("Village data (wojska, id) is missing or inconsistent for wybieranieWiosek.");
             return;
        }

        var okienkoHead = `<thead>`;
        okienkoHead += `<tr class="min-troops-header"><th colspan="1"><span>Ø§Ù„Ø­Ø¯ Ø§Ù„Ø£Ø¯Ù†Ù‰:</span><a href='#' style="text-decoration:none;" title="ØªØ¹ÙŠÙŠÙ† Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø­Ø¯ÙˆØ¯ Ø§Ù„Ø¯Ù†ÙŠØ§ Ø¥Ù„Ù‰ 0">ØªØµÙÙŠØ±</a></th>`;
        for (let i = 0; i < obrazki.length; i++) {
            if (typeof minimalna_ilosc_wojsk[i] === 'undefined') minimalna_ilosc_wojsk[i] = 0;
            okienkoHead += `<th style="text-align: center;"><input type='number' min='0' value="${minimalna_ilosc_wojsk[i]}" data-unit-index="${i}" title="${dane.nazwyWojsk[i]}"></th>`;
        }
        okienkoHead += `<th colspan="2"></th></tr>`;
        okienkoHead += `<tr><th data-sort-col="-1" style="cursor:pointer;"><span class='icon header village'></span> Ø§Ù„Ù‚Ø±ÙŠØ©</th>`;
        for (let i = 0; i < obrazki.length; i++) {
            okienkoHead += `<th data-sort-col="${i}" style="cursor:pointer;"><img src='${img_wojsk}unit_${obrazki[i]}.png' title='${dane.nazwyWojsk[i]}' alt="${dane.nazwyWojsk[i]}"></th>`;
        }
        okienkoHead += `<th data-sort-col="${obrazki.length}" style="cursor:pointer;">Ø§Ù„Ù…Ø³Ø§ÙØ©</th>`;
        okienkoHead += `<th><input type='checkbox' id='sniper-select-all-checkbox' title='ØªØ­Ø¯ÙŠØ¯/Ø¥Ù„ØºØ§Ø¡ ØªØ­Ø¯ÙŠØ¯ Ø§Ù„ÙƒÙ„'></th></tr>`;
        okienkoHead += `</thead>`;

        var okienkoBody = "<tbody>";
        if (!pokazWies || pokazWies.length !== id.length) {
            pokazWies = new Array(id.length).fill(true);
        }
        for (let i = 0; i < id.length; i++) {
            let isChecked = pokazWies[i];
            let coordStr = (mojeWioski[i] && mojeWioski[i].length >= 2) ? `${mojeWioski[i][0]}|${mojeWioski[i][1]}` : '?|?';
            let villageName = nazwyWiosek[i]?.replace(/\s+/g, "\u00A0") ?? `Ù‚Ø±ÙŠØ© ${id[i]}`;
            let komorki = `<td><a href="${dane.linkDoPrzegladuWioski}${id[i]}" target="_blank" title="${coordStr}">${villageName}</a></td>`;

            for (let j = 0; j < obrazki.length; j++) {
                let troopCount = (wojska[i] && j < wojska[i].length) ? parseInt(wojska[i][j], 10) || 0 : 0;
                komorki += `<td>${troopCount}</td>`;
            }
            komorki += `<td>0.0</td>`;
            komorki += `<td><input name='wybierz' type='checkbox' value="${id[i]}" ${isChecked ? 'checked' : ''} aria-label="Select village ${villageName}"></td>`;
            okienkoBody += `<tr class="${(i % 2 ? 'row_a' : 'row_b')}">` + komorki + `</tr>`;
        }
        okienkoBody += "</tbody>";

        filterTable.innerHTML = okienkoHead + okienkoBody;
        pokazOdleglosc();
        chowaj_wojska();
        const totalVillages = id.length;
        const checkedCount = pokazWies.filter(Boolean).length;
        if(resultsCountEl) resultsCountEl.innerHTML = `<b>${checkedCount}/${totalVillages}</b> <span class='icon header village' title='Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© / Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù‚Ø±Ù‰'></span>`;
    }

    function pokazOdleglosc() {
        var celInput = gebi('sniper-coord-target')?.value ?? '';
        var cel = celInput ? celInput.match(/(\d+)\|(\d+)/) : null;
        const distanceCellIndex = obrazki.length + 1;

        const filterTableBody = qs("#sniper-filter-table tbody");
        if (!filterTableBody) return;
        const rows = filterTableBody.querySelectorAll('tr');

        if (!cel || cel.length < 3) {
            rows.forEach(row => {
                 if (row.cells.length > distanceCellIndex) row.cells[distanceCellIndex].textContent = '?.?';
            });
            return;
        }

        let targetX = Number(cel[1]);
        let targetY = Number(cel[2]);

        rows.forEach((row, i) => {
            if (row.cells.length <= distanceCellIndex || i >= mojeWioski.length) return;
            const distCell = row.cells[distanceCellIndex];
            if(!distCell) return;

            let villageCoords = mojeWioski[i];
            let distText = 'Øº/Ù…';
            if (villageCoords && villageCoords.length >= 2) {
                let originX = Number(villageCoords[0]);
                let originY = Number(villageCoords[1]);
                if (!isNaN(originX) && !isNaN(originY)) {
                    let a = targetX - originX;
                    let b = targetY - originY;
                    distText = Number(Math.sqrt(a * a + b * b).toFixed(1));
                } else {
                     distText = 'Ø®Ø·Ø£';
                }
            }
            distCell.textContent = distText;
        });

        const distHeader = qs(`#sniper-filter-table th[data-sort-col="${obrazki.length}"][data-sort-dir]`);
        if (distHeader) {
             sortowanie_przegladu(String(obrazki.length));
        }
    }

    function zapiszWybrane() {
        if (!id || !Array.isArray(id)) return;
        if (!pokazWies || !Array.isArray(pokazWies) || pokazWies.length !== id.length) {
            pokazWies = new Array(id.length).fill(true);
        }

        let currentlyChecked = {};
        qsa('#sniper-filter-table tbody input[name="wybierz"]').forEach(checkbox => {
             if (checkbox.value) { currentlyChecked[checkbox.value] = checkbox.checked; }
        });

        for (let i = 0; i < id.length; i++) {
            pokazWies[i] = !!currentlyChecked[id[i]];
        }

        const resultsCountEl = gebi('sniper-results-count');
        if (resultsCountEl) {
            const totalVillages = id.length;
            const checkedCount = pokazWies.filter(Boolean).length;
            resultsCountEl.innerHTML = `<b>${checkedCount}/${totalVillages}</b> <span class='icon header village' title='Ø§Ù„Ù‚Ø±Ù‰ Ø§Ù„Ù…Ø®ØªØ§Ø±Ø© / Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„Ù‚Ø±Ù‰'></span>`;
        }
    }

    function zmienStrzalke() {
        let arrowSpan = gebi("sniper-filter-toggle-arrow");
        let toggleDiv = gebi("sniper-filter-toggle");
        if (!arrowSpan || !toggleDiv) return;
        let textSpan = toggleDiv.querySelector('span:not(#sniper-filter-toggle-arrow)');
        let isDown = arrowSpan.classList.contains('arr_down');
        arrowSpan.classList.toggle('arr_down', !isDown);
        arrowSpan.classList.toggle('arr_up', isDown);
        if (textSpan) textSpan.textContent = isDown ? 'Ø¥Ø®ÙØ§Ø¡ Ø§Ù„ÙÙ„ØªØ±' : 'Ø¥Ø¸Ù‡Ø§Ø± Ø§Ù„ÙÙ„ØªØ±';
    }

    function pobierzDane() {
        const loadingDiv = gebi('sniper-loading');
        const filterTable = gebi('sniper-filter-table');
        const resultsBody = qs('#sniper-results-table tbody');
        const resultsCountEl = gebi('sniper-results-count');
        const bbContainer = gebi('sniper-bb-export-container');
        const copyBtn = gebi('bb-copy-button');

        if (loadingDiv) {
            loadingDiv.innerHTML = `<img src='${image_base}throbber.gif' alt=""/> Ø¬Ø§Ø±ÙŠ ØªØ­Ù…ÙŠÙ„ Ø¨ÙŠØ§Ù†Ø§Øª Ø§Ù„Ù‚Ø±Ù‰ ÙˆØ§Ù„ÙˆØ­Ø¯Ø§Øª...`;
            loadingDiv.style.display = 'flex';
        }
        if (bbContainer) bbContainer.style.display = 'none';
        if (copyBtn) copyBtn.disabled = true;
        if (resultsBody) resultsBody.innerHTML = '';
        if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
        window.sniperLastBBContent = "";
        window.sniperTargetArrivalTimeBB = "";

        pobieram = true;
        unitColReadOrder = [];

        fetch(dane.linkDoWojska, { method: 'GET', signal: AbortSignal.timeout(20000) })
        .then(response => {
            if (!response.ok) throw new Error(`Ø®Ø·Ø£ HTTP: ${response.status} Ù„Ù„Ø±Ø§Ø¨Ø· ${dane.linkDoWojska}`);
            return response.text();
        })
        .then(responseText => {
            try {
                let parser = new DOMParser();
                let requestedDoc = parser.parseFromString(responseText, 'text/html');

                let tabela = qs('#units_table.vis', requestedDoc) || qs('table.vis:has(th > img[src*="unit_"])', requestedDoc);

                let grupyContainer = null;
                grupyContainer = qs('#overview_filters form', requestedDoc) || qs('.overview_filters form', requestedDoc);
                if (!grupyContainer) {
                    grupyContainer = qs('.overview_filters', requestedDoc);
                    if (!grupyContainer) {
                       const potentialContainers = qsa('.vis_item, .vis', requestedDoc);
                       for(const container of potentialContainers) {
                           if (qs('a[href*="group="]', container) || qs('select[name="group_id"]', container) || qs('select[name*="group"]', container) || qs('option[value*="group="]', container)) {
                                grupyContainer = container;
                                break;
                           }
                       }
                    }
                }

                if (!tabela || !tabela.rows || tabela.rows.length <= 1) {
                    let emptyMsg = "<span style='color: orange;'>Ù„Ø§ ØªÙˆØ¬Ø¯ Ù‚Ø±Ù‰ Ø£Ùˆ ÙˆØ­Ø¯Ø§Øª ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø©/Ø§Ù„ÙÙ„ØªØ±.</span>";
                    if (loadingDiv) loadingDiv.innerHTML = emptyMsg;
                    wojska = []; id = []; mojeWioski = []; nazwyWiosek = []; pokazWies = [];
                    if (filterTable) filterTable.innerHTML = `<tbody><tr><td>${emptyMsg.replace(/<[^>]+>/g, '')}</td></tr></tbody>`;
                    if (resultsBody) resultsBody.innerHTML = '';
                    if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
                    if (bbContainer) bbContainer.style.display = 'none'; if (copyBtn) copyBtn.disabled = true;
                    pobieram = false;
                    return;
                }

                 unitColReadOrder = new Array(obrazki.length).fill(null);
                 let headerCells = qsa('thead tr:last-child th', tabela);
                 if (!headerCells.length || !qs('img[src*="/unit/unit_"]', headerCells[1])) {
                    headerCells = qsa('thead tr:first-child th', tabela);
                 }
                 if (!headerCells.length) throw new Error("Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ø®Ù„Ø§ÙŠØ§ ØªØ±ÙˆÙŠØ³Ø© Ø§Ù„Ø¬Ø¯ÙˆÙ„ (th) Ø§Ù„ØªÙŠ ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ Ø£ÙŠÙ‚ÙˆÙ†Ø§Øª Ø§Ù„ÙˆØ­Ø¯Ø§Øª.");

                 headerCells.forEach((th, th_index) => {
                     let img = qs('img[src*="/unit/unit_"]', th);
                     if (img && img.src) {
                         let unitNameMatch = img.src.match(/unit_([a-z]+)\.(png|gif|webp)/i);
                         if (unitNameMatch && unitNameMatch[1]) {
                             let unitName = unitNameMatch[1].toLowerCase();
                             let scriptUnitIndex = obrazki.indexOf(unitName);
                             if (scriptUnitIndex !== -1) {
                                 unitColReadOrder[scriptUnitIndex] = th_index;
                             }
                         }
                     }
                 });

                 let missingUnits = [];
                 for (let i = 0; i < obrazki.length; i++) {
                     if (unitColReadOrder[i] === null && aktywneJednostki[i] === '1') {
                         missingUnits.push(obrazki[i]);
                     }
                 }
                 if (missingUnits.length > 0) {
                      console.warn("Ø§Ù„ÙˆØ­Ø¯Ø§Øª Ø§Ù„ØªØ§Ù„ÙŠØ© Ù†Ø´Ø·Ø© ÙˆÙ„ÙƒÙ† Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„ÙŠÙ‡Ø§ ÙÙŠ ØªØ±ÙˆÙŠØ³Ø© Ø§Ù„Ø¬Ø¯ÙˆÙ„:", missingUnits.join(', '));
                 }

                 wojska = []; id = []; mojeWioski = []; nazwyWiosek = []; pokazWies = [];
                 let villagesProcessed = 0;
                 const dataRows = qsa('tbody tr', tabela);

                 dataRows.forEach((row) => {
                     let cells = row.cells;
                     if (cells.length < 2) return;

                     let currentVillageUnits = new Array(obrazki.length).fill(0);
                     for (let scriptUnitIndex = 0; scriptUnitIndex < obrazki.length; scriptUnitIndex++) {
                         let tableCellIndex = unitColReadOrder[scriptUnitIndex];
                         if (tableCellIndex !== null && cells.length > tableCellIndex) {
                             let count = parseInt(cells[tableCellIndex].textContent.trim().replace(/\./g,''), 10) || 0;
                             currentVillageUnits[scriptUnitIndex] = count;
                         }
                     }

                     let villageSpan = qs('span[data-id]', cells[0]);
                     let villageId = null;
                     let villageLinkText = '';

                     if (villageSpan && villageSpan.dataset.id) {
                         villageId = villageSpan.dataset.id;
                         villageLinkText = villageSpan.textContent;
                     } else {
                         let villageLinkTag = qs('a[href*="village="]', cells[0]);
                         if(villageLinkTag && villageLinkTag.href) {
                              const urlParams = new URLSearchParams(villageLinkTag.href.split('?')[1]);
                              villageId = urlParams.get('village');
                              villageLinkText = villageLinkTag.textContent;
                         }
                     }

                     if(!villageId) return;

                     id.push(villageId);
                     wojska.push(currentVillageUnits);

                     let villageNameMatch = villageLinkText.match(/(.*)\s\((\d+\|\d+)\)/);
                     nazwyWiosek.push(villageNameMatch ? villageNameMatch[1].trim() : villageLinkText.trim());
                     let coords = villageNameMatch ? villageNameMatch[2].match(/\d+/g) : null;
                     mojeWioski.push((coords && coords.length === 2) ? [coords[0], coords[1], 0] : ['0', '0', 0]);

                     villagesProcessed++;
                 });

                 pokazWies = new Array(id.length).fill(true);

                 if (villagesProcessed > 0) {
                     wybieranieWiosek();
                 } else {
                      if (loadingDiv) loadingDiv.innerHTML = "<span style='color: orange;'>Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù‚Ø±Ù‰ Ù‚Ø§Ø¨Ù„Ø© Ù„Ù„Ù…Ø¹Ø§Ù„Ø¬Ø© ÙÙŠ Ù‡Ø°Ù‡ Ø§Ù„Ù…Ø¬Ù…ÙˆØ¹Ø© Ø£Ùˆ Ø§Ù„ÙÙ„ØªØ±.</span>";
                      if (filterTable) filterTable.innerHTML = '<tbody><tr><td>Ù„Ù… ÙŠØªÙ… Ø§Ù„Ø¹Ø«ÙˆØ± Ø¹Ù„Ù‰ Ù‚Ø±Ù‰.</td></tr></tbody>';
                      if (resultsBody) resultsBody.innerHTML = '';
                      if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
                      if (bbContainer) bbContainer.style.display = 'none'; if (copyBtn) copyBtn.disabled = true;
                 }

                if (grupyContainer && !pobraneGrupy) {
                     let groupOptions = [];
                     let groupSelectEl = qs('select[name="group_id"], select[name*="group"]', grupyContainer);
                     let groupLinks = qsa('a[href*="group="]:not([href*="group=0"])', grupyContainer);

                     if (groupSelectEl) {
                         qsa('option:not([value="0"]):not([value=""])', groupSelectEl).forEach(el => {
                             let rawValue = el.value;
                             let groupName = el.textContent.trim();
                             let groupIdMatch = rawValue.match(/(\d+)/);
                             let groupId = groupIdMatch ? groupIdMatch[1] : null;
                             if (groupId && groupId !== "0" && groupName) {
                                 let correctGroupLink = `/game.php?village=${game_data.village.id}&type=own_home&mode=units&group=${groupId}&page=-1&screen=overview_villages`;
                                 if (game_data.player.sitter != 0) {
                                     correctGroupLink = `/game.php?t=${game_data.player.id}&village=${game_data.village.id}&type=own_home&mode=units&group=${groupId}&page=-1&screen=overview_villages`;
                                 }
                                 groupOptions.push({ value: correctGroupLink, text: groupName });
                             }
                         });
                     } else if (groupLinks.length > 0) {
                         groupLinks.forEach(el => {
                             let rawLink = el.getAttribute('href');
                             let groupName = el.textContent.trim().replace(/\s*\(\d+\)$/, '').trim();
                             let groupIdMatch = rawLink.match(/group(?:_id)?=(\d+)/);
                             let groupId = groupIdMatch ? groupIdMatch[1] : null;
                             if (groupId && groupId !== "0" && groupName) {
                                 let correctGroupLink = `/game.php?village=${game_data.village.id}&type=own_home&mode=units&group=${groupId}&page=-1&screen=overview_villages`;
                                 if (game_data.player.sitter != 0) {
                                     correctGroupLink = `/game.php?t=${game_data.player.id}&village=${game_data.village.id}&type=own_home&mode=units&group=${groupId}&page=-1&screen=overview_villages`;
                                 }
                                 groupOptions.push({ value: correctGroupLink, text: groupName });
                             }
                         });
                     }

                     groupOptions.sort((a, b) => a.text.localeCompare(b.text, 'ar'));
                     const groupSelectDropdown = gebi('sniper-group-select');
                     if (groupSelectDropdown) {
                         while (groupSelectDropdown.options.length > 1) groupSelectDropdown.remove(1);
                         groupOptions.forEach(opt => {
                             let option = document.createElement('option');
                             option.value = opt.value;
                             option.textContent = opt.text;
                             groupSelectDropdown.appendChild(option);
                         });
                         pobraneGrupy = true;
                     }
                 } else if (!grupyContainer && !pobraneGrupy) {
                     console.warn("Group filter container not found.");
                     pobraneGrupy = true;
                 }

                if (loadingDiv) loadingDiv.style.display = 'none';
                pobieram = false;

            } catch (e) {
                if (loadingDiv) loadingDiv.innerHTML = `<span style='color: red;'>Ø­Ø¯Ø« Ø®Ø·Ø£ Ø£Ø«Ù†Ø§Ø¡ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª: ${e.message}.</span>`;
                pobieram = false;
                if (filterTable) filterTable.innerHTML = '<tbody><tr><td>Ø®Ø·Ø£ ÙÙŠ Ù…Ø¹Ø§Ù„Ø¬Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.</td></tr></tbody>';
                if (resultsBody) resultsBody.innerHTML = '';
                if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
                if (bbContainer) bbContainer.style.display = 'none'; if (copyBtn) copyBtn.disabled = true;
                console.error("Error parsing overview response:", e);
            }
        })
        .catch(error => {
            let errorText = "Ø®Ø·Ø£ ÙÙŠ Ø¬Ù„Ø¨ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.";
            if (error.name === 'AbortError' || error.message.includes('timeout')) errorText += " (Ø§Ù†ØªÙ‡Øª Ø§Ù„Ù…Ù‡Ù„Ø©)";
            else if (error.message.includes('HTTP error')) errorText += ` (${error.message})`;
            else errorText += ` (${error.name}: ${error.message})`;
            errorText += " Ø­Ø§ÙˆÙ„ ØªØ­Ø¯ÙŠØ« Ø§Ù„ØµÙØ­Ø© Ø£Ùˆ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø§ØªØµØ§Ù„Ùƒ.";

            if (loadingDiv) loadingDiv.innerHTML = `<span style='color: red;'>${errorText}</span>`;
            pobieram = false;
            if (filterTable) filterTable.innerHTML = '<tbody><tr><td>Ø®Ø·Ø£ ÙÙŠ ØªØ­Ù…ÙŠÙ„ Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª.</td></tr></tbody>';
            if (resultsBody) resultsBody.innerHTML = '';
            if (resultsCountEl) resultsCountEl.innerHTML = `<b>0/0</b> <span class='icon header village'></span>`;
            if (bbContainer) bbContainer.style.display = 'none'; if (copyBtn) copyBtn.disabled = true;
            console.error("Error fetching overview data:", error);
        });
    }

    async function initializeSniper() {
        if (gebi("planer_klinow")) {
             console.log("Sniper planner already initialized.");
             return;
        }

        if (typeof game_data === 'undefined' || !game_data || !game_data.village || !game_data.player || typeof image_base === 'undefined' || typeof UI === 'undefined' || typeof Timing === 'undefined') {
            console.log("Game data not ready, retrying initialization...");
            setTimeout(initializeSniper, 500);
            return;
        }

        originalPageTitle = document.title;

        try {
            const savedThreshold = localStorage.getItem(ALERT_THRESHOLD_STORAGE_KEY);
            if (savedThreshold !== null) {
                const parsedThreshold = parseInt(savedThreshold, 10);
                if (!isNaN(parsedThreshold) && parsedThreshold >= 1 && parsedThreshold <= 300) {
                    alertThresholdSeconds = parsedThreshold;
                } else { localStorage.removeItem(ALERT_THRESHOLD_STORAGE_KEY); }
            }
            const savedSigil = localStorage.getItem(SIGIL_VALUE_STORAGE_KEY);
             if (savedSigil !== null) {
                 const parsedSigil = parseFloat(savedSigil);
                 if (!isNaN(parsedSigil) && parsedSigil >= 0) {
                     savedSigilValue = parsedSigil;
                 } else { localStorage.removeItem(SIGIL_VALUE_STORAGE_KEY); }
             }

            konfiguracja = await konfiguracjaSwiata();
            if (!konfiguracja) {
                 console.error("Failed to load world config, cannot initialize sniper tool.");
                 return;
            }

            mobile = window.innerWidth < 768;
            img_wojsk = image_base + "unit/";

            const configRoot = konfiguracja.documentElement;
            dane = {
                predkosc_gry: Number(qs("config > speed", configRoot)?.textContent ?? 1),
                predkosc_jednostek: Number(qs("config > unit_speed", configRoot)?.textContent ?? 1),
                lucznicy: Number(qs("game > archer", configRoot)?.textContent ?? 0),
                rycerz: Number(qs("game > knight", configRoot)?.textContent ?? 0),
                linkDoWojska: `/game.php?village=${game_data.village.id}&type=own_home&mode=units&group=0&page=-1&screen=overview_villages`,
                linkDoPrzegladuWioski: `/game.php?village=${game_data.village.id}&screen=info_village&id=`,
                linkDorozkazu: `/game.php?village=`,
                predkosci: [],
                nazwyWojsk: []
            };

            const baseUnits = [
                { key: 'spear', speed: 18, name: "Ø±Ù…Ø­", img: "spear", active: true },
                { key: 'sword', speed: 22, name: "Ø³ÙŠÙ", img: "sword", active: true },
                { key: 'axe', speed: 18, name: "ÙØ£Ø³", img: "axe", active: true },
                { key: 'archer', speed: 18, name: "Ù‚ÙˆØ³", img: "archer", active: Boolean(dane.lucznicy) },
                { key: 'spy', speed: 9, name: "ÙƒØ´Ø§ÙØ©", img: "spy", active: true },
                { key: 'light', speed: 10, name: "Ø®ÙÙŠÙ", img: "light", active: true },
                { key: 'marcher', speed: 10, name: "Ø±Ø§Ù…ÙŠ Ø£Ø³Ù‡Ù…", img: "marcher", active: Boolean(dane.lucznicy) },
                { key: 'heavy', speed: 11, name: "Ø«Ù‚ÙŠÙ„", img: "heavy", active: true },
                { key: 'ram', speed: 30, name: "Ù…Ø­Ø·Ù…Ø©", img: "ram", active: true },
                { key: 'catapult', speed: 30, name: "Ù…Ù‚Ù„Ø§Ø¹", img: "catapult", active: true },
                { key: 'knight', speed: 10, name: "Ù‚Ø§Ø¦Ø¯ ÙØ±Ø³Ø§Ù†", img: "knight", active: Boolean(dane.rycerz) },
                { key: 'snob', speed: 35, name: "Ù†Ø¨Ù„Ø§Ø¡", img: "snob", active: true },
            ];

            obrazki = [];
            aktywneJednostki = [];
            minimalna_ilosc_wojsk = [];
            dane.predkosci = [];
            dane.nazwyWojsk = [];

            baseUnits.forEach(unit => {
                 let unitSpeedFromConfig = Number(qs(`unit_config > ${unit.key} > speed`, configRoot)?.textContent ?? unit.speed);
                 let unitNameFromConfig = qs(`unit_config > ${unit.key} > name`, configRoot)?.textContent ?? unit.name;

                 if (unit.active) {
                     dane.predkosci.push(unitSpeedFromConfig > 0 ? unitSpeedFromConfig : unit.speed);
                     dane.nazwyWojsk.push(unitNameFromConfig || unit.name);
                     obrazki.push(unit.img);
                     aktywneJednostki.push("1");
                     minimalna_ilosc_wojsk.push(0);
                 }
            });

            let ciacho = getCookie(ACTIVE_UNITS_COOKIE_KEY);
            if (ciacho) {
                try {
                    let defaultLength = aktywneJednostki.length;
                    let savedUnitsBinary = parseInt(ciacho, 36).toString(2).padStart(defaultLength, "0");
                    if (savedUnitsBinary.length === defaultLength) {
                        aktywneJednostki = savedUnitsBinary.split('');
                    } else {
                         console.warn("Saved active units cookie length mismatch. Resetting to default.");
                         aktywneJednostki = new Array(defaultLength).fill("1");
                         setCookie(ACTIVE_UNITS_COOKIE_KEY, parseInt(aktywneJednostki.join(""), 2).toString(36), 30);
                    }
                } catch (e) {
                     console.error("Error parsing active units cookie:", e);
                     aktywneJednostki = new Array(aktywneJednostki.length).fill("1");
                     setCookie(ACTIVE_UNITS_COOKIE_KEY, parseInt(aktywneJednostki.join(""), 2).toString(36), 30);
                 }
            }
            if (!Array.isArray(aktywneJednostki) || aktywneJednostki.length !== obrazki.length) {
                 aktywneJednostki = new Array(obrazki.length).fill("1");
            }

            if (game_data.player.sitter != 0) {
                let sitterParam = "?t=" + game_data.player.id;
                dane.linkDoWojska = `/game.php${sitterParam}&village=${game_data.village.id}&type=own_home&mode=units&group=0&page=-1&screen=overview_villages`;
                dane.linkDoPrzegladuWioski = `/game.php${sitterParam}&village=${game_data.village.id}&screen=info_village&id=`;
                dane.linkDorozkazu = `/game.php${sitterParam}&village=`;
            }
            wszystkieWojska = dane.linkDoWojska;

            predkosc_swiata = Number((dane.predkosc_gry * dane.predkosc_jednostek).toFixed(5));
            if (predkosc_swiata <= 0) predkosc_swiata = 1;
            for (let i = 0; i < dane.predkosci.length; i++) {
                if (dane.predkosci[i] > 0) {
                     dane.predkosci[i] /= predkosc_swiata;
                }
            }

            addGlobalStyle(`
                #planer_klinow { direction: rtl; border: 1px solid #804000; background-color: #f4e4bc; padding: 15px; margin-bottom: 15px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); overflow: visible !important; height: auto !important; }
                #planer_klinow h3 { margin: 0 0 10px 0; padding-bottom: 5px; border-bottom: 2px solid #c1a264; color: #603000; font-size: 1.1em; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; }
                #planer_klinow h3 .title-text { display: flex; align-items: center; margin-left: 10px; }
                #planer_klinow h3 img { vertical-align: middle; margin-left: 7px; margin-bottom: 3px; }
                #planer_klinow h3 .updater-tag { font-size: 0.75em; font-weight: normal; color: #804000; opacity: 0.8; white-space: nowrap; }
                #planer_klinow .controls-container { display: flex; flex-wrap: wrap; gap: 6px 8px; align-items: flex-end; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #c1a264; }
                #planer_klinow .control-group { display: flex; flex-direction: column; gap: 2px; margin-bottom: 0; }
                #planer_klinow .control-group label { font-weight: bold; font-size: 0.9em; color: #603000; margin-bottom: 2px; display: block; text-align: right; }
                #planer_klinow input[type="text"], #planer_klinow input[type="number"], #planer_klinow select { padding: 5px 8px; border: 1px solid #b99870; border-radius: 3px; background-color: #fff; font-size: 1em; box-sizing: border-box; height: 30px; vertical-align: bottom; text-align: right; }
                #planer_klinow input#sniper-coord-target { width: 75px; text-align: center; }
                #planer_klinow input#sniper-arrival-date { width: 90px; text-align: center; }
                #planer_klinow input#sniper-arrival-time { width: 80px; text-align: center; }
                #planer_klinow select#sniper-group-select { min-width: 100px; max-width: 150px; }
                #planer_klinow input#sniper-sigil-percentage { width: 55px; text-align: center; }
                #planer_klinow input#sniper-alert-threshold { width: 55px; text-align: center; }
                #planer_klinow input[type="text"]:focus, #planer_klinow input[type="number"]:focus, #planer_klinow select:focus { border-color: #804000; outline: none; box-shadow: 0 0 3px rgba(128, 64, 0, 0.5); }
                #planer_klinow input[type="text"].input-error, #planer_klinow input[type="number"].input-error { border-color: red !important; background-color: #ffebeb; }
                #planer_klinow .filter-toggle-container, #planer_klinow #sniper-calculate-button { display: inline-flex; align-items: center; justify-content: center; height: 30px; padding: 0 10px; box-sizing: border-box; border-radius: 3px; border: 1px solid; font-weight: bold; text-align: center; cursor: pointer; user-select: none; vertical-align: bottom; transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.1); white-space: nowrap; flex-shrink: 0; }
                #planer_klinow .filter-toggle-container { background: linear-gradient(to bottom, #f9e8c6 0%, #e4d0a8 100%); color: #603000; border-color: #c1a264; gap: 4px; padding: 0 8px; }
                #planer_klinow .filter-toggle-container:hover { background: linear-gradient(to bottom, #fff5d7 0%, #f4e4bc 100%); border-color: #a07540; }
                #planer_klinow .filter-toggle-container:active { background: #e4d0a8; box-shadow: inset 0 1px 2px rgba(0,0,0,0.1); }
                #planer_klinow #sniper-filter-toggle-arrow { margin-left: 3px; width: 10px; height: 10px; filter: brightness(0.8); }
                #planer_klinow #sniper-calculate-button { background: linear-gradient(to bottom, #b08550 0%, #804000 100%); color: white; border-color: #542C0C; text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.4); }
                #planer_klinow #sniper-calculate-button:hover { background: linear-gradient(to bottom, #c19a64 0%, #905520 100%); border-color: #603000; box-shadow: 0 2px 3px rgba(0,0,0,0.2); }
                #planer_klinow #sniper-calculate-button:active { background: #804000; box-shadow: inset 0 1px 3px rgba(0,0,0,0.3); }
                #planer_klinow #sniper-loading { display: flex; align-items: center; gap: 8px; padding: 10px 0; font-style: italic; color: #603000; clear: both; }
                #planer_klinow #sniper-loading img { width: 16px; height: 16px; }
                #planer_klinow #sniper-bb-export-container { display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px; background-color: #f8f2e4; border: 1px solid #c1a264; border-bottom: none; border-radius: 3px 3px 0 0; margin-top: 15px; flex-wrap: wrap; clear: both; }
                #planer_klinow #sniper-bb-export-container a { color: #00659a; text-decoration: none; font-weight: bold; display: inline-flex; align-items: center; }
                #planer_klinow #sniper-bb-export-container a:hover { text-decoration: underline; }
                #planer_klinow #sniper-bb-export-container img { vertical-align: middle; margin-left: 5px; }
                #planer_klinow #sniper-bb-export-container .btn-copy-bb { padding: 3px 8px; font-size: 0.9em; background-color: #a07540; border: 1px solid #603000; color: white; border-radius: 3px; cursor: pointer; }
                #planer_klinow #sniper-bb-export-container .btn-copy-bb:hover { background-color: #804000; }
                #planer_klinow #sniper-bb-export-container .btn-copy-bb:disabled { background-color: #c1a264; border-color: #a18054; cursor: not-allowed; opacity: 0.7; }
                #planer_klinow #sniper-bb-export-container textarea { width: 95%; max-width: 600px; height: 120px; padding: 8px; border: 1px solid #b99870; background-color: #fff; font-family: monospace; font-size: 0.9em; margin-top: 5px; display: block; margin-left: auto; margin-right: auto; box-sizing: border-box; flex-basis: 100%; direction: ltr; text-align: left; }
                #planer_klinow .results-table-container, #planer_klinow .filter-table-container { margin-top: 0; max-height: 400px; overflow-y: auto; border: 1px solid #c1a264; background-color: #f4e4bc; border-radius: 0 0 3px 3px; border-top: none; clear: both; }
                #planer_klinow .filter-table-container { margin-top: 15px; border-radius: 3px; border-top: 1px solid #c1a264; }
                #planer_klinow table.vis { border-collapse: separate !important; border-spacing: 1px !important; background-color: #c1a264; width: 100%; box-sizing: border-box; }
                #planer_klinow table.vis th, #planer_klinow table.vis td { padding: 6px 8px; text-align: center; background-color: #f4e4bc; border: none; }
                #planer_klinow table.vis th { background-color: #e0c8a0; font-weight: bold; color: #603000; white-space: nowrap; }
                #planer_klinow table.vis th img { vertical-align: middle; margin: 0 2px; }
                #planer_klinow table.vis .row_a td { background-color: #f8f2e4; }
                #planer_klinow table.vis .row_b td { background-color: #f4e4bc; }
                #planer_klinow table.vis tr:hover td { filter: brightness(0.96); }
                #sniper-filter-table { margin-top: 0; border: none; }
                #sniper-filter-table thead tr.min-troops-header th { padding: 4px 8px; text-align: right; }
                #sniper-filter-table thead tr.min-troops-header span { font-weight:bold; margin-left: 5px; }
                #sniper-filter-table thead tr.min-troops-header input[type="number"] { width: 45px; text-align: center; padding: 3px 5px; font-size: 0.9em; box-sizing: border-box; margin: 0 1px; vertical-align: middle; height: auto; }
                #sniper-filter-table thead tr.min-troops-header a { margin-right: 5px; vertical-align: middle;}
                #sniper-filter-table th:first-child, #sniper-filter-table td:first-child { text-align: right; padding-right: 10px; }
                #sniper-filter-table td:first-child a { color: #603000; text-decoration: none; }
                #sniper-filter-table td:first-child a:hover { text-decoration: underline; color: #000; }
                #sniper-filter-table input[type="checkbox"] { vertical-align: middle; }
                #sniper-filter-table .header, #sniper-filter-table .icon { vertical-align: middle; }
                #sniper-filter-table th[data-sort-col] { cursor: pointer; }
                #sniper-filter-table th img.sort-arrow { margin-right: 3px; vertical-align: middle;}
                #sniper-results-table { margin-top: 0; border: none; }
                #sniper-results-table th:first-child, #sniper-results-table td:first-child { text-align: right; padding-right: 10px; }
                #sniper-results-table td:first-child a { color: #603000; text-decoration: none; }
                #sniper-results-table td:first-child a:hover { text-decoration: underline; color: #000; }
                #sniper-results-table td a.btn-attack { display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; border: 1px solid #603000; background-color: #a07540; color: #fff !important; border-radius: 3px; text-decoration: none !important; font-weight: bold; font-size: 0.95em; box-shadow: 0 1px 1px rgba(0,0,0,0.2); transition: background-color 0.2s ease, box-shadow 0.2s ease; text-shadow: 1px 1px 1px rgba(0,0,0,0.3); background-image: none !important; }
                #sniper-results-table td a.btn-attack img { height: 14px; width: 14px; vertical-align: middle; flex-shrink: 0;}
                #sniper-results-table td a.btn-attack:hover { background-color: #804000; color: #fff !important; box-shadow: inset 0 1px 2px rgba(0,0,0,0.3); }
                #sniper-results-table td.possible { background-color: #d4ffbc !important; font-weight: bold; color: #175400 !important; }
                #sniper-results-table th.faded img { opacity: 0.4; filter: grayscale(80%); }
                #sniper-results-table th.faded { cursor: pointer; }
                #sniper-results-table .countdown-active { font-weight: bold; color: #333; direction: ltr; }
                #sniper-results-table .countdown-soon { color: #b70000; font-weight: bold; animation: blinker 1.5s linear infinite; direction: ltr; }
                #sniper-results-table .countdown-timer.faded { color: grey; }
                @keyframes blinker { 50% { opacity: 0.5; } }
                #sniper-results-filter-header { background-color: #e0c8a0; padding: 5px; text-align: center; font-size: 0.9em; border-bottom: 1px solid #c1a264; }
                #sniper-results-filter-header label { margin: 0 3px 0 8px; cursor: pointer; white-space: nowrap; display: inline-block; }
                #sniper-results-filter-header input[type="checkbox"] { vertical-align: middle; margin-left: 3px; cursor: pointer; }
                #sniper-results-filter-header img { height: 12px; vertical-align: middle; }
                #commands_incomings tr.command-row.sniper-highlight-incoming td, #commands_outgoings tr.command-row.sniper-highlight-outgoing td { background-color: #fff5bd !important; }
                .alert-threshold-group label, .sigil-group label { white-space: nowrap; }
                #sniper-results-table .btn-copy-row-bb { display: inline-flex; align-items: center; gap: 3px; padding: 2px 6px; font-size: 0.85em; background-color: #c1a264; border: 1px solid #804000; color: #603000; border-radius: 3px; cursor: pointer; margin: 0 2px; vertical-align: middle; line-height: 1.2; box-shadow: 0 1px 1px rgba(0,0,0,0.1); transition: background-color 0.2s ease, box-shadow 0.2s ease; }
                #sniper-results-table .btn-copy-row-bb:hover { background-color: #e0c8a0; box-shadow: 0 1px 2px rgba(0,0,0,0.15); }
                #sniper-results-table .btn-copy-row-bb:active { background-color: #a07540; box-shadow: inset 0 1px 1px rgba(0,0,0,0.2); }
                #sniper-results-table .btn-copy-row-bb img { height: 12px !important; width: 12px !important; vertical-align: middle; flex-shrink: 0; }
            `);

            rysujPlaner();
            pobierzDane();

            const thresholdInput = gebi('sniper-alert-threshold');
            if (thresholdInput) thresholdInput.value = alertThresholdSeconds;
            const sigilInput = gebi('sniper-sigil-percentage');
             if (sigilInput) sigilInput.value = savedSigilValue;

        } catch (error) {
            let errorMsg = "Ø®Ø·Ø£ : " + error.message;
            if (typeof UI !== 'undefined' && UI.ErrorMessage) {
                 UI.ErrorMessage(errorMsg, 5000);
            } else {
                alert(errorMsg);
            }
            console.error("Sniper Initialization Error:", error);
            document.title = originalPageTitle;
        }
    }

    setTimeout(initializeSniper, 500);

})();
