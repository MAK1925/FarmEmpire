let regStep = 1;
let regData = {
  form: null,
  region: null,
  fieldHa: 0,
  tractor: null,
  farmName: ""
};

function renderRegistration() {
  const app = document.getElementById("app");
  
  if (regStep === 1) {
    app.innerHTML = `
      <div class="header"><h2>Шаг 1: Форма бизнеса</h2></div>
      <div class="card">Выбери, как будет оформлено твое предприятие:</div>
      ${BUSINESS_FORMS.map(f => `
        <button onclick="selectForm('${f.id}')">
          <strong>${f.name}</strong><br>
          <small>Старт: ${f.startMoney.toLocaleString()} ₽ · Налог: ${f.taxRate * 100}%</small>
        </button>
      `).join("")}
    `;
  } else if (regStep === 2) {
    app.innerHTML = `
      <div class="header"><h2>Шаг 2: Регион</h2></div>
      <div class="card">Где будет находиться твоя ферма?</div>
      ${REGIONS.map(r => `
        <button onclick="selectRegion('${r.id}')">
          <strong>${r.name}</strong><br>
          <small>Земля: ${r.landPricePerHa.toLocaleString()} ₽/га · Бонус урожая: ${r.yieldBonus > 0 ? '+' : ''}${r.yieldBonus * 100}%</small>
        </button>
      `).join("")}
    `;
  } else if (regStep === 3) {
    app.innerHTML = `
      <div class="header"><h2>Шаг 3: Поле</h2></div>
      <div class="card">Сколько гектаров берем?</div>
      <button onclick="selectField(10)"><strong>10 гектаров</strong><br><small>Дешево и просто</small></button>
      <button onclick="selectField(50)"><strong>50 гектаров</strong><br><small>Средний бизнес</small></button>
      <button onclick="selectField(100)"><strong>100 гектаров</strong><br><small>Крупное хозяйство</small></button>
    `;
  } else if (regStep === 4) {
    app.innerHTML = `
      <div class="header"><h2>Шаг 4: Трактор</h2></div>
      <div class="card">Выбери свою первую технику:</div>
      ${TRACTORS.map(t => `
        <button onclick="selectTractor('${t.id}')">
          <strong>${t.name}</strong><br>
          <small>Мощность: ${t.power} л.с. · Цена: ${t.price.toLocaleString()} ₽</small>
        </button>
      `).join("")}
    `;
  } else if (regStep === 5) {
    app.innerHTML = `
      <div class="header"><h2>Шаг 5: Название</h2></div>
      <div class="card">Как назовем твою ферму?</div>
      <input type="text" id="farmNameInput" placeholder="Например: Заря" style="width:100%; padding:15px; border-radius:12px; border:1px solid #4a6a4a; background:#252a25; color:white; font-size:16px; margin-bottom:10px;">
      <button class="btn-primary" onclick="finishRegistration()">Завершить регистрацию</button>
    `;
  }
}

function selectForm(id) {
  regData.form = id;
  regStep = 2;
  renderRegistration();
}

function selectRegion(id) {
  regData.region = id;
  regStep = 3;
  renderRegistration();
}

function selectField(ha) {
  regData.fieldHa = ha;
  regStep = 4;
  renderRegistration();
}

function selectTractor(id) {
  regData.tractor = TRACTORS.find(t => t.id === id);
  regStep = 5;
  renderRegistration();
}

function finishRegistration() {
  const name = document.getElementById("farmNameInput").value.trim();
  if (!name) return alert("Введи название фермы!");

  const form = BUSINESS_FORMS.find(f => f.id === regData.form);
  const region = REGIONS.find(r => r.id === regData.region);
  
  // Считаем стартовые деньги
  let money = form.startMoney;
  
  // Считаем расходы
  const fieldCost = regData.fieldHa * region.landPricePerHa;
  const tractorCost = regData.tractor.price;
  
  money = money - fieldCost - tractorCost;
  
  // Если денег в минус — берем кредит!
  let debt = 0;
  if (money < 0) {
    debt = Math.abs(money);
    money = 0; // Обнуляем баланс
  }

  // Создаем состояние игры
  const state = createInitialState();
  state.registered = true;
  state.farmName = name;
  state.form = regData.form;
  state.region = regData.region;
  state.fieldHa = regData.fieldHa;
  state.money = money;
  state.debt = debt; // Записываем долг
  state.tractor = regData.tractor;
  state.combine = COMBINES[0]; 
  
  saveGame(state);
  
  if (debt > 0) {
    alert(`Тебе не хватило денег, поэтому банк выдал кредит на ${debt.toLocaleString()} ₽. Теперь ты должен банку!`);
  }
  
  renderMain(state);
}
