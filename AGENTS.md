# AGENTS.md

Lucky Draw 是一個純前端的抽獎網頁工具，專為簡單、直觀的抽獎活動設計。本 AGENTS.md 提供協助 AI 編碼代理與專案互動所需的指導。

## Quick Setup

- 直接開啟 `index.html` 在瀏覽器預覽（無需安裝）
- 若需本地伺服器測試：`npx serve`
- 執行品質檢查：`npm run check`

## Key Commands

- `npm run lint` - 檢查代碼品質（顯示錯誤但不修復）
- `npm run format` - 自動格式化所有文件
- `npm run check` - 檢查並自動修復（推薦使用）

## Project Overview

**Tech Stack:**
- HTML5、CSS3、Vanilla JavaScript（無框架）
- 純靜態網站，無需後端伺服器
- 所有邏輯在瀏覽器端執行，確保使用者資料隱私與安全

**File Structure:**
- `index.html` - 主頁面
- `styles.css` - 樣式表
- `script.js` - 主要 JavaScript 邏輯
- `biome.json` - Biome linter/formatter 配置
- `.biomeignore` - Biome 忽略清單

## Development Environment

**Code Quality Tool:**

本專案使用 [Biome](https://biomejs.dev/) 進行代碼檢查和自動格式化。

**檢查範圍：**
- JavaScript/HTML/CSS/JSON 代碼風格
- 程式碼品質問題（如使用不推薦的全域函數）
- 格式一致性

## Testing Instructions

- 在瀏覽器中開啟 `index.html` 進行手動測試
- 測試不同瀏覽器的相容性（Chrome、Firefox、Safari、Edge）
- 確認響應式設計在不同裝置上的表現
- 執行 `npm run check` 確保代碼符合品質標準

## Code Style Guidelines

### HTML
- 使用語意化標籤
- 保持適當的縮排（2 空格）
- 為互動元素添加適當的 `aria-*` 屬性

### CSS
- 使用 CSS 變數定義顏色主題
- 優先使用 Flexbox/Grid 進行佈局
- 使用 mobile-first 方法撰寫媒體查詢

### JavaScript
- 使用現代 ES6+ 語法
- 變數命名使用 camelCase，常數使用 UPPER_CASE
- 優先使用 `const`，必要時使用 `let`，避免 `var`
- 添加適當的註解說明複雜邏輯
- 函式保持單一職責原則

## Commit Message Guidelines

遵循 Conventional Commits 格式：

```
<type>(<scope>): <subject>
```

**Types:**
- `feat` - 新功能
- `fix` - 錯誤修復
- `docs` - 文件更新
- `style` - 代碼格式調整（不影響功能）
- `refactor` - 重構代碼
- `perf` - 效能優化

**Examples:**
```
feat(draw): add random draw animation
fix(ui): correct button alignment on mobile
docs(readme): update setup instructions
```

## Pull Request Guidelines

- PR 標題格式：`<type>: <description>`
- 提交前執行：`npm run check`（檢查並修復代碼質量）
- 在多個瀏覽器（Chrome、Firefox、Safari、Edge）上測試
- 提供清楚的變更說明
- 保持 commit 歷史清晰
