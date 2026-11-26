function renderMain(state) {
  const cropId = state.field.crop;
  const crop = cropId ? CROPS[cropId] : null;
  const monthName = crop ? MONTH_NAMES[state.field.monthIndex % 12] : "—";
  const isLastMonth = crop && state.field.monthIndex === crop.growMonths - 1;
  
  let fieldBg = "#8B5A2B"; // Пашня
  let fieldText = "🟫 Пашня (Пусто)";
  let fieldColor = "#d1b89b";
  
  if (crop) {
    const progress = Math.min(100, Math.floor((state.field.monthIndex / crop.growMonths) * 100));
    if (isLastMonth) {
      fieldBg = "#e6c84c"; fieldText = `${crop.emoji} Урожай созрел!`; fieldColor = "#5a4500";
    } else {
      fieldBg = "#4caf50"; fieldText = `${crop.emoji} ${crop.name} (${progress}%)`; fieldColor = "#1b3a1b";
    }
  }

  let actionsHtml = "";
  if (crop && !isLastMonth) {
    getAvailableActions(state).forEach(a => {
      actionsHtml += `<button onclick="handleAction('${a.id}')" ${a.available ? "" : "disabled"}><span>${a.emoji} ${a.name}</span><small>${a.days} дн.</small></button>`;
    });
  }

  document.getElementById("app").innerHTML = `
    <div class="header">
      <h2>🌾 ${state.farmName}</h2>
      <div style="text-align: right;">
        <div class="money">💰 ${state.money.toLocaleString("ru-RU")} ₽</div>
        ${state.debt > 0 ? `<div style="color: #ff6b6b; font-size: 12px;">📉 Долг: ${state.debt.toLocaleString("ru-RU")} ₽</div>` : ""}
      </div>
    </div>

    <div style="height: 130px; border-radius: 16px; border: 4px solid #2b2b2b; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; font-size: 16px; font-weight: 900; text-transform: uppercase; background: ${fieldBg}; color: ${fieldColor}; box-shadow: inset 0 0 20px rgba(0,0,0,0.3); transition: 0.5s;">
      ${fieldText}
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>📅 ${monthName}</strong>
        <span style="font-size: 12px; color: #888;">День ${DAYS_PER_MONTH - state.field.daysLeft + 1}/${DAYS_PER_MONTH}</span>
      </div>
      <hr style="border-color: #2e362e; margin: 10px 0;">
      ${crop ? `
        <div>${crop.emoji} ${crop.name} · ${state.fieldHa} га</div>
        <div>Прогноз урожая: <strong>~${calcYield(state).toFixed(1)} т</strong></div>
      ` : `<div style="color: #666; text-align: center;">Выберите культуру для посева</div>`}
    </div>

    ${actionsHtml ? `<div class="actions">${actionsHtml}</div>` : ""}

    ${!crop ? `
      <div class="card">
        <h3>Что посадим?</h3>
        ${Object.values(CROPS).filter(c => !c.isProduct).map(c => `
          <button onclick="handlePlant('${c.id}')" style="padding: 12px; display: flex; justify-content: space-between;">
            <span style="font-size: 20px;">${c.emoji}</span>
            <span style="flex-grow: 1; text-align: left; margin-left: 10px;">${c.name}</span>
            <small style="margin:0; color:#d8a77d;">${c.seedCostPerHa.toLocaleString()} ₽/га</small>
          </button>
        `).join('')}
      </div>
    ` : ""}

    ${crop ? `<button class="btn-primary" onclick="handleNextMonth()">${isLastMonth ? "🌾 Убрать урожай" : "▶ Следующий месяц"}</button>` : ""}

    <button class="btn-danger" onclick="handleReset()" style="margin-top: 20px;">🔄 Сбросить игру</button>
    ${renderNav('farm')}
  `;
}

function renderNav(active) {
  return `
    <div class="bottom-nav">
      <button class="${active === 'farm' ? 'active' : ''}" onclick="renderMain(loadGame())"><span class="icon">🌾</span>Ферма</button>
      <button class="${active === 'factories' ? 'active' : ''}" onclick="handleContracts()"><span class="icon">🏭</span>Заводы</button>
      <button class="${active === 'exchange' ? 'active' : ''}" onclick="renderExchange(loadGame())"><span class="icon">📈</span>Биржа</button>
      <button class="${active === 'tech' ? 'active' : ''}" onclick="renderTechShop(loadGame())"><span class="icon">🚜</span>Техника</button>
      <button class="${active === 'bank' ? 'active' : ''}" onclick="handleBank()"><span class="icon">🏦</span>Банк</button>
    </div>
  `;
}

