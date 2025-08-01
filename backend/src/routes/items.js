// backend/src/routes/items.js
// Friday's Bar ERP - 品項管理 CRUD API

const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// 輔助函數：計算毛利
function calculateGrossProfit(price, liquorCost, otherCost) {
    return parseFloat(price) - parseFloat(liquorCost) - parseFloat(otherCost);
}

// 輔助函數：驗證品項資料
function validateItemData(itemData, isUpdate = false) {
    const errors = [];
    
    // 必填欄位檢查（新增時）
    if (!isUpdate) {
        if (!itemData.name || itemData.name.trim() === '') {
            errors.push('品項名稱為必填欄位');
        }
    }
    
    if (itemData.price === undefined || itemData.price === null || itemData.price === '') {
        errors.push('售價為必填欄位');
    }
    
    if (itemData.liquor_cost === undefined || itemData.liquor_cost === null || itemData.liquor_cost === '') {
        errors.push('酒類成本為必填欄位');
    }
    
    if (itemData.other_cost === undefined || itemData.other_cost === null || itemData.other_cost === '') {
        errors.push('其他成本為必填欄位');
    }
    
    // 數值合理性檢查
    if (itemData.price !== undefined) {
        const price = parseFloat(itemData.price);
        if (isNaN(price) || price < 0) {
            errors.push('售價必須為有效的正數');
        }
    }
    
    if (itemData.liquor_cost !== undefined) {
        const liquorCost = parseFloat(itemData.liquor_cost);
        if (isNaN(liquorCost) || liquorCost < 0) {
            errors.push('酒類成本必須為有效的正數');
        }
    }
    
    if (itemData.other_cost !== undefined) {
        const otherCost = parseFloat(itemData.other_cost);
        if (isNaN(otherCost) || otherCost < 0) {
            errors.push('其他成本必須為有效的正數');
        }
    }
    
    // 成本不能超過售價檢查
    if (itemData.price !== undefined && itemData.liquor_cost !== undefined && itemData.other_cost !== undefined) {
        const totalCost = parseFloat(itemData.liquor_cost) + parseFloat(itemData.other_cost);
        if (totalCost >= parseFloat(itemData.price)) {
            errors.push('總成本不能大於等於售價（會導致零毛利或負毛利）');
        }
    }
    
    return errors;
}

// ==========================================
// GET /api/items - 取得所有品項
// ==========================================
router.get('/', async (req, res) => {
    try {
        console.log('📋 開始查詢所有品項...');
        
        const items = await database.query(`
            SELECT 
                name,
                base_liquor,
                price,
                liquor_cost,
                other_cost,
                materials,
                notes,
                created_at,
                updated_at
            FROM items 
            ORDER BY name
        `);
        
        // 為每個品項計算毛利和成本率
        const itemsWithCalculations = items.map(item => {
            const grossProfit = calculateGrossProfit(item.price, item.liquor_cost, item.other_cost);
            const totalCost = parseFloat(item.liquor_cost) + parseFloat(item.other_cost);
            const costRatio = parseFloat(item.price) > 0 ? (totalCost / parseFloat(item.price) * 100) : 0;
            const profitMargin = parseFloat(item.price) > 0 ? (grossProfit / parseFloat(item.price) * 100) : 0;
            
            return {
                ...item,
                price: parseFloat(item.price),
                liquor_cost: parseFloat(item.liquor_cost),
                other_cost: parseFloat(item.other_cost),
                materials: item.materials ? JSON.parse(item.materials) : [],
                gross_profit: parseFloat(grossProfit.toFixed(2)),
                total_cost: parseFloat(totalCost.toFixed(2)),
                cost_ratio: parseFloat(costRatio.toFixed(2)),
                profit_margin: parseFloat(profitMargin.toFixed(2))
            };
        });
        
        console.log(`✅ 成功查詢到 ${items.length} 個品項`);
        
        res.json({
            success: true,
            message: `成功取得 ${items.length} 個品項`,
            count: items.length,
            data: itemsWithCalculations
        });
        
    } catch (error) {
        console.error('❌ 查詢品項失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢品項失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/items/:name - 取得特定品項
// ==========================================
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        console.log(`🔍 查詢品項: ${name}`);
        
        const item = await database.get(`
            SELECT 
                name,
                base_liquor,
                price,
                liquor_cost,
                other_cost,
                materials,
                notes,
                created_at,
                updated_at
            FROM items 
            WHERE name = ?
        `, [name]);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: `找不到品項: ${name}`,
                available_items_hint: '請使用 GET /api/items 查看所有可用品項'
            });
        }
        
        // 計算相關數據
        const grossProfit = calculateGrossProfit(item.price, item.liquor_cost, item.other_cost);
        const totalCost = parseFloat(item.liquor_cost) + parseFloat(item.other_cost);
        const costRatio = parseFloat(item.price) > 0 ? (totalCost / parseFloat(item.price) * 100) : 0;
        const profitMargin = parseFloat(item.price) > 0 ? (grossProfit / parseFloat(item.price) * 100) : 0;
        
        const itemWithCalculations = {
            ...item,
            price: parseFloat(item.price),
            liquor_cost: parseFloat(item.liquor_cost),
            other_cost: parseFloat(item.other_cost),
            materials: item.materials ? JSON.parse(item.materials) : [],
            gross_profit: parseFloat(grossProfit.toFixed(2)),
            total_cost: parseFloat(totalCost.toFixed(2)),
            cost_ratio: parseFloat(costRatio.toFixed(2)),
            profit_margin: parseFloat(profitMargin.toFixed(2))
        };
        
        console.log(`✅ 成功查詢品項: ${name}`);
        
        res.json({
            success: true,
            message: `成功取得品項: ${name}`,
            data: itemWithCalculations
        });
        
    } catch (error) {
        console.error('❌ 查詢特定品項失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢品項失敗',
            error: error.message
        });
    }
});

