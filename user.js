// ==UserScript==
// @name         Auto Market Buy — Premium v4.0
// @namespace    local.market.buy
// @version      4.0
// @description  شراء تلقائي عند توفر الكمية المطلوبة + تنبيه صوتي + تمييز العناصر
// @match        *://*/game.php*screen=market*&mode=exchange*
// @run-at       document-idle
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      worldtimeapi.org
// ==/UserScript==

/*** ═══════════════════════════════════════════════════════════
     ⚠️ إعدادات الاشتراك - غيّر التاريخ هنا لكل مستخدم
     ═══════════════════════════════════════════════════════════ ***/
const EXPIRY_DATE = "2026-12-01"; // تاريخ انتهاء الاشتراك (سنة-شهر-يوم)
const USER_NAME = "اسم المستخدم"; // اسم المشترك
/*** ═══════════════════════════════════════════════════════════ ***/

/*** التحقق من الاشتراك ***/
async function checkSubscription() {
    return new Promise((resolve) => {
        // محاولة الحصول على التاريخ من الإنترنت
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://worldtimeapi.org/api/ip",
            timeout: 5000,
            onload: function(response) {
                try {
                    const data = JSON.parse(response.responseText);
                    const currentDate = new Date(data.datetime);
                    const expiryDate = new Date(EXPIRY_DATE);
                    
                    if (currentDate > expiryDate) {
                        resolve({ valid: false, source: "online" });
                    } else {
                        const daysLeft = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
                        resolve({ valid: true, daysLeft: daysLeft, source: "online" });
                    }
                } catch (e) {
                    // فشل في قراءة الرد، استخدم تاريخ الجهاز
                    checkLocalDate(resolve);
                }
            },
            onerror: function() {
                // فشل الاتصال، استخدم تاريخ الجهاز
                checkLocalDate(resolve);
            },
            ontimeout: function() {
                // انتهت المهلة، استخدم تاريخ الجهاز
                checkLocalDate(resolve);
            }
        });
    });
}

function checkLocalDate(resolve) {
    const currentDate = new Date();
    const expiryDate = new Date(EXPIRY_DATE);
    
    if (currentDate > expiryDate) {
        resolve({ valid: false, source: "local" });
    } else {
        const daysLeft = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
        resolve({ valid: true, daysLeft: daysLeft, source: "local" });
    }
}

function showExpiredMessage() {
    GM_addStyle(`
        #mb-expired {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            z-index: 9999999;
            background: linear-gradient(135deg, #ff4444, #cc0000);
            color: white;
            padding: 40px;
            border-radius: 15px;
            text-align: center;
            font-family: tahoma;
            direction: rtl;
            box-shadow: 0 10px 40px rgba(0,0,0,0.5);
            min-width: 350px;
        }
        #mb-expired h2 {
            margin: 0 0 20px 0;
            font-size: 24px;
        }
        #mb-expired p {
            margin: 10px 0;
            font-size: 16px;
        }
        #mb-expired .contact {
            margin-top: 20px;
            padding: 15px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
        }
    `);
    
    const box = document.createElement("div");
    box.id = "mb-expired";
    box.innerHTML = `
        <h2>⛔ انتهى الاشتراك</h2>
        <p>عزيزي <strong>${USER_NAME}</strong></p>
        <p>انتهت صلاحية اشتراكك في تاريخ:</p>
        <p><strong>${EXPIRY_DATE}</strong></p>
        <div class="contact">
            <p>📱 للتجديد تواصل معنا:</p>
            <p>Telegram: @YourUsername</p>
        </div>
    `;
    document.body.appendChild(box);
}

/*** بدء التحقق ثم تشغيل السكربت ***/
(async function() {
    const subscription = await checkSubscription();
    
    if (!subscription.valid) {
        showExpiredMessage();
        console.log("⛔ الاشتراك منتهي");
        return; // إيقاف السكربت
    }
    
    console.log(`✅ الاشتراك ساري - متبقي ${subscription.daysLeft} يوم`);
    
    // ═══════════════════════════════════════════════════════════
    // بداية السكربت الأصلي
    // ═══════════════════════════════════════════════════════════

    /*** منع تشغيل السكربت مرتين ***/
    if (window.__MARKET_BUY_RUNNING__) {
        console.warn("⛔ سكربت الشراء يعمل مسبقًا — تم منع التكرار");
        return;
    }
    window.__MARKET_BUY_RUNNING__ = true;

    /* إعدادات ثابتة */
    const CLICK_DELAY = 1000;
    const BETWEEN_BUY_DELAY = 10000;
    const BUFFER = 1000;

    /* أسماء التخزين */
    const KEY_ENABLED    = "mb_enabled";
    const KEY_AUTO_BUY   = "mb_auto_buy";
    const KEY_SOUND      = "mb_sound";
    const KEY_INTERVAL   = "mb_interval";
    const KEY_WOOD_QTY   = "mb_wood_qty";
    const KEY_STONE_QTY  = "mb_stone_qty";
    const KEY_IRON_QTY   = "mb_iron_qty";

    /* قيم افتراضية */
    let mbEnabled   = GM_getValue(KEY_ENABLED, true);
    let mbAutoBuy   = GM_getValue(KEY_AUTO_BUY, false);
    let mbSound     = GM_getValue(KEY_SOUND, true);
    let mbInterval  = GM_getValue(KEY_INTERVAL, 30000);
    let mbWoodQty   = GM_getValue(KEY_WOOD_QTY, 1000);
    let mbStoneQty  = GM_getValue(KEY_STONE_QTY, 1000);
    let mbIronQty   = GM_getValue(KEY_IRON_QTY, 1000);

    /* مؤقت خاص بالسكريبت */
    let __marketBuyTimer = null;

    /* اختصارات */
    const $  = (s, p=document) => p.querySelector(s);
    const $$ = (s, p=document) => Array.from(p.querySelectorAll(s));

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    /* لوج */
    let logBox = null;
    function log(msg) {
        const t = new Date().toLocaleTimeString();
        console.log("[MARKET-BUY]", t, msg);
        if (!logBox) return;

        let div = document.createElement("div");
        div.textContent = `[${t}] ${msg}`;
        logBox.prepend(div);

        while (logBox.childElementCount > 40) {
            logBox.lastChild.remove();
        }
    }

    /* صفارة تنبيه */
    function beep() {
        if (!mbSound) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.value = 700;
            gain.gain.value = 0.15;
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();
            setTimeout(() => osc.stop(), 200);
        } catch {}
    }

    /* قراءة رقم */
    function toNum(t) {
        return Number(String(t || "0").replace(/[^\d]/g, ""));
    }

    /* الحصول على الموارد التي أملكها */
    function getMyResource(resource) {
        const el = $(`#${resource}`);
        return el ? toNum(el.textContent) : 0;
    }

    /* الحصول على المخزون المتاح في السوق */
    function getStockElement(resource) {
        return $(`#premium_exchange_stock_${resource}`);
    }

    function getStock(resource) {
        const el = getStockElement(resource);
        return el ? toNum(el.textContent) : 0;
    }

    /* الحصول على حقل الإدخال للشراء */
    function getBuyInput(resource) {
        return $(`input[name="buy_${resource}"]`) || 
               $(`input[data-resource="${resource}"][data-type="buy"]`);
    }

    /* تمييز العنصر بخلفية زرقاء */
    function highlightElement(resource, highlight) {
        const el = getStockElement(resource);
        if (el) {
            if (highlight) {
                el.style.backgroundColor = "#add8e6";
                el.style.transition = "background-color 0.3s";
            } else {
                el.style.backgroundColor = "";
            }
        }
    }

    /* إزالة التمييز من جميع العناصر */
    function clearAllHighlights() {
        ["wood", "stone", "iron"].forEach(r => highlightElement(r, false));
    }

    /* تحديث عرض الموارد */
    function updateResourceDisplay() {
        const woodEl = $("#mb-my-wood");
        const stoneEl = $("#mb-my-stone");
        const ironEl = $("#mb-my-iron");
        
        if (woodEl) woodEl.textContent = getMyResource("wood").toLocaleString();
        if (stoneEl) stoneEl.textContent = getMyResource("stone").toLocaleString();
        if (ironEl) ironEl.textContent = getMyResource("iron").toLocaleString();
    }

    /* شراء مورد واحد */
    async function buyResource(resource, qty) {
        log(`🔍 محاولة شراء ${qty} من ${resource}...`);
        
        const stock = getStock(resource);
        const myResource = getMyResource(resource);
        const input = getBuyInput(resource);

        if (!input) {
            log(`❌ حقل إدخال ${resource} غير موجود.`);
            return false;
        }

        if (stock < qty) {
            log(`❌ المخزون (${stock}) أقل من الكمية المطلوبة (${qty}).`);
            return false;
        }

        // حساب الكمية المتاحة للشراء (ما أملكه - 1000)
        const availableToPay = myResource - BUFFER;
        if (availableToPay <= 0) {
            log(`❌ لا تملك موارد كافية للشراء (${myResource} - ${BUFFER} = ${availableToPay}).`);
            return false;
        }

        // الكمية النهائية للشراء
        const finalQty = Math.min(qty, availableToPay);
        
        log(`💰 مواردي: ${myResource} | المتاح للدفع: ${availableToPay} | سأشتري: ${finalQty}`);

        /* املأ الحقل */
        input.focus();
        input.value = finalQty;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        log(`✍️ كتابة الكمية: ${finalQty}`);

        await sleep(CLICK_DELAY);

        /* زر أفضل عرض */
        const computeBtn = $(".btn-premium-exchange-buy");
        if (!computeBtn) {
            log("❌ لا يوجد زر أفضل عرض.");
            return false;
        }
        computeBtn.click();
        log("تم الضغط على أفضل عرض...");

        await sleep(CLICK_DELAY);

        /* زر التأكيد */
        const confirmBtn = $(".btn-confirm-yes") || $("[class*='confirm']");
        if (!confirmBtn) {
            log("❌ لم أجد زر التأكيد.");
            return false;
        }

        confirmBtn.click();
        await sleep(CLICK_DELAY);

        log(`✅ تم شراء ${finalQty} من ${resource} بنجاح!`);

        return true;
    }

    /* فحص دوري */
    async function checkAndProcess() {
        if (!mbEnabled) return;
        
        log("🔄 بدء الفحص الدوري...");
        updateResourceDisplay();

        const resources = [
            { name: "wood", qty: mbWoodQty, label: "خشب" },
            { name: "stone", qty: mbStoneQty, label: "حجر" },
            { name: "iron", qty: mbIronQty, label: "حديد" }
        ];

        // إزالة التمييز السابق
        clearAllHighlights();

        for (let r of resources) {
            if (r.qty <= 0) continue;

            const stock = getStock(r.name);
            log(`📦 مخزون ${r.label} = ${stock} | المطلوب = ${r.qty}`);

            // فحص تحقق الشرط
            if (stock >= r.qty) {
                log(`🔥 الشرط تحقق لـ ${r.label}! المخزون كافٍ.`);
                
                // تمييز العنصر بخلفية زرقاء
                highlightElement(r.name, true);
                
                // تنبيه صوتي
                beep();

                // الشراء التلقائي فقط إذا كان مفعّلاً
                if (mbAutoBuy) {
                    const ok = await buyResource(r.name, r.qty);
                    if (ok) {
                        highlightElement(r.name, false);
                        log(`⏳ انتظار ${BETWEEN_BUY_DELAY / 1000} ثانية قبل التالي...`);
                        await sleep(BETWEEN_BUY_DELAY);
                    }
                }
            }
        }

        log("✔️ انتهاء دورة الفحص.");
    }

    /* UI */
    GM_addStyle(`
    #mb-panel {
        position: fixed;
        right: 20px;
        top: 20px;
        z-index: 999999;
        width: 320px;
        padding: 12px;
        border-radius: 10px;
        background: rgba(0, 100, 0, 0.85);
        color: white;
        font-family: tahoma;
        direction: rtl;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }
    #mb-panel h3 {
        margin: 0 0 10px 0;
        text-align: center;
        border-bottom: 1px solid rgba(255,255,255,0.3);
        padding-bottom: 8px;
    }
    #mb-panel .mb-sub-info {
        background: rgba(255,255,255,0.15);
        padding: 6px 10px;
        border-radius: 6px;
        margin-bottom: 10px;
        font-size: 12px;
        text-align: center;
    }
    #mb-panel .mb-resources {
        background: rgba(255,255,255,0.1);
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 10px;
        font-size: 12px;
    }
    #mb-panel .mb-resources div {
        display: flex;
        justify-content: space-between;
        padding: 3px 0;
    }
    #mb-panel .mb-row {
        display: flex;
        align-items: center;
        margin: 6px 0;
        gap: 8px;
    }
    #mb-panel .mb-row label {
        flex: 1;
        font-size: 13px;
    }
    #mb-panel .mb-row input[type="number"] {
        width: 80px;
        padding: 5px;
        border: none;
        border-radius: 4px;
        text-align: center;
        font-size: 13px;
    }
    #mb-panel .mb-checkbox {
        margin: 8px 0;
    }
    #mb-panel .mb-checkbox label {
        cursor: pointer;
        font-size: 13px;
    }
    #mb-panel button {
        width: 100%;
        margin: 6px 0;
        padding: 8px;
        border: none;
        border-radius: 6px;
        font-weight: bold;
        cursor: pointer;
        font-size: 13px;
    }
    #mb-panel #mb-toggle {
        background: #4CAF50;
        color: white;
    }
    #mb-panel #mb-toggle.stopped {
        background: #f44336;
    }
    #mb-panel #mb-now {
        background: #2196F3;
        color: white;
    }
    #mb-panel #mb-set-int {
        background: #FF9800;
        color: white;
    }
    #mb-log {
        max-height: 120px;
        overflow-y: auto;
        background: rgba(255,255,255,0.1);
        padding: 6px;
        font-size: 11px;
        margin-top: 8px;
        border-radius: 4px;
    }
    `);

    function buildUI() {
        if ($("#mb-panel")) return;

        const box = document.createElement("div");
        box.id = "mb-panel";
        box.innerHTML = `
            <h3>🛒 الشراء التلقائي</h3>
            
            <div class="mb-sub-info">
                👤 ${USER_NAME} | ⏳ متبقي ${subscription.daysLeft} يوم
            </div>
            
            <div class="mb-resources">
                <div><span>🪵 خشب:</span> <span id="mb-my-wood">${getMyResource("wood").toLocaleString()}</span></div>
                <div><span>🪨 طمي:</span> <span id="mb-my-stone">${getMyResource("stone").toLocaleString()}</span></div>
                <div><span>⚙️ حديد:</span> <span id="mb-my-iron">${getMyResource("iron").toLocaleString()}</span></div>
            </div>
            
            <div class="mb-row">
                <label>🪵 خشب:</label>
                <input type="number" id="mb-wood" value="${mbWoodQty}" min="0">
            </div>
            
            <div class="mb-row">
                <label>🪨 حجر:</label>
                <input type="number" id="mb-stone" value="${mbStoneQty}" min="0">
            </div>
            
            <div class="mb-row">
                <label>⚙️ حديد:</label>
                <input type="number" id="mb-iron" value="${mbIronQty}" min="0">
            </div>
            
            <div class="mb-checkbox">
                <label>
                    <input type="checkbox" id="mb-auto" ${mbAutoBuy ? "checked" : ""}>
                    🛒 الشراء التلقائي (عند تحقق الشرط)
                </label>
            </div>
            
            <div class="mb-checkbox">
                <label>
                    <input type="checkbox" id="mb-sound" ${mbSound ? "checked" : ""}>
                    🔊 التنبيه الصوتي
                </label>
            </div>
            
            <button id="mb-toggle" class="${mbEnabled ? '' : 'stopped'}">
                ${mbEnabled ? "⏸️ إيقاف الفحص" : "▶️ تشغيل الفحص"}
            </button>
            <button id="mb-set-int">⏱️ تغيير فترة الفحص (${mbInterval/1000}s)</button>
            <button id="mb-now">🔄 فحص الآن</button>
            
            <div id="mb-log">— السجل سيظهر هنا —</div>
        `;
        document.body.appendChild(box);

        logBox = $("#mb-log");

        /* تحديث الموارد كل 5 ثواني */
        setInterval(updateResourceDisplay, 5000);

        /* أحداث حقول الإدخال */
        $("#mb-wood").onchange = e => {
            mbWoodQty = Number(e.target.value) || 0;
            GM_setValue(KEY_WOOD_QTY, mbWoodQty);
            log(`✔️ كمية الخشب: ${mbWoodQty}`);
        };

        $("#mb-stone").onchange = e => {
            mbStoneQty = Number(e.target.value) || 0;
            GM_setValue(KEY_STONE_QTY, mbStoneQty);
            log(`✔️ كمية الحجر: ${mbStoneQty}`);
        };

        $("#mb-iron").onchange = e => {
            mbIronQty = Number(e.target.value) || 0;
            GM_setValue(KEY_IRON_QTY, mbIronQty);
            log(`✔️ كمية الحديد: ${mbIronQty}`);
        };

        /* زر التشغيل/الإيقاف */
        $("#mb-toggle").onclick = () => {
            mbEnabled = !mbEnabled;
            GM_setValue(KEY_ENABLED, mbEnabled);
            
            const btn = $("#mb-toggle");
            btn.textContent = mbEnabled ? "⏸️ إيقاف الفحص" : "▶️ تشغيل الفحص";
            btn.classList.toggle("stopped", !mbEnabled);
            
            if (mbEnabled) {
                resetTimer();
                log("✔️ تم تشغيل الفحص الدوري");
            } else {
                if (__marketBuyTimer) {
                    clearInterval(__marketBuyTimer);
                    __marketBuyTimer = null;
                }
                clearAllHighlights();
                log("⛔ تم إيقاف الفحص الدوري");
            }
        };

        /* زر الفحص الفوري */
        $("#mb-now").onclick = () => {
            const wasEnabled = mbEnabled;
            mbEnabled = true;
            checkAndProcess().then(() => {
                mbEnabled = wasEnabled;
            });
        };

        /* زر تغيير فترة الفحص */
        $("#mb-set-int").onclick = () => {
            let v = prompt("فترة الفحص بالثواني:", mbInterval / 1000);
            if (v !== null) {
                mbInterval = Number(v) * 1000;
                GM_setValue(KEY_INTERVAL, mbInterval);
                $("#mb-set-int").textContent = `⏱️ تغيير فترة الفحص (${mbInterval/1000}s)`;
                if (mbEnabled) resetTimer();
                log(`✔️ تم تحديث فترة الفحص إلى ${mbInterval/1000} ثانية`);
            }
        };

        /* تشيك بوكس الشراء التلقائي */
        $("#mb-auto").onchange = e => {
            mbAutoBuy = e.target.checked;
            GM_setValue(KEY_AUTO_BUY, mbAutoBuy);
            log(mbAutoBuy ? "✔️ الشراء التلقائي مفعّل" : "⛔ الشراء التلقائي معطل (التنبيه فقط)");
        };

        /* تشيك بوكس الصوت */
        $("#mb-sound").onchange = e => {
            mbSound = e.target.checked;
            GM_setValue(KEY_SOUND, mbSound);
            log(mbSound ? "🔊 التنبيه الصوتي مفعّل" : "🔇 التنبيه الصوتي معطل");
        };
    }

    /* مؤقت دوري */
    function resetTimer() {
        if (__marketBuyTimer) clearInterval(__marketBuyTimer);
        __marketBuyTimer = setInterval(() => {
            if (mbEnabled) checkAndProcess();
        }, mbInterval);
        log(`⏱️ الفحص الدوري كل ${mbInterval/1000} ثانية`);
    }

    /* بدء */
    function init() {
        buildUI();
        if (mbEnabled) {
            resetTimer();
        }
        log("✔️ سكربت Auto Market Buy v4.0 يعمل الآن.");
    }

    init();

})();
