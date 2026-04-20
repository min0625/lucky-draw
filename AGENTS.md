
# Lucky Draw AGENTS.md

Lucky Draw 是一個純前端的抽獎網頁工具，協助 AI 代理與開發者互動，提升專案協作效率。

---

## AI Agent 行為準則

- 僅能操作本專案（不得存取外部資源或後端服務）
- 嚴格遵循本文件規範與專案代碼風格
- 回應需簡潔明確，避免冗長解釋
- 不得主動推測需求，僅依據明確指示執行
- 需優先維護使用者資料隱私與安全

## AI Agent 可協助的任務範例

- 依據需求修改、優化 HTML/CSS/JS 檔案
- 依據規範檢查並修正代碼品質
- 產生、優化文件內容（如 README、說明）
- 協助撰寫 Conventional Commits 格式提交訊息
- 回答專案結構、開發流程、測試相關問題

## 如何向 AI 提問

- 明確描述需求（如：「新增一個響應式按鈕」）
- 指定檔案或區塊（如：「請優化 styles.css 的 mobile 佈局」）
- 可直接貼上錯誤訊息或需求清單

---


## 快速開始（Quick Setup）

- 本地預覽：直接開啟 `index.html`（無需安裝）
- 本地伺服器：`bun run serve`
- 建置 TypeScript：`bun run build`
- 代碼品質檢查：`bun run check`


## 主要指令（Key Commands）

- `bun run build`：編譯 TypeScript（`script.ts` → `script.js`）
- `bun run serve`：啟動本地伺服器
- `bun run check`：型別檢查 + Biome 代碼品質檢查（僅顯示錯誤）
- `bun run check:type`：僅執行 TypeScript 型別檢查
- `bun run check:biome`：僅執行 Biome 代碼品質檢查
- `bun run fix`：Biome 檢查並自動修復（推薦）


## 專案概覽（Project Overview）

**技術棧：**
- HTML5、CSS3、TypeScript（編譯為原生 JavaScript，無框架）
- Bun 作為執行環境與建置工具
- 純靜態網站，無需後端伺服器
- 所有邏輯於瀏覽器端執行，保障使用者隱私

**檔案結構與說明：**
- `index.html`：主頁面，抽獎 UI 與入口
- `styles.css`：全站樣式表，含主題色與響應式設計
- `script.ts`：主要 TypeScript 原始碼，包含抽獎流程
- `script.js`：編譯後的 JavaScript（由 `bun run build` 產生，勿手動修改）
- `tsconfig.json`：TypeScript 編譯器設定
- `biome.json`：Biome linter/formatter 設定
- `.gitignore`：Git 忽略清單


## 開發環境與品質檢查

**代碼品質工具：**
本專案採用 [Biome](https://biomejs.dev/) 進行自動檢查與格式化，並使用 TypeScript 進行型別檢查。

**檢查範圍：**
- TypeScript 型別正確性（`tsc --noEmit`）
- JavaScript/HTML/CSS/JSON 代碼風格（Biome）
- 程式碼品質問題（如不推薦的全域函數）
- 格式一致性


## 測試說明（Testing Instructions）

**功能測試：**
- 於瀏覽器開啟 `index.html` 進行手動測試
- 驗證抽獎流程、UI 操作、動畫效果

**相容性測試：**
- 測試主流瀏覽器（Chrome、Firefox、Safari、Edge）
- 確認響應式設計於不同裝置表現

**品質檢查：**
- 執行 `bun run check` 確保型別正確且代碼符合標準


## 代碼風格規範（Code Style Guidelines）

> **所有貢獻必須遵循下列規範，違反將不予合併。**

### HTML
- 使用語意化標籤，提升可維護性與無障礙
- 2 空格縮排
- 互動元素需加上適當 `aria-*` 屬性

### CSS
- 以 CSS 變數定義主題色
- 優先採用 Flexbox/Grid 佈局
- 採 mobile-first 撰寫媒體查詢

### JavaScript
- 採用 ES6+ 語法
- 變數命名用 camelCase，常數用 UPPER_CASE
- 優先用 `const`，必要時用 `let`，避免 `var`
- 複雜邏輯需加註解
- 函式保持單一職責


## 提交訊息規範（Commit Message Guidelines）

遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/) 格式：

```
<type>(<scope>): <subject>
```

**type 類型：**
- `feat`：新功能
- `fix`：錯誤修復
- `docs`：文件更新
- `style`：格式調整（不影響功能）
- `refactor`：重構
- `perf`：效能優化

**範例：**
```
feat(draw): add random draw animation
fix(ui): correct button alignment on mobile
docs(readme): update setup instructions
```


## Pull Request 規範

- PR 標題格式：`<type>: <description>`
- 提交前必須執行 `npm run check` 並修正所有問題
- 需於主流瀏覽器測試功能與相容性
- 說明變更內容與動機
- 保持 commit 歷史清晰、乾淨

---
