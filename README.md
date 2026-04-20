# Lucky Draw

> 一個簡單、直觀的純前端抽獎網頁工具，支援桌面與行動裝置，保障隱私、無需安裝。

---

## 🚀 特色亮點

- 🎯 **純前端實作**：無需後端伺服器，所有邏輯皆於瀏覽器執行
- 🔒 **隱私保護**：資料僅存於本地，不上傳任何資訊
- 📱 **響應式設計**：支援桌面、平板與行動裝置
- ⚡ **輕量快速**：原生 JavaScript，無框架依賴
- 🎨 **易於使用**：簡潔直觀的 UI
- 🔊 **動畫與音效**：流暢的抽獎動畫及可選音效
- 📋 **歷史記錄**：自動儲存於 LocalStorage，可隨時查閱或清除

---

## 🏁 快速開始

### 1. 線上試玩（最快）

[立即體驗](https://min0625.github.io/lucky-draw/)（無需安裝）

### 2. 直接開啟（推薦）

下載專案後，直接以瀏覽器開啟 `index.html`。

### 3. 本地伺服器（選用）

如需本地伺服器測試：

```bash
bun install         # 安裝依賴
bun run build       # 編譯 TypeScript（script.ts → script.js）
bun run serve       # 啟動本地伺服器
# 於瀏覽器開啟顯示的網址
```

---

## 🛠️ 使用說明

1. 開啟網頁
2. 輸入參與者名單（每行一人，自動去除空白與重複）
3. 設定抽獎標題／獎品名稱、抽取人數、是否允許重複
4. 點擊「開始抽獎」，欣賞滾動動畫
5. 查看抽獎結果，可一鍵複製或查閱歷史記錄

---

## ✨ 功能一覽

| 功能 | 說明 |
|------|------|
| 參與者管理 | 手動輸入名單、顯示總數、清空、去重 |
| 單次／多次抽獎 | 自由設定每次抽取人數 |
| 允許重複抽取 | 可選擇是否允許同一人被重複抽中 |
| 自訂標題／獎品 | 自訂每輪抽獎的名稱 |
| 抽獎動畫 | 名單滾動效果與結果顯示動畫 |
| 音效（可選） | 滾動與中獎提示音 |
| 結果管理 | 已抽中名單、剩餘名單、複製結果 |
| 歷史記錄 | 以 LocalStorage 儲存，支援清除 |

---

## 🧑‍💻 開發與貢獻

- **建置**：
  - `bun run build`：編譯 TypeScript（`script.ts` → `script.js`）

- **代碼檢查/格式化**：
  - 使用 [Biome](https://biomejs.dev/) 與 TypeScript 工具
  - `bun run check`：型別檢查 + Biome 代碼品質檢查
  - `bun run check:type`：僅執行 TypeScript 型別檢查
  - `bun run check:biome`：僅執行 Biome 代碼品質檢查
  - `bun run fix`：自動修正格式

- **開發規範**：
  - 請詳閱 [AGENTS.md](AGENTS.md)（HTML/CSS/JS 命名、結構、提交訊息、PR 流程等）
  - 違反規範將不予合併

- **歡迎貢獻**：
  - 提交 Issue 或 Pull Request 前，請先檢查代碼品質並於主流瀏覽器測試
  - 詳細功能規劃請參閱 [FEATURES.md](FEATURES.md)

---

## 🏗️ 技術架構

- HTML5
- CSS3（含 CSS 變數、Flexbox、Grid）
- TypeScript（編譯為原生 JavaScript ES6+）
- Bun（執行環境與建置工具）

---

## 🌐 瀏覽器支援

- Chrome、Firefox、Safari、Edge（最新版及前兩版）

---

## 🚢 部署建議

本專案為純靜態網站，適合部署於：

- [GitHub Pages](https://pages.github.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

---

## ❓ 常見問題

**Q: 參與者名單會被上傳嗎？**
A: 不會，所有資料僅於本地瀏覽器記憶體中運作。

**Q: 可以自訂抽獎動畫或樣式嗎？**
A: 歡迎 Fork 或修改原始碼，並依 [AGENTS.md](AGENTS.md) 貢獻規範提交 PR。

**Q: 有支援手機操作嗎？**
A: 有，UI 響應式設計，適用各種裝置。

**Q: 歷史記錄會消失嗎？**
A: 歷史記錄儲存於瀏覽器 LocalStorage，清除瀏覽器資料或手動點擊清除才會消失。

---

## 📄 授權

本專案採用 MIT 授權，詳見 [LICENSE](LICENSE)。

---

## 📬 聯絡方式

如有建議或問題，歡迎開 Issue 或聯絡 [min0625](https://github.com/min0625)。
