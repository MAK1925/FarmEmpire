const SAVE_KEY = "farm_game_v3";

function createInitialState() {
  return {
    registered: false, form: null, region: null, fieldHa: 0, farmName: "",
    money: 0, debt: 0,
    tractors: [], // Массив купленных тракторов
    combines: [], // Массив купленных комбайнов
    rentedTractor: null, // Арендованный трактор
    rentedCombine: null, // Арендованный комбайн
    field: { crop: null, monthIndex: 0, daysLeft: DAYS_PER_MONTH, actionsDone: [], yieldModifier: 1.0, monthEvent: null },
    storage: { wheat: 0, sunflower: 0, corn: 0, soy: 0, ash: 0, sorghum: 0, flour: 0, oil: 0 },
    myFactories: []
  };
}
function saveGame(state) { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); }
function loadGame() { const r = localStorage.getItem(SAVE_KEY); return r ? JSON.parse(r) : null; }
function resetGame() { localStorage.removeItem(SAVE_KEY); location.reload(); }
