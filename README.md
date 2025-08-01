# 🍺 Friday's Bar ERP 系統

> 校園酒吧完整管理系統，包含點單、庫存、財務等功能

![專案狀態](https://img.shields.io/badge/狀態-開發中-yellow)
![版本](https://img.shields.io/badge/版本-1.0.0-blue)

---

## 📋 系統簡介

Friday's Bar ERP 是專為校園酒吧設計的全方位管理系統，就像給酒吧裝上大腦！

### 🎯 主要功能
- **📱 點單系統** - 外場點單、內場出酒，即時同步
- **📦 庫存管理** - 材料清點、庫存警示
- **💰 財務管理** - 自動計算成本、毛利、淨利
- **📚 SOP文件庫** - 操作手冊、標準流程
- **👥 多用戶權限** - 外場、內場、管理員分權管理

---

## 🛠️ 技術需求

在開始之前，您的電腦需要安裝：

### 必要軟體
- **Node.js 16+** - JavaScript 執行環境
- **npm 8+** - 套件管理工具
- **Git** - 版本控制工具

### 檢查是否已安裝
```bash
node --version    # 應該顯示 v16.0.0 或更新版本
npm --version     # 應該顯示 8.0.0 或更新版本
git --version     # 應該有版本號
```

---

## 🚀 快速開始

### 1️⃣ 下載專案
```bash
# 如果您有 Git 倉庫
git clone [您的倉庫網址]
cd friday-bar-erp

# 如果您是直接下載
cd friday-bar-erp
```

### 2️⃣ 設定環境變數
```bash
# 複製範例設定檔
cp .env.example .env

# 用編輯器打開 .env，修改成您的設定
# 主要修改：資料庫路徑、密碼等
```

### 3️⃣ 安裝後端套件
```bash
cd backend
npm install
```

### 4️⃣ 安裝前端套件
```bash
cd ../frontend
npm install
```

### 5️⃣ 初始化資料庫
```bash
cd ../backend
npm run db:init
```

### 6️⃣ 啟動系統
```bash
# 啟動後端 (在一個終端機視窗)
cd backend
npm run dev

# 啟動前端 (在另一個終端機視窗)
cd frontend
npm start
```

### 7️⃣ 開啟瀏覽器
- 前端界面：http://localhost:3000
- 後端 API：http://localhost:3001

---

## 📁 專案結構

```
friday-bar-erp/
├── 📄 README.md              # 您正在看的這個檔案
├── 📄 .env                   # 環境設定檔 (不會上傳到 Git)
├── 📄 .gitignore            # Git 忽略清單
├── 📂 backend/               # 後端程式碼
│   ├── 📂 src/
│   │   ├── 📂 database/     # 資料庫相關程式
│   │   ├── 📂 routes/       # API 路由 (處理網路請求)
│   │   ├── 📂 models/       # 資料模型
│   │   └── 📂 utils/        # 工具函數
│   ├── 📂 uploads/          # 上傳檔案存放處
│   └── 📄 package.json      # 後端套件清單
├── 📂 frontend/             # 前端程式碼
│   ├── 📂 src/
│   │   ├── 📂 components/   # React 組件
│   │   ├── 📂 pages/        # 網頁頁面
│   │   └── 📂 services/     # API 呼叫服務
│   └── 📄 package.json      # 前端套件清單
└── 📂 backup/               # 備份檔案
```

---

## 🍹 系統功能詳細說明

### 1. 品項管理
- ✅ 新增/編輯/刪除調酒品項
- ✅ 自動計算毛利 (售價 - 酒類成本 - 其他成本)
- ✅ 材料清單管理
- ✅ 成本分析

### 2. 點單系統 
- ✅ 外場點單界面 (服務生使用)
- ✅ 內場出酒管理 (調酒師使用)
- ✅ 即時狀態同步 (點單後立即顯示在內場)
- ✅ 桌號管理

### 3. 庫存管理
- ✅ 材料清點功能
- ✅ 庫存不足警示 (紅字提醒)
- ✅ 採購需求清單

### 4. 財務管理
- ✅ 報帳系統 (發票上傳)
- ✅ 營業報表自動生成
- ✅ 毛利、淨利自動計算
- ✅ 成本分析

### 5. SOP 文件庫
- ✅ 操作手冊管理
- ✅ 版本控制
- ✅ 多人協作編輯

---

## 🔧 開發指令

### 後端指令
```bash
cd backend

npm start         # 正式執行 (生產環境)
npm run dev       # 開發執行 (自動重啟)
npm run db:init   # 初始化資料庫
```

### 前端指令
```bash
cd frontend

npm start         # 開發執行
npm run build     # 建置正式版本
npm test          # 執行測試
```

---

## 🌐 API 文件

### 品項管理 API
```http
GET    /api/items           # 獲取所有品項
POST   /api/items           # 新增品項
PUT    /api/items/:name     # 更新品項
DELETE /api/items/:name     # 刪除品項
```

### 訂單管理 API
```http
GET    /api/orders          # 獲取訂單列表
POST   /api/orders          # 新增訂單
PUT    /api/orders/:id      # 更新訂單狀態
```

### 財務管理 API
```http
GET    /api/expenses        # 獲取報帳列表
POST   /api/expenses        # 新增報帳記錄
GET    /api/reports/daily   # 獲取日報表
```

---

## 👥 使用者權限

| 角色 | 權限 | 說明 |
|------|------|------|
| 🍽️ 外場人員 | 點單系統 | 只能新增訂單、查看菜單 |
| 🍸 內場人員 | 出酒系統 + 庫存 | 可以標記出酒、管理材料 |
| 💰 財務人員 | 報帳 + 報表 | 管理財務、查看報表 |
| 👑 管理員 | 全部功能 | 所有功能 + 使用者管理 |

---

## 🛡️ 環境變數說明

在 `.env` 檔案中設定：

```bash
# 伺服器設定
PORT=3001                    # 後端伺服器埠號
NODE_ENV=development         # 環境模式 (development/production)

# 資料庫設定
DB_PATH=./backend/database/friday_bar.db  # 資料庫檔案位置

# 安全設定
JWT_SECRET=your_secret_key   # JWT 加密密鑰 (請改成您的密碼)

# 檔案上傳設定
UPLOAD_PATH=./backend/uploads     # 檔案上傳目錄
MAX_FILE_SIZE=5000000            # 最大檔案大小 (5MB)

# 前端設定
FRONTEND_URL=http://localhost:3000  # 前端網址 (CORS 用)
```

---

## 🐛 常見問題

### Q: 執行 npm install 時出現錯誤
**A:** 請確認 Node.js 版本是 16 以上，並嘗試清除快取：
```bash
npm cache clean --force
npm install
```

### Q: 無法連接資料庫
**A:** 請確認：
1. `.env` 檔案中的 `DB_PATH` 設定正確
2. 已執行 `npm run db:init` 初始化資料庫
3. 資料庫檔案有正確的讀寫權限

### Q: 前端無法連接後端 API
**A:** 請確認：
1. 後端是否正常運行在 port 3001
2. `.env` 檔案中的 `FRONTEND_URL` 設定
3. 防火牆是否阻擋連接

### Q: 檔案上傳失敗
**A:** 請確認：
1. `uploads` 資料夾是否存在
2. 檔案大小是否超過 `MAX_FILE_SIZE` 限制
3. 檔案格式是否被允許

---

## 📝 開發日誌

- **2025-08-01** - 專案初始化，基礎架構建立
- **即將推出** - 品項管理系統
- **即將推出** - 點單系統
- **即將推出** - 財務管理系統

---

## 🤝 貢獻指南

歡迎提出建議和改進！

1. Fork 這個專案
2. 建立您的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的修改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

---

## 📄 授權

這個專案使用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案

---

## 📞 聯絡資訊

- **開發者：** [經濟26張恩睿]
- **Email：** [ryan.ej.chang@gmail.com]
- **專案開始日期：** 2025年8月1日

---

## 🙏 致謝

感謝所有為這個專案做出貢獻的人！

---

*💡 這個 README 會隨著專案發展持續更新*