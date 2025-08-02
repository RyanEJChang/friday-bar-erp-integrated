// backend/src/app.js
// Friday's Bar ERP 主程式

// 1. 載入環境變數 (讀取 .env)
require('dotenv').config({ path: '../.env' });
const http = require('http');
const socketManager = require('./utils/socket');


// 2. 載入需要的套件 
const express = require('express');
const cors = require('cors');

// 3. 建立 Express 應用程式 
const app = express();

// 4. 設定中間件 

// 4.1 CORS 設定 - 允許前端網站連接
app.use(cors({
    origin: [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        process.env.FRONTEND_URL || "http://localhost:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 4.2 JSON 解析 
app.use(express.json());

// 4.3 靜態檔案服務 - 讓客戶可以下載上傳的檔案
app.use('/uploads', express.static('uploads'));

// 5. 定義路由 

// 5.1 基本路由 - 測試伺服器是否正常
app.get('/', (req, res) => {
    res.json({
        message: '🍺 歡迎來到 Friday\'s Bar ERP 系統！',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        status: 'running',
        environment: process.env.NODE_ENV || 'development'
    });
});

// 5.2 健康檢查路由 - 確認系統狀態
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
    });
});

// 5.3 API 版本資訊
app.get('/api', (req, res) => {
    res.json({
        name: 'Friday\'s Bar ERP API',
        version: '1.0.0',
        description: '校園酒吧管理系統 API',
        endpoints: {
            items: '/api/items',
            orders: '/api/orders',
            materials: '/api/materials',
            finance: '/api/finance'
        }
    });
});

// 5.4 資料庫健康檢查路由
app.get('/db', async (req, res) => {
    try {
        console.log('🔍 開始資料庫健康檢查...');
        
        // 延遲載入資料庫連接，避免循環載入問題
        const database = require('./database/connection');
        
        console.log('🔍 執行健康檢查...');
        const healthCheck = await database.healthCheck();
        
        console.log('🔍 取得資料庫資訊...');
        const dbInfo = await database.getInfo();
        
        console.log('✅ 資料庫檢查完成');
        res.json({
            ...healthCheck,
            database_info: dbInfo
        });
    } catch (error) {
        console.error('❌ 資料庫檢查錯誤:', error);
        res.status(500).json({
            status: 'unhealthy',
            message: '資料庫連接失敗',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// 5.5 臨時測試路由 - 查看範例品項
app.get('/test-items', async (req, res) => {
    try {
        const database = require('./database/connection');
        const items = await database.query('SELECT * FROM items');
        res.json({
            message: '品項資料查詢成功',
            count: items.length,
            items: items
        });
    } catch (error) {
        res.status(500).json({
            error: '查詢品項失敗',
            message: error.message
        });
    }
});

// ==========================================
// 業務邏輯路由
// ==========================================

// 品項管理路由
const itemsRouter = require('./routes/items');
app.use('/api/items', itemsRouter);

console.log('📋 品項管理 API 已載入: /api/items');


// 在品項管理路由後加入
const ordersRouter = require('./routes/orders');
app.use('/api/orders', ordersRouter);

console.log('🍽️ 點單管理 API 已載入: /api/orders');


const materialsRouter = require('./routes/materials');
app.use('/api/materials', materialsRouter);

console.log('📦 材料管理 API 已載入: /api/materials');


// 6. 404 錯誤處理 (客人要求不存在的服務)
app.use('*', (req, res) => {
    res.status(404).json({
        error: '找不到請求的資源',
        message: `路徑 ${req.originalUrl} 不存在`,
        availableEndpoints: ['/', '/health', '/api']
    });
});

// 7. 錯誤處理中間件 (處理系統錯誤)
app.use((error, req, res, next) => {
    console.error('系統錯誤:', error);
    res.status(500).json({
        error: '內部伺服器錯誤',
        message: process.env.NODE_ENV === 'development' ? error.message : '請稍後再試'
    });
});

// 8. 建立 HTTP 伺服器並整合 Socket.io (開店營業 + 即時通訊)
const PORT = process.env.PORT || 3001;

// 除錯資訊
console.log('🔍 除錯資訊:');
console.log('PORT from env:', process.env.PORT);
console.log('Final PORT:', PORT);
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('---');

// 建立 HTTP 伺服器
const server = http.createServer(app);

// 初始化 Socket.io
const io = socketManager.initialize(server);

// 將 socketManager 設定到 app 中供其他模組使用
app.set('socketManager', socketManager);

// 啟動伺服器
server.listen(PORT, '0.0.0.0', () => {
    // 啟動成功後的額外檢查
    const address = server.address();
    console.log('🔍 伺服器實際監聽:');
    console.log('   IP:', address.address);
    console.log('   埠號:', address.port);
    console.log('   協議:', address.family);
    
    console.log(`
🍺 ======================================
   Friday's Bar ERP 伺服器啟動成功！
======================================
🌐 伺服器地址: http://localhost:${PORT}
📚 API 文件:   http://localhost:${PORT}/api
🏥 健康檢查:   http://localhost:${PORT}/health
🔌 Socket.io:  已啟用即時同步功能
🌍 環境模式:   ${process.env.NODE_ENV || 'development'}
⏰ 啟動時間:   ${new Date().toLocaleString('zh-TW')}
======================================
    `);
});

// 9. 優雅關閉處理 (安全關店)
process.on('SIGTERM', () => {
    console.log('🛑 收到關閉信號，正在安全關閉伺服器...');
    server.close(() => {
        console.log('✅ 伺服器已安全關閉');
        process.exit(0);
    });
});

// 10. 未處理的錯誤捕獲
process.on('uncaughtException', (error) => {
    console.error('💥 未捕獲的例外:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 未處理的 Promise 拒絕:', reason);
    console.error('Promise:', promise);
    process.exit(1);
});