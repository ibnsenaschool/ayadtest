(function() {
    if (document.URL.match(/screen=map/)) {
        setInterval(function() {
            if (document.querySelector("#troop_confirm_submit") && !document.querySelector('#time')) {
                document.querySelector("#troop_confirm_submit").insertAdjacentHTML('afterend',
                    '<input type="text" maxlength="8" size="15" autocomplete="off" placeholder="ادخل وقت الوصول هنا" style="text-align:center;font-weight:bold" id="time" />' +
                    '<span id="ss">:</span>' +
                    '<input type="text" id="lag" style="text-align:center;font-weight:bold" placeholder="تأخير" size="4" />' +
                    '<input type="button" class="btn" id="btn" value="موافق" />'
                );
            }
        }, 50);
    } else {
        document.querySelector("#troop_confirm_submit")?.insertAdjacentHTML('afterend',
            '<input type="text" maxlength="8" size="15" autocomplete="off" placeholder="ادخل وقت الوصول هنا" style="text-align:center;font-weight:bold" id="time" />' +
            '<span id="ss">:</span>' +
            '<input type="text" id="lag" style="text-align:center;font-weight:bold" placeholder="تأخير" size="4" />' +
            '<input type="button" class="btn" id="btn" value="موافق" />'
        );
    }

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'btn') {
            var wsool = document.getElementById('time').value;
            document.getElementById('time').style.display = 'none';
            document.getElementById('btn').style.display = 'none';
            document.getElementById('ss').style.display = 'none';
            document.getElementById('lag').style.display = 'none';

            if (typeof UI !== "undefined" && UI.InfoMessage) {
                UI.InfoMessage('تم الحفظ بنجاح', 3000, "success");
            } else {
                alert('تم الحفظ بنجاح');
            }

            setInterval(function() {
                var relativeTime = document.querySelector('.relative_time');
                if (!relativeTime) return;
                var server = relativeTime.textContent.match(/\d+:\d+:\d+/);
                if (!server) return;

                server = server[0];

                if (wsool === server) {
                    var lag = document.getElementById('lag').value || '200';
                    setTimeout(function() {
                        document.getElementById("troop_confirm_submit").click();
                    }, lag);
                    wsool = "";
                }
            }, 1);
        }
    });
})();
