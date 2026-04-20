/**
 * Lucky Draw - 抽獎工具
 * 純前端實作，所有資料僅存於瀏覽器本地
 */

// ===== 常數定義 =====
const STORAGE_KEY = "luckyDrawHistory";
const MAX_HISTORY = 50;
const DRAW_ANIMATION_DURATION = 1500; // 抽獎動畫持續時間（毫秒）
const MAX_ROLLS = 30; // 名單滾動次數
const ROLL_INTERVAL = 50; // 滾動間隔（毫秒）
const RESULT_ITEM_DELAY = 200; // 結果項目顯示間隔（毫秒）
const RESULT_ANIMATION_DELAY = 0.1; // 結果項目動畫延遲（秒）

// ===== 型別定義 =====
interface DrawRecord {
  timestamp: string;
  title: string;
  winners: string[];
  count: number;
}

interface Elements {
  participantsInput: HTMLTextAreaElement;
  participantCount: HTMLElement;
  drawTitleInput: HTMLInputElement;
  drawCountInput: HTMLInputElement;
  allowDuplicateCheckbox: HTMLInputElement;
  enableSoundCheckbox: HTMLInputElement;
  drawBtn: HTMLButtonElement;
  clearBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  copyBtn: HTMLButtonElement;
  clearHistoryBtn: HTMLButtonElement;
  resultDisplay: HTMLElement;
  resultActions: HTMLElement;
  historyList: HTMLElement;
  historySection: HTMLElement;
}

interface AppState {
  participants: string[];
  drawnParticipants: string[];
  history: DrawRecord[];
  activeTimeouts: ReturnType<typeof setTimeout>[];
  activeIntervals: ReturnType<typeof setInterval>[];
}

// ===== DOM 元素 =====
const elements: Elements = {
  participantsInput: document.getElementById(
    "participants"
  ) as HTMLTextAreaElement,
  participantCount: document.getElementById("count") as HTMLElement,
  drawTitleInput: document.getElementById("draw-title") as HTMLInputElement,
  drawCountInput: document.getElementById("draw-count") as HTMLInputElement,
  allowDuplicateCheckbox: document.getElementById(
    "allow-duplicate"
  ) as HTMLInputElement,
  enableSoundCheckbox: document.getElementById(
    "enable-sound"
  ) as HTMLInputElement,
  drawBtn: document.getElementById("draw-btn") as HTMLButtonElement,
  clearBtn: document.getElementById("clear-btn") as HTMLButtonElement,
  resetBtn: document.getElementById("reset-btn") as HTMLButtonElement,
  copyBtn: document.getElementById("copy-btn") as HTMLButtonElement,
  clearHistoryBtn: document.getElementById(
    "clear-history-btn"
  ) as HTMLButtonElement,
  resultDisplay: document.getElementById("result-display") as HTMLElement,
  resultActions: document.getElementById("result-actions") as HTMLElement,
  historyList: document.getElementById("history-list") as HTMLElement,
  historySection: document.getElementById("history-section") as HTMLElement,
};

// ===== 狀態管理 =====
const state: AppState = {
  participants: [],
  drawnParticipants: [],
  history: [],
  activeTimeouts: [],
  activeIntervals: [],
};

// ===== 音效管理 =====
let audioContext: AudioContext | null = null;

function initAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) throw new Error("AudioContext not supported");
    audioContext = new AudioContextClass();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function playSound(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine"
): void {
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
    console.error("Failed to play sound:", err);
  }
}

function playRollingSound(): void {
  playSound(400, 0.05, "square");
}

function playWinSound(): void {
  playSound(800, 0.3, "sine");
  setTimeout(() => playSound(1000, 0.3, "sine"), 100);
  setTimeout(() => playSound(1200, 0.4, "sine"), 200);
}

// ===== 通知提示 =====
let notificationHideTimeout: ReturnType<typeof setTimeout> | null = null;

