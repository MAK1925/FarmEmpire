const CROPS = {
  wheat: {
    id: "wheat", name: "Пшеница", emoji: "🌾", growMonths: 8, baseYieldPerHa: 3,
    seedCostPerHa: 2000, basePrice: 12000,
    plantMonths: ["Март", "Апрель"], harvestMonths: ["Июль", "Август"]
  },
  sunflower: {
    id: "sunflower", name: "Подсолнечник", emoji: "🌻", growMonths: 5, baseYieldPerHa: 2.5,
    seedCostPerHa: 4000, basePrice: 28000,
    plantMonths: ["Апрель", "Май"], harvestMonths: ["Сентябрь"]
  },
  corn: {
    id: "corn", name: "Кукуруза", emoji: "🌽", growMonths: 5, baseYieldPerHa: 5,
    seedCostPerHa: 3500, basePrice: 9000,
    plantMonths: ["Апрель", "Май"], harvestMonths: ["Сентябрь", "Октябрь"]
  },
  soy: {
    id: "soy", name: "Соя", emoji: "🌱", growMonths: 4, baseYieldPerHa: 2,
    seedCostPerHa: 5000, basePrice: 25000,
    plantMonths: ["Май"], harvestMonths: ["Сентябрь"]
  },
  ash: {
    id: "ash", name: "Ясень", emoji: "🌳", growMonths: 12, baseYieldPerHa: 10,
    seedCostPerHa: 10000, basePrice: 3000,
    plantMonths: ["Апрель"], harvestMonths: ["Апрель"]
  },
  sorghum: {
    id: "sorghum", name: "Сорго", emoji: "🌾", growMonths: 4, baseYieldPerHa: 4,
    seedCostPerHa: 1500, basePrice: 8000,
    plantMonths: ["Май", "Июнь"], harvestMonths: ["Сентябрь", "Октябрь"]
  },
  flour: { id: "flour", name: "Мука", emoji: "🌫️", isProduct: true, basePrice: 20000 },
  oil: { id: "oil", name: "Подсолнечное масло", emoji: "🛢", isProduct: true, basePrice: 45000 }
};

const ACTIONS = {
  plow: { id: "plow", name: "Вспашка", emoji: "🚜", coef: 30, requires: "tractor" },
  sow: { id: "sow", name: "Посев", emoji: "🌱", coef: 20, requires: "tractor" },
  water: { id: "water", name: "Полив", emoji: "💧", coef: 15, requires: "tractor", yieldBonus: 0.10, yieldPenalty: 0.10 },
  fertilize: { id: "fertilize", name: "Удобрение", emoji: "🧪", coef: 25, requires: "tractor", yieldBonus: 0.20, yieldPenalty: 0.10 },
  weeds: { id: "weeds", name: "Прополка", emoji: "🌿", coef: 20, requires: "tractor", yieldBonus: 0.15, yieldPenalty: 0.20 },
  pest: { id: "pest", name: "Вредители", emoji: "🐛", coef: 35, requires: "tractor", yieldBonus: 0.10, yieldPenalty: 0.25 },
  harvest: { id: "harvest", name: "Уборка", emoji: "🌾", coef: 40, requires: "combine" }
};

const MONTH_ACTIONS = [
  ["plow", "sow"], ["water", "fertilize"], ["weeds", "water"],
  ["fertilize", "pest"], ["water", "weeds"], ["pest", "fertilize"],
  ["water"], ["harvest"], ["water"], ["harvest"], ["water"], ["harvest"]
];

const TRACTORS = [
  { id: "t80", name: "Силач-80", power: 80, price: 400000, fuelPerDay: 500 },
  { id: "t120", name: "Силач-120", power: 120, price: 800000, fuelPerDay: 700 },
  { id: "t200", name: "Агро-200", power: 200, price: 1600000, fuelPerDay: 1000 }
];

const COMBINES = [{ id: "c150", name: "Комбайн-150", power: 150, price: 1200000, fuelPerDay: 800 }];

const REGIONS = [
  { id: "south", name: "Юг", landPricePerHa: 50000, yieldBonus: 0.20 },
  { id: "center", name: "Центр", landPricePerHa: 70000, yieldBonus: 0.0 }
];

const BUSINESS_FORMS = [
  { id: "ip", name: "ИП", startMoney: 150000, taxRate: 0.06 },
  { id: "kfh", name: "КФХ", startMoney: 100000, taxRate: 0.04 }
];

const FACTORIES = [
  { id: "mini_mill", name: "Мини-мельница", minTons: 5, emoji: "🏭" },
  { id: "mill", name: "Мельница", minTons: 50, emoji: "🏭" }
];

const PLAYER_FACTORIES = [
  { id: "my_mill", name: "Мукомольный завод", emoji: "🏭", price: 1500000, incomePerMonth: 150000, desc: "Производит муку." },
  { id: "my_oil", name: "Маслобойка", emoji: "🛢", price: 2500000, incomePerMonth: 250000, desc: "Делает масло." }
];

const EVENTS = [
  { id: "drought", name: "☀️ Засуха", chance: 0.15, yieldMod: -0.15, desc: "Урожай −15%" },
  { id: "rain", name: "🌧 Дожди", chance: 0.20, dayMod: -3, desc: "Полив не нужен" }
];

const DAYS_PER_MONTH = 30;
const MONTH_NAMES = ["Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь","Январь","Февраль"];

function getMarketPrice(cropId) {
  const crop = CROPS[cropId];
  if (!crop) return 0;
  const modifier = 0.8 + (Math.random() * 0.4);
  return Math.floor(crop.basePrice * modifier);
}
