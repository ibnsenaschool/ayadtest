(function () {
  'use strict';

  const SPEED = 30; // سرعة الوحدة الأبطأ بالدقيقة لكل خانة

  const styles = `
    .sniper-container { background: #fff8dc; border: 1px solid #aaa; padding: 10px; margin-bottom: 15px; border-radius: 8px; }
    .sniper-container h2 { margin-top: 0; }
    .target-block { margin-bottom: 10px; padding: 10px; border: 1px dashed #ccc; border-radius: 6px; background: #fefefe; }
    .target-block input { margin-right: 8px; margin-top: 5px; }
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

  function getCurrentVillageCoords() {
    const villageEl = document.querySelector('#menu_row2 b');
    if (!villageEl) return [500, 500];
    const match = villageEl.textContent.match(/\((\d+)\|(\d+)\)/);
    return match ? [parseInt(match[1]), parseInt(match[2])] : [500, 500];
  }

  function calculateTravelTime(from, to) {
    const dx = Math.abs(to[0] - from[0]);
    const dy = Math.abs(to[1] - from[1]);
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance * SPEED * 60 * 1000; // زمن الرحلة بالمللي ثانية
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
      <button class="btn-sniper" onclick="this.parentElement.remove()">🗑️ حذف</button>
    `;
    return div;
  }

  function addNewTarget(container, counterRef) {
    const newTarget = createTargetInput(counterRef.count);
    container.appendChild(newTarget);
    counterRef.count++;
  }

  function parseDateTime(dateStr, timeStr) {
    const [d, m, y] = dateStr.split('.').map(Number);
    const [h, min, s] = timeStr.split(':').map(Number);
    return new Date(y, m - 1, d, h, min, s);
  }

  function formatDate(dateObj) {
    return dateObj.toLocaleString('ar-EG').replace(',', '');
  }

  function initSniperUI() {
    const container = document.createElement('div');
    container.className = 'sniper-container';

    const title = document.createElement('h2');
    title.textContent = '🧠 سكربت القنص - النسخة الكاملة متعددة الأهداف';

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
    calcButton.textContent = '📌 حساب وقت الخروج لكل هدف';
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
    const resultBox = document.getElementById('results');
    resultBox.innerHTML = '';
    const origin = getCurrentVillageCoords();

    const rows = wrapper.querySelectorAll('.target-block');
    const table = document.createElement('table');
    table.className = 'results-table';
    table.innerHTML = `<thead><tr><th>#</th><th>الإحداثيات</th><th>تاريخ الوصول</th><th>وقت الوصول</th><th>وقت الخروج</th></tr></thead><tbody></tbody>`;
    const tbody = table.querySelector('tbody');

    rows.forEach((row, i) => {
      const coord = row.querySelector(`input[name="coord_${i + 1}"]`).value.trim();
      const date = row.querySelector(`input[name="date_${i + 1}"]`).value.trim();
      const time = row.querySelector(`input[name="time_${i + 1}"]`).value.trim();

      const [tx, ty] = coord.split('|').map(Number);
      const arrival = parseDateTime(date, time);
      const travelTime = calculateTravelTime(origin, [tx, ty]);
      const depart = new Date(arrival.getTime() - travelTime);

      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${coord}</td><td>${date}</td><td>${time}</td><td>${formatDate(depart)}</td>`;
      tbody.appendChild(tr);
    });

    resultBox.appendChild(table);
  }

  injectStyle(styles);
  initSniperUI();
})();
