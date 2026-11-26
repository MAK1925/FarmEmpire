// ============ КУЛЬТУРЫ ============
const CROPS = {
  wheat: {
    id: "wheat",
    name: "Пшеница",
    emoji: "🌾",
    growMonths: 8,
    baseYieldPerHa: 3,
    seedCostPerHa: 2000,
    basePrice: 12000,
    stages: [
      { name: "Посев",          progress: 0 },
      { name: "Всходы",         progress: 12 },
      { name: "Кущение",        progress: 25 },
      { name: "Трубкование",    progress: 40 },
      { name: "Колошение",      progress: 55 },
      { name: "Цветение",       progress: 70 },
      { name: "Созревание",     progress: 85 },
      { name: "Готов к уборке", progress: 100 }
    ]
  }
};

// ============ ДЕЙСТВИЯ ============
const ACTIONS = {
  plow:      { id: "plow",      name: "Вспашка",       emoji: "🚜", coef: 30, requires: "tractor", yieldBonus: 0,    yieldPenalty: 0 },
  sow:       { id: "sow",       name: "Посев",         emoji: "🌱", coef: 20, requires: "tractor", yieldBonus: 0,    yieldPenalty: 0 },
  water:     { id: "water",     name: "Полив",         emoji: "💧", coef: 15, requires: "tractor", yieldBonus: 0.10, yieldPenalty: 0.10 },
  fertilize: { id: "fertilize", name: "Удобрение",     emoji: "🧪", coef: 25, requires: "tractor", yieldBonus: 0.20, yieldPenalty: 0.10 },
  weeds:     { id: "weeds",     name: "Прополка",      emoji: "🌿", coef: 20, requires: "tractor", yieldBonus: 0.15, yieldPenalty: 0.20 },
  pest:      { id: "pest",      name: "От вредителей", emoji: "🐛", coef: 35, requires: "tractor", yieldBonus: 0.10, yieldPenalty: 0.25 },
  harvest:   { id: "harvest",   name: "Уборка",        emoji: "🌾", coef: 40, requires: "combine", yieldBonus: 0,    yieldPenalty: 0 }
};

const MONTH_ACTIONS = [
  ["plow", "sow"],
  ["water", "fertilize"],
  ["weeds", "water"],
  ["fertilize", "pest"],
  ["water", "weeds"],
  ["pest", "fertilize"],
  ["water"],
  ["harvest"]
];

// ============ ТЕХНИКА ============
const TRACTORS = [
  { id: "t80",  name: "Силач-80",  power: 80,  price: 400000,  fuelPerDay: 500 },
  { id: "t120", name: "Силач-120", power: 120, price: 800000,  fuelPerDay: 700 },
  { id: "t200", name: "Агро-200",  power: 200, price: 1600000, fuelPerDay: 1000 }
];

const COMBINES = [
  { id: "c150", name: "Комбайн-150", power: 150, price: 1200000, fuelPerDay: 800 },
  { id: "c250", name: "Комбайн-250", power: 250, price: 2200000, fuelPerDay: 1200 }
];

// ============ РЕГИОНЫ ============
const REGIONS = [
  { id: "south",   name: "Юг",     landPricePerHa: 50000, yieldBonus: 0.20 },
  { id: "center",  name: "Центр",  landPricePerHa: 70000, yieldBonus: 0.0 },
  { id: "siberia", name: "Сибирь", landPricePerHa: 40000, yieldBonus: -0.15 }
];

// ============ ФОРМЫ ============
const BUSINESS_FORMS = [
  { id: "ip",  name: "ИП",       startMoney: 150000, taxRate: 0.06, maxFields: 1 },
  { id: "kfh", name: "КФХ",      startMoney: 100000, taxRate: 0.04, maxFields: 3 },
  { id: "ooo", name: "ООО (АПК)", startMoney: 300000, taxRate: 0.20, maxFields: 10 }
];

// ============ СОБЫТИЯ ============
const EVENTS = [
  { id: "rain",     name: "🌧 Дожди",                chance: 0.20, yieldMod: 0.0,   dayMod: -3, desc: "Полив не нужен" },
  { id: "drought",  name: "☀️ Засуха",               chance: 0.15, yieldMod: -0.15, dayMod: 0,  desc: "Урожай −15%" },
  { id: "pests",    name: "🐛 Нашествие вредителей", chance: 0.15, yieldMod: -0.10, dayMod: 0,  desc: "Нужна обработка" },
  { id: "break",    name: "⚡ Поломка трактора",      chance: 0.10, yieldMod: 0.0,   dayMod: 3,  desc: "Ремонт +3 дня" },
  { id: "priceUp",  name: "📈 Скачок цен",           chance: 0.10, yieldMod: 0.0,   dayMod: 0,  desc: "Цена +10%" },
  { id: "goodYear", name: "🌾 Отличный год",         chance: 0.05, yieldMod: 0.20,  dayMod: 0,  desc: "Урожай +20%" }
];

// ============ КОНСТАНТЫ ============
const DAYS_PER_MONTH = 30;
const MONTH_NAMES = ["Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь"];
// ============ ЗАВОДЫ ============
const FACTORIES = [
  { id: "mini_mill", name: "Мини-мельница", minTons: 5, pricePerTon: 12000, termDays: 7, emoji: "🏭" },
  { id: "mill", name: "Мельница", minTons: 50, pricePerTon: 13500, termDays: 14, emoji: "🏭" },
  { id: "kombinat", name: "Крупный комбинат", minTons: 500, pricePerTon: 15000, termDays: 30, emoji: "🏭" }
];
// Колебания цен на рынке (от -20% до +20%)
function getMarketPrice(cropId) {
  const crop = CROPS[cropId];
  if (!crop) return 0;
  
  // Если цена еще не сгенерирована для этого месяца — генерируем
  // (в идеале это должно сохраняться в state, но для простоты сделаем случайной)
  const randomModifier = 0.8 + (Math.random() * 0.4); // от 0.8 до 1.2
  return Math.floor(crop.basePrice * randomModifier);
}
