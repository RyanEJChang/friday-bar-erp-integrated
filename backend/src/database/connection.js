// backend/src/database/connection.js
// Friday's Bar ERP 資料庫連接管理

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        // 設定資料庫檔案路徑
        const dbPath = process.env.DB_PATH || path.join(__dirname, '../../database/friday_bar.db');
        
        // 確保目錄存在
        const dbDir = path.dirname(dbPath);
        if (!require('fs').existsSync(dbDir)) {
            require('fs').mkdirSync(dbDir, { recursive: true });
        }
        
        console.log('🗄️  正在連接資料庫:', dbPath);
        
        // 建立資料庫連接 (就像打開咖啡店的帳本)
        this.db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('❌ 資料庫連接失敗:', err.message);
                throw err;
            } else {
                console.log('✅ 成功連接到 SQLite 資料庫');
                // 啟用外鍵約束 (確保資料完整性)
                this.db.run('PRAGMA foreign_keys = ON');
                console.log('🔗 外鍵約束已啟用');
            }
        });
    }

    // 通用查詢方法 (就像查帳本資料)
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            console.log('🔍 執行查詢:', sql);
            console.log('📋 參數:', params);
            
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('❌ 查詢錯誤:', err.message);
                    reject(err);
                } else {
                    console.log(`✅ 查詢成功，回傳 ${rows.length} 筆資料`);
                    resolve(rows);
                }
            });
        });
    }

    // 通用執行方法 (就像寫入帳本)
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            console.log('✍️  執行指令:', sql);
            console.log('📋 參數:', params);
            
            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('❌ 執行錯誤:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 執行成功');
                    resolve({
                        id: this.lastID,      // 新插入記錄的 ID
                        changes: this.changes // 影響的記錄數量
                    });
                }
            });
        });
    }

    // 取得單一記錄 (就像查詢特定帳目)
    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            console.log('🔍 取得單筆資料:', sql);
            console.log('📋 參數:', params);
            
            this.db.get(sql, params, (err, row) => {
                if (err) {
                    console.error('❌ 查詢錯誤:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 查詢完成:', row ? '找到資料' : '無資料');
                    resolve(row);
                }
            });
        });
    }

    // 開始交易 (就像開始記帳)
    beginTransaction() {
        return this.run('BEGIN TRANSACTION');
    }

    // 提交交易 (就像確認記帳)
    commit() {
        return this.run('COMMIT');
    }

    // 回滾交易 (就像取消記帳)
    rollback() {
        return this.run('ROLLBACK');
    }

    // 關閉資料庫連接 (就像關上帳本)
    close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err) {
                    console.error('❌ 關閉資料庫錯誤:', err.message);
                    reject(err);
                } else {
                    console.log('✅ 資料庫連接已關閉');
                    resolve();
                }
            });
        });
    }

    // 檢查資料庫健康狀態
    async healthCheck() {
        try {
            const result = await this.query('SELECT 1 as test');
            return {
                status: 'healthy',
                message: '資料庫連接正常',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                message: '資料庫連接異常',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    // 取得資料庫資訊
    async getInfo() {
        try {
            const tables = await this.query(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `);
            
            return {
                database_path: process.env.DB_PATH || 'default path',
                tables: tables.map(t => t.name),
                table_count: tables.length,
                sqlite_version: await this.query('SELECT sqlite_version() as version')
            };
        } catch (error) {
            console.error('取得資料庫資訊錯誤:', error);
            return {
                error: error.message
            };
        }
    }
}

// 建立單一資料庫實例 (就像整家店只有一本主帳本)
const database = new Database();

// 優雅關閉處理
process.on('SIGINT', async () => {
    console.log('🛑 正在關閉資料庫連接...');
    try {
        await database.close();
        process.exit(0);
    } catch (error) {
        console.error('關閉資料庫時發生錯誤:', error);
        process.exit(1);
    }
});

// 匯出資料庫實例供其他檔案使用
module.exports = database;