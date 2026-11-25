function renderMain(state) {
  const crop = state.field.crop ? CROPS[state.field.crop] : null;
  const monthName = crop ? MONTH_NAMES[state.field.monthIndex] : "—";
  const stage = crop ? crop.stages[state.field.monthIndex] : null;
  const isLastMonth = crop && state.field.monthIndex === crop.growMonths - 1;

  let actionsHtml = "";
  if (crop && !isLastMonth) {
    getAvailableActions(state).forEach(a => {
      actionsHtml += `
        <button onclick="handleAction('${a.id}')" ${a.available ? "" : "disabled"}>
          ${a.emoji} ${a.name} — ${a.days}д
          ${a.reason ? `<small>${a.reason}</small>` : ""}
        </button>`;
    });
  }

  document.getElementById("app").innerHTML = `
    <div class="header">
      <h2>🌾 ${state.farmName}</h2>
      <div class="money">💰 ${state.money.toLocaleString("ru-RU")} ₽</div>
    </div>

    <div class="card">
      <div><strong>📅 ${monthName}</strong> · День ${DAYS_PER_MONTH - state.field.daysLeft + 1}/${DAYS_PER_MONTH}</div>
      ${crop ? `
        <div>${crop.emoji} ${crop.name} · ${state.fieldHa} га</div>
        <div>Стадия: <strong>${stage.name}</strong> (${stage.progress}%)</div>
        <div>Прогноз урожая: <strong>~${calcYield(state).toFixed(1)} т</strong></div>
      ` : `<div>🟫 Поле пустое</div>`}
    </div>

    ${state.field.monthEvent ? `
      <div class="event">${state.field.monthEvent.name} — ${state.field.monthEvent.desc}</div>
    ` : ""}

    ${actionsHtml ? `<div class="actions">${actionsHtml}</div>` : ""}

    ${!crop ? `<button class="btn-primary" onclick="handlePlant()">🌱 Посеять пшеницу</button>` : ""}

    ${crop ? `
      <button class="btn-primary" onclick="handleNextMonth()">
        ${isLastMonth ? "🌾 Убрать урожай" : "▶ Следующий месяц"}
      </button>
    ` : ""}

    <button onclick="handleSell()">💰 Продать зерно (${(state.storage.wheat || 0).toFixed(1)} т)</button>
    <button class="btn-danger" onclick="handleReset()">🔄 Сбросить игру</button>
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
  const r = sellWheat(state, tons);
  alert(`💰 Продано ${r.tons.toFixed(1)} т за ${r.income.toLocaleString("ru-RU")} ₽`);
  renderMain(loadGame());
}

function handleReset() {
  if (confirm("Сбросить игру? Прогресс потеряется.")) resetGame();
}
