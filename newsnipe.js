(function() {
    'use strict';

    function gebi(id) { return document.getElementById(id); }

    function createSniperUI() {
        const targetContainer = document.getElementById('content_value');
        if (!targetContainer) return;

        const mainDiv = document.createElement('div');
        mainDiv.className = 'vis vis_item';
        mainDiv.style.margin = '10px 0';
        mainDiv.style.padding = '10px';
        mainDiv.style.border = '1px solid #c1a264';
        mainDiv.style.borderRadius = '8px';
        mainDiv.innerHTML = `
            <h3 style="margin-bottom:10px;">
                سكربت القنص المتطور
            </h3>
            <div class="controls-container">
                <div class="control-group">
                    <label>إحداثيات الهدف:</label>
                    <input size="8" type="text" placeholder="xxx|yyy" id="sniper-coord-target" required />
                </div>
                <div class="control-group">
                    <label>تاريخ الوصول:</label>
                    <input size="10" type="text" placeholder="dd.mm.yyyy" id="sniper-arrival-date" required />
                </div>
                <div class="control-group">
                    <label>وقت الوصول:</label>
                    <input size="8" type="text" placeholder="hh:mm:ss" id="sniper-arrival-time" required />
                </div>
                <div class="control-group">
                    <label>المجموعة:</label>
                    <select id="sniper-group-select">
                        <option value="all">-- الجميع --</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>نسبة التسريع (%):</label>
                    <input type="number" value="0" min="0" step="0.1" id="sniper-sigil-percentage" />
                </div>

                <input type="button" value="➕ إضافة هدف جديد" id="add-new-target-button" class="btn" style="margin-top: 10px;">
                <div id="sniper-targets-container" class="controls-container" style="margin-top:10px;"></div>

                <input type="button" value="حساب النتائج" id="sniper-calculate-button" class="btn" style="margin-top: 10px;">
            </div>
        `;

        targetContainer.prepend(mainDiv);

        setupAddTargetButton();
    }

    function setupAddTargetButton() {
        const addButton = document.getElementById('add-new-target-button');
        const targetsContainer = document.getElementById('sniper-targets-container');

        addButton.addEventListener('click', () => {
            const block = document.createElement('div');
            block.className = 'target-block';
            block.style.padding = '10px';
            block.style.marginBottom = '10px';
            block.style.border = '1px solid #c1a264';
            block.style.borderRadius = '8px';
            block.innerHTML = `
                <div class="control-group">
                    <label>إحداثيات الهدف:</label>
                    <input size="8" type="text" placeholder="xxx|yyy" required />
                </div>
                <div class="control-group">
                    <label>تاريخ الوصول:</label>
                    <input size="10" type="text" placeholder="dd.mm.yyyy" required />
                </div>
                <div class="control-group">
                    <label>وقت الوصول:</label>
                    <input size="8" type="text" placeholder="hh:mm:ss" required />
                </div>
                <div class="control-group">
                    <label>المجموعة:</label>
                    <select>
                        <option value="all">-- الجميع --</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>نسبة التسريع (%):</label>
                    <input type="number" value="0" min="0" step="0.1" />
                </div>
                <hr style="margin-top:10px;">
            `;
            targetsContainer.appendChild(block);
        });
    }

    // تنفيذ بناء الواجهة فور تحميل الصفحة
    window.addEventListener('load', () => {
        createSniperUI();
    });

})();
