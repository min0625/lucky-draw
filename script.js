/**
 * Lucky Draw - 抽獎工具
 * 純前端實作，所有資料僅存於瀏覽器本地
 */

// ===== 常數定義 =====
const STORAGE_KEY = "luckyDrawHistory";
const MAX_HISTORY = 50;

// ===== DOM 元素 =====
const elements = {
  participantsInput: document.getElementById("participants"),
  participantCount: document.getElementById("count"),
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
  historySection: document.getElementById("history-section"),
};

// ===== 狀態管理 =====
const state = {
  participants: [],
  drawnParticipants: [],
  history: [],
};

// ===== 音效管理 =====
let audioContext = null;

function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playSound(frequency, duration, type = "sine") {
  if (!elements.enableSoundCheckbox?.checked) return;

  try {
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      ctx.currentTime + duration
    );

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  } catch (err) {
    console.error("無法播放音效:", err);
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

// ===== 初始化 =====
function init() {
  loadHistory();
  updateParticipantCount();
  renderHistory();
  attachEventListeners();
}

// ===== 事件監聽 =====
function attachEventListeners() {
  elements.participantsInput.addEventListener("input", handleParticipantsInput);
  elements.drawBtn.addEventListener("click", handleDraw);
  elements.clearBtn.addEventListener("click", handleClear);
  elements.resetBtn.addEventListener("click", handleReset);
  elements.copyBtn.addEventListener("click", handleCopy);
  elements.clearHistoryBtn.addEventListener("click", handleClearHistory);
  elements.drawCountInput.addEventListener("input", validateDrawCount);
}

// ===== 處理參與者輸入 =====
function handleParticipantsInput() {
  updateParticipantCount();
  validateDrawCount();
}

// ===== 更新參與人數 =====
function updateParticipantCount() {
  const participants = getParticipants();
  state.participants = participants;
  elements.participantCount.textContent = participants.length;

  // 更新抽獎按鈕狀態
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const canDraw = participants.length > 0 && drawCount <= participants.length;
  elements.drawBtn.disabled = !canDraw;
}

// ===== 取得參與者列表 =====
function getParticipants() {
  const text = elements.participantsInput.value;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((name, index, self) => self.indexOf(name) === index); // 去除重複
}

// ===== 驗證抽取人數 =====
function validateDrawCount() {
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const maxCount = state.participants.length;
  const allowDuplicate = elements.allowDuplicateCheckbox.checked;

  if (!allowDuplicate && drawCount > maxCount) {
    elements.drawCountInput.value = maxCount;
  }

  if (drawCount < 1) {
    elements.drawCountInput.value = 1;
  }
}

// ===== 開始抽獎 =====
function handleDraw() {
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const allowDuplicate = elements.allowDuplicateCheckbox.checked;

  if (state.participants.length === 0) {
    alert("請先輸入參與者名單");
    return;
  }

  if (!allowDuplicate && drawCount > state.participants.length) {
    alert("抽取人數不能超過參與人數（未允許重複抽取）");
    return;
  }

  // 執行抽獎動畫
  performDrawAnimation(drawCount, allowDuplicate);
}

// ===== 抽獎動畫 =====
function performDrawAnimation(drawCount, allowDuplicate) {
  // 禁用抽獎按鈕
  elements.drawBtn.disabled = true;
  elements.drawBtn.textContent = "🎲 抽獎中...";

  // 顯示滾動動畫
  showRollingAnimation();

  // 1.5 秒後顯示結果
  setTimeout(() => {
    // 執行抽獎
    const winners = drawWinners(state.participants, drawCount, allowDuplicate);

    // 顯示結果
    displayResults(winners);

    // 儲存記錄
    saveToHistory(winners);

    // 更新已抽中名單
    if (!allowDuplicate) {
      state.drawnParticipants.push(...winners);
    }

    // 恢復按鈕狀態
    elements.drawBtn.disabled = false;
    elements.drawBtn.textContent = "🎲 開始抽獎";
  }, 1500);
}

// ===== 顯示滾動動畫 =====
function showRollingAnimation() {
  const availableParticipants = state.participants.filter(
    (p) => !state.drawnParticipants.includes(p)
  );

  if (availableParticipants.length === 0) {
    return;
  }

  elements.resultDisplay.innerHTML = '<div class="rolling-animation"></div>';
  const rollingElement =
    elements.resultDisplay.querySelector(".rolling-animation");

  let counter = 0;
  const maxRolls = 30;
  const interval = setInterval(() => {
    const randomIndex = Math.floor(
      Math.random() * availableParticipants.length
    );
    const randomName = availableParticipants[randomIndex];
    rollingElement.textContent = `🎯 ${escapeHtml(randomName)}`;

    // 播放滾動音效
    playRollingSound();

    counter++;
    if (counter >= maxRolls) {
      clearInterval(interval);
    }
  }, 50);
}

// ===== 抽獎邏輯 =====
function drawWinners(participants, count, allowDuplicate) {
  const winners = [];
  const availableParticipants = allowDuplicate
    ? [...participants]
    : participants.filter((p) => !state.drawnParticipants.includes(p));

  if (availableParticipants.length === 0) {
    alert("所有參與者都已抽中！");
    return [];
  }

  for (let i = 0; i < count; i++) {
    if (availableParticipants.length === 0) break;

    const randomIndex = Math.floor(
      Math.random() * availableParticipants.length
    );
    const winner = availableParticipants[randomIndex];
    winners.push(winner);

    if (!allowDuplicate) {
      availableParticipants.splice(randomIndex, 1);
    }
  }

  return winners;
}

// ===== 顯示結果 =====
function displayResults(winners) {
  if (winners.length === 0) {
    elements.resultDisplay.innerHTML = '<p class="empty-state">抽獎失敗</p>';
    elements.resultActions.classList.remove("show");
    return;
  }

  elements.resultDisplay.innerHTML = "";

  // 播放勝利音效
  playWinSound();

  // 使用階梯式動畫顯示每個結果
  winners.forEach((winner, index) => {
    setTimeout(() => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";
      resultItem.style.animationDelay = `${index * 0.1}s`;
      resultItem.innerHTML = `🎉 ${index + 1}. ${escapeHtml(winner)}`;
      elements.resultDisplay.appendChild(resultItem);

      // 在最後一個項目顯示後顯示操作按鈕
      if (index === winners.length - 1) {
        setTimeout(() => {
          elements.resultActions.classList.add("show");
        }, 300);
      }
    }, index * 200);
  });
}

