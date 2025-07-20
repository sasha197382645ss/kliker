const clickImage = document.getElementById("click-image");
const countDisplay = document.getElementById("count");
const upgradesContainer = document.getElementById("upgrades");
const progressFill = document.getElementById("progress-fill");
const progressCount = document.getElementById("progress-count");
const progressCurrent = document.getElementById("progress-current");
const musicToggle = document.getElementById("music-toggle");
const musicVolume = document.getElementById("volume");
const clickVolume = document.getElementById("click-volume");
const bgMusic = document.getElementById("bg-music");
const settingsIcon = document.getElementById("settings-icon");
const settingsModal = document.getElementById("settings-modal");
const closeSettingsBtn = document.getElementById("close-settings");
const themeSelect = document.getElementById("theme-select");
const resetButton = document.getElementById("reset-button");
const appContainer = document.getElementById("app-container");
const scaleSelect = document.getElementById("scale-select");

const state = {
  count: 0,
  clickPower: 1,
  autoClick: 0,
  passiveIncome: 0,
  upgrades: {},
  musicOn: true,
  musicVolume: 0.5,
  clickVolume: 0.5,
  theme: "light",
  scale: 1
};

let maxCountAchieved = 0;

const upgradeKeys = [
  "click", "autoclick",
  "passive0", "passive1", "passive2", "passive3",
  "passive4", "passive5", "passive6", "passive7"
];

function getUpgradeCost(key) {
  const level = state.upgrades[key] || 0;
  const basePrices = {
    click: 10,
    autoclick: 50,
    passive0: 100,
    passive1: 200,
    passive2: 400,
    passive3: 800,
    passive4: 1600,
    passive5: 3200,
    passive6: 6400,
    passive7: 12800
  };
  const basePrice = basePrices[key] || 100;
  return Math.floor(basePrice * Math.pow(1.5, level));
}

function updateUpgrades() {
  upgradeKeys.forEach(key => {
    const el = document.querySelector(`[data-upgrade='${key}']`);
    const costEl = document.getElementById(`cost-${key}`);
    if (el && costEl) {
      const cost = getUpgradeCost(key);
      costEl.textContent = cost;
      el.classList.toggle("disabled", state.count < cost);
    }
  });
}

let progressLevel = 0; // текущий уровень прогресса
let progressSinceLevelStart = 0; // локальный счётчик прогресса в уровне

function updateProgressBar() {
  const levelSize = 1000 * (progressLevel + 1);

  const percentage = Math.min((progressSinceLevelStart / levelSize) * 100, 100);

  progressFill.style.width = `${percentage}%`;

  if (progressCurrent) {
    progressCurrent.textContent = `${Math.floor(progressSinceLevelStart)} / ${levelSize}`;
  }
  if (progressCount) {
    progressCount.textContent = `x${progressLevel}`;
  }
}

// Функция добавления очков прогресса
function addProgressPoints(amount) {
  const levelSize = 1000 * (progressLevel + 1);

  progressSinceLevelStart += amount;

  if (progressSinceLevelStart >= levelSize) {
    progressSinceLevelStart -= levelSize;
    progressLevel++;
  }

  updateProgressBar();
  updateUI();
}

// При клике
clickImage.addEventListener('click', () => {
  addProgressPoints(state.clickPower);
});

// Пассивное добавление каждую секунду
setInterval(() => {
  const incomeThisTick = state.autoClick + state.passiveIncome;
  addProgressPoints(incomeThisTick);
}, 1000);

// Обработчик клика
clickImage.addEventListener('click', () => {
  addProgressPoints(state.clickPower); // добавляем очки за клик
});

// Пассивное прибавление каждую секунду
setInterval(() => {
  const incomeThisTick = state.autoClick + state.passiveIncome;
  addProgressPoints(incomeThisTick);
}, 1000);

function updateUI() {
  countDisplay.textContent = Math.floor(state.count);
  updateProgressBar();
  updateUpgrades();
  saveState();
}

