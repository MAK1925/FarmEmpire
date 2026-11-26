function renderMain(state) {
  const crop = state.field.crop ? CROPS[state.field.crop] : null;
  const monthName = crop ? MONTH_NAMES[state.field.monthIndex] : "—";
  const stage = crop ? crop.stages[state.field.monthIndex] : null;
  const isLastMonth = crop && state.field.monthIndex === crop.growMonths - 1;
  const currentPrice = getMarketPrice('wheat');

  let actionsHtml = "";
  if (crop && !isLastMonth) {
    getAvailableActions(state).forEach(a => {
      actionsHtml += `
        <button onclick="handleAction('${a.id}')" ${a.available ? "" : "disabled"}>
          <span>${a.emoji} ${a.name}</span>
          <small>${a.days} дн. ${a.reason ? `(${a.reason})` : ""}</small>
        </button>`;
    });
  }

  document.getElementById("app").innerHTML = `
    <div class="header">
      <h2>🌾 ${state.farmName}</h2>
      <div style="text-align: right;">
        <div class="money">💰 ${state.money.toLocaleString("ru-RU")} ₽</div>
        ${state.debt > 0 ? `<div style="color: #ff6b6b; font-size: 12px; margin-top: 4px; font-weight: bold;">📉 Долг: ${state.debt.toLocaleString("ru-RU")} ₽</div>` : ""}
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong>📅 ${monthName}</strong>
        <span style="font-size: 12px; color: #888;">День ${DAYS_PER_MONTH - state.field.daysLeft + 1}/${DAYS_PER_MONTH}</span>
      </div>
      <div style="color: #d8a77d; font-size: 13px; margin-top: 5px;">📈 Рынок: ~${currentPrice.toLocaleString("ru-RU")} ₽/т</div>
      
      <hr style="border-color: #2e362e; margin: 10px 0;">
      
      ${crop ? `
        <div>${crop.emoji} ${crop.name} · ${state.fieldHa} га</div>
        <div style="color: #a0c0a0;">Стадия: <strong>${stage.name}</strong> (${stage.progress}%)</div>
        <div>Прогноз урожая: <strong>~${calcYield(state).toFixed(1)} т</strong></div>
      ` : `<div style="color: #666; text-align: center; padding: 10px 0;">Поле пустое</div>`}
    </div>

    ${state.field.monthEvent ? `
      <div class="event"><strong>${state.field.monthEvent.name}</strong><br>${state.field.monthEvent.desc}</div>
    ` : ""}

    ${actionsHtml ? `<div class="actions">${actionsHtml}</div>` : ""}

    ${!crop ? `<button class="btn-primary" onclick="handlePlant()" style="padding: 18px;">🌱 Посеять пшеницу</button>` : ""}

    ${crop ? `
      <button class="btn-primary" onclick="handleNextMonth()" style="padding: 18px; font-size: 16px;">
        ${isLastMonth ? "🌾 Убрать урожай" : "▶ Следующий месяц"}
      </button>
    ` : ""}

    <button onclick="handleSell()">💰 Продать на рынке (${(state.storage.wheat || 0).toFixed(1)} т)</button>

    <button class="btn-danger" onclick="handleReset()" style="margin-top: 20px;">🔄 Сбросить игру</button>
    
    ${renderNav('farm')}
  `;
}

function renderNav(activeTab) {
  return `
    <div class="bottom-nav">
      <button class="${activeTab === 'farm' ? 'active' : ''}" onclick="renderMain(loadGame())">
        <span class="icon">🌾</span> Ферма
      </button>
      <button class="${activeTab === 'factories' ? 'active' : ''}" onclick="handleContracts()">
        <span class="icon">🏭</span> Заводы
      </button>
      <button class="${activeTab === 'tech' ? 'active' : ''}" onclick="renderTechShop(loadGame())">
        <span class="icon">🚜</span> Техника
      </button>
      <button class="${activeTab === 'bank' ? 'active' : ''}" onclick="handleBank()">
        <span class="icon">🏦</span> Банк
      </button>
    </div>
  `;
}