function showNotification(message: string): void {
  const notification = document.getElementById("notification") as HTMLElement;
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

// ===== 確認對話框 =====
function showConfirm(message: string, onConfirm: () => void): void {
  const modal = document.getElementById("confirm-modal") as HTMLElement;
  const messageEl = document.getElementById("confirm-message") as HTMLElement;
  const confirmBtn = document.getElementById(
    "confirm-ok-btn"
  ) as HTMLButtonElement;
  const cancelBtn = document.getElementById(
    "confirm-cancel-btn"
  ) as HTMLButtonElement;

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

// ===== 初始化 =====
function init(): void {
  loadHistory();
  updateParticipantCount();
  renderHistory();
  attachEventListeners();
  updateCopyrightYear();
}

// ===== 事件監聽 =====
function attachEventListeners(): void {
  elements.participantsInput.addEventListener("input", handleParticipantsInput);
  elements.drawBtn.addEventListener("click", handleDraw);
  elements.clearBtn.addEventListener("click", handleClear);
  elements.resetBtn.addEventListener("click", handleReset);
  elements.copyBtn.addEventListener("click", handleCopy);
  elements.clearHistoryBtn.addEventListener("click", handleClearHistory);
  elements.drawCountInput.addEventListener("input", validateDrawCount);
  // 當允許重複抽取選項變更時，更新按鈕與抽取數驗證
  elements.allowDuplicateCheckbox?.addEventListener("change", () => {
    updateParticipantCount();
    validateDrawCount();
  });
}

// ===== 處理參與者輸入 =====
function handleParticipantsInput(): void {
  updateParticipantCount();
  validateDrawCount();
}

// ===== 更新參與人數 =====
function updateParticipantCount(): void {
  const participants = getParticipants();
  state.participants = participants;
  elements.participantCount.textContent = String(participants.length);

  // 更新抽獎按鈕狀態（考慮允許重複抽取時可抽取人數不受參與者總數限制）
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const allowDuplicate = elements.allowDuplicateCheckbox?.checked || false;
  const canDraw =
    participants.length > 0 &&
    (allowDuplicate || drawCount <= participants.length);
  elements.drawBtn.disabled = !canDraw;
}

// ===== 取得參與者列表 =====
function getParticipants(): string[] {
  const text = elements.participantsInput.value;
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((name, index, self) => self.indexOf(name) === index); // 去除重複
}

// ===== 驗證抽取人數 =====
function validateDrawCount(): void {
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

// ===== 開始抽獎 =====
function handleDraw(): void {
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

  // 執行抽獎動畫
  performDrawAnimation(drawCount, allowDuplicate);
}

// ===== 清除動畫計時器 =====
function clearAnimationTimers(): void {
  // 清除所有待執行的 timeout
  for (const timeoutId of state.activeTimeouts) {
    clearTimeout(timeoutId);
  }
  state.activeTimeouts = [];

  // 清除所有執行中的 interval
  for (const intervalId of state.activeIntervals) {
    clearInterval(intervalId);
  }
  state.activeIntervals = [];
}

// ===== 抽獎動畫 =====
function performDrawAnimation(
  drawCount: number,
  allowDuplicate: boolean
): void {
  // 清除之前的動畫計時器
  clearAnimationTimers();

  // 禁用抽獎按鈕
  elements.drawBtn.disabled = true;
  elements.drawBtn.textContent = "🎲 抽獎中...";

  // 顯示滾動動畫
  showRollingAnimation(allowDuplicate);

  // 在動畫結束後顯示結果
  const timeoutId = setTimeout(() => {
    // 執行抽獎
    const winners = drawWinners(state.participants, drawCount, allowDuplicate);

    // 顯示結果
    displayResults(winners);

    // 儲存記錄
    saveToHistory(winners);

    // 更新已抽中名單
    if (!allowDuplicate) {
      state.drawnParticipants.push(...winners);
      updateParticipantCount();
    }

    // 恢復按鈕狀態
    elements.drawBtn.disabled = false;
    elements.drawBtn.textContent = "🎲 開始抽獎";
  }, DRAW_ANIMATION_DURATION);

  state.activeTimeouts.push(timeoutId);
}

// ===== 顯示滾動動畫 =====
function showRollingAnimation(allowDuplicate: boolean): void {
  const drawnSet = new Set(state.drawnParticipants);
  const availableParticipants = allowDuplicate
    ? [...state.participants]
    : state.participants.filter((p) => !drawnSet.has(p));

  if (availableParticipants.length === 0) {
    return;
  }

  elements.resultDisplay.innerHTML = '<div class="rolling-animation"></div>';
  const rollingElement = elements.resultDisplay.querySelector(
    ".rolling-animation"
  ) as HTMLElement;

  let counter = 0;
  const interval = setInterval(() => {
    const randomIndex = Math.floor(
      Math.random() * availableParticipants.length
    );
    const randomName = availableParticipants[randomIndex];
    rollingElement.textContent = `🎯 ${escapeHtml(randomName)}`;

    // 播放滾動音效
    playRollingSound();

    counter++;
    if (counter >= MAX_ROLLS) {
      clearInterval(interval);
      // 從追蹤清單移除
      const index = state.activeIntervals.indexOf(interval);
      if (index > -1) {
        state.activeIntervals.splice(index, 1);
      }
    }
  }, ROLL_INTERVAL);

  state.activeIntervals.push(interval);
}

// ===== 抽獎邏輯 =====
function drawWinners(
  participants: string[],
  count: number,
  allowDuplicate: boolean
): string[] {
  const winners: string[] = [];
  const drawnSet = new Set(state.drawnParticipants);
  const availableParticipants = allowDuplicate
    ? [...participants]
    : participants.filter((p) => !drawnSet.has(p));

  if (availableParticipants.length === 0) {
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
function displayResults(winners: string[]): void {
  if (winners.length === 0) {
    elements.resultDisplay.innerHTML = '<p class="empty-state">抽獎失敗</p>';
    elements.resultActions.classList.remove("show");
    return;
  }

  elements.resultDisplay.innerHTML = "";

  // 播放勝利音效
  playWinSound();

  const drawTitle = elements.drawTitleInput.value.trim();

  // 如果有標題，先顯示標題
  if (drawTitle) {
    const titleElement = document.createElement("div");
    titleElement.className = "result-title";
    titleElement.innerHTML = `【${escapeHtml(drawTitle)}】`;
    elements.resultDisplay.appendChild(titleElement);
  }

  // 使用階梯式動畫顯示每個結果
  winners.forEach((winner, index) => {
    const timeoutId = setTimeout(() => {
      const resultItem = document.createElement("div");
      resultItem.className = "result-item";
      resultItem.style.animationDelay = `${index * RESULT_ANIMATION_DELAY}s`;
      resultItem.innerHTML = `🎉 ${index + 1}. ${escapeHtml(winner)}`;
      elements.resultDisplay.appendChild(resultItem);

      // 在最後一個項目顯示後顯示操作按鈕
      if (index === winners.length - 1) {
        const buttonTimeoutId = setTimeout(() => {
          elements.resultActions.classList.add("show");
          // 從追蹤清單移除
          const idx = state.activeTimeouts.indexOf(buttonTimeoutId);
          if (idx > -1) {
            state.activeTimeouts.splice(idx, 1);
          }
        }, 300);
        state.activeTimeouts.push(buttonTimeoutId);
      }

      // 從追蹤清單移除
      const idx = state.activeTimeouts.indexOf(timeoutId);
      if (idx > -1) {
        state.activeTimeouts.splice(idx, 1);
      }
    }, index * RESULT_ITEM_DELAY);

    state.activeTimeouts.push(timeoutId);
  });
}

// ===== 清空名單 =====
function handleClear(): void {
  if (elements.participantsInput.value.trim() === "") return;

  showConfirm("確定要清空名單嗎？", () => {
    elements.participantsInput.value = "";
    updateParticipantCount();
  });
}

// ===== 重置抽獎 =====
function handleReset(): void {
  clearAnimationTimers();
  state.drawnParticipants = [];
  elements.resultDisplay.innerHTML = '<p class="empty-state">尚未進行抽獎</p>';
  elements.resultActions.classList.remove("show");
  elements.drawBtn.textContent = "🎲 開始抽獎";
  updateParticipantCount();
}

// ===== 複製結果 =====
async function handleCopy(): Promise<void> {
  const resultItems = elements.resultDisplay.querySelectorAll(".result-item");
  if (resultItems.length === 0) return;

  const text = Array.from(resultItems)
    .map((item) => item.textContent?.trim() ?? "")
    .join("\n");

  try {
    await navigator.clipboard.writeText(text);

    // 顯示複製成功提示
    const originalText = elements.copyBtn.textContent ?? "";
    elements.copyBtn.textContent = "✓ 已複製";
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 2000);
  } catch (_err) {
    // 降級方案：提示使用者手動複製
    showNotification("無法自動複製，請手動選取結果文字複製");
  }
}

// ===== 儲存到歷史記錄 =====
function saveToHistory(winners: string[]): void {
  if (winners.length === 0) return;

  const drawTitle = elements.drawTitleInput.value.trim();

  const record: DrawRecord = {
    timestamp: new Date().toISOString(),
    title: drawTitle || "",
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
function loadHistory(): void {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        state.history = parsed.filter(
          (r): r is DrawRecord =>
            typeof r === "object" &&
            r !== null &&
            typeof (r as DrawRecord).timestamp === "string" &&
            typeof (r as DrawRecord).title === "string" &&
            Array.isArray((r as DrawRecord).winners) &&
            (r as DrawRecord).winners.every(
              (w: unknown) => typeof w === "string"
            ) &&
            typeof (r as DrawRecord).count === "number"
        );
      }
    }
  } catch (err) {
    console.error("無法載入歷史記錄:", err);
    state.history = [];
  }
}

// ===== 渲染歷史記錄 =====
function renderHistory(): void {
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
      const titleStr = record.title ? `【${escapeHtml(record.title)}】` : "";

      return `
                <div class="history-item">
                    <div class="history-time">${timeStr}</div>
                    <div class="history-winners">${titleStr}${winnersStr}</div>
                </div>
            `;
    })
    .join("");
}

// ===== 清除歷史記錄 =====
function handleClearHistory(): void {
  if (state.history.length === 0) return;

  showConfirm("確定要清除所有抽獎記錄嗎？", () => {
    state.history = [];
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });
}

// ===== 工具函式 =====
function formatDateTime(date: Date): string {
  return date.toLocaleString("zh-TW", { hour12: false });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ===== 動態更新版權年份 =====
function updateCopyrightYear(): void {
  const el = document.getElementById("copyright-year");
  if (el) {
    const currentYear = new Date().getFullYear();
    el.innerHTML = `&copy; 2024${currentYear > 2024 ? `\u2013${currentYear}` : ""} Lucky Draw. 保留所有權利。`;
  }
}

// ===== 啟動應用程式 =====
document.addEventListener("DOMContentLoaded", init);