function saveState() {
  const fullState = { ...state, progressLevel, maxCountAchieved };
  localStorage.setItem("clickerGameState", JSON.stringify(fullState));
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem("clickerGameState"));
  if (saved) {
    Object.assign(state, saved);
    progressLevel = saved.progressLevel || 0;
    maxCountAchieved = saved.maxCountAchieved || state.count;
  }
  upgradeKeys.forEach(key => {
    if (!(key in state.upgrades)) {
      state.upgrades[key] = 0;
    }
  });
}

clickImage.addEventListener("click", () => {
  if (state.musicOn && bgMusic.paused) {
    bgMusic.play().catch(() => {});
  }
  state.count += state.clickPower;
  maxCountAchieved = Math.max(maxCountAchieved, state.count);
  updateUI();
});

upgradesContainer.addEventListener("click", e => {
  const upgradeEl = e.target.closest(".upgrade");
  if (!upgradeEl) return;
  const key = upgradeEl.dataset.upgrade;
  const cost = getUpgradeCost(key);
  if (state.count < cost) return;
  state.count -= cost;
  state.upgrades[key] = (state.upgrades[key] || 0) + 1;
  if (key === "click") state.clickPower++;
  else if (key === "autoclick") state.autoClick++;
  else if (key.startsWith("passive")) state.passiveIncome++;
  maxCountAchieved = Math.max(maxCountAchieved, state.count);
  updateUI();
});

setInterval(() => {
  state.count += state.autoClick + state.passiveIncome;
  maxCountAchieved = Math.max(maxCountAchieved, state.count);
  updateUI();
}, 1000);

if (settingsIcon && settingsModal && closeSettingsBtn) {
  settingsIcon.addEventListener("click", () => settingsModal.classList.remove("hidden"));
  closeSettingsBtn.addEventListener("click", () => settingsModal.classList.add("hidden"));
}

if (themeSelect) {
  document.body.className = state.theme;
  themeSelect.value = state.theme;
  themeSelect.addEventListener("change", () => {
    state.theme = themeSelect.value;
    document.body.className = state.theme;
    saveState();
  });
}

if (scaleSelect && appContainer) {
  appContainer.style.transform = `scale(${state.scale})`;
  scaleSelect.value = state.scale;
  scaleSelect.addEventListener("change", () => {
    state.scale = parseFloat(scaleSelect.value);
    appContainer.style.transform = `scale(${state.scale})`;
    saveState();
  });
}

if (resetButton) {
  resetButton.addEventListener("click", () => {
    if (!confirm("Ты точно хочешь сбросить весь прогресс?")) return;
    localStorage.removeItem("clickerGameState");
    Object.assign(state, {
      count: 0,
      clickPower: 1,
      autoClick: 0,
      passiveIncome: 0,
      upgrades: {},
      musicOn: true,
      musicVolume: 0.5,
      clickVolume: 0.5,
      theme: "light",
      scale: 1
    });
    progressLevel = 0;
    maxCountAchieved = 0;
    document.body.className = "light";
    bgMusic.volume = 0.5;
    if (musicToggle) musicToggle.checked = true;
    if (musicVolume) musicVolume.value = 50;
    if (clickVolume) clickVolume.value = 50;
    if (themeSelect) themeSelect.value = "light";
    if (scaleSelect) scaleSelect.value = "1";
    updateUI();
    bgMusic.play();
  });
}

if (musicToggle) {
  musicToggle.checked = state.musicOn;
  musicToggle.addEventListener("change", () => {
    state.musicOn = musicToggle.checked;
    if (state.musicOn) bgMusic.play().catch(() => {});
    else bgMusic.pause();
    saveState();
  });
}

if (musicVolume) {
  musicVolume.value = state.musicVolume * 100;
  musicVolume.addEventListener("input", () => {
    state.musicVolume = parseFloat(musicVolume.value) / 100;
    bgMusic.volume = state.musicVolume;
    saveState();
  });
}

// Запуск
loadState();
bgMusic.volume = state.musicVolume;
updateUI();