// === Элементы DOM ===
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
  scale: 1,
  passiveMultiplier: 1,
  autoClickMultiplier: 1
};

let progressLevel = 0;
let progressSinceLevelStart = 0;

const upgradeKeys = [
  "click", "autoclick",
  "passive0", "passive1", "passive2", "passive3",
  "passive4", "passive5", "passive6", "passive7"
];

const prestigeUpgrades = [
  {
    id: "prestige1",
    name: "x2 к пассивному доходу",
    baseCost: 1,
    effect: () => { state.passiveMultiplier *= 2; },
    timesBought: 0
  },
  {
    id: "prestige2",
    name: "+1 к клику",
    baseCost: 2,
    effect: () => { state.clickPower += 1; },
    timesBought: 0
  },
  {
    id: "prestige3",
    name: "x2 к автоклику",
    baseCost: 3,
    effect: () => { state.autoClickMultiplier *= 2; },
    timesBought: 0
  }
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

function getPrestigeUpgradeCost(upg) {
  return upg.baseCost * Math.pow(2, upg.timesBought);
}

function renderPrestigeUpgrades() {
  const container = document.getElementById("prestige-upgrades");
  if (!container) return;
  container.innerHTML = "";

  prestigeUpgrades.forEach(upg => {
    const currentCost = getPrestigeUpgradeCost(upg);
    const div = document.createElement("div");
    div.className = "prestige-upgrade";
    div.id = upg.id;
    div.textContent = `${upg.name} — ${currentCost} шкалы (Куплено: ${upg.timesBought})`;

    div.classList.toggle("disabled", progressLevel < currentCost);

    div.addEventListener("click", () => {
      if (progressLevel >= currentCost) {
        upg.effect();
        upg.timesBought++;
        progressLevel -= currentCost;
        saveState();
        updateUI();
        renderPrestigeUpgrades();
      }
    });

    container.appendChild(div);
  });
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

function updateProgressBar() {
  const levelSize = 1000 * (progressLevel + 1);
  const percentage = Math.min((progressSinceLevelStart / levelSize) * 100, 100);
  progressFill.style.width = `${percentage}%`;
  if (progressCurrent) progressCurrent.textContent = `${Math.floor(progressSinceLevelStart)} / ${levelSize}`;
  if (progressCount) progressCount.textContent = `x${progressLevel}`;
}

function addProgressPoints(amount) {
  const levelSize = 1000 * (progressLevel + 1);
  progressSinceLevelStart += amount;
  state.count += amount;
  if (progressSinceLevelStart >= levelSize) {
    progressSinceLevelStart -= levelSize;
    progressLevel++;
  }
  updateProgressBar();
  updateUI();
}

clickImage.addEventListener('click', () => {
  addProgressPoints(state.clickPower);
  playClickSound();
});

setInterval(() => {
  const incomeThisTick = (state.autoClick * state.autoClickMultiplier) + (state.passiveIncome * state.passiveMultiplier);
  addProgressPoints(incomeThisTick);
}, 1000);

function playClickSound() {
  if (!state.clickVolume) return;
  // const clickSound = new Audio('path/to/click.mp3');
  // clickSound.volume = state.clickVolume;
  // clickSound.play();
}

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
  updateUI();
});

function updateUI() {
  countDisplay.textContent = Math.floor(state.count);
  updateProgressBar();
  updateUpgrades();
  renderPrestigeUpgrades();
  saveState();
}

function saveState() {
  const fullState = {
    ...state,
    progressLevel,
    progressSinceLevelStart,
    prestigeUpgrades: prestigeUpgrades.map(p => ({ id: p.id, timesBought: p.timesBought }))
  };
  localStorage.setItem("clickerGameState", JSON.stringify(fullState));
}

function loadState() {
  const saved = JSON.parse(localStorage.getItem("clickerGameState"));
  if (saved) {
    Object.assign(state, saved);
    progressLevel = saved.progressLevel || 0;
    progressSinceLevelStart = saved.progressSinceLevelStart || 0;
    if (saved.prestigeUpgrades) {
      for (const upg of prestigeUpgrades) {
        const savedUpg = saved.prestigeUpgrades.find(p => p.id === upg.id);
        if (savedUpg) upg.timesBought = savedUpg.timesBought || 0;
      }
    }
  }
  upgradeKeys.forEach(key => {
    if (!(key in state.upgrades)) {
      state.upgrades[key] = 0;
    }
  });
}

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
      scale: 1,
      passiveMultiplier: 1,
      autoClickMultiplier: 1
    });
    progressLevel = 0;
    progressSinceLevelStart = 0;
    prestigeUpgrades.forEach(upg => upg.timesBought = 0);
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

loadState();
bgMusic.volume = state.musicVolume;
updateUI();