// ===== 清空名單 =====
function handleClear() {
  if (elements.participantsInput.value.trim() === "") return;

  if (confirm("確定要清空名單嗎？")) {
    elements.participantsInput.value = "";
    updateParticipantCount();
  }
}

// ===== 重置抽獎 =====
function handleReset() {
  state.drawnParticipants = [];
  elements.resultDisplay.innerHTML = '<p class="empty-state">尚未進行抽獎</p>';
  elements.resultActions.classList.remove("show");
}

// ===== 複製結果 =====
async function handleCopy() {
  const resultItems = elements.resultDisplay.querySelectorAll(".result-item");
  if (resultItems.length === 0) return;

  const text = Array.from(resultItems)
    .map((item) => item.textContent.trim())
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);

    // 顯示複製成功提示
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = "✓ 已複製";
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (_err) {
    // 降級方案：使用 textarea
    const textarea = document.createElement("textarea");
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);

    alert("結果已複製到剪貼簿");
  }
}

// ===== 儲存到歷史記錄 =====
function saveToHistory(winners) {
  if (winners.length === 0) return;

  const record = {
    timestamp: new Date().toISOString(),
    winners: winners,
    count: winners.length,
  };

  state.history.unshift(record);

  // 限制歷史記錄數量
  if (state.history.length > MAX_HISTORY) {
    state.history = state.history.slice(0, MAX_HISTORY);
  }

  // 儲存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.history));
  } catch (err) {
    console.error("無法儲存歷史記錄:", err);
  }

  renderHistory();
}

// ===== 載入歷史記錄 =====
function loadHistory() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state.history = JSON.parse(saved);
    }
  } catch (err) {
    console.error("無法載入歷史記錄:", err);
    state.history = [];
  }
}

// ===== 渲染歷史記錄 =====
function renderHistory() {
  if (state.history.length === 0) {
    elements.historyList.innerHTML = '<p class="empty-state">暫無抽獎記錄</p>';
    elements.historySection.classList.add("hidden");
    return;
  }

  elements.historySection.classList.remove("hidden");
  elements.historyList.innerHTML = state.history
    .map((record) => {
      const date = new Date(record.timestamp);
      const timeStr = formatDateTime(date);
      const winnersStr = record.winners.map((w) => escapeHtml(w)).join("、");

      return `
                <div class="history-item">
                    <div class="history-time">${timeStr}</div>
                    <div class="history-winners">${winnersStr}</div>
                </div>
            `;
    })
    .join("");
}

// ===== 清除歷史記錄 =====
function handleClearHistory() {
  if (state.history.length === 0) return;

  if (confirm("確定要清除所有抽獎記錄嗎？")) {
    state.history = [];
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
}

// ===== 工具函式 =====
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===== 啟動應用程式 =====
document.addEventListener("DOMContentLoaded", init);