function handleAction(id) {
  const state = loadGame();
  const res = doAction(state, id);
  if (res.error) return alert(res.error);
  renderMain(loadGame());
}

function handleNextMonth() {
  let state = loadGame();
  const crop = CROPS[state.field.crop];
  const isLast = state.field.monthIndex === crop.growMonths - 1;

  if (isLast) {
    const r = harvest(state);
    alert(`🌾 Собрано ${r.tons.toFixed(1)} т пшеницы`);
  } else {
    nextMonth(state);
  }
  renderMain(loadGame());
}

function handlePlant() {
  const state = loadGame();
  const res = plantWheat(state);
  if (res.error) return alert(res.error);
  renderMain(loadGame());
}

function handleSell() {
  const state = loadGame();
  const tons = state.storage.wheat || 0;
  if (tons <= 0) return alert("Нечего продавать");
  
  const currentPrice = getMarketPrice('wheat');
  if (confirm(`Продать ${tons.toFixed(1)} т по рыночной цене ${currentPrice.toLocaleString("ru-RU")} ₽/т?`)) {
    const r = sellWheat(state, tons, currentPrice);
    alert(`💰 Продано ${r.tons.toFixed(1)} т за ${r.income.toLocaleString("ru-RU")} ₽`);
    renderMain(loadGame());
  }
}

function handleReset() {
  if (confirm("Сбросить игру? Прогресс потеряется.")) resetGame();
}

function handleContracts() {
  const state = loadGame();
  const tons = state.storage.wheat || 0;
  const currentPrice = getMarketPrice('wheat');
  
  let html = `
    <div class="header"><h2>🏭 Заводы</h2></div>
    <div class="card">
      <div style="display:flex; justify-content:space-between;">
        <span>На складе:</span> <strong>${tons.toFixed(1)} т</strong>
      </div>
      <div style="display:flex; justify-content:space-between; margin-top:5px;">
        <span>Цена рынка:</span> <strong style="color:#d8a77d;">~${currentPrice.toLocaleString("ru-RU")} ₽/т</strong>
      </div>
    </div>
  `;

  FACTORIES.forEach(f => {
    const canSign = tons >= f.minTons;
    const offerPrice = Math.floor(currentPrice * 1.1); 
    
    html += `
      <div class="card" style="${canSign ? '' : 'opacity: 0.5;'}">
        <div><strong>${f.emoji} ${f.name}</strong></div>
        <div style="font-size: 13px; color: #888;">Мин. партия: ${f.minTons} т</div>
        <div>Предлагает: <strong style="color: #7dd87d;">${offerPrice.toLocaleString("ru-RU")} ₽/т</strong></div>
        <button ${canSign ? '' : 'disabled'} onclick="handleSignContract('${f.id}', ${offerPrice})" style="margin-top: 10px;">
          ${canSign ? 'Подписать контракт' : `Нужно ${f.minTons} т`}
        </button>
      </div>
    `;
  });

  html += renderNav('factories');
  document.getElementById("app").innerHTML = html;
}

function handleSignContract(factoryId, offerPrice) {
  const state = loadGame();
  const factory = FACTORIES.find(f => f.id === factoryId);
  const tons = state.storage.wheat;
  
  if (confirm(`Продать ${tons.toFixed(1)} т заводу "${factory.name}" по ${offerPrice.toLocaleString("ru-RU")} ₽/т?`)) {
    const income = tons * offerPrice;
    state.storage.wheat -= tons;
    state.money += income;
    saveGame(state);
    alert(`✅ Контракт выполнен! Получено ${income.toLocaleString("ru-RU")} ₽`);
    handleContracts(); // Остаемся на экране заводов
  }
}