// ==========================================
// POST /api/items - 新增品項
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            name,
            base_liquor,
            price,
            liquor_cost,
            other_cost,
            materials,
            notes
        } = req.body;
        
        console.log('➕ 新增品項請求:', { name, price, liquor_cost, other_cost });
        
        // 資料驗證
        const validationErrors = validateItemData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '資料驗證失敗',
                errors: validationErrors
            });
        }
        
        // 檢查品項是否已存在
        const existingItem = await database.get('SELECT name FROM items WHERE name = ?', [name]);
        if (existingItem) {
            return res.status(409).json({
                success: false,
                message: `品項 "${name}" 已存在`,
                suggestion: '請使用不同的品項名稱，或使用 PUT 方法更新現有品項'
            });
        }
        
        // 插入新品項
        const result = await database.run(`
            INSERT INTO items (
                name, 
                base_liquor, 
                price, 
                liquor_cost, 
                other_cost, 
                materials, 
                notes,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            name.trim(),
            base_liquor || '',
            parseFloat(price),
            parseFloat(liquor_cost),
            parseFloat(other_cost),
            JSON.stringify(materials || []),
            notes || ''
        ]);
        
        // 計算並回傳完整資料
        const grossProfit = calculateGrossProfit(price, liquor_cost, other_cost);
        const totalCost = parseFloat(liquor_cost) + parseFloat(other_cost);
        const costRatio = parseFloat(price) > 0 ? (totalCost / parseFloat(price) * 100) : 0;
        const profitMargin = parseFloat(price) > 0 ? (grossProfit / parseFloat(price) * 100) : 0;
        
        console.log(`✅ 成功新增品項: ${name}`);
        
        res.status(201).json({
            success: true,
            message: `品項 "${name}" 新增成功`,
            data: {
                name: name.trim(),
                base_liquor: base_liquor || '',
                price: parseFloat(price),
                liquor_cost: parseFloat(liquor_cost),
                other_cost: parseFloat(other_cost),
                materials: materials || [],
                notes: notes || '',
                gross_profit: parseFloat(grossProfit.toFixed(2)),
                total_cost: parseFloat(totalCost.toFixed(2)),
                cost_ratio: parseFloat(costRatio.toFixed(2)),
                profit_margin: parseFloat(profitMargin.toFixed(2)),
                created_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 新增品項失敗:', error);
        res.status(500).json({
            success: false,
            message: '新增品項失敗',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/items/:name - 更新品項
// ==========================================
router.put('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const {
            base_liquor,
            price,
            liquor_cost,
            other_cost,
            materials,
            notes
        } = req.body;
        
        console.log(`✏️ 更新品項: ${name}`);
        
        // 檢查品項是否存在
        const existingItem = await database.get('SELECT name FROM items WHERE name = ?', [name]);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: `找不到品項: ${name}`,
                suggestion: '請確認品項名稱正確，或使用 POST 方法建立新品項'
            });
        }
        
        // 資料驗證
        const validationErrors = validateItemData(req.body, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '資料驗證失敗',
                errors: validationErrors
            });
        }
        
        // 更新品項
        await database.run(`
            UPDATE items 
            SET 
                base_liquor = ?, 
                price = ?, 
                liquor_cost = ?, 
                other_cost = ?, 
                materials = ?, 
                notes = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE name = ?
        `, [
            base_liquor || '',
            parseFloat(price),
            parseFloat(liquor_cost),
            parseFloat(other_cost),
            JSON.stringify(materials || []),
            notes || '',
            name
        ]);
        
        // 計算並回傳更新後的資料
        const grossProfit = calculateGrossProfit(price, liquor_cost, other_cost);
        const totalCost = parseFloat(liquor_cost) + parseFloat(other_cost);
        const costRatio = parseFloat(price) > 0 ? (totalCost / parseFloat(price) * 100) : 0;
        const profitMargin = parseFloat(price) > 0 ? (grossProfit / parseFloat(price) * 100) : 0;
        
        console.log(`✅ 成功更新品項: ${name}`);
        
        res.json({
            success: true,
            message: `品項 "${name}" 更新成功`,
            data: {
                name: name,
                base_liquor: base_liquor || '',
                price: parseFloat(price),
                liquor_cost: parseFloat(liquor_cost),
                other_cost: parseFloat(other_cost),
                materials: materials || [],
                notes: notes || '',
                gross_profit: parseFloat(grossProfit.toFixed(2)),
                total_cost: parseFloat(totalCost.toFixed(2)),
                cost_ratio: parseFloat(costRatio.toFixed(2)),
                profit_margin: parseFloat(profitMargin.toFixed(2)),
                updated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 更新品項失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新品項失敗',
            error: error.message
        });
    }
});

// ==========================================
// DELETE /api/items/:name - 刪除品項
// ==========================================
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        console.log(`🗑️ 刪除品項: ${name}`);
        
        // 檢查品項是否存在
        const existingItem = await database.get('SELECT name FROM items WHERE name = ?', [name]);
        if (!existingItem) {
            return res.status(404).json({
                success: false,
                message: `找不到品項: ${name}`,
                suggestion: '請確認品項名稱正確'
            });
        }
        
        // 檢查是否有相關訂單（防止刪除正在使用的品項）
        const relatedOrders = await database.query(
            'SELECT COUNT(*) as count FROM front_orders WHERE item_name = ?', 
            [name]
        );
        
        if (relatedOrders[0].count > 0) {
            return res.status(409).json({
                success: false,
                message: `無法刪除品項 "${name}"`,
                reason: `該品項有 ${relatedOrders[0].count} 筆相關訂單記錄`,
                suggestion: '請先處理相關訂單，或聯絡管理員協助處理'
            });
        }
        
        // 刪除品項
        const result = await database.run('DELETE FROM items WHERE name = ?', [name]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '刪除失敗，品項不存在'
            });
        }
        
        console.log(`✅ 成功刪除品項: ${name}`);
        
        res.json({
            success: true,
            message: `品項 "${name}" 刪除成功`,
            deleted_item: name,
            deleted_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ 刪除品項失敗:', error);
        res.status(500).json({
            success: false,
            message: '刪除品項失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/items/:name/profit-analysis - 獲利分析
// ==========================================
router.get('/:name/profit-analysis', async (req, res) => {
    try {
        const { name } = req.params;
        console.log(`📊 品項獲利分析: ${name}`);
        
        const item = await database.get(`
            SELECT name, price, liquor_cost, other_cost, materials
            FROM items 
            WHERE name = ?
        `, [name]);
        
        if (!item) {
            return res.status(404).json({
                success: false,
                message: `找不到品項: ${name}`
            });
        }
        
        const price = parseFloat(item.price);
        const liquorCost = parseFloat(item.liquor_cost);
        const otherCost = parseFloat(item.other_cost);
        const totalCost = liquorCost + otherCost;
        const grossProfit = price - totalCost;
        
        // 詳細分析
        const analysis = {
            item_name: name,
            pricing: {
                selling_price: price,
                liquor_cost: liquorCost,
                other_cost: otherCost,
                total_cost: parseFloat(totalCost.toFixed(2)),
                gross_profit: parseFloat(grossProfit.toFixed(2))
            },
            ratios: {
                liquor_cost_ratio: parseFloat((liquorCost / price * 100).toFixed(2)),
                other_cost_ratio: parseFloat((otherCost / price * 100).toFixed(2)),
                total_cost_ratio: parseFloat((totalCost / price * 100).toFixed(2)),
                profit_margin: parseFloat((grossProfit / price * 100).toFixed(2))
            },
            recommendations: []
        };
        
        // 建議
        if (analysis.ratios.profit_margin < 30) {
            analysis.recommendations.push('獲利率偏低，建議檢討成本結構或調整售價');
        }
        if (analysis.ratios.liquor_cost_ratio > 50) {
            analysis.recommendations.push('酒類成本比例過高，建議尋找更經濟的酒類來源');
        }
        if (analysis.ratios.total_cost_ratio > 70) {
            analysis.recommendations.push('總成本比例過高，獲利空間有限');
        }
        if (analysis.recommendations.length === 0) {
            analysis.recommendations.push('成本結構良好，獲利表現佳');
        }
        
        res.json({
            success: true,
            message: `品項 "${name}" 獲利分析完成`,
            data: analysis
        });
        
    } catch (error) {
        console.error('❌ 獲利分析失敗:', error);
        res.status(500).json({
            success: false,
            message: '獲利分析失敗',
            error: error.message
        });
    }
});

module.exports = router;