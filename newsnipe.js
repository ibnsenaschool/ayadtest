(function () {
  'use strict';

  const unitSpeeds = {
    spear: 18,
    sword: 22,
    axe: 18,
    light: 10,
    heavy: 11
  };

  const styles = `
    .sniper-container { background: #fff8dc; border: 1px solid #aaa; padding: 10px; margin-bottom: 15px; border-radius: 8px; }
    .sniper-container h2 { margin-top: 0; }
    .target-block { margin-bottom: 10px; padding: 10px; border: 1px dashed #ccc; border-radius: 6px; background: #fefefe; }
    .target-block input, .target-block select { margin: 5px; }
    .btn-sniper { background: #c2a05d; border: none; padding: 5px 10px; color: white; cursor: pointer; border-radius: 4px; }
    .btn-sniper:hover { background: #a8894a; }
    .results-table { margin-top: 15px; border-collapse: collapse; width: 100%; }
    .results-table th, .results-table td { border: 1px solid #ccc; padding: 5px; text-align: center; }
    .results-table th { background: #eee; }
  `;

  function injectStyle(css) {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
  }

  function parseVillageCoords(str) {
    const match = str.match(/(\d+)\|(\d+)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : null;
  }

  function getVillagesAndUnits() {
    const rows = document.querySelectorAll('#combined_table tr:has(td.quickedit-vn)');
    const result = [];
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      const nameCell = row.querySelector('span.quickedit-label');
      const coord = parseVillageCoords(nameCell?.innerText);
      if (!coord) return;
      const spear = parseInt(cells[cells.length - 11]?.innerText) || 0;
      const sword = parseInt(cells[cells.length - 10]?.innerText) || 0;
      const axe = parseInt(cells[cells.length - 9]?.innerText) || 0;
      const light = parseInt(cells[cells.length - 7]?.innerText) || 0;
      const heavy = parseInt(cells[cells.length - 6]?.innerText) || 0;
      result.push({ name: nameCell.innerText.trim(), coord, spear, sword, axe, light, heavy });
    });
    return result;
  }

  function calculateTravelTime(from, to, speed) {
    const dx = Math.abs(to[0] - from[0]);
    const dy = Math.abs(to[1] - from[1]);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance * speed * 60 * 1000; // ms
  }

  function parseDateTime(dateStr, timeStr) {
    const [d, m, y] = dateStr.split('.').map(Number);
    const [h, min, s] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, s);
  }

  function formatDate(dateObj) {
    return dateObj.toLocaleString('ar-EG').replace(',', '');
  }

  function createTargetInput(index) {
    const div = document.createElement('div');
    div.className = 'target-block';
    div.innerHTML = `
      <label>🎯 إحداثيات الهدف:</label>
      <input type="text" placeholder="500|500" name="coord_${index}" size="8" required>
      <label>📅 التاريخ:</label>
      <input type="text" placeholder="25.04.2025" name="date_${index}" size="10" required>
      <label>🕒 الوقت:</label>
      <input type="text" placeholder="13:30:00" name="time_${index}" size="8" required>
      <label>🚴 نوع الوحدة:</label>
      <select name="unit_${index}">
        <option value="spear">رمح</option>
        <option value="sword">سيف</option>
        <option value="axe">فاس</option>
        <option value="light">خفيف</option>
        <option value="heavy">ثقيل</option>
      </select>
      <button class="btn-sniper" onclick="this.parentElement.remove()">🗑️ حذف</button>
    `;
    return div;
  }

  function addNewTarget(container, counterRef) {
    const newTarget = createTargetInput(counterRef.count);
    container.appendChild(newTarget);
    counterRef.count++;
  }

  function initSniperUI() {
    const container = document.createElement('div');
    container.className = 'sniper-container';
    const title = document.createElement('h2');
    title.textContent = '🧠 سكربت القنص - النسخة النهائية بكل الوظائف';

    const targetsWrapper = document.createElement('div');
    targetsWrapper.id = 'targets-wrapper';
    const counter = { count: 1 };
    targetsWrapper.appendChild(createTargetInput(counter.count));
    counter.count++;

    const addButton = document.createElement('button');
    addButton.className = 'btn-sniper';
    addButton.textContent = '➕ إضافة هدف جديد';
    addButton.onclick = () => addNewTarget(targetsWrapper, counter);

    const resultsDiv = document.createElement('div');
    resultsDiv.id = 'results';

    const calcButton = document.createElement('button');
    calcButton.className = 'btn-sniper';
    calcButton.textContent = '📌 حساب النتائج';
    calcButton.onclick = () => calculateResults(targetsWrapper);

    container.appendChild(title);
    container.appendChild(targetsWrapper);
    container.appendChild(addButton);
    container.appendChild(document.createElement('hr'));
    container.appendChild(calcButton);
    container.appendChild(resultsDiv);

    const targetElement = document.querySelector('#content_value') || document.body;
    targetElement.prepend(container);
  }

  function calculateResults(wrapper) {
    const villages = getVillagesAndUnits();
    const resultBox = document.getElementById('results');
    resultBox.innerHTML = '';

    const rows = wrapper.querySelectorAll('.target-block');
    rows.forEach((row, i) => {
      const coordStr = row.querySelector(`input[name="coord_${i + 1}"]`).value.trim();
      const date = row.querySelector(`input[name="date_${i + 1}"]`).value.trim();
      const time = row.querySelector(`input[name="time_${i + 1}"]`).value.trim();
      const unit = row.querySelector(`select[name="unit_${i + 1}"]`).value;
      const speed = unitSpeeds[unit];
      const [tx, ty] = coordStr.split('|').map(Number);
      const arrival = parseDateTime(date, time);

      const table = document.createElement('table');
      table.className = 'results-table';
      table.innerHTML = `<thead><tr><th>القرية</th><th>الوحدات</th><th>وقت الإرسال</th><th>رابط الهجوم</th><th>BB Code</th></tr></thead><tbody></tbody>`;
      const tbody = table.querySelector('tbody');

      villages.forEach(v => {
        const travelTime = calculateTravelTime(v.coord, [tx, ty], speed);
        const depart = new Date(arrival.getTime() - travelTime);
        const link = `/game.php?screen=place&village=${v.id}&x=${tx}&y=${ty}`;
        const bb = `[coord]${v.coord.join('|')}[/coord] → [coord]${tx}|${ty}[/coord] | [b]${formatDate(depart)}[/b]`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${v.name}</td>
          <td>${unit}</td>
          <td>${formatDate(depart)}</td>
          <td><a href="${link}" target="_blank">🚀 هجوم</a></td>
          <td><textarea readonly onclick="this.select()">${bb}</textarea></td>
        `;
        tbody.appendChild(tr);
      });

      resultBox.appendChild(document.createElement('hr'));
      resultBox.appendChild(table);
    });
  }

  injectStyle(styles);
  initSniperUI();
})();
