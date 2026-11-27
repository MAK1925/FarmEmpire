function renderMain(state) {
  const cropId = state.field.crop;
  const crop = cropId ? CROPS[cropId] : null;
  const monthName = crop ? MONTH_NAMES[state.field.monthIndex % 12] : "—";
  const isLastMonth = crop && state.field.monthIndex === crop.growMonths - 1;
  
  // ВИЗУАЛИЗАЦИЯ ПОЛЯ
  let fieldStyle = "height: 130px; border-radius: 16px; border: 4px solid #2b2b2b; display: flex; flex-direction: column; align-items: center; justify-content: center; margin-bottom: 15px; box-shadow: inset 0 0 30px rgba(0,0,0,0.5), 0 6px 0 #2b2b2b; transition: all 0.5s; position: relative; overflow: hidden;";
  let fieldContent = "";

  if (!crop) {
    fieldStyle += "background: repeating-linear-gradient(45deg, #6d4824, #6d4824 10px, #5c3c1e 10px, #5c3c1e 20px); color: #d1b89b;";
    fieldContent = `<span style="font-size: 30px; margin-bottom: 5px;">🟫</span><span style="font-weight: 900; text-transform: uppercase;">Пашня (Пусто)</span>`;
  } else if (isLastMonth) {
    fieldStyle += "background: repeating-linear-gradient(45deg, #d4b03c, #d4b03c 10px, #c29f30 10px, #c29f30 20px); color: #4a3600;";
    fieldContent = `<span style="font-size: 40px; margin-bottom: 5px;">${crop.emoji}</span><span style="font-weight: 900; text-transform: uppercase;">Урожай созрел!</span>`;
  } else {
    const progress = Math.min(100, Math.floor((state.field.monthIndex / crop.growMonths) * 100));
    fieldStyle += "background: linear-gradient(to bottom, #6bb56b, #468a46); color: #fff; text-shadow: 0 2px 4px rgba(0,0,0,0.5);";
    fieldContent = `
      <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px; font-size: 24px; margin-bottom: 5px;">
        <span>🌱</span><span>🌿</span><span>🌱</span><span>🌿</span><span>🌱</span>
      </div>
      <span style="font-weight: 900; text-transform: uppercase;">${crop.name} (${progress}%)</span>
    `;
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

    <div style="${fieldStyle}">${fieldContent}</div>

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
function signContract(id) { const state = loadGame(); const price = getMarketPrice('wheat') * 1.1; state.money += (state.storage.wheat||0) * price; state.storage.wheat = 0; saveGame(state); handleContracts(); }
function buyFactory(id) { const state = loadGame(); const f = PLAYER_FACTORIES.find(x=>x.id===id); state.money -= f.price; state.myFactories.push(f.id); saveGame(state); handleContracts(); }

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
    <div class="card"><div>Баланс: ${state.money.toLocaleString()} ₽</div><div>Долг: ${state.debt.toLocaleString()} ₽</div></div>
    <div class="card">
      <h3>Кредит</h3>
      <button onclick="takeLoan(100000)">Взять 100 000 ₽ (под 2%/мес)</button>
    </div>
    ${state.debt > 0 ? `<div class="card"><h3>Погашение</h3><button onclick="payDebt(50000)">Оплатить 50 000 ₽</button></div>` : ''}
    ${renderNav('bank')}`;
}
function takeLoan(amount) { const state = loadGame(); state.money += amount; state.debt += amount; saveGame(state); handleBank(); alert(`Взят кредит ${amount} ₽`); }
function payDebt(amount) { const state = loadGame(); if(state.money < amount) return alert("Нет денег!"); if(amount > state.debt) amount = state.debt; state.money -= amount; state.debt -= amount; saveGame(state); handleBank(); }

function renderTechShop(state) {
  let html = `<div class="header"><h2>🚜 Техника</h2></div>
  <div class="card">Баланс: <strong>${state.money.toLocaleString()} ₽</strong></div>
  
  <div class="card">
    <h3>Мой парк техники</h3>
    ${state.tractors.map(t => `<div>✅ ${t.name}</div>`).join('')}
    ${state.combines.map(c => `<div>✅ ${c.name}</div>`).join('')}
    ${state.rentedTractor ? `<div>⏳ Аренда: ${state.rentedTractor.name}</div>` : ''}
  </div>

  <h3 style="margin: 15px 0 10px 5px;">Купить трактор</h3>`;
  
  TRACTORS.forEach(t => {
    const owned = state.tractors.some(x => x.id === t.id);
    html += `<div class="card" style="${owned ? 'border-color:#7dd87d' : ''}">
      <strong>${t.name}</strong> <small style="color:#888">(Мощь: ${t.power})</small>
      <div>Цена: ${t.price.toLocaleString()} ₽</div>
      <button ${owned||state.money<t.price?'disabled':''} onclick="buyTractor('${t.id}')">${owned ? 'Куплен' : 'Купить'}</button>
    </div>`;
  });

  html += `<h3 style="margin: 15px 0 10px 5px;">Аренда (на 1 месяц)</h3>
    <div class="card">
      <strong>Аренда Трактора-200</strong>
      <div>Цена: 50 000 ₽/мес</div>
      <button onclick="rentTractor()" ${state.rentedTractor?'disabled':''}>Арендовать</button>
    </div>
    <div class="card">
      <strong>Аренда Комбайна-250</strong>
      <div>Цена: 80 000 ₽/мес</div>
      <button onclick="rentCombine()" ${state.rentedCombine?'disabled':''}>Арендовать</button>
    </div>
  `;

  html += renderNav('tech'); document.getElementById("app").innerHTML = html;
}

function buyTractor(id) {
  const state = loadGame(); const t = TRACTORS.find(x=>x.id===id);
  state.money -= t.price; state.tractors.push(t); saveGame(state); renderTechShop(state); alert(`Куплен ${t.name}`);
}

function rentTractor() {
  const state = loadGame(); const cost = 50000;
  if(state.money < cost) return alert("Нет денег!");
  state.money -= cost; state.rentedTractor = { name: "Аренда-200", power: 200, fuelPerDay: 1000 };
  saveGame(state); renderTechShop(state);
}

function rentCombine() {
  const state = loadGame(); const cost = 80000;
  if(state.money < cost) return alert("Нет денег!");
  state.money -= cost; state.rentedCombine = { name: "Аренда-Комбайн", power: 250, fuelPerDay: 1200 };
  saveGame(state); renderTechShop(state);
}
