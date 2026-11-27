// Получить лучшую доступную технику
function getBestTractor(state) {
  let best = null;
  if (state.rentedTractor) best = state.rentedTractor;
  if (state.tractors && state.tractors.length > 0) {
    const ownedBest = state.tractors.reduce((prev, current) => (prev.power > current.power) ? prev : current);
    if (!best || ownedBest.power > best.power) best = ownedBest;
  }
  return best;
}

function getBestCombine(state) {
  let best = null;
  if (state.rentedCombine) best = state.rentedCombine;
  if (state.combines && state.combines.length > 0) {
    const ownedBest = state.combines.reduce((prev, current) => (prev.power > current.power) ? prev : current);
    if (!best || ownedBest.power > best.power) best = ownedBest;
  }
  return best;
}

function calcDays(actionId, fieldHa, power) {
  return Math.ceil((fieldHa * ACTIONS[actionId].coef) / power);
}

function getAvailableActions(state) {
  const m = state.field.monthIndex;
  if (m < 0 || m >= MONTH_ACTIONS.length) return [];
  const bestTractor = getBestTractor(state);
  const bestCombine = getBestCombine(state);

  return MONTH_ACTIONS[m].map(id => {
    const a = ACTIONS[id];
    const machine = a.requires === "combine" ? bestCombine : bestTractor;
    if (!machine) return { ...a, available: false, reason: "Нужна техника" };
    
    const days = calcDays(id, state.fieldHa, machine.power);
    const alreadyDone = state.field.actionsDone.some(x => x.month === m && x.action === id);
    return {
      ...a, days,
      available: !alreadyDone && days <= state.field.daysLeft,
      reason: alreadyDone ? "Уже сделано" : days > state.field.daysLeft ? "Нет дней" : null
    };
  });
}

function doAction(state, actionId) {
  const m = state.field.monthIndex;
  const a = ACTIONS[actionId];
  const machine = a.requires === "combine" ? getBestCombine(state) : getBestTractor(state);
  
  if (!machine) return { error: "Нет техники" };
  const days = calcDays(actionId, state.fieldHa, machine.power);
  if (days > state.field.daysLeft) return { error: "Не хватает дней" };
  
  const fuelCost = days * machine.fuelPerDay;
  if (state.money < fuelCost) return { error: "Нет денег на топливо" };

  state.money -= fuelCost;
  state.field.daysLeft -= days;
  state.field.actionsDone.push({ month: m, action: actionId });
  saveGame(state);
  return { success: true };
}

function nextMonth(state) {
  const m = state.field.monthIndex;
  MONTH_ACTIONS[m].forEach(id => {
    const a = ACTIONS[id];
    const done = state.field.actionsDone.some(x => x.month === m && x.action === id);
    if (done && a.yieldBonus) state.field.yieldModifier += a.yieldBonus;
    if (!done && a.yieldPenalty) state.field.yieldModifier -= a.yieldPenalty;
  });

  state.field.monthIndex++;
  state.field.daysLeft = DAYS_PER_MONTH;
  
  // Пассивный доход
  if (state.myFactories) {
      state.myFactories.forEach(fId => {
          const fact = PLAYER_FACTORIES.find(f => f.id === fId);
          if (fact) state.money += fact.incomePerMonth;
      });
  }

  // Проценты по кредиту (2%)
  if (state.debt > 0) {
      state.debt += Math.floor(state.debt * 0.02);
  }

  saveGame(state);
  return state;
}

function calcYield(state) {
  const crop = CROPS[state.field.crop];
  const region = REGIONS.find(r => r.id === state.region);
  if (!crop || !region) return 0;
  let mod = Math.max(0.1, state.field.yieldModifier);
  return crop.baseYieldPerHa * mod * (1 + region.yieldBonus) * state.fieldHa;
}

function harvest(state) {
  const tons = calcYield(state);
  const cropId = state.field.crop;
  state.storage[cropId] = (state.storage[cropId] || 0) + tons;
  state.field = { crop: null, monthIndex: 0, daysLeft: DAYS_PER_MONTH, actionsDone: [], yieldModifier: 1.0, monthEvent: null };
  saveGame(state);
  return { tons };
}

function plantCrop(state, cropId) {
  const crop = CROPS[cropId];
  const seedCost = crop.seedCostPerHa * state.fieldHa;
  if (state.money < seedCost) return { error: "Не хватает на семена" };
  if (state.field.crop) return { error: "Поле уже засеяно" };

  state.money -= seedCost;
  state.field.crop = cropId;
  state.field.monthIndex = 0;
  state.field.daysLeft = DAYS_PER_MONTH;
  state.field.yieldModifier = 1.0;
  state.field.actionsDone = [];
  saveGame(state);
  return { success: true };
}
