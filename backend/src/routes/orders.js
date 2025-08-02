// backend/src/routes/orders.js
// Friday's Bar ERP - 點單管理 CRUD API

const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// 輔助函數：計算訂單總金額和淨收入
function calculateOrderFinancials(price, adjustment, liquorCost, otherCost) {
    const totalPrice = parseFloat(price) + parseFloat(adjustment || 0);
    const netRevenue = totalPrice - parseFloat(liquorCost) - parseFloat(otherCost);
    return {
        total_price: parseFloat(totalPrice.toFixed(2)),
        net_revenue: parseFloat(netRevenue.toFixed(2))
    };
}

// 輔助函數：驗證訂單資料
function validateOrderData(orderData) {
    const errors = [];
    
    if (!orderData.table_number || orderData.table_number.trim() === '') {
        errors.push('桌號為必填欄位');
    }
    
    if (!orderData.item_name || orderData.item_name.trim() === '') {
        errors.push('品項名稱為必填欄位');
    }
    
    if (!orderData.orderer || orderData.orderer.trim() === '') {
        errors.push('點單者為必填欄位');
    }
    
    // 調價驗證（可選）
    if (orderData.adjustment !== undefined && orderData.adjustment !== null) {
        const adjustment = parseFloat(orderData.adjustment);
        if (isNaN(adjustment)) {
            errors.push('調價金額必須為有效數字');
        }
    }
    
    return errors;
}

