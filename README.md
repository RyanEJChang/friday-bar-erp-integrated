# 🍺 Friday's Bar ERP 系統

> 校園酒吧完整管理系統，包含點單、庫存、財務等功能

![專案狀態](https://img.shields.io/badge/狀態-開發中-yellow)
![版本](https://img.shields.io/badge/版本-1.0.0-blue)
![技術棧](https://img.shields.io/badge/技術棧-React+Node.js-green)

---

## 📋 系統簡介

Friday's Bar ERP 是專為校園酒吧設計的全方位管理系統，支援前後端分離架構與即時同步功能！

### 🎯 主要功能
- **📱 點單系統** - 外場點單、內場出酒，Socket.io 即時同步
- **📦 庫存管理** - 材料清點、庫存警示、自動補貨提醒
- **💰 財務管理** - 自動計算成本、毛利、淨利分析
- **📚 SOP文件庫** - 操作手冊、標準流程管理
- **👥 多用戶權限** - 外場、內場、財務、管理員分權管理

### ✅ 已完成功能
- ✅ 品項管理 (完整 CRUD)
- ✅ 點單系統 (外場→內場即時同步)
- ✅ 材料庫存管理
- ✅ Socket.io 即時通訊
- ✅ SQLite 資料庫架構

### 🚧 開發中功能
- 🔄 使用者認證系統
- 🔄 財務報表系統
- 🔄 SOP 文件管理
- 🔄 進階統計分析

---

## 🛠️ 技術棧

### 後端
- **Node.js 22+** + Express.js
- **SQLite** 資料庫
- **Socket.io** 即時通訊
- **JWT** 認證 (開發中)

### 前端
- **React 18** + TypeScript
- **Vite** 構建工具
- **shadcn/ui** + Tailwind CSS
- **TanStack Query** 狀態管理
- **React Router** 路由管理

---

## 🚀 快速開始

### 方法一：一鍵啟動 (推薦)
```bash
# 克隆專案
git clone https://github.com/RyanEJChang/friday-bar-erp-integrated.git
cd friday-bar-erp-integrated

# 安裝所有依賴
npm install
npm run install-all

# 一鍵啟動前後端
npm run dev
```

### 方法二：分別啟動
```bash
# 啟動後端 (終端機 1)
cd backend
npm install
npm run dev

# 啟動前端 (終端機 2)
cd frontend
npm install
npm run dev
```

### 📱 訪問系統
- **前端界面**: http://localhost:3000
- **後端 API**: http://localhost:3001
- **健康檢查**: http://localhost:3001/health

---

## 📁 專案結構

```
friday-bar-erp/
├── 📄 README.md              # 專案說明文件
├── 📄 package.json           # 根目錄設定 (同時啟動前後端)
├── 📂 backend/               # Node.js 後端
│   ├── 📂 src/
│   │   ├── 📂 database/     # 資料庫連接與初始化
│   │   ├── 📂 routes/       # API 路由
│   │   │   ├── items.js     # 品項管理 API
│   │   │   ├── orders.js    # 訂單管理 API
│   │   │   └── materials.js # 材料管理 API
│   │   └── 📂 utils/        # Socket.io 工具
│   ├── 📂 database/         # SQLite 資料庫檔案
│   └── 📄 package.json      # 後端依賴清單
├── 📂 frontend/             # React 前端
│   ├── 📂 src/
│   │   ├── 📂 components/   # UI 組件
│   │   ├── 📂 pages/        # 頁面組件
│   │   └── 📂 lib/          # 工具函數
│   └── 📄 package.json      # 前端依賴清單
└── 📂 node_modules/         # 根目錄依賴
```

---

## 🍹 API 文件

### 品項管理
```http
GET    /api/items                    # 取得所有品項
GET    /api/items/:name              # 取得特定品項
POST   /api/items                    # 新增品項
PUT    /api/items/:name              # 更新品項
DELETE /api/items/:name              # 刪除品項
GET    /api/items/:name/profit-analysis  # 獲利分析
```

### 訂單管理
```http
GET    /api/orders                   # 取得所有訂單
GET    /api/orders/front             # 外場訂單視圖
GET    /api/orders/bar               # 內場工作清單
POST   /api/orders                   # 外場下單
PUT    /api/orders/:id/claim         # 調酒師認領訂單
PUT    /api/orders/:id/served        # 標記訂單完成
GET    /api/orders/stats             # 訂單統計
```

### 材料管理
```http
GET    /api/materials                # 取得所有材料
GET    /api/materials/:name          # 取得特定材料
POST   /api/materials                # 新增材料
PUT    /api/materials/:name          # 更新材料
DELETE /api/materials/:name          # 刪除材料
PUT    /api/materials/:name/stock    # 庫存調整
GET    /api/materials/alerts/low-stock  # 低庫存警示
```

### 系統狀態
```http
GET    /health                       # 健康檢查
GET    /db                          # 資料庫狀態
GET    /api                         # API 版本資訊
```

---

## 🔌 Socket.io 即時功能

### 連接事件
```javascript
// 加入角色房間
socket.emit('join_room', { role: 'front', user_name: '使用者名稱' });

// 監聽新訂單 (內場)
socket.on('new_order', (data) => {
  // 處理新訂單通知
});

// 監聽訂單狀態更新 (外場)
socket.on('order_status_update', (data) => {
  // 處理訂單完成通知
});

// 監聽庫存警示
socket.on('inventory_alert', (data) => {
  // 處理庫存不足警示
});
```

---

## 🎯 使用者角色權限

| 角色 | 功能權限 | 描述 |
|------|----------|------|
| 🍽️ **外場人員** | 點單系統 | 查看菜單、新增訂單、查看訂單狀態 |
| 🍸 **內場人員** | 出酒系統 + 庫存 | 認領訂單、標記完成、管理材料庫存 |
| 💰 **財務人員** | 報帳 + 報表 | 管理財務記錄、產生營業報表 |
| 👑 **管理員** | 全部功能 | 品項管理、使用者管理、系統設定 |

---

## 🔧 開發指令

### 根目錄指令
```bash
npm run dev          # 同時啟動前後端
npm run backend      # 只啟動後端
npm run frontend     # 只啟動前端
npm run install-all  # 安裝前後端依賴
npm run build        # 建置前端生產版本
```

### 後端指令
```bash
cd backend
npm run dev          # 開發模式啟動
npm start            # 生產模式啟動
npm run db:init      # 初始化資料庫 (如需要)
```

### 前端指令
```bash
cd frontend
npm run dev          # 開發模式啟動
npm run build        # 建置生產版本
npm run preview      # 預覽生產版本
```

---

## 🌐 環境設定

### 前端環境變數 (`frontend/.env`)
```bash
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
REACT_APP_ENV=development
VITE_PORT=3000
```

### 後端環境變數 (`backend/.env` 或根目錄 `.env`)
```bash
PORT=3001
DB_PATH=./database/friday_bar.db
JWT_SECRET=friday_bar_secret_key_2024
UPLOAD_PATH=./uploads
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

---

## 🐛 常見問題排除

### Q: 無法啟動服務
```bash
# 檢查端口是否被佔用
lsof -i :3000
lsof -i :3001

# 清除依賴重新安裝
rm -rf node_modules package-lock.json
npm install
```

### Q: Socket.io 連接失敗
```bash
# 檢查 CORS 設定
# 確認前端 .env 中的 SOCKET_URL 正確
# 查看瀏覽器 Console 是否有錯誤
```

### Q: 資料庫錯誤
```bash
# 重新初始化資料庫
cd backend
rm -f database/friday_bar.db
npm run db:init
```

---

## 📈 開發進度

### ✅ 已完成 (v1.0.0)
- [x] 基礎架構建立
- [x] 品項管理 CRUD API
- [x] 訂單管理系統
- [x] 材料庫存管理
- [x] Socket.io 即時同步
- [x] 前後端整合

### 🚧 開發中 (v1.1.0)
- [ ] 使用者認證系統 (`/api/auth/*`)
- [ ] 財務管理 API (`/api/finance/*`) 
- [ ] SOP 文件管理 (`/api/sops/*`)
- [ ] 進階統計報表

### 📋 計劃中 (v1.2.0)
- [ ] 檔案上傳功能
- [ ] 匯出報表功能
- [ ] 行動裝置優化
- [ ] 多語言支援

---

## 🤝 貢獻指南

1. **Fork** 專案
2. **建立**功能分支 (`git checkout -b feature/NewFeature`)
3. **提交**變更 (`git commit -m 'Add NewFeature'`)
4. **推送**到分支 (`git push origin feature/NewFeature`)
5. **建立** Pull Request

---

## 📄 授權

MIT License - 詳見 [LICENSE](LICENSE) 檔案

---

## 📞 聯絡資訊

- **開發者**: 經濟26張恩睿
- **Email**: ryan.ej.chang@gmail.com
- **GitHub**: [@RyanEJChang](https://github.com/RyanEJChang)
- **專案啟始**: 2025年8月1日

---

## 🙏 致謝

感謝所有為此專案提供建議和協助的朋友們！

---

*💡 這個 README 隨專案發展持續更新 | 最後更新: 2025-08-02*