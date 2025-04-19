// سكريפט كامل مستقل لجرد جيوش القبيلة مع ملخص وتصدير Excel + قائمة تلخيصية لكل لاعب

(function() {
    if (window.location.href.indexOf('&screen=ally&mode=members') < 0 || window.location.href.indexOf('&screen=ally&mode=members_troops') > -1) {
        window.location.assign(game_data.link_base_pure + "ally&mode=members");
    }

    let baseURL = `game.php?screen=ally&mode=members_troops&player_id=`;
    let playerURLs = [];
    let villageData = {};
    let playerData = {};
    let player = [];
    let typeTotals = {};
    let fullPop = 15000, almostPop = 12000, semiPop = 9000, quarterPop = 6000;
    let fangSize = 200, scoutSize = 4000;

    $('input:radio[name=player]').each(function () {
        playerURLs.push(baseURL + $(this).attr("value"));
        player.push({ "id": $(this).attr("value"), "name": $(this).parent().text().trim() });
    });

    function numberWithCommas(x) {
      x = x.toString();
      var pattern = /(-?\d+)(\d{3})/;
      while (pattern.test(x))
        x = x.replace(pattern, "$1.$2");
      return x;
    }

    function exportSummaryToExcel(data) {
      let csv = "الفئة,العدد\n";
      for (const [key, value] of Object.entries(data)) {
        csv += `${key},${value}\n`;
      }
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", "tribe_summary.csv");
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    function displayEverything() {
        let html = "";
        let summaryTotals = {
          fullNuke: 0,
          almostNuke: 0,
          semiNuke: 0,
          quarterNuke: 0,
          fullDV: 0,
          almostDV: 0,
          semiDV: 0,
          quarterDV: 0,
          train: 0,
          fang: 0,
          scout: 0
        };

        Object.keys(playerData).forEach(playerName => {
            if (!typeTotals[playerName]) {
                typeTotals[playerName] = { ...summaryTotals };
            }

            const playerRecord = typeTotals[playerName];

            for (let villageKey of Object.keys(playerData[playerName])) {
                if (villageKey !== "total") {
                    const village = playerData[playerName][villageKey];
                    let thisVillageOffPop = 0, thisVillageDefPop = 0, thisVillageTrain = 0, thisVillageFang = 0, thisVillageScout = 0;

                    for (let unit in village) {
                        let amount = parseInt(village[unit]) || 0;
                        switch (unit) {
                            case "spear": case "sword": case "archer":
                                thisVillageDefPop += amount;
                                break;
                            case "axe":
                                thisVillageOffPop += amount;
                                break;
                            case "spy":
                                thisVillageDefPop += 2 * amount;
                                thisVillageOffPop += 2 * amount;
                                if (amount > scoutSize) thisVillageScout++;
                                break;
                            case "light":
                                thisVillageOffPop += 4 * amount;
                                break;
                            case "marcher":
                                thisVillageOffPop += 5 * amount;
                                break;
                            case "ram":
                                thisVillageOffPop += 5 * amount;
                                break;
                            case "heavy":
                                thisVillageDefPop += 6 * amount;
                                break;
                            case "catapult":
                                thisVillageOffPop += 8 * amount;
                                if (amount > fangSize) thisVillageFang++;
                                break;
                            case "snob":
                                if (amount >= 4) thisVillageTrain++;
                                break;
                        }
                    }

                    if (thisVillageOffPop > fullPop) playerRecord["fullNuke"]++;
                    else if (thisVillageOffPop >= almostPop) playerRecord["almostNuke"]++;
                    else if (thisVillageOffPop >= semiPop) playerRecord["semiNuke"]++;
                    else if (thisVillageOffPop >= quarterPop) playerRecord["quarterNuke"]++;

                    if (thisVillageDefPop > fullPop) playerRecord["fullDV"]++;
                    else if (thisVillageDefPop >= almostPop) playerRecord["almostDV"]++;
                    else if (thisVillageDefPop >= semiPop) playerRecord["semiDV"]++;
                    else if (thisVillageDefPop >= quarterPop) playerRecord["quarterDV"]++;

                    if (thisVillageTrain) playerRecord["train"]++;
                    if (thisVillageFang) playerRecord["fang"]++;
                    if (thisVillageScout) playerRecord["scout"]++;
                }
            }
        });

        Object.values(typeTotals).forEach(player => {
          Object.keys(summaryTotals).forEach(key => {
            summaryTotals[key] += player[key] || 0;
          });
        });

        html += `<div class="sophHeader" style="width: 800px; margin-bottom:10px">
<h3 style="padding:10px;">الملخص العام لجيوش القبيلة</h3>
<button onclick='exportSummaryToExcel(${JSON.stringify(summaryTotals)})' style="margin: 10px; padding: 8px; font-size: 14px; cursor:pointer">📥 تصدير إلى Excel</button>
<table style="width:100%; text-align:left; padding:5px;">
<tr>`;

        Object.entries(summaryTotals).forEach(([key, value], index) => {
          if (index > 0 && index % 3 === 0) html += '</tr><tr>';
          html += `<td style="padding:5px;"><b>${key}:</b> ${numberWithCommas(value)}</td>`;
        });

        html += `</tr></table></div>`;

        // جدول تلخيص لكل لاعب في الأعلى
        html += `<div class="sophHeader" style="width: 800px; margin-bottom:10px">
        <h4 style="padding:10px;">تفصيل حسب كل لاعب</h4>
        <table style="width:100%; text-align:right; border:1px solid #ccc; border-collapse:collapse;">
        <thead><tr style="background:#eee;"><th style="padding:4px;">اللاعب</th><th>نوك كامل</th><th>3/4 نوك</th><th>نصف نوك</th><th>1/4 نوك</th></tr></thead>
        <tbody>`;
        Object.entries(typeTotals).forEach(([player, counts]) => {
            html += `<tr><td style="padding:4px;">${player}</td><td>${counts.fullNuke}</td><td>${counts.almostNuke}</td><td>${counts.semiNuke}</td><td>${counts.quarterNuke}</td></tr>`;
        });
        html += `</tbody></table></div>`;

        $("#contentContainer").prepend(html);
    }

    function simulateDataLoading() {
        playerData = {
            "لاعب 1": {
                "village1": { spear: 1000, sword: 500, axe: 3000, spy: 500, light: 2000, marcher: 0, ram: 300, heavy: 400, catapult: 300, snob: 4 },
                total: {}
            },
            "لاعب 2": {
                "village1": { spear: 2000, sword: 1000, axe: 2500, spy: 300, light: 1500, marcher: 0, ram: 200, heavy: 300, catapult: 150, snob: 3 },
                total: {}
            }
        };
        displayEverything();
    }

    simulateDataLoading();
})();
