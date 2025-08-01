// backend/src/database/init.js
// Friday's Bar ERP 資料庫初始化程式

require('dotenv').config({ path: '../.env' });
const database = require('./connection');

// 資料表結構定義 
const tables = {
    // 品項資料表 
    items: `
        CREATE TABLE IF NOT EXISTS items (
            name TEXT PRIMARY KEY,                    -- 品項名稱 (主鍵)
            base_liquor TEXT,                        -- 基酒種類
            price DECIMAL(10,2) NOT NULL,            -- 售價
            liquor_cost DECIMAL(10,2) NOT NULL,      -- 酒類成本
            other_cost DECIMAL(10,2) NOT NULL,       -- 其他成本
            materials TEXT,                          -- 所需材料 (JSON 格式)
            notes TEXT,                              -- 備註
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 建立時間
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP   -- 更新時間
        )
    `,

    // 外場點單資料表 
    front_orders: `
        CREATE TABLE IF NOT EXISTS front_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 訂單編號
            table_number TEXT NOT NULL,              -- 桌號
            item_name TEXT NOT NULL,                 -- 品項名稱
            price DECIMAL(10,2) NOT NULL,            -- 單價
            adjustment DECIMAL(10,2) DEFAULT 0,     -- 調價/折扣
            total_price DECIMAL(10,2) NOT NULL,      -- 總價
            liquor_cost DECIMAL(10,2) NOT NULL,      -- 酒類成本
            other_cost DECIMAL(10,2) NOT NULL,       -- 其他成本
            net_revenue DECIMAL(10,2) NOT NULL,      -- 淨收入
            available_today BOOLEAN DEFAULT 1,      -- 今日可售
            order_time DATETIME DEFAULT CURRENT_TIMESTAMP,  -- 點餐時間
            orderer TEXT,                            -- 點單者
            served_status BOOLEAN DEFAULT 0,        -- 出酒狀態
            notes TEXT,                              -- 附註
            FOREIGN KEY (item_name) REFERENCES items(name)
        )
    `,

    // 內場出酒資料表 
    bar_orders: `
        CREATE TABLE IF NOT EXISTS bar_orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 出酒單編號
            front_order_id INTEGER NOT NULL,        -- 對應的外場訂單
            table_number TEXT NOT NULL,              -- 桌號
            item_name TEXT NOT NULL,                 -- 品項名稱
            bartender TEXT,                          -- 調酒師
            is_served BOOLEAN DEFAULT 0,            -- 已出酒
            order_time DATETIME NOT NULL,            -- 點單時間
            served_time DATETIME,                    -- 出酒時間
            notes TEXT,                              -- 附註
            orderer TEXT,                            -- 點單者
            FOREIGN KEY (front_order_id) REFERENCES front_orders(id)
        )
    `,

    // 材料清點資料表 
    materials: `
        CREATE TABLE IF NOT EXISTS materials (
            name TEXT PRIMARY KEY,                   -- 材料名稱
            need_pickup BOOLEAN DEFAULT 0,          -- 需要領取
            picked_up BOOLEAN DEFAULT 0,            -- 已領取
            liquor_type TEXT,                       -- 基酒種類
            is_homemade BOOLEAN DEFAULT 0,          -- 自製材料
            stock_quantity INTEGER DEFAULT 0,       -- 庫存數量
            min_stock INTEGER DEFAULT 0,            -- 最低庫存
            unit TEXT DEFAULT '瓶',                 -- 計量單位
            notes TEXT,                              -- 備註
            usage TEXT,                              -- 用途 (JSON 格式)
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,

    // 報帳資料表 
    expenses: `
        CREATE TABLE IF NOT EXISTS expenses (
            expense_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 報帳編號
            item TEXT NOT NULL,                      -- 購買品項
            date DATE NOT NULL,                      -- 購買日期
            purchaser TEXT NOT NULL,                 -- 購買人
            amount DECIMAL(10,2) NOT NULL,           -- 購買金額
            invoice_file TEXT,                       -- 發票檔案路徑
            invoice_uploaded BOOLEAN DEFAULT 0,     -- 發票已上傳
            reimbursed BOOLEAN DEFAULT 0,            -- 已請款
            category TEXT DEFAULT '其他',            -- 支出類別
            notes TEXT,                              -- 備註
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,

    // 營業報表資料表 
    daily_reports: `
        CREATE TABLE IF NOT EXISTS daily_reports (
            business_id INTEGER PRIMARY KEY AUTOINCREMENT,  -- 營業編號
            date DATE UNIQUE NOT NULL,               -- 營業日期
            gross_profit DECIMAL(10,2) DEFAULT 0,   -- 毛利
            total_liquor_cost DECIMAL(10,2) DEFAULT 0,  -- 酒類總成本
            total_other_cost DECIMAL(10,2) DEFAULT 0,   -- 其他總成本
            transferred_to_club BOOLEAN DEFAULT 0,  -- 已匯入社團帳戶
            net_profit DECIMAL(10,2) DEFAULT 0,     -- 淨利
            profit_margin DECIMAL(10,4) DEFAULT 0,  -- 淨利率
            sender TEXT,                             -- 匯款人
            receiver TEXT,                           -- 收款人
            payment_confirmed BOOLEAN DEFAULT 0,    -- 確認收款
            notes TEXT,                              -- 備註
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `,

    // SOP文件資料表 
    sops: `
        CREATE TABLE IF NOT EXISTS sops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,    -- SOP編號
            title TEXT NOT NULL,                     -- 標題
            type TEXT CHECK(type IN ('front', 'bar', 'prep')) NOT NULL,  -- SOP類型
            content TEXT NOT NULL,                   -- 內容 (Markdown)
            version INTEGER DEFAULT 1,              -- 版本號
            is_active BOOLEAN DEFAULT 1,            -- 是否啟用
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_by TEXT                          -- 更新者
        )
    `
};

// 初始化資料庫
async function initDatabase() {
    console.log('開始初始化 Friday\'s Bar ERP 資料庫...\n');
    
    try {
        // 建立資料表
        console.log('📋 建立資料表...');
        for (const [tableName, createSQL] of Object.entries(tables)) {
            console.log(`   ├── 建立 ${tableName} 資料表`);
            await database.run(createSQL);
        }
        
        // 檢查建立的資料表
        console.log('\n🔍 檢查資料表結構...');
        const dbInfo = await database.getInfo();
        console.log('   ├── 資料庫位置:', dbInfo.database_path);
        console.log('   ├── SQLite 版本:', dbInfo.sqlite_version[0]?.version);
        console.log('   ├── 資料表數量:', dbInfo.table_count);
        console.log('   └── 資料表清單:', dbInfo.tables.join(', '));
        
        // 插入初始資料
        await insertSampleData();
        
        console.log('\n✅ 資料庫初始化完成！');
        console.log('🍺 Friday\'s Bar ERP 準備就緒！\n');
        
    } catch (error) {
        console.error('❌ 資料庫初始化失敗:', error.message);
        throw error;
    }
}

// 插入範例資料 (就像預先寫好一些菜單)
async function insertSampleData() {
    console.log('\n🎯 插入範例資料...');
    
    try {
        // 檢查是否已有資料
        const existingItems = await database.query('SELECT COUNT(*) as count FROM items');
        if (existingItems[0].count > 0) {
            console.log('   ├── 資料已存在，跳過範例資料插入');
            return;
        }
        
        // 插入範例品項
        const sampleItems = [
            {
                name: '經典調酒-威士忌可樂',
                base_liquor: '威士忌',
                price: 180,
                liquor_cost: 80,
                other_cost: 20,
                materials: JSON.stringify(['威士忌', '可樂', '檸檬片', '冰塊']),
                notes: '經典入門調酒'
            },
            {
                name: '夏日特調-莫吉托',
                base_liquor: '蘭姆酒',
                price: 220,
                liquor_cost: 90,
                other_cost: 30,
                materials: JSON.stringify(['白蘭姆酒', '薄荷葉', '萊姆汁', '蘇打水', '糖漿']),
                notes: '清爽夏日調酒'
            },
            {
                name: '果汁調酒-藍色夏威夷',
                base_liquor: '蘭姆酒',
                price: 200,
                liquor_cost: 70,
                other_cost: 40,
                materials: JSON.stringify(['蘭姆酒', '藍柑橘香甜酒', '鳳梨汁', '椰奶']),
                notes: '熱帶風情調酒'
            }
        ];
        
        for (const item of sampleItems) {
            await database.run(`
                INSERT INTO items (name, base_liquor, price, liquor_cost, other_cost, materials, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [item.name, item.base_liquor, item.price, item.liquor_cost, item.other_cost, item.materials, item.notes]);
            console.log(`   ├── 新增範例品項: ${item.name}`);
        }
        
        // 插入範例材料
        const sampleMaterials = [
            { name: '威士忌', liquor_type: '威士忌', stock_quantity: 5, min_stock: 2, unit: '瓶' },
            { name: '蘭姆酒', liquor_type: '蘭姆酒', stock_quantity: 3, min_stock: 1, unit: '瓶' },
            { name: '可樂', liquor_type: '', stock_quantity: 10, min_stock: 3, unit: '瓶' },
            { name: '薄荷葉', liquor_type: '', stock_quantity: 2, min_stock: 1, unit: '包', is_homemade: 0 }
        ];
        
        for (const material of sampleMaterials) {
            await database.run(`
                INSERT INTO materials (name, liquor_type, stock_quantity, min_stock, unit, is_homemade)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [material.name, material.liquor_type, material.stock_quantity, material.min_stock, material.unit, material.is_homemade]);
            console.log(`   ├── 新增範例材料: ${material.name}`);
        }
        
        console.log('   └── 範例資料插入完成');
        
    } catch (error) {
        console.error('❌ 插入範例資料失敗:', error.message);
        throw error;
    }
}

// 如果直接執行此檔案，則初始化資料庫
if (require.main === module) {
    initDatabase()
        .then(() => {
            console.log('🎉 資料庫初始化成功完成！');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 資料庫初始化失敗:', error);
            process.exit(1);
        });
}

module.exports = { initDatabase, tables };