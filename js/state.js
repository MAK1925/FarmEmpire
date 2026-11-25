const SAVE_KEY = "farm_game_save_v1";

function createInitialState() {
  return {
    registered: false, form: null, region: null, fieldHa: 0, farmName: "",
    tractor: null, combine: null, money: 0,
    field: {
      crop: null, sownMonth: 0, monthIndex: 0, daysLeft: DAYS_PER_MONTH,
      actionsDone: [], yieldModifier: 1.0, monthEvent: null
    },
    storage: { wheat: 0 }, log: []
  };
}

function saveGame(state) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function loadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function resetGame() {
  localStorage.removeItem(SAVE_KEY);
  location.reload();
}
