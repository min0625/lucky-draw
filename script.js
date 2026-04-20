// script.ts
var STORAGE_KEY = "luckyDrawHistory";
var MAX_HISTORY = 50;
var DRAW_ANIMATION_DURATION = 1500;
var MAX_ROLLS = 30;
var ROLL_INTERVAL = 50;
var RESULT_ITEM_DELAY = 200;
var RESULT_ANIMATION_DELAY = 0.1;
var elements = {
  participantsInput: document.getElementById("participants"),
  participantCount: document.getElementById("count"),
  drawTitleInput: document.getElementById("draw-title"),
  drawCountInput: document.getElementById("draw-count"),
  allowDuplicateCheckbox: document.getElementById("allow-duplicate"),
  enableSoundCheckbox: document.getElementById("enable-sound"),
  drawBtn: document.getElementById("draw-btn"),
  clearBtn: document.getElementById("clear-btn"),
  resetBtn: document.getElementById("reset-btn"),
  copyBtn: document.getElementById("copy-btn"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  resultDisplay: document.getElementById("result-display"),
  resultActions: document.getElementById("result-actions"),
  historyList: document.getElementById("history-list"),
  historySection: document.getElementById("history-section")
};
var state = {
  participants: [],
  drawnParticipants: [],
  history: [],
  activeTimeouts: [],
  activeIntervals: []
};
var audioContext = null;
function initAudioContext() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass)
      throw new Error("AudioContext not supported");
    audioContext = new AudioContextClass;
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}
function playSound(frequency, duration, type = "sine") {
  if (!elements.enableSoundCheckbox?.checked)
    return;
  try {
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error("Failed to play sound:", err);
  }
}
function playRollingSound() {
  playSound(400, 0.05, "square");
}
function playWinSound() {
  playSound(800, 0.3, "sine");
  setTimeout(() => playSound(1000, 0.3, "sine"), 100);
  setTimeout(() => playSound(1200, 0.4, "sine"), 200);
}
var notificationHideTimeout = null;
function showNotification(message) {
  const notification = document.getElementById("notification");
  notification.textContent = message;
  notification.classList.add("show");
  if (notificationHideTimeout !== null) {
    clearTimeout(notificationHideTimeout);
  }
  notificationHideTimeout = setTimeout(() => {
    notification.classList.remove("show");
    notificationHideTimeout = null;
  }, 3000);
}
function showConfirm(message, onConfirm) {
  const modal = document.getElementById("confirm-modal");
  const messageEl = document.getElementById("confirm-message");
  const confirmBtn = document.getElementById("confirm-ok-btn");
  const cancelBtn = document.getElementById("confirm-cancel-btn");
  messageEl.textContent = message;
  modal.classList.add("show");
  const handleConfirm = () => {
    modal.classList.remove("show");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    onConfirm();
  };
  const handleCancel = () => {
    modal.classList.remove("show");
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
  };
  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
}
function init() {
  loadHistory();
  updateParticipantCount();
  renderHistory();
  attachEventListeners();
  updateCopyrightYear();
}
function attachEventListeners() {
  elements.participantsInput.addEventListener("input", handleParticipantsInput);
  elements.drawBtn.addEventListener("click", handleDraw);
  elements.clearBtn.addEventListener("click", handleClear);
  elements.resetBtn.addEventListener("click", handleReset);
  elements.copyBtn.addEventListener("click", handleCopy);
  elements.clearHistoryBtn.addEventListener("click", handleClearHistory);
  elements.drawCountInput.addEventListener("input", validateDrawCount);
  elements.allowDuplicateCheckbox?.addEventListener("change", () => {
    updateParticipantCount();
    validateDrawCount();
  });
}
function handleParticipantsInput() {
  updateParticipantCount();
  validateDrawCount();
}
function updateParticipantCount() {
  const participants = getParticipants();
  state.participants = participants;
  elements.participantCount.textContent = String(participants.length);
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const allowDuplicate = elements.allowDuplicateCheckbox?.checked || false;
  const canDraw = participants.length > 0 && (allowDuplicate || drawCount <= participants.length);
  elements.drawBtn.disabled = !canDraw;
}
function getParticipants() {
  const text = elements.participantsInput.value;
  return text.split(`
`).map((line) => line.trim()).filter((line) => line.length > 0).filter((name, index, self) => self.indexOf(name) === index);
}
function validateDrawCount() {
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const maxCount = state.participants.length;
  const allowDuplicate = elements.allowDuplicateCheckbox.checked;
  if (drawCount < 1) {
    elements.drawCountInput.value = "1";
    return;
  }
  if (!allowDuplicate && maxCount > 0 && drawCount > maxCount) {
    elements.drawCountInput.value = String(maxCount);
  }
}
function handleDraw() {
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const allowDuplicate = elements.allowDuplicateCheckbox.checked;
  if (state.participants.length === 0) {
    showNotification("請先輸入參與者名單");
    return;
  }
  if (!allowDuplicate) {
    const drawnSet = new Set(state.drawnParticipants);
    const available = state.participants.filter((p) => !drawnSet.has(p));
    if (available.length === 0) {
      showNotification("所有參與者都已抽中！");
      return;
    }
    if (drawCount > available.length) {
      showNotification("抽取人數不能超過剩餘可抽人數");
      return;
    }
  }
  performDrawAnimation(drawCount, allowDuplicate);
}
function clearAnimationTimers() {
  for (const timeoutId of state.activeTimeouts) {
    clearTimeout(timeoutId);
  }
  state.activeTimeouts = [];
  for (const intervalId of state.activeIntervals) {
    clearInterval(intervalId);
  }
  state.activeIntervals = [];
}
function performDrawAnimation(drawCount, allowDuplicate) {
  clearAnimationTimers();
  elements.drawBtn.disabled = true;
  elements.drawBtn.textContent = "\uD83C\uDFB2 抽獎中...";
  showRollingAnimation(allowDuplicate);
  const timeoutId = setTimeout(() => {
    const winners = drawWinners(state.participants, drawCount, allowDuplicate);
    displayResults(winners);
    saveToHistory(winners);
    if (!allowDuplicate) {
      state.drawnParticipants.push(...winners);
      updateParticipantCount();
    }
    elements.drawBtn.disabled = false;
    elements.drawBtn.textContent = "\uD83C\uDFB2 開始抽獎";
  }, DRAW_ANIMATION_DURATION);
  state.activeTimeouts.push(timeoutId);
}
function showRollingAnimation(allowDuplicate) {
  const drawnSet = new Set(state.drawnParticipants);
  const availableParticipants = allowDuplicate ? [...state.participants] : state.participants.filter((p) => !drawnSet.has(p));
  if (availableParticipants.length === 0) {
    return;
  }
  elements.resultDisplay.innerHTML = '<div class="rolling-animation"></div>';
  const rollingElement = elements.resultDisplay.querySelector(".rolling-animation");
  let counter = 0;
  const interval = setInterval(() => {
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const randomName = availableParticipants[randomIndex];
    rollingElement.textContent = `\uD83C\uDFAF ${escapeHtml(randomName)}`;
    playRollingSound();
    counter++;
    if (counter >= MAX_ROLLS) {
      clearInterval(interval);
      const index = state.activeIntervals.indexOf(interval);
      if (index > -1) {
        state.activeIntervals.splice(index, 1);
      }
    }
  }, ROLL_INTERVAL);
  state.activeIntervals.push(interval);
}
function drawWinners(participants, count, allowDuplicate) {
  const winners = [];
  const drawnSet = new Set(state.drawnParticipants);
  const availableParticipants = allowDuplicate ? [...participants] : participants.filter((p) => !drawnSet.has(p));
  if (availableParticipants.length === 0) {
    return [];
  }
  for (let i = 0;i < count; i++) {
    if (availableParticipants.length === 0)
      break;
    const randomIndex = Math.floor(Math.random() * availableParticipants.length);
    const winner = availableParticipants[randomIndex];
    winners.push(winner);
    if (!allowDuplicate) {
      availableParticipants.splice(randomIndex, 1);
    }
  }
  return winners;
}
function displayResults(winners) {
  if (winners.length === 0) {
    elements.resultDisplay.innerHTML = '<p class="empty-state">抽獎失敗</p>';
    elements.resultActions.classList.remove("show");
    return;
  }
  elements.resultDisplay.innerHTML = "";
  playWinSound();
  const drawTitle = elements.drawTitleInput.value.trim();
  if (drawTitle) {
    const titleElement = document.createElement("div");
    titleElement.className = "result-title";
    titleElement.innerHTML = `【${escapeHtml(drawTitle)}】`;
    elements.resultDisplay.appendChild(titleElement);
  }
  winners.forEach((winner, index) => {
    const timeoutId = setTimeout(() => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";
      resultItem.style.animationDelay = `${index * RESULT_ANIMATION_DELAY}s`;
      resultItem.innerHTML = `\uD83C\uDF89 ${index + 1}. ${escapeHtml(winner)}`;
      elements.resultDisplay.appendChild(resultItem);
      if (index === winners.length - 1) {
        const buttonTimeoutId = setTimeout(() => {
          elements.resultActions.classList.add("show");
          const idx2 = state.activeTimeouts.indexOf(buttonTimeoutId);
          if (idx2 > -1) {
            state.activeTimeouts.splice(idx2, 1);
          }
        }, 300);
        state.activeTimeouts.push(buttonTimeoutId);
      }
      const idx = state.activeTimeouts.indexOf(timeoutId);
      if (idx > -1) {
        state.activeTimeouts.splice(idx, 1);
      }
    }, index * RESULT_ITEM_DELAY);
    state.activeTimeouts.push(timeoutId);
  });
}
function handleClear() {
  if (elements.participantsInput.value.trim() === "")
    return;
  showConfirm("確定要清空名單嗎？", () => {
    elements.participantsInput.value = "";
    updateParticipantCount();
  });
}
function handleReset() {
  clearAnimationTimers();
  state.drawnParticipants = [];
  elements.resultDisplay.innerHTML = '<p class="empty-state">尚未進行抽獎</p>';
  elements.resultActions.classList.remove("show");
  elements.drawBtn.textContent = "\uD83C\uDFB2 開始抽獎";
  updateParticipantCount();
}
async function handleCopy() {
  const resultItems = elements.resultDisplay.querySelectorAll(".result-item");
  if (resultItems.length === 0)
    return;
  const text = Array.from(resultItems).map((item) => item.textContent?.trim() ?? "").join(`
`);
  try {
    await navigator.clipboard.writeText(text);
    const originalText = elements.copyBtn.textContent ?? "";
    elements.copyBtn.textContent = "✓ 已複製";
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (_err) {
    showNotification("無法自動複製，請手動選取結果文字複製");
  }
}
function saveToHistory(winners) {
  if (winners.length === 0)
    return;
  const drawTitle = elements.drawTitleInput.value.trim();
  const record = {
    timestamp: new Date().toISOString(),
    title: drawTitle || "",
    winners,
    count: winners.length
  };
  state.history.unshift(record);
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(0, MAX_HISTORY);
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  } catch (err) {
    console.error("無法儲存歷史記錄:", err);
  }
  renderHistory();
}
function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.history = parsed.filter((r) => typeof r === "object" && r !== null && typeof r.timestamp === "string" && typeof r.title === "string" && Array.isArray(r.winners) && r.winners.every((w) => typeof w === "string") && typeof r.count === "number");
      }
    }
  } catch (err) {
    console.error("無法載入歷史記錄:", err);
    state.history = [];
  }
}
function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<p class="empty-state">暫無抽獎記錄</p>';
    elements.historySection.classList.add("hidden");
    return;
  }
  elements.historySection.classList.remove("hidden");
  elements.historyList.innerHTML = state.history.map((record) => {
    const date = new Date(record.timestamp);
    const timeStr = formatDateTime(date);
    const winnersStr = record.winners.map((w) => escapeHtml(w)).join("、");
    const titleStr = record.title ? `【${escapeHtml(record.title)}】` : "";
    return `
                <div class="history-item">
                    <div class="history-time">${timeStr}</div>
                    <div class="history-winners">${titleStr}${winnersStr}</div>
                </div>
            `;
  }).join("");
}
function handleClearHistory() {
  if (state.history.length === 0)
    return;
  showConfirm("確定要清除所有抽獎記錄嗎？", () => {
    state.history = [];
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });
}
function formatDateTime(date) {
  return date.toLocaleString("zh-TW", { hour12: false });
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function updateCopyrightYear() {
  const el = document.getElementById("copyright-year");
  if (el) {
    const currentYear = new Date().getFullYear();
    el.innerHTML = `&copy; 2024${currentYear > 2024 ? `–${currentYear}` : ""} Lucky Draw. 保留所有權利。`;
  }
}
document.addEventListener("DOMContentLoaded", init);