// ==========================================
// GET /api/orders - 取得所有訂單
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { status, date, table_number } = req.query;
        
        console.log('📋 查詢訂單，篩選條件:', { status, date, table_number });
        
        let whereConditions = [];
        let queryParams = [];
        
        // 狀態篩選
        if (status === 'pending') {
            whereConditions.push('fo.served_status = 0');
        } else if (status === 'served') {
            whereConditions.push('fo.served_status = 1');
        }
        
        // 日期篩選
        if (date) {
            whereConditions.push('DATE(fo.order_time) = ?');
            queryParams.push(date);
        }
        
        // 桌號篩選
        if (table_number) {
            whereConditions.push('fo.table_number = ?');
            queryParams.push(table_number);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const orders = await database.query(`
            SELECT 
                fo.id,
                fo.table_number,
                fo.item_name,
                fo.price,
                fo.adjustment,
                fo.total_price,
                fo.liquor_cost,
                fo.other_cost,
                fo.net_revenue,
                fo.available_today,
                fo.order_time,
                fo.orderer,
                fo.served_status,
                fo.notes,
                i.base_liquor,
                i.materials
            FROM front_orders fo
            LEFT JOIN items i ON fo.item_name = i.name
            ${whereClause}
            ORDER BY fo.order_time DESC
        `, queryParams);
        
        const ordersWithDetails = orders.map(order => ({
            ...order,
            price: parseFloat(order.price),
            adjustment: parseFloat(order.adjustment || 0),
            total_price: parseFloat(order.total_price),
            liquor_cost: parseFloat(order.liquor_cost),
            other_cost: parseFloat(order.other_cost),
            net_revenue: parseFloat(order.net_revenue),
            materials: order.materials ? JSON.parse(order.materials) : [],
            served_status: Boolean(order.served_status),
            available_today: Boolean(order.available_today)
        }));
        
        console.log(`✅ 成功查詢到 ${orders.length} 筆訂單`);
        
        res.json({
            success: true,
            message: `成功取得 ${orders.length} 筆訂單`,
            count: orders.length,
            filters: { status, date, table_number },
            data: ordersWithDetails
        });
        
    } catch (error) {
        console.error('❌ 查詢訂單失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢訂單失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/orders/front - 外場訂單視圖
// ==========================================
router.get('/front', async (req, res) => {
    try {
        const { table_number } = req.query;
        
        console.log('🍽️ 外場查詢訂單:', { table_number });
        
        let whereClause = '';
        let queryParams = [];
        
        if (table_number) {
            whereClause = 'WHERE fo.table_number = ?';
            queryParams.push(table_number);
        }
        
        const orders = await database.query(`
            SELECT 
                fo.id,
                fo.table_number,
                fo.item_name,
                fo.total_price,
                fo.order_time,
                fo.orderer,
                fo.served_status,
                fo.notes,
                i.base_liquor
            FROM front_orders fo
            LEFT JOIN items i ON fo.item_name = i.name
            ${whereClause}
            ORDER BY fo.served_status ASC, fo.order_time DESC
        `, queryParams);
        
        const frontOrders = orders.map(order => ({
            ...order,
            total_price: parseFloat(order.total_price),
            served_status: Boolean(order.served_status),
            status_text: order.served_status ? '已出酒' : '製作中'
        }));
        
        res.json({
            success: true,
            message: '外場訂單查詢成功',
            count: frontOrders.length,
            data: frontOrders
        });
        
    } catch (error) {
        console.error('❌ 外場訂單查詢失敗:', error);
        res.status(500).json({
            success: false,
            message: '外場訂單查詢失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/orders/bar - 內場工作清單
// ==========================================
router.get('/bar', async (req, res) => {
    try {
        console.log('🍸 內場查詢待製作訂單');
        
        const barOrders = await database.query(`
            SELECT 
                bo.id as bar_order_id,
                bo.front_order_id,
                bo.table_number,
                bo.item_name,
                bo.bartender,
                bo.is_served,
                bo.order_time,
                bo.served_time,
                bo.notes,
                bo.orderer,
                i.base_liquor,
                i.materials,
                fo.total_price
            FROM bar_orders bo
            LEFT JOIN items i ON bo.item_name = i.name
            LEFT JOIN front_orders fo ON bo.front_order_id = fo.id
            ORDER BY bo.is_served ASC, bo.order_time ASC
        `);
        
        const formattedBarOrders = barOrders.map(order => ({
            ...order,
            total_price: parseFloat(order.total_price || 0),
            is_served: Boolean(order.is_served),
            materials: order.materials ? JSON.parse(order.materials) : [],
            status_text: order.is_served ? '已完成' : '待製作',
            waiting_time: order.order_time ? 
                Math.floor((Date.now() - new Date(order.order_time).getTime()) / 1000 / 60) + ' 分鐘' : 
                '未知'
        }));
        
        const pendingCount = formattedBarOrders.filter(order => !order.is_served).length;
        const completedCount = formattedBarOrders.filter(order => order.is_served).length;
        
        res.json({
            success: true,
            message: '內場工作清單查詢成功',
            count: formattedBarOrders.length,
            summary: {
                pending: pendingCount,
                completed: completedCount,
                total: formattedBarOrders.length
            },
            data: formattedBarOrders
        });
        
    } catch (error) {
        console.error('❌ 內場工作清單查詢失敗:', error);
        res.status(500).json({
            success: false,
            message: '內場工作清單查詢失敗',
            error: error.message
        });
    }
});

// ==========================================
// POST /api/orders - 外場下單
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            table_number,
            item_name,
            adjustment = 0,
            orderer,
            notes = '',
            available_today = true
        } = req.body;
        
        console.log('➕ 外場下單:', { table_number, item_name, orderer });
        
        // 資料驗證
        const validationErrors = validateOrderData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '訂單資料驗證失敗',
                errors: validationErrors
            });
        }
        
        // 檢查品項是否存在
        const item = await database.get('SELECT * FROM items WHERE name = ?', [item_name]);
        if (!item) {
            return res.status(404).json({
                success: false,
                message: `品項 "${item_name}" 不存在`,
                suggestion: '請使用 GET /api/items 查看可用品項'
            });
        }
        
        // 計算訂單金額
        const financials = calculateOrderFinancials(
            item.price, 
            adjustment, 
            item.liquor_cost, 
            item.other_cost
        );
        
        // 開始交易
        await database.beginTransaction();
        
        try {
            // 插入外場訂單
            const frontOrderResult = await database.run(`
                INSERT INTO front_orders (
                    table_number, item_name, price, adjustment, total_price,
                    liquor_cost, other_cost, net_revenue, available_today,
                    orderer, served_status, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
            `, [
                table_number.trim(),
                item_name.trim(),
                parseFloat(item.price),
                parseFloat(adjustment),
                financials.total_price,
                parseFloat(item.liquor_cost),
                parseFloat(item.other_cost),
                financials.net_revenue,
                available_today ? 1 : 0,
                orderer.trim(),
                notes.trim()
            ]);
            
            const frontOrderId = frontOrderResult.id;
            
            // 同時插入內場工作單
            await database.run(`
                INSERT INTO bar_orders (
                    front_order_id, table_number, item_name, 
                    order_time, notes, orderer, is_served
                ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 0)
            `, [
                frontOrderId,
                table_number.trim(),
                item_name.trim(),
                notes.trim(),
                orderer.trim()
            ]);
            
            // 提交交易
            await database.commit();
            
            console.log(`✅ 訂單建立成功: 桌號 ${table_number}, 品項 ${item_name}`);
            
            // TODO: 這裡未來會加入 Socket.io 即時通知內場
            
            res.status(201).json({
                success: true,
                message: '訂單建立成功',
                data: {
                    order_id: frontOrderId,
                    table_number: table_number.trim(),
                    item_name: item_name.trim(),
                    base_liquor: item.base_liquor,
                    original_price: parseFloat(item.price),
                    adjustment: parseFloat(adjustment),
                    total_price: financials.total_price,
                    net_revenue: financials.net_revenue,
                    orderer: orderer.trim(),
                    order_time: new Date().toISOString(),
                    status: '已下單，等待製作'
                }
            });
            
        } catch (error) {
            // 回滾交易
            await database.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('❌ 下單失敗:', error);
        res.status(500).json({
            success: false,
            message: '下單失敗',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/orders/:id/claim - 調酒師認領訂單
// ==========================================
router.put('/:id/claim', async (req, res) => {
    try {
        const { id } = req.params;
        const { bartender } = req.body;
        
        console.log(`👨‍🍳 調酒師認領訂單: ${id}, 調酒師: ${bartender}`);
        
        if (!bartender || bartender.trim() === '') {
            return res.status(400).json({
                success: false,
                message: '調酒師名稱為必填欄位'
            });
        }
        
        // 檢查訂單是否存在
        const barOrder = await database.get('SELECT * FROM bar_orders WHERE front_order_id = ?', [id]);
        if (!barOrder) {
            return res.status(404).json({
                success: false,
                message: `找不到訂單 ID: ${id}`
            });
        }
        
        if (barOrder.is_served) {
            return res.status(409).json({
                success: false,
                message: '該訂單已完成，無法認領'
            });
        }
        
        // 更新調酒師
        await database.run(`
            UPDATE bar_orders 
            SET bartender = ? 
            WHERE front_order_id = ?
        `, [bartender.trim(), id]);
        
        console.log(`✅ 訂單 ${id} 已被 ${bartender} 認領`);
        
        res.json({
            success: true,
            message: `訂單已被 ${bartender} 認領`,
            data: {
                order_id: parseInt(id),
                bartender: bartender.trim(),
                claimed_at: new Date().toISOString(),
                status: '製作中'
            }
        });
        
    } catch (error) {
        console.error('❌ 認領訂單失敗:', error);
        res.status(500).json({
            success: false,
            message: '認領訂單失敗',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/orders/:id/served - 標記訂單已完成
// ==========================================
router.put('/:id/served', async (req, res) => {
    try {
        const { id } = req.params;
        
        console.log(`✅ 標記訂單完成: ${id}`);
        
        // 檢查訂單是否存在
        const barOrder = await database.get('SELECT * FROM bar_orders WHERE front_order_id = ?', [id]);
        if (!barOrder) {
            return res.status(404).json({
                success: false,
                message: `找不到訂單 ID: ${id}`
            });
        }
        
        if (barOrder.is_served) {
            return res.status(409).json({
                success: false,
                message: '該訂單已標記為完成'
            });
        }
        
        // 開始交易
        await database.beginTransaction();
        
        try {
            // 更新內場狀態
            await database.run(`
                UPDATE bar_orders 
                SET is_served = 1, served_time = CURRENT_TIMESTAMP 
                WHERE front_order_id = ?
            `, [id]);
            
            // 同步更新外場狀態
            await database.run(`
                UPDATE front_orders 
                SET served_status = 1 
                WHERE id = ?
            `, [id]);
            
            // 提交交易
            await database.commit();
            
            console.log(`✅ 訂單 ${id} 已完成`);
            
            // TODO: 這裡未來會加入 Socket.io 即時通知外場
            
            res.json({
                success: true,
                message: '訂單已標記為完成',
                data: {
                    order_id: parseInt(id),
                    served_time: new Date().toISOString(),
                    status: '已完成'
                }
            });
            
        } catch (error) {
            // 回滾交易
            await database.rollback();
            throw error;
        }
        
    } catch (error) {
        console.error('❌ 標記訂單完成失敗:', error);
        res.status(500).json({
            success: false,
            message: '標記訂單完成失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/orders/stats - 訂單統計
// ==========================================
router.get('/stats', async (req, res) => {
    try {
        const { date } = req.query;
        const targetDate = date || new Date().toISOString().split('T')[0];
        
        console.log('📊 查詢訂單統計:', { date: targetDate });
        
        // 當日訂單統計
        const stats = await database.query(`
            SELECT 
                COUNT(*) as total_orders,
                COUNT(CASE WHEN served_status = 1 THEN 1 END) as completed_orders,
                COUNT(CASE WHEN served_status = 0 THEN 1 END) as pending_orders,
                SUM(total_price) as total_revenue,
                SUM(net_revenue) as total_net_revenue,
                SUM(liquor_cost + other_cost) as total_costs
            FROM front_orders
            WHERE DATE(order_time) = ?
        `, [targetDate]);
        
        // 熱門品項統計
        const popularItems = await database.query(`
            SELECT 
                item_name,
                COUNT(*) as order_count,
                SUM(total_price) as revenue,
                SUM(net_revenue) as net_revenue
            FROM front_orders
            WHERE DATE(order_time) = ?
            GROUP BY item_name
            ORDER BY order_count DESC
            LIMIT 5
        `, [targetDate]);
        
        // 桌號統計
        const tableStats = await database.query(`
            SELECT 
                table_number,
                COUNT(*) as order_count,
                SUM(total_price) as table_revenue
            FROM front_orders
            WHERE DATE(order_time) = ?
            GROUP BY table_number
            ORDER BY order_count DESC
        `, [targetDate]);
        
        const dailyStats = stats[0];
        const completionRate = dailyStats.total_orders > 0 ? 
            (dailyStats.completed_orders / dailyStats.total_orders * 100).toFixed(2) : 0;
        
        res.json({
            success: true,
            message: '訂單統計查詢成功',
            date: targetDate,
            data: {
                daily_summary: {
                    ...dailyStats,
                    total_revenue: parseFloat(dailyStats.total_revenue || 0),
                    total_net_revenue: parseFloat(dailyStats.total_net_revenue || 0),
                    total_costs: parseFloat(dailyStats.total_costs || 0),
                    completion_rate: parseFloat(completionRate)
                },
                popular_items: popularItems.map(item => ({
                    ...item,
                    revenue: parseFloat(item.revenue),
                    net_revenue: parseFloat(item.net_revenue)
                })),
                table_performance: tableStats.map(table => ({
                    ...table,
                    table_revenue: parseFloat(table.table_revenue)
                }))
            }
        });
        
    } catch (error) {
        console.error('❌ 訂單統計查詢失敗:', error);
        res.status(500).json({
            success: false,
            message: '訂單統計查詢失敗',
            error: error.message
        });
    }
});

module.exports = router;