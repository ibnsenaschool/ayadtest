/*
 * Protected Bot v5.6
 * كل مستخدم له كلمة مرور خاصة
 */
(function(){
    var SUBS_URL = "https://ibnsenaschool.github.io/ayadtest/subscribers.json";
    
    // ============================================
    // التحقق من المصدر
    // ============================================
    function checkOrigin() {
        var currentHost = window.location.hostname;
        if (currentHost.indexOf("github.io") !== -1) {
            showBlockedMessage("⛔ لا يمكن تشغيل البوت مباشرة!\n\n📌 يجب تشغيله من داخل اللعبة عبر صفحة التثبيت.");
            return false;
        }
        return true;
    }
    
    function showBlockedMessage(msg) {
        var overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:9999999;display:flex;align-items:center;justify-content:center;";
        var box = document.createElement("div");
        box.style.cssText = "background:linear-gradient(135deg,#c62828,#8e0000);padding:40px;border-radius:15px;text-align:center;font-family:tahoma;direction:rtl;color:white;max-width:450px;box-shadow:0 10px 40px rgba(0,0,0,0.5);";
        box.innerHTML = '<h2 style="margin:0 0 20px;font-size:24px;">🚫 الوصول مرفوض</h2>' +
            '<p style="font-size:16px;line-height:1.8;white-space:pre-line;">' + msg + '</p>' +
            '<button onclick="this.parentElement.parentElement.remove()" style="margin-top:25px;padding:12px 35px;background:white;color:#c62828;border:none;border-radius:8px;font-weight:bold;font-size:14px;cursor:pointer;">إغلاق</button>';
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }
    
    if (!checkOrigin()) return;
    
    // ============================================
    // الكود الرئيسي للبوت
    // ============================================
    var STORAGE_KEY = "ms_saved_user";
    var STORAGE_PASS = "ms_saved_pass";
    var CLICK_DELAY = 1000;
    var BETWEEN_SELL_DELAY = 10000;
    var MERCHANT_CAPACITY = 1000;
    var BUFFER = 500;
    var RESOURCE_BUFFER = 1000;
    var DEFAULT_INTERVAL = 30000;
    var DEFAULT_THRESHOLD =64;
    
    var TEXTS = {
        title: "بيع تلقائي",
        enterUsername: "اسم المستخدم",
        enterPassword: "كلمة المرور",
        checking: "جاري التحقق",
        userNotFound: "اسم المستخدم غير موجود",
        wrongPassword: "كلمة المرور غير صحيحة",
        expired: "انتهى اشتراكك",
        renewSub: "يرجى تجديد الاشتراك",
        welcome: "مرحباً",
        wood: "خشب",
        stone: "طمي",
        iron: "حديد",
        autoSell: "بيع تلقائي",
        sound: "صوت",
        stop: "إيقاف",
        start: "تشغيل",
        runNow: "تشغيل الآن",
        close: "إغلاق",
        period: "الفترة",
        threshold: "العتبة",
        log: "السجل",
        days: "أيام",
        reserve: "احتياطي",
        running: "البوت يعمل",
        noMerchants: "لا يوجد تجار",
        done: "تم",
        checkNow: "فحص",
        sold: "تم البيع",
        thresholdMet: "العتبة تحققت",
        nextCheck: "الفحص القادم",
        seconds: "ثانية",
        plan: "الباقة",
        expiryDate: "تاريخ الانتهاء",
        connectionError: "خطأ في الاتصال",
        tryAgain: "حاول مرة أخرى",
        remaining: "متبقي",
        savedUser: "مستخدم محفوظ",
        login: "دخول",
        changeUser: "تغيير المستخدم",
        rememberMe: "تذكرني",
        logout: "تسجيل خروج"
    };
    
    function getSavedUser() { try { return localStorage.getItem(STORAGE_KEY) || ""; } catch(e) { return ""; } }
    function getSavedPass() { try { return localStorage.getItem(STORAGE_PASS) || ""; } catch(e) { return ""; } }
    function saveUser(u, p) { try { localStorage.setItem(STORAGE_KEY, u); localStorage.setItem(STORAGE_PASS, p); } catch(e) {} }
    function clearSavedUser() { try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(STORAGE_PASS); } catch(e) {} }
    
    function showLoginDialog(callback) {
        var savedUser = getSavedUser();
        var savedPass = getSavedPass();
        
        var overlay = document.createElement("div");
        overlay.id = "ms-login-overlay";
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999998;display:flex;align-items:center;justify-content:center;";
        
        var dialog = document.createElement("div");
        dialog.style.cssText = "background:linear-gradient(135deg,#1a1a2e,#16213e);padding:30px;border-radius:15px;text-align:center;font-family:tahoma;direction:rtl;color:white;min-width:350px;box-shadow:0 10px 40px rgba(0,0,0,0.5);";
        
        var html = '<h2 style="margin:0 0 20px;color:#ffc107;">💰 ' + TEXTS.title + ' v5.6</h2>';
        
        if (savedUser && savedPass) {
            html += '<div style="background:rgba(76,175,80,0.2);border:1px solid #4CAF50;border-radius:8px;padding:12px;margin-bottom:15px;">' +
                '<p style="margin:0;color:#8BC34A;font-size:11px;">👤 ' + TEXTS.savedUser + '</p>' +
                '<p style="margin:5px 0 0;font-size:18px;font-weight:bold;">' + savedUser + '</p></div>' +
                '<button id="ms-use-saved" style="width:100%;padding:14px;background:linear-gradient(45deg,#4CAF50,#8BC34A);border:none;border-radius:8px;color:white;font-weight:bold;font-size:15px;cursor:pointer;margin-bottom:8px;">✅ ' + TEXTS.login + ' كـ ' + savedUser + '</button>' +
                '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.2);margin:15px 0;">' +
                '<p style="color:#888;font-size:11px;margin-bottom:10px;">' + TEXTS.changeUser + ':</p>';
        }
        
        html += '<input type="text" id="ms-username" style="width:100%;padding:12px;border:none;border-radius:8px;font-size:14px;text-align:center;margin-bottom:10px;box-sizing:border-box;" placeholder="👤 ' + TEXTS.enterUsername + '">' +
            '<input type="password" id="ms-password" style="width:100%;padding:12px;border:none;border-radius:8px;font-size:14px;text-align:center;margin-bottom:10px;box-sizing:border-box;" placeholder="🔐 ' + TEXTS.enterPassword + '">' +
            '<div style="margin-bottom:10px;text-align:right;"><label style="font-size:11px;color:#aaa;cursor:pointer;"><input type="checkbox" id="ms-remember" checked style="margin-left:5px;"> ' + TEXTS.rememberMe + '</label></div>' +
            '<div id="ms-login-error" style="color:#ff6b6b;margin-bottom:10px;min-height:18px;font-size:12px;"></div>' +
            '<button id="ms-login-btn" style="width:100%;padding:12px;background:linear-gradient(45deg,#ff6b6b,#ffc107);border:none;border-radius:8px;color:#1a1a2e;font-weight:bold;font-size:15px;cursor:pointer;">' + TEXTS.login + '</button>' +
            '<button id="ms-cancel-btn" style="width:100%;padding:10px;background:#555;border:none;border-radius:8px;color:white;margin-top:10px;cursor:pointer;font-size:12px;">' + TEXTS.close + '</button>';
        
        dialog.innerHTML = html;
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        var inputUser = document.getElementById("ms-username");
        var inputPass = document.getElementById("ms-password");
        var btn = document.getElementById("ms-login-btn");
        var cancelBtn = document.getElementById("ms-cancel-btn");
        var errorDiv = document.getElementById("ms-login-error");
        var rememberCb = document.getElementById("ms-remember");
        var useSavedBtn = document.getElementById("ms-use-saved");
        
        if (!savedUser) inputUser.focus();
        
        function doLogin(username, password) {
            if (!username) { errorDiv.textContent = TEXTS.enterUsername; return; }
            if (!password) { errorDiv.textContent = TEXTS.enterPassword; return; }
            btn.textContent = TEXTS.checking + "...";
            btn.disabled = true;
            if (useSavedBtn) useSavedBtn.disabled = true;
            errorDiv.textContent = "";
            callback(username.toLowerCase(), password, overlay, rememberCb ? rememberCb.checked : true);
        }
        
        btn.onclick = function() { doLogin(inputUser.value.trim(), inputPass.value); };
        inputPass.onkeypress = function(e) { if (e.key === "Enter") doLogin(inputUser.value.trim(), inputPass.value); };
        cancelBtn.onclick = function() { overlay.remove(); };
        if (useSavedBtn) useSavedBtn.onclick = function() { doLogin(savedUser, savedPass); };
    }
    
    function showExpiredDialog(userName, expiryDate, contact) {
        clearSavedUser();
        var overlay = document.createElement("div");
        overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);z-index:9999999;display:flex;align-items:center;justify-content:center;";
        var dialog = document.createElement("div");
        dialog.style.cssText = "background:linear-gradient(135deg,#ff4444,#cc0000);padding:40px;border-radius:15px;text-align:center;font-family:tahoma;direction:rtl;color:white;min-width:380px;box-shadow:0 10px 40px rgba(0,0,0,0.5);";
        dialog.innerHTML = '<h2 style="margin:0 0 20px;font-size:22px;">⛔ ' + TEXTS.expired + '</h2>' +
            '<p style="font-size:16px;margin-bottom:8px;">' + TEXTS.welcome + ' <strong>' + userName + '</strong></p>' +
            '<p style="margin-bottom:20px;font-size:14px;">' + TEXTS.expiryDate + ': <strong>' + expiryDate + '</strong></p>' +
            '<p style="font-size:18px;color:#ffeb3b;margin-bottom:20px;">' + TEXTS.renewSub + '</p>' +
            '<div style="background:rgba(255,255,255,0.2);padding:12px;border-radius:8px;"><p style="margin:0;">📱 ' + contact + '</p></div>' +
            '<button onclick="this.parentElement.parentElement.remove()" style="margin-top:20px;padding:10px 30px;background:white;color:#cc0000;border:none;border-radius:8px;font-weight:bold;cursor:pointer;">' + TEXTS.close + '</button>';
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }
    
    function showError(msg, overlay) {
        var errorDiv = document.getElementById("ms-login-error");
        var btn = document.getElementById("ms-login-btn");
        var useSavedBtn = document.getElementById("ms-use-saved");
        if (errorDiv) errorDiv.textContent = msg;
        if (btn) { btn.textContent = TEXTS.login; btn.disabled = false; }
        if (useSavedBtn) useSavedBtn.disabled = false;
    }
    
    function checkSubscription(username, password, overlay, remember) {
        fetch(SUBS_URL + "?t=" + Date.now())
        .then(function(r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function(data) {
            var user = data.users[username];
            
            // التحقق من وجود المستخدم
            if (!user) { 
                showError(TEXTS.userNotFound, overlay); 
                return; 
            }
            
            // التحقق من كلمة المرور
            if (user.password !== password) {
                showError(TEXTS.wrongPassword, overlay);
                return;
            }
            
            var now = new Date(), expiry = new Date(user.expiry);
            fetch("https://worldtimeapi.org/api/ip")
            .then(function(r) { return r.json(); })
            .then(function(t) { now = new Date(t.datetime); checkExpiry(now, expiry, user, data.settings, overlay, username, password, remember); })
            .catch(function() { checkExpiry(now, expiry, user, data.settings, overlay, username, password, remember); });
        })
        .catch(function(err) { showError(TEXTS.connectionError + ": " + err.message, overlay); });
    }
    
    function checkExpiry(now, expiry, user, settings, overlay, username, password, remember) {
        if (now > expiry) { overlay.remove(); showExpiredDialog(user.name, user.expiry, settings.contact); return; }
        if (remember) saveUser(username, password);
        var daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        overlay.remove();
        startBot(user, daysLeft, settings, username);
    }
    
    function startBot(user, daysLeft, settings, username) {
        if (window.__MS_RUN__) { alert(TEXTS.running + "!"); return; }
        window.__MS_RUN__ = true;
        
        var enabled = true, autoSell = true, sound = true;
        var interval = DEFAULT_INTERVAL, threshold = DEFAULT_THRESHOLD;
        var timerWorker = null, countdownTimer = null, countdown = interval / 1000, logBox = null;
        
        function $(s) { return document.querySelector(s); }
        function sleep(ms) { return new Promise(function(r) { setTimeout(r, ms); }); }
        function log(m) { var t = new Date().toLocaleTimeString(); console.log("[MS]", t, m); if (logBox) { var d = document.createElement("div"); d.textContent = "[" + t + "] " + m; logBox.insertBefore(d, logBox.firstChild); while (logBox.children.length > 30) logBox.lastChild.remove(); } }
        function beep() { if (!sound) return; try { var ctx = new (window.AudioContext || window.webkitAudioContext)(); var osc = ctx.createOscillator(); var gain = ctx.createGain(); osc.type = "sine"; osc.frequency.value = 550; gain.gain.value = 0.1; osc.connect(gain); gain.connect(ctx.destination); osc.start(); setTimeout(function() { osc.stop(); }, 180); } catch(e) {} }
        function toNum(t) { return Number(String(t || "0").replace(/[^0-9]/g, "")); }
        function getMyRes() { return { wood: toNum($("#wood") ? $("#wood").textContent : 0), stone: toNum($("#stone") ? $("#stone").textContent : 0), iron: toNum($("#iron") ? $("#iron").textContent : 0) }; }
        function getMarketVal(r) { var divs = document.querySelectorAll(".premium-exchange-sep"); for (var i = 0; i < divs.length; i++) { var d = divs[i]; var img = d.querySelector("img"); if (!img) continue; var src = img.src; if (r === "wood" && src.indexOf("wood_") !== -1) return toNum(d.textContent); if (r === "stone" && src.indexOf("stone_") !== -1) return toNum(d.textContent); if (r === "iron" && src.indexOf("iron_") !== -1) return toNum(d.textContent); } return null; }
        function getMerchants() { var el = $("#market_merchant_available_count"); return el ? toNum(el.textContent) : 0; }
        function getSel(r) { return { stock: $("#premium_exchange_stock_" + r), cap: $("#premium_exchange_capacity_" + r), input: $("input[name='sell_" + r + "']") || $("input[data-resource='" + r + "'][data-type='sell']") }; }
        function updRes() { var res = getMyRes(); var w = $("#ms-w"), s = $("#ms-s"), i = $("#ms-i"); if (w) w.textContent = res.wood.toLocaleString(); if (s) s.textContent = res.stone.toLocaleString(); if (i) i.textContent = res.iron.toLocaleString(); }
        function updateCountdown() { var el = $("#ms-countdown"); if (el && enabled) { el.textContent = countdown + " " + TEXTS.seconds; countdown--; if (countdown < 0) countdown = interval / 1000; } }
        
        async function sellRes(r) {
            log(TEXTS.checkNow + " " + r + "...");
            var sel = getSel(r); if (!sel.stock || !sel.cap || !sel.input) { log(r + " not found"); return false; }
            var marketStock = toNum(sel.stock.textContent), marketCap = toNum(sel.cap.textContent), myRes = getMyRes(), myAmt = myRes[r] || 0;
            var marketNeed = (marketCap - marketStock) - BUFFER; if (marketNeed < 0) marketNeed = 0;
            var canSell = myAmt - RESOURCE_BUFFER; if (canSell < 0) canSell = 0;
            var qty = Math.min(marketNeed, canSell);
            var merchants = getMerchants(); if (merchants <= 0) { log(TEXTS.noMerchants); return false; }
            var maxQty = merchants * MERCHANT_CAPACITY; qty = Math.min(qty, maxQty);
            if (qty <= 0) { log("qty = 0"); return false; }
            sel.input.focus(); sel.input.value = qty; sel.input.dispatchEvent(new Event("input", {bubbles: true}));
            await sleep(CLICK_DELAY);
            var btn1 = $(".btn-premium-exchange-buy"); if (!btn1) { log("btn not found"); return false; } btn1.click();
            await sleep(CLICK_DELAY);
            var btn2 = $(".btn-confirm-yes") || $("[class*='confirm']"); if (!btn2) { log("confirm not found"); return false; } btn2.click();
            await sleep(CLICK_DELAY);
            beep(); log(TEXTS.sold + "! " + qty + " " + r); return true;
        }
        
        async function autoSellCheck() {
            if (!enabled) return; countdown = interval / 1000; log(TEXTS.checkNow + "..."); updRes();
            var list = ["wood", "stone", "iron"], labels = [TEXTS.wood, TEXTS.stone, TEXTS.iron];
            for (var i = 0; i < list.length; i++) {
                var r = list[i]; var val = getMarketVal(r);
                if (val === null) { log(r + " val not found"); continue; }
                log(labels[i] + " = " + val + " | " + TEXTS.threshold + " = " + threshold);
                if (val <= threshold) { log(TEXTS.thresholdMet + " " + labels[i] + "!"); beep(); if (autoSell) { var ok = await sellRes(r); if (ok) await sleep(BETWEEN_SELL_DELAY); } }
            }
            log(TEXTS.done); updRes();
        }
        
        function startTimer() {
            if (timerWorker) timerWorker.terminate(); if (countdownTimer) clearInterval(countdownTimer); countdown = interval / 1000;
            try { var workerCode = "var t=" + interval + ";setInterval(function(){postMessage('tick');},t);"; var blob = new Blob([workerCode], {type: "application/javascript"}); timerWorker = new Worker(URL.createObjectURL(blob)); timerWorker.onmessage = function(e) { if (e.data === "tick" && enabled) autoSellCheck(); }; } catch(e) { setInterval(function() { if (enabled) autoSellCheck(); }, interval); }
            countdownTimer = setInterval(updateCountdown, 1000);
        }
        function stopTimer() { if (timerWorker) timerWorker.terminate(); if (countdownTimer) clearInterval(countdownTimer); timerWorker = null; }
        
        function buildUI() {
            if ($("#ms-p")) return;
            var css = document.createElement("style");
            css.textContent = "#ms-p{position:fixed;left:20px;bottom:20px;z-index:999999;width:300px;padding:10px;border-radius:10px;background:rgba(0,0,0,0.92);color:#fff;font-family:tahoma;direction:rtl;font-size:11px;box-shadow:0 5px 25px rgba(0,0,0,0.5)}#ms-p h3{margin:0 0 8px;text-align:center;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:6px;font-size:13px}#ms-p .inf{background:rgba(255,255,255,0.12);padding:8px;border-radius:5px;margin-bottom:6px;text-align:center}#ms-p .user-info{color:#ffc107;font-weight:bold;font-size:12px}#ms-p .plan-info{color:#8BC34A;font-size:9px;margin-top:3px}#ms-p .days-left{background:rgba(76,175,80,0.3);color:#8BC34A;padding:2px 6px;border-radius:10px;font-size:9px;display:inline-block;margin-top:4px}#ms-p .days-left.warning{background:rgba(255,152,0,0.3);color:#FFB74D}#ms-p .days-left.danger{background:rgba(244,67,54,0.3);color:#ef5350}#ms-p .countdown-box{background:rgba(33,150,243,0.25);color:#64B5F6;padding:4px 6px;border-radius:5px;margin:5px 0;text-align:center;font-size:11px}#ms-p .rs{background:rgba(255,255,255,0.08);padding:5px;border-radius:5px;margin-bottom:5px;font-size:10px}#ms-p .rs div{display:flex;justify-content:space-between;padding:2px 0}#ms-p .ck{margin:4px 0;font-size:10px}#ms-p button{width:100%;margin:2px 0;padding:5px;border:none;border-radius:4px;font-weight:bold;cursor:pointer;font-size:10px}#ms-p button:hover{opacity:0.9}#ms-p .bt{background:#1e88e5;color:#fff}#ms-p .bt.off{background:#f44336}#ms-p .bn{background:#4CAF50;color:#fff}#ms-p .bi{background:#FF9800;color:#fff}#ms-p .bc{background:#555;color:#fff}#ms-p .bx{background:#c62828;color:#fff}#ms-p #ms-lg{max-height:80px;overflow-y:auto;background:rgba(255,255,255,0.06);padding:4px;font-size:9px;margin-top:5px;border-radius:3px}";
            document.head.appendChild(css);
            
            var daysClass = "days-left"; if (daysLeft <= 7) daysClass += " danger"; else if (daysLeft <= 30) daysClass += " warning";
            var box = document.createElement("div"); box.id = "ms-p";
            box.innerHTML = '<h3>💰 ' + TEXTS.title + ' v5.6</h3><div class="inf"><div class="user-info">👤 ' + user.name + '</div><div class="plan-info">🎁 ' + TEXTS.plan + ': ' + user.plan + '</div><span class="' + daysClass + '">⏳ ' + TEXTS.remaining + ' ' + daysLeft + ' ' + TEXTS.days + '</span></div><div class="countdown-box">⏱ ' + TEXTS.nextCheck + ': <span id="ms-countdown">' + countdown + ' ' + TEXTS.seconds + '</span></div><div class="rs"><div><span>🪵 ' + TEXTS.wood + ':</span><span id="ms-w" style="color:#8BC34A">' + getMyRes().wood.toLocaleString() + '</span></div><div><span>🧱 ' + TEXTS.stone + ':</span><span id="ms-s" style="color:#FF9800">' + getMyRes().stone.toLocaleString() + '</span></div><div><span>⚙️ ' + TEXTS.iron + ':</span><span id="ms-i" style="color:#9E9E9E">' + getMyRes().iron.toLocaleString() + '</span></div><div style="font-size:9px;color:#777;margin-top:3px">💡 ' + TEXTS.reserve + ': ' + RESOURCE_BUFFER + '</div></div><div class="ck"><label><input type="checkbox" id="ms-au" checked> 🔄 ' + TEXTS.autoSell + '</label></div><div class="ck"><label><input type="checkbox" id="ms-sn" checked> 🔊 ' + TEXTS.sound + '</label></div><button class="bt" id="ms-tg">⏸ ' + TEXTS.stop + '</button><button class="bn" id="ms-nw">🚀 ' + TEXTS.runNow + '</button><button class="bi" id="ms-th">🎯 ' + TEXTS.threshold + ' (' + threshold + ')</button><button class="bi" id="ms-in">⏱ ' + TEXTS.period + ' (' + (interval/1000) + 's)</button><button class="bc" id="ms-cl">✖ ' + TEXTS.close + '</button><button class="bx" id="ms-lo">🚪 ' + TEXTS.logout + '</button><div id="ms-lg">-- ' + TEXTS.log + ' --</div>';
            document.body.appendChild(box);
            
            logBox = $("#ms-lg"); setInterval(updRes, 5000);
            $("#ms-tg").onclick = function() { enabled = !enabled; var b = $("#ms-tg"); b.textContent = enabled ? "⏸ " + TEXTS.stop : "▶ " + TEXTS.start; b.className = enabled ? "bt" : "bt off"; if (enabled) { startTimer(); log(TEXTS.start); } else { stopTimer(); log(TEXTS.stop); } };
            $("#ms-nw").onclick = function() { autoSellCheck(); };
            $("#ms-th").onclick = function() { var v = prompt(TEXTS.threshold + ":", threshold); if (v) { threshold = Number(v); $("#ms-th").textContent = "🎯 " + TEXTS.threshold + " (" + threshold + ")"; log(TEXTS.threshold + " = " + threshold); } };
            $("#ms-in").onclick = function() { var v = prompt(TEXTS.period + " (s):", interval/1000); if (v) { interval = Number(v) * 1000; countdown = interval / 1000; $("#ms-in").textContent = "⏱ " + TEXTS.period + " (" + (interval/1000) + "s)"; if (enabled) startTimer(); log(TEXTS.period + " = " + (interval/1000) + "s"); } };
            $("#ms-au").onchange = function(e) { autoSell = e.target.checked; log(TEXTS.autoSell + " = " + (autoSell ? "ON" : "OFF")); };
            $("#ms-sn").onchange = function(e) { sound = e.target.checked; };
            $("#ms-cl").onclick = function() { stopTimer(); box.remove(); window.__MS_RUN__ = false; };
            $("#ms-lo").onclick = function() { clearSavedUser(); stopTimer(); box.remove(); window.__MS_RUN__ = false; alert("تم تسجيل الخروج"); };
        }
        
        buildUI(); log(TEXTS.welcome + " " + user.name + "!");
        setTimeout(function() { autoSellCheck(); startTimer(); }, 1000);
    }
    
    showLoginDialog(checkSubscription);
})();