function handleBank() {
  const state = loadGame();
  let html = `<div class="header"><h2>🏦 Банк</h2></div>`;
  
  html += `
    <div class="card">
      <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
        <span>На счету:</span> <strong style="color: #7dd87d;">${state.money.toLocaleString("ru-RU")} ₽</strong>
      </div>
      <div style="display: flex; justify-content: space-between;">
        <span>Твой долг:</span> <strong style="color: #ff6b6b;">${(state.debt || 0).toLocaleString("ru-RU")} ₽</strong>
      </div>
      <div style="font-size: 12px; margin-top: 15px; color: #888; text-align: center;">
        Проценты: 2% в месяц (долг растет, если не платить).
      </div>
    </div>
  `;

  if (state.debt > 0) {
    html += `
      <div class="card">
        <h3>Погашение долга</h3>
        <button onclick="handlePayDebt(10000)">Оплатить 10 000 ₽</button>
        <button onclick="handlePayDebt(50000)">Оплатить 50 000 ₽</button>
        <button class="btn-primary" onclick="handlePayDebt(state.debt)">Оплатить всё</button>
      </div>
    `;
  } else {
    html += `<div class="card" style="text-align:center; color:#7dd87d; font-weight: bold; padding: 20px;">🎉 У тебя нет долгов!</div>`;
  }

  html += `
    <div class="card">
      <h3>Взять новый кредит</h3>
      <button onclick="alert('Кредиты временно недоступны. Скоро добавим!')">Взять 100 000 ₽</button>
    </div>
    ${renderNav('bank')}
  `;

  document.getElementById("app").innerHTML = html;
}

function handlePayDebt(amount) {
  const state = loadGame();
  if (state.money < amount) return alert("Недостаточно денег на счету!");
  
  if (amount > state.debt) amount = state.debt;
  
  state.money -= amount;
  state.debt -= amount;
  saveGame(state);
  
  alert(`✅ Ты погасил ${amount.toLocaleString("ru-RU")} ₽ долга!`);
  handleBank(); 
}

function renderTechShop(state) {
  let html = `
    <div class="header"><h2>🚜 Техника</h2></div>
    <div class="card" style="display: flex; justify-content: space-between;">
      <span>Баланс:</span> <strong style="color: #7dd87d;">${state.money.toLocaleString("ru-RU")} ₽</strong>
    </div>
    
    <h3 style="margin: 15px 0 10px 5px; color: #a0c0a0;">Текущий трактор: ${state.tractor.name}</h3>
  `;

  TRACTORS.forEach(t => {
    const isCurrent = state.tractor.id === t.id;
    html += `
      <div class="card" style="${isCurrent ? 'border-color: #7dd87d;' : ''}">
        <div style="display: flex; justify-content: space-between;">
          <strong>${t.name}</strong>
          ${isCurrent ? '<span style="color:#7dd87d; font-size:12px;">В работе</span>' : ''}
        </div>
        <div style="font-size: 13px; color: #888; margin: 5px 0;">Мощность: ${t.power} л.с. · Расход: ${t.fuelPerDay} ₽/день</div>
        <div>Цена: <strong>${t.price.toLocaleString("ru-RU")} ₽</strong></div>
        <button ${isCurrent || state.money < t.price ? 'disabled' : ''} onclick="buyTractor('${t.id}')" style="margin-top: 10px;">
          ${isCurrent ? 'Уже куплен' : (state.money < t.price ? 'Не хватает денег' : 'Купить')}
        </button>
      </div>
    `;
  });

  html += renderNav('tech');
  document.getElementById("app").innerHTML = html;
}

function buyTractor(tractorId) {
  const state = loadGame();
  const tractor = TRACTORS.find(t => t.id === tractorId);
  
  if (state.money < tractor.price) return alert("Недостаточно денег!");
  
  state.money -= tractor.price;
  state.tractor = tractor;
  saveGame(state);
  
  alert(`✅ Ты купил ${tractor.name}!`);
  renderTechShop(state);
}
