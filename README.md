# Lucky Draw

一個簡單、直觀的純前端抽獎網頁工具。

## 特色

- 🎯 **純前端實作** - 無需後端伺服器，所有邏輯在瀏覽器執行
- 🔒 **隱私保護** - 所有資料僅存於本地，不上傳任何資訊
- 📱 **響應式設計** - 支援桌面與行動裝置
- ⚡ **輕量快速** - 使用原生 JavaScript，無框架依賴
- 🎨 **易於使用** - 簡潔直觀的使用者介面

## 快速開始

### 方式零：線上試玩（最快）

前往 [https://min0625.github.io/lucky-draw/](https://min0625.github.io/lucky-draw/) 立即線上使用，無需安裝。

### 方式一：直接開啟（推薦）

在瀏覽器中直接開啟 `index.html` 檔案，無需任何安裝或設定。

### 方式二：本地伺服器（選用）

若需要本地伺服器環境進行測試：

```bash
# 安裝依賴
npm install

# 啟動本地伺服器
npx serve
# 然後在瀏覽器訪問顯示的 URL
```

## 開發

### 代碼檢查與格式化

本專案使用 [Biome](https://biomejs.dev/) 進行代碼品質檢查與自動格式化。

```bash
# 檢查代碼品質（顯示錯誤但不修復）
npm run lint

# 自動格式化代碼
npm run format

# 檢查並修復（推薦使用）
npm run check
```

### 代碼風格指南

詳見 [AGENTS.md](AGENTS.md) 的詳細開發指南，包括：
- HTML 語意化與無障礙設計建議
- CSS 變數與佈局最佳實踐
- JavaScript 命名慣例與函式設計原則
- Commit 訊息與 Pull Request 規範

## 使用方法

1. 開啟網頁
2. 輸入參與者名單
3. 點擊開始抽獎
4. 查看抽獎結果

## 技術架構

- HTML5
- CSS3
- Vanilla JavaScript

## 瀏覽器支援

- Chrome (最新版及前兩個版本)
- Firefox (最新版及前兩個版本)
- Safari (最新版及前兩個版本)
- Edge (最新版及前兩個版本)

## 部署

本專案為純靜態網站，可輕鬆部署至：

- [GitHub Pages](https://pages.github.com/)
- [Netlify](https://www.netlify.com/)
- [Vercel](https://vercel.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## 貢獻

歡迎提交 Issue 或 Pull Request！

請參閱 [AGENTS.md](AGENTS.md) 了解開發指南與程式碼規範。

## 授權

請參閱 [LICENSE](LICENSE) 文件。