function handleAction(id) { const state = loadGame(); const res = doAction(state, id); if (res.error) return alert(res.error); renderMain(loadGame()); }
function handleNextMonth() { let state = loadGame(); const crop = CROPS[state.field.crop]; if (state.field.monthIndex === crop.growMonths - 1) { const r = harvest(state); alert(`🌾 Собрано ${r.tons.toFixed(1)} т`); } else { nextMonth(state); } renderMain(loadGame()); }
function handlePlant(cropId) { const state = loadGame(); const res = plantCrop(state, cropId); if (res.error) return alert(res.error); renderMain(loadGame()); }
function handleReset() { if (confirm("Сбросить игру?")) resetGame(); }

function handleContracts() {
  const state = loadGame();
  let html = `<div class="header"><h2>🏭 Заводы</h2></div>
    <div class="card">Склад (Пшеница): <strong>${(state.storage.wheat||0).toFixed(1)} т</strong></div>
    <h3 style="margin: 15px 0 10px 5px;">Контракты</h3>`;
  
  FACTORIES.forEach(f => {
    const can = (state.storage.wheat||0) >= f.minTons;
    html += `<div class="card" style="${can?'':'opacity:0.5'}"><strong>${f.emoji} ${f.name}</strong><div>Мин: ${f.minTons} т</div><button ${can?'':'disabled'} onclick="signContract('${f.id}')">Продать</button></div>`;
  });

  html += `<h3 style="margin: 15px 0 10px 5px;">Мои заводы</h3>`;
  PLAYER_FACTORIES.forEach(f => {
    const owned = state.myFactories.includes(f.id);
    html += `<div class="card"><strong>${f.emoji} ${f.name}</strong><div style="color:#7dd87d">+${f.incomePerMonth} ₽/мес</div><button ${owned||state.money<f.price?'disabled':''} onclick="buyFactory('${f.id}')">${owned?'Куплен':'Купить'}</button></div>`;
  });
  
  html += renderNav('factories'); document.getElementById("app").innerHTML = html;
}

function signContract(id) {
  const state = loadGame(); const price = getMarketPrice('wheat') * 1.1;
  state.money += (state.storage.wheat||0) * price; state.storage.wheat = 0; saveGame(state); handleContracts();
}
function buyFactory(id) {
  const state = loadGame(); const f = PLAYER_FACTORIES.find(x=>x.id===id);
  state.money -= f.price; state.myFactories.push(f.id); saveGame(state); handleContracts();
}

function renderExchange(state) {
  let html = `<div class="header"><h2>📈 Биржа</h2></div><div class="card">`;
  Object.values(CROPS).forEach(c => {
    html += `<button onclick="renderCropDetails('${c.id}')" style="display:flex; justify-content:space-between; padding:12px;"><span>${c.emoji} ${c.name}</span><span style="color:#7dd87d">${getMarketPrice(c.id)} ₽/т</span></button>`;
  });
  html += `</div>${renderNav('exchange')}`; document.getElementById("app").innerHTML = html;
}

function renderCropDetails(id) {
  const c = CROPS[id];
  let html = `<div class="header"><h2>${c.emoji} ${c.name}</h2><button onclick="renderExchange(loadGame())" style="width:auto; padding:5px;">←</button></div>
  <div class="card"><div>Цена: <strong>${getMarketPrice(id)} ₽/т</strong></div>`;
  if (!c.isProduct) html += `<hr><div>Сажать: ${c.plantMonths.join(', ')}</div><div>Убирать: ${c.harvestMonths.join(', ')}</div>`;
  html += `</div>${renderNav('exchange')}`; document.getElementById("app").innerHTML = html;
}

function handleBank() {
  const state = loadGame();
  document.getElementById("app").innerHTML = `<div class="header"><h2>🏦 Банк</h2></div>
    <div class="card"><div>Баланс: ${state.money} ₽</div><div>Долг: ${state.debt} ₽</div></div>
    ${renderNav('bank')}`;
}

function renderTechShop(state) {
  let html = `<div class="header"><h2>🚜 Техника</h2></div><div class="card">Баланс: ${state.money} ₽</div>`;
  TRACTORS.forEach(t => {
    html += `<div class="card"><strong>${t.name}</strong><div>${t.price} ₽</div><button ${state.money<t.price?'disabled':''} onclick="buyTractor('${t.id}')">Купить</button></div>`;
  });
  html += renderNav('tech'); document.getElementById("app").innerHTML = html;
}
function buyTractor(id) { const state = loadGame(); const t = TRACTORS.find(x=>x.id===id); state.money -= t.price; state.tractor = t; saveGame(state); renderTechShop(state); }
