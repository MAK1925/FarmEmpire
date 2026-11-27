// Создаем состояние игры
  const state = createInitialState();
  state.registered = true;
  state.farmName = name;
  state.form = regData.form;
  state.region = regData.region;
  state.fieldHa = regData.fieldHa;
  state.money = money;
  state.debt = debt; 
  state.tractors = [regData.tractor]; // ДОБАВЛЯЕМ В МАССИВ
  state.combines = [COMBINES[0]];     // ДОБАВЛЯЕМ КОМБАЙН В МАССИВ
  
  saveGame(state);
