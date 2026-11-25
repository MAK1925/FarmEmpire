function calcDays(actionId, fieldHa, power) {
  const a = ACTIONS[actionId];
  return Math.ceil((fieldHa * a.coef) / power);
}

function getAvailableActions(state) {
  const m = state.field.monthIndex;
  if (m < 0 || m >= MONTH_ACTIONS.length) return [];

  return MONTH_ACTIONS[m].map(id => {
    const a = ACTIONS[id];
    const machine = a.requires === "combine" ? state.combine : state.tractor;
    if (!machine) return { ...a, available: false, reason: "Нужна техника" };

    const days = calcDays(id, state.fieldHa, machine.power);
    const alreadyDone = state.field.actionsDone.some(
      x => x.month === m && x.action === id
    );

    return {
      ...a, days,
      available: !alreadyDone && days <= state.field.daysLeft,
      reason: alreadyDone ? "Уже сделано"
            : days > state.field.daysLeft ? "Не хватает дней" : null
    };
  });
}

function doAction(state, actionId) {
  const m = state.field.monthIndex;
  const a = ACTIONS[actionId];
  const machine = a.requires === "combine" ? state.combine : state.tractor;

  if (!machine) return { error: "Нет техники" };
  if (state.field.actionsDone.some(x => x.month === m && x.action === actionId))
    return { error: "Уже сделано в этом месяце" };

  const days = calcDays(actionId, state.fieldHa, machine.power);
  if (days > state.field.daysLeft) return { error: "Не хватает дней в месяце" };

  const fuelCost = days * machine.fuelPerDay;
  if (state.money < fuelCost) return { error: "Не хватает денег на топливо" };

  state.money -= fuelCost;
  state.field.daysLeft -= days;
  state.field.actionsDone.push({ month: m, action: actionId });

  saveGame(state);
  return { success: true, days, fuelCost };
}

function nextMonth(state) {
  const m = state.field.monthIndex;
  const allowed = MONTH_ACTIONS[m] || [];

  allowed.forEach(id => {
    const a = ACTIONS[id];
    const done = state.field.actionsDone.some(x => x.month === m && x.action === id);
    if (done && a.yieldBonus) state.field.yieldModifier += a.yieldBonus;
    if (!done && a.yieldPenalty) state.field.yieldModifier -= a.yieldPenalty;
  });

  state.field.monthIndex++;
  state.field.daysLeft = DAYS_PER_MONTH;

  state.field.monthEvent = null;
  if (state.field.monthIndex < CROPS.wheat.growMonths - 1) {
    const ev = rollEvent();
    if (ev) {
      state.field.monthEvent = ev;
      state.field.yieldModifier += ev.yieldMod || 0;
      state.field.daysLeft = Math.max(1, state.field.daysLeft + (ev.dayMod || 0));
    }
  }

  saveGame(state);
  return state;
}

function rollEvent() {
  const r = Math.random();
  let acc = 0;
  for (const ev of EVENTS) {
    acc += ev.chance;
    if (r <= acc) return ev;
  }
  return null;
}

function calcYield(state) {
  const crop = CROPS[state.field.crop];
  const region = REGIONS.find(r => r.id === state.region);
  if (!crop || !region) return 0;

  let mod = state.field.yieldModifier;
  if (mod < 0.1) mod = 0.1;

  const yieldPerHa = crop.baseYieldPerHa * mod * (1 + region.yieldBonus);
  return Math.max(0, yieldPerHa * state.fieldHa);
}

function harvest(state) {
  const yieldTons = calcYield(state);
  state.storage.wheat = (state.storage.wheat || 0) + yieldTons;

  state.field = {
    crop: null, sownMonth: 0, monthIndex: 0, daysLeft: DAYS_PER_MONTH,
    actionsDone: [], yieldModifier: 1.0, monthEvent: null
  };

  saveGame(state);
  return { tons: yieldTons };
}

function sellWheat(state, tons) {
  const crop = CROPS.wheat;
  tons = Math.min(tons, state.storage.wheat || 0);
  if (tons <= 0) return { error: "Нет зерна" };

  const income = tons * crop.basePrice;
  state.storage.wheat -= tons;
  state.money += income;
  saveGame(state);
  return { income, tons };
}

function plantWheat(state) {
  const crop = CROPS.wheat;
  const seedCost = crop.seedCostPerHa * state.fieldHa;
  if (state.money < seedCost) return { error: "Не хватает на семена" };
  if (state.field.crop) return { error: "Поле уже засеяно" };

  state.money -= seedCost;
  state.field.crop = "wheat";
  state.field.monthIndex = 0;
  state.field.daysLeft = DAYS_PER_MONTH;
  state.field.yieldModifier = 1.0;
  state.field.actionsDone = [];
  saveGame(state);
  return { success: true, seedCost };
}
