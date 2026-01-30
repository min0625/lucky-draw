# AGENTS.md

A guide for coding agents working on the Lucky Draw project.

## Project Overview

Lucky Draw 是一個純前端的抽獎網頁工具，專為簡單、直觀的抽獎活動設計。本專案使用 HTML、CSS 和 JavaScript 技術，無需後端伺服器，所有邏輯在瀏覽器端執行，確保使用者資料的隱私與安全。

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript (無框架)
- 純靜態網站，可部署至任何靜態網站託管服務

## Development Environment

### Setup Commands

```bash
# 無需安裝依賴，直接開啟 index.html 即可
# 若需本地伺服器測試，可使用：
python -m http.server 8000
```

### Testing

- 在瀏覽器中開啟 `index.html` 進行手動測試
- 測試不同瀏覽器的相容性（Chrome、Firefox、Safari、Edge）
- 確認響應式設計在不同裝置上的表現

## Code Style Guidelines

### HTML
- 使用語意化標籤
- 保持適當的縮排（2 空格）
- 為互動元素添加適當的 `aria-*` 屬性以提升無障礙性

### CSS
- 使用 CSS 變數定義顏色主題
- 保持選擇器簡潔明確
- 優先使用 Flexbox/Grid 進行佈局
- 使用 mobile-first 方法撰寫媒體查詢

### JavaScript
- 使用現代 ES6+ 語法
- 變數命名使用 camelCase
- 常數使用 UPPER_CASE
- 添加適當的註解說明複雜邏輯
- 避免使用 `var`，優先使用 `const`，必要時使用 `let`
- 函式保持單一職責原則

## File Structure

```
lucky-draw/
├── index.html          # 主頁面
├── styles.css          # 樣式表（如有）
├── script.js           # 主要 JavaScript 邏輯（如有）
├── README.md           # 專案說明
├── AGENTS.md          # 本文件
└── LICENSE            # 授權資訊
```

## Features to Implement

建議的功能增強方向：
- 參與者名單輸入/管理介面
- 抽獎動畫效果
- 結果顯示與歷史記錄
- 可調整的抽獎設定（單次/多次抽取、重複抽取等）
- 匯入/匯出參與者名單（CSV/JSON）
- 響應式設計支援行動裝置

## Security Considerations

- 不收集或傳送任何使用者資料至外部伺服器
- 所有資料僅存於使用者瀏覽器的記憶體或 LocalStorage
- 避免使用 `eval()` 或其他不安全的程式碼執行方式
- 若使用 LocalStorage，需在使用者清除資料前告知

## Deployment

本專案為純靜態網站，可部署至：
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- 任何支援靜態網站的託管服務

部署步驟：
1. 將專案檔案推送至 Git 倉庫
2. 連接至託管服務
3. 設定根目錄為部署目錄
4. 部署完成

## Commit Message Guidelines

遵循 Conventional Commits 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

Type:
- `feat`: 新功能
- `fix`: 錯誤修復
- `docs`: 文件更新
- `style`: 程式碼格式調整（不影響功能）
- `refactor`: 重構程式碼
- `perf`: 效能優化
- `test`: 測試相關
- `chore`: 建置工具或輔助工具變動

範例：
```
feat(draw): add random draw animation
fix(ui): correct button alignment on mobile
docs(readme): update setup instructions
```

## Pull Request Guidelines

- PR 標題格式：`<type>: <description>`
- 提供清楚的變更說明
- 確保程式碼已在多個瀏覽器測試
- 保持 commit 歷史清晰
- 遵循專案的程式碼風格

## Accessibility

- 確保所有互動元素可透過鍵盤操作
- 提供適當的 ARIA 標籤
- 保持良好的色彩對比度（至少 WCAG AA 標準）
- 字體大小應易於閱讀
- 支援螢幕閱讀器

## Browser Support

目標支援的瀏覽器：
- Chrome (最新版及前兩個版本)
- Firefox (最新版及前兩個版本)
- Safari (最新版及前兩個版本)
- Edge (最新版及前兩個版本)

## Notes for Agents

- 本專案強調簡單性，避免引入不必要的依賴或框架
- 優先考慮使用者體驗和介面的直觀性
- 所有變更應保持向後相容性
- 新增功能前，考慮是否會增加專案的複雜度
- 保持程式碼可讀性，方便未來維護
