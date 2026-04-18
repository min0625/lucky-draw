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

// ===== DOM 元素 =====
const elements = {
  participantsInput: document.getElementById("participants"),
  participantCount: document.getElementById("count"),
  drawTitleInput: document.getElementById("draw-title"),
  drawCountInput: document.getElementById("draw-count"),
  allowDuplicateCheckbox: document.getElementById("allow-duplicate"),
  enableSoundCheckbox: document.getElementById("enable-sound"),
  drawBtn: document.getElementById("draw-btn"),
  clearBtn: document.getElementById("clear-btn"),
  importBtn: document.getElementById("import-btn"),
  importFile: document.getElementById("import-file"),
  resetBtn: document.getElementById("reset-btn"),
  copyBtn: document.getElementById("copy-btn"),
  exportResultBtn: document.getElementById("export-result-btn"),
  clearHistoryBtn: document.getElementById("clear-history-btn"),
  exportHistoryBtn: document.getElementById("export-history-btn"),
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
  activeTimeouts: [],
  activeIntervals: [],
  currentWinners: [], // 儲存當前抽獎結果
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
  elements.importBtn.addEventListener("click", handleImportClick);
  elements.importFile.addEventListener("change", handleImportFile);
  elements.resetBtn.addEventListener("click", handleReset);
  elements.copyBtn.addEventListener("click", handleCopy);
  elements.exportResultBtn.addEventListener("click", handleExportResult);
  elements.clearHistoryBtn.addEventListener("click", handleClearHistory);
  elements.exportHistoryBtn.addEventListener("click", handleExportHistory);
  elements.drawCountInput.addEventListener("input", validateDrawCount);
  // 當允許重複抽取選項變更時，更新按鈕與抽取數驗證
  elements.allowDuplicateCheckbox?.addEventListener("change", () => {
    updateParticipantCount();
    validateDrawCount();
  });
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

  // 更新抽獎按鈕狀態（考慮允許重複抽取時可抽取人數不受參與者總數限制）
  const drawCount = Number.parseInt(elements.drawCountInput.value, 10) || 1;
  const allowDuplicate = elements.allowDuplicateCheckbox?.checked || false;
  const canDraw =
    participants.length > 0 &&
    (allowDuplicate || drawCount <= participants.length);
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

// ===== 清除動畫計時器 =====
function clearAnimationTimers() {
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
function performDrawAnimation(drawCount, allowDuplicate) {
  // 清除之前的動畫計時器
  clearAnimationTimers();

  // 禁用抽獎按鈕
  elements.drawBtn.disabled = true;
  elements.drawBtn.textContent = "🎲 抽獎中...";

  // 顯示滾動動畫
  showRollingAnimation();

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
    }

    // 恢復按鈕狀態
    elements.drawBtn.disabled = false;
    elements.drawBtn.textContent = "🎲 開始抽獎";
  }, DRAW_ANIMATION_DURATION);

  state.activeTimeouts.push(timeoutId);
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

  // 儲存當前抽獎結果
  state.currentWinners = winners;

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
function handleClear() {
  if (elements.participantsInput.value.trim() === "") return;

  if (confirm("確定要清空名單嗎？")) {
    elements.participantsInput.value = "";
    updateParticipantCount();
  }
}

// ===== 重置抽獎 =====
function handleReset() {
  clearAnimationTimers();
  state.drawnParticipants = [];
  state.currentWinners = [];
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

  const drawTitle = elements.drawTitleInput.value.trim();

  const record = {
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
function handleClearHistory() {
  if (state.history.length === 0) return;

  if (confirm("確定要清除所有抽獎記錄嗎？")) {
    state.history = [];
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  }
}

// ===== 匯入功能 =====
function handleImportClick() {
  elements.importFile.click();
}

async function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const extension = file.name.split(".").pop().toLowerCase();

    let participants = [];

    switch (extension) {
      case "csv":
        participants = parseCSV(text);
        break;
      case "json":
        participants = parseJSON(text);
        break;
      case "txt":
        participants = parseTXT(text);
        break;
      default:
        alert("不支援的檔案格式，請使用 CSV、JSON 或 TXT 檔案");
        return;
    }

    if (participants.length === 0) {
      alert("檔案中沒有找到有效的參與者名單");
      return;
    }

    // 詢問是否覆蓋現有名單
    const shouldReplace =
      elements.participantsInput.value.trim() === "" ||
      confirm(
        `找到 ${participants.length} 位參與者。是否要覆蓋現有名單？\n按「取消」將會附加到現有名單。`
      );

    if (shouldReplace) {
      elements.participantsInput.value = participants.join("\n");
    } else {
      const currentParticipants = getParticipants();
      const allParticipants = [
        ...new Set([...currentParticipants, ...participants]),
      ];
      elements.participantsInput.value = allParticipants.join("\n");
    }

    updateParticipantCount();
    alert(`成功匯入 ${participants.length} 位參與者`);
  } catch (error) {
    console.error("匯入失敗:", error);
    alert(`匯入失敗: ${error.message}`);
  } finally {
    // 清空 file input 以允許重複匯入相同檔案
    event.target.value = "";
  }
}

// ===== CSV 解析器 =====
function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const participants = [];

  for (const line of lines) {
    // 處理 CSV，支援逗號和分號分隔
    const values = line
      .split(/[,;]/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    // 取第一欄作為參與者名稱（忽略其他欄位）
    if (values.length > 0) {
      participants.push(values[0]);
    }
  }

  // 去除重複
  return [...new Set(participants)];
}

// ===== JSON 解析器 =====
function parseJSON(text) {
  const data = JSON.parse(text);

  // 支援多種 JSON 格式
  if (Array.isArray(data)) {
    // 格式 1: ["name1", "name2", ...]
    if (data.every((item) => typeof item === "string")) {
      return [...new Set(data.filter((item) => item.trim().length > 0))];
    }

    // 格式 2: [{name: "name1"}, {name: "name2"}, ...]
    if (data.every((item) => typeof item === "object" && item.name)) {
      return [
        ...new Set(
          data
            .map((item) => item.name)
            .filter(
              (name) => typeof name === "string" && name.trim().length > 0
            )
        ),
      ];
    }

    // 格式 3: [{participants: [...], ...}, ...]（抽獎記錄格式）
    const firstItemWithParticipants = data.find((item) =>
      Array.isArray(item.participants)
    );
    if (firstItemWithParticipants) {
      return [
        ...new Set(
          firstItemWithParticipants.participants.filter(
            (name) => typeof name === "string" && name.trim().length > 0
          )
        ),
      ];
    }
  }

  // 格式 4: {participants: [...]}
  if (data.participants && Array.isArray(data.participants)) {
    return [
      ...new Set(
        data.participants.filter(
          (name) => typeof name === "string" && name.trim().length > 0
        )
      ),
    ];
  }

  throw new Error("無法識別的 JSON 格式");
}

// ===== TXT 解析器 =====
function parseTXT(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((name, index, self) => self.indexOf(name) === index); // 去除重複
}

// ===== 匯出結果功能 =====
function handleExportResult() {
  if (state.currentWinners.length === 0) {
    alert("目前沒有抽獎結果可匯出");
    return;
  }

  // 詢問匯出格式
  const format = prompt(
    "請選擇匯出格式：\n1. CSV\n2. TXT\n\n請輸入 1 或 2（預設為 TXT）",
    "2"
  );

  if (format === null) return; // 取消

  const drawTitle = elements.drawTitleInput.value.trim();
  const timestamp = formatTimestampForFilename(new Date());

  if (format === "1") {
    // 匯出為 CSV
    const csvContent = generateResultCSV(state.currentWinners, drawTitle);
    downloadFile(
      csvContent,
      `抽獎結果_${timestamp}.csv`,
      "text/csv;charset=utf-8;"
    );
  } else {
    // 匯出為 TXT
    const txtContent = generateResultTXT(state.currentWinners, drawTitle);
    downloadFile(
      txtContent,
      `抽獎結果_${timestamp}.txt`,
      "text/plain;charset=utf-8;"
    );
  }
}

// ===== 生成結果 CSV =====
function generateResultCSV(winners, title) {
  let csv = "序號,姓名\n";

  if (title) {
    csv = `標題,${title}\n${csv}`;
  }

  winners.forEach((winner, index) => {
    csv += `${index + 1},${winner}\n`;
  });

  return csv;
}

// ===== 生成結果 TXT =====
function generateResultTXT(winners, title) {
  let txt = "";

  if (title) {
    txt += `【${title}】\n\n`;
  }

  txt += "抽獎結果：\n";
  winners.forEach((winner, index) => {
    txt += `${index + 1}. ${winner}\n`;
  });

  txt += `\n總計：${winners.length} 位`;

  return txt;
}

// ===== 匯出記錄功能 =====
function handleExportHistory() {
  if (state.history.length === 0) {
    alert("目前沒有抽獎記錄可匯出");
    return;
  }

  const timestamp = formatTimestampForFilename(new Date());
  const jsonContent = JSON.stringify(state.history, null, 2);

  downloadFile(
    jsonContent,
    `抽獎記錄_${timestamp}.json`,
    "application/json;charset=utf-8;"
  );

  alert(`成功匯出 ${state.history.length} 筆抽獎記錄`);
}

// ===== 下載檔案 =====
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ===== 工具函式 =====
function formatTimestampForFilename(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}${month}${day}-${hours}${minutes}${seconds}`;
}

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
