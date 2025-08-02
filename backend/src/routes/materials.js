// backend/src/routes/materials.js
// Friday's Bar ERP - 材料庫存管理 CRUD API

const express = require('express');
const router = express.Router();
const database = require('../database/connection');

// 輔助函數：判斷庫存狀態
function getStockStatus(stockQuantity, minStock) {
    const stock = parseInt(stockQuantity);
    const min = parseInt(minStock);
    
    if (stock <= 0) {
        return { status: 'out_of_stock', level: 'critical', message: '缺貨' };
    } else if (stock <= min) {
        return { status: 'low_stock', level: 'warning', message: '庫存不足' };
    } else if (stock <= min * 2) {
        return { status: 'medium_stock', level: 'caution', message: '庫存普通' };
    } else {
        return { status: 'sufficient', level: 'good', message: '庫存充足' };
    }
}

// 輔助函數：驗證材料資料
function validateMaterialData(materialData, isUpdate = false) {
    const errors = [];
    
    // 必填欄位檢查（新增時）
    if (!isUpdate) {
        if (!materialData.name || materialData.name.trim() === '') {
            errors.push('材料名稱為必填欄位');
        }
    }
    
    // 數值合理性檢查
    if (materialData.stock_quantity !== undefined) {
        const stock = parseInt(materialData.stock_quantity);
        if (isNaN(stock) || stock < 0) {
            errors.push('庫存數量必須為有效的非負整數');
        }
    }
    
    if (materialData.min_stock !== undefined) {
        const minStock = parseInt(materialData.min_stock);
        if (isNaN(minStock) || minStock < 0) {
            errors.push('最低庫存必須為有效的非負整數');
        }
    }
    
    return errors;
}

// ==========================================
// GET /api/materials - 取得所有材料
// ==========================================
router.get('/', async (req, res) => {
    try {
        const { status, liquor_type, low_stock } = req.query;
        
        console.log('📦 查詢材料庫存，篩選條件:', { status, liquor_type, low_stock });
        
        let whereConditions = [];
        let queryParams = [];
        
        // 酒類篩選
        if (liquor_type) {
            whereConditions.push('liquor_type = ?');
            queryParams.push(liquor_type);
        }
        
        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
        
        const materials = await database.query(`
            SELECT 
                name,
                need_pickup,
                picked_up,
                liquor_type,
                is_homemade,
                stock_quantity,
                min_stock,
                unit,
                notes,
                usage,
                created_at,
                updated_at
            FROM materials 
            ${whereClause}
            ORDER BY name
        `, queryParams);
        
        // 為每個材料計算庫存狀態和相關資訊
        const materialsWithStatus = materials.map(material => {
            const stockStatus = getStockStatus(material.stock_quantity, material.min_stock);
            const stockValue = material.stock_quantity * (material.estimated_unit_cost || 0);
            
            return {
                ...material,
                stock_quantity: parseInt(material.stock_quantity),
                min_stock: parseInt(material.min_stock),
                need_pickup: Boolean(material.need_pickup),
                picked_up: Boolean(material.picked_up),
                is_homemade: Boolean(material.is_homemade),
                usage: material.usage ? JSON.parse(material.usage) : [],
                stock_status: stockStatus,
                stock_health: {
                    is_sufficient: stockStatus.status === 'sufficient',
                    needs_reorder: stockStatus.status === 'low_stock' || stockStatus.status === 'out_of_stock',
                    days_remaining: material.daily_usage ? Math.floor(material.stock_quantity / material.daily_usage) : null
                },
                pickup_status: {
                    needs_pickup: material.need_pickup && !material.picked_up,
                    status_text: material.need_pickup ? 
                        (material.picked_up ? '已領取' : '待領取') : '無需領取'
                }
            };
        });
        
        // 根據篩選條件過濾
        let filteredMaterials = materialsWithStatus;
        
        if (low_stock === 'true') {
            filteredMaterials = materialsWithStatus.filter(m => 
                m.stock_status.status === 'low_stock' || m.stock_status.status === 'out_of_stock'
            );
        }
        
        if (status === 'need_pickup') {
            filteredMaterials = filteredMaterials.filter(m => m.pickup_status.needs_pickup);
        }
        
        // 統計資訊
        const stats = {
            total: materialsWithStatus.length,
            sufficient: materialsWithStatus.filter(m => m.stock_status.status === 'sufficient').length,
            low_stock: materialsWithStatus.filter(m => m.stock_status.status === 'low_stock').length,
            out_of_stock: materialsWithStatus.filter(m => m.stock_status.status === 'out_of_stock').length,
            need_pickup: materialsWithStatus.filter(m => m.pickup_status.needs_pickup).length
        };
        
        console.log(`✅ 成功查詢到 ${filteredMaterials.length} 個材料`);
        
        res.json({
            success: true,
            message: `成功取得 ${filteredMaterials.length} 個材料`,
            count: filteredMaterials.length,
            statistics: stats,
            filters: { status, liquor_type, low_stock },
            data: filteredMaterials
        });
        
    } catch (error) {
        console.error('❌ 查詢材料失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢材料失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/materials/:name - 取得特定材料
// ==========================================
router.get('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        console.log(`🔍 查詢材料: ${name}`);
        
        const material = await database.get(`
            SELECT 
                name,
                need_pickup,
                picked_up,
                liquor_type,
                is_homemade,
                stock_quantity,
                min_stock,
                unit,
                notes,
                usage,
                created_at,
                updated_at
            FROM materials 
            WHERE name = ?
        `, [name]);
        
        if (!material) {
            return res.status(404).json({
                success: false,
                message: `找不到材料: ${name}`,
                suggestion: '請使用 GET /api/materials 查看所有可用材料'
            });
        }
        
        // 查詢使用該材料的品項
        const relatedItems = await database.query(`
            SELECT name, base_liquor, price, materials
            FROM items
            WHERE materials LIKE ?
        `, [`%"${name}"%`]);
        
        const stockStatus = getStockStatus(material.stock_quantity, material.min_stock);
        
        const materialWithDetails = {
            ...material,
            stock_quantity: parseInt(material.stock_quantity),
            min_stock: parseInt(material.min_stock),
            need_pickup: Boolean(material.need_pickup),
            picked_up: Boolean(material.picked_up),
            is_homemade: Boolean(material.is_homemade),
            usage: material.usage ? JSON.parse(material.usage) : [],
            stock_status: stockStatus,
            pickup_status: {
                needs_pickup: material.need_pickup && !material.picked_up,
                status_text: material.need_pickup ? 
                    (material.picked_up ? '已領取' : '待領取') : '無需領取'
            },
            related_items: relatedItems.map(item => ({
                name: item.name,
                base_liquor: item.base_liquor,
                price: parseFloat(item.price),
                all_materials: JSON.parse(item.materials || '[]')
            })),
            usage_analysis: {
                used_in_items: relatedItems.length,
                item_names: relatedItems.map(item => item.name)
            }
        };
        
        console.log(`✅ 成功查詢材料: ${name}`);
        
        res.json({
            success: true,
            message: `成功取得材料: ${name}`,
            data: materialWithDetails
        });
        
    } catch (error) {
        console.error('❌ 查詢特定材料失敗:', error);
        res.status(500).json({
            success: false,
            message: '查詢材料失敗',
            error: error.message
        });
    }
});

// ==========================================
// POST /api/materials - 新增材料
// ==========================================
router.post('/', async (req, res) => {
    try {
        const {
            name,
            liquor_type = '',
            stock_quantity = 0,
            min_stock = 0,
            unit = '個',
            is_homemade = false,
            need_pickup = false,
            picked_up = false,
            notes = '',
            usage = []
        } = req.body;
        
        console.log('➕ 新增材料:', { name, stock_quantity, min_stock });
        
        // 資料驗證
        const validationErrors = validateMaterialData(req.body);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '資料驗證失敗',
                errors: validationErrors
            });
        }
        
        // 檢查材料是否已存在
        const existingMaterial = await database.get('SELECT name FROM materials WHERE name = ?', [name]);
        if (existingMaterial) {
            return res.status(409).json({
                success: false,
                message: `材料 "${name}" 已存在`,
                suggestion: '請使用不同的材料名稱，或使用 PUT 方法更新現有材料'
            });
        }
        
        // 插入新材料
        const result = await database.run(`
            INSERT INTO materials (
                name, liquor_type, stock_quantity, min_stock, unit,
                is_homemade, need_pickup, picked_up, notes, usage,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [
            name.trim(),
            liquor_type.trim(),
            parseInt(stock_quantity),
            parseInt(min_stock),
            unit.trim(),
            is_homemade ? 1 : 0,
            need_pickup ? 1 : 0,
            picked_up ? 1 : 0,
            notes.trim(),
            JSON.stringify(usage)
        ]);
        
        const stockStatus = getStockStatus(stock_quantity, min_stock);
        
        console.log(`✅ 成功新增材料: ${name}`);
        
        res.status(201).json({
            success: true,
            message: `材料 "${name}" 新增成功`,
            data: {
                name: name.trim(),
                liquor_type: liquor_type.trim(),
                stock_quantity: parseInt(stock_quantity),
                min_stock: parseInt(min_stock),
                unit: unit.trim(),
                is_homemade: Boolean(is_homemade),
                need_pickup: Boolean(need_pickup),
                picked_up: Boolean(picked_up),
                notes: notes.trim(),
                usage: usage,
                stock_status: stockStatus,
                created_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 新增材料失敗:', error);
        res.status(500).json({
            success: false,
            message: '新增材料失敗',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/materials/:name - 更新材料
// ==========================================
router.put('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        const {
            liquor_type,
            stock_quantity,
            min_stock,
            unit,
            is_homemade,
            need_pickup,
            picked_up,
            notes,
            usage
        } = req.body;
        
        console.log(`✏️ 更新材料: ${name}`);
        
        // 檢查材料是否存在
        const existingMaterial = await database.get('SELECT * FROM materials WHERE name = ?', [name]);
        if (!existingMaterial) {
            return res.status(404).json({
                success: false,
                message: `找不到材料: ${name}`,
                suggestion: '請確認材料名稱正確，或使用 POST 方法建立新材料'
            });
        }
        
        // 資料驗證
        const validationErrors = validateMaterialData(req.body, true);
        if (validationErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: '資料驗證失敗',
                errors: validationErrors
            });
        }
        
        // 準備更新資料（只更新提供的欄位）
        const updateFields = [];
        const updateValues = [];
        
        if (liquor_type !== undefined) {
            updateFields.push('liquor_type = ?');
            updateValues.push(liquor_type.trim());
        }
        if (stock_quantity !== undefined) {
            updateFields.push('stock_quantity = ?');
            updateValues.push(parseInt(stock_quantity));
        }
        if (min_stock !== undefined) {
            updateFields.push('min_stock = ?');
            updateValues.push(parseInt(min_stock));
        }
        if (unit !== undefined) {
            updateFields.push('unit = ?');
            updateValues.push(unit.trim());
        }
        if (is_homemade !== undefined) {
            updateFields.push('is_homemade = ?');
            updateValues.push(is_homemade ? 1 : 0);
        }
        if (need_pickup !== undefined) {
            updateFields.push('need_pickup = ?');
            updateValues.push(need_pickup ? 1 : 0);
        }
        if (picked_up !== undefined) {
            updateFields.push('picked_up = ?');
            updateValues.push(picked_up ? 1 : 0);
        }
        if (notes !== undefined) {
            updateFields.push('notes = ?');
            updateValues.push(notes.trim());
        }
        if (usage !== undefined) {
            updateFields.push('usage = ?');
            updateValues.push(JSON.stringify(usage));
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: '沒有提供要更新的欄位'
            });
        }
        
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(name);
        
        // 更新材料
        await database.run(`
            UPDATE materials 
            SET ${updateFields.join(', ')} 
            WHERE name = ?
        `, updateValues);
        
        // 獲取更新後的資料
        const updatedMaterial = await database.get('SELECT * FROM materials WHERE name = ?', [name]);
        const stockStatus = getStockStatus(updatedMaterial.stock_quantity, updatedMaterial.min_stock);
        
        console.log(`✅ 成功更新材料: ${name}`);
        
        res.json({
            success: true,
            message: `材料 "${name}" 更新成功`,
            data: {
                name: updatedMaterial.name,
                liquor_type: updatedMaterial.liquor_type,
                stock_quantity: parseInt(updatedMaterial.stock_quantity),
                min_stock: parseInt(updatedMaterial.min_stock),
                unit: updatedMaterial.unit,
                is_homemade: Boolean(updatedMaterial.is_homemade),
                need_pickup: Boolean(updatedMaterial.need_pickup),
                picked_up: Boolean(updatedMaterial.picked_up),
                notes: updatedMaterial.notes,
                usage: JSON.parse(updatedMaterial.usage || '[]'),
                stock_status: stockStatus,
                updated_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 更新材料失敗:', error);
        res.status(500).json({
            success: false,
            message: '更新材料失敗',
            error: error.message
        });
    }
});

// ==========================================
// PUT /api/materials/:name/stock - 庫存調整
// ==========================================
router.put('/:name/stock', async (req, res) => {
    try {
        const { name } = req.params;
        const { action, quantity, reason } = req.body;
        
        console.log(`📦 庫存調整: ${name}, 動作: ${action}, 數量: ${quantity}`);
        
        if (!action || !['add', 'subtract', 'set'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: '動作必須為 add（增加）、subtract（減少）或 set（設定）'
            });
        }
        
        if (!quantity || isNaN(parseInt(quantity)) || parseInt(quantity) < 0) {
            return res.status(400).json({
                success: false,
                message: '數量必須為有效的非負整數'
            });
        }
        
        // 檢查材料是否存在
        const material = await database.get('SELECT * FROM materials WHERE name = ?', [name]);
        if (!material) {
            return res.status(404).json({
                success: false,
                message: `找不到材料: ${name}`
            });
        }
        
        const currentStock = parseInt(material.stock_quantity);
        const adjustQuantity = parseInt(quantity);
        let newStock;
        
        switch (action) {
            case 'add':
                newStock = currentStock + adjustQuantity;
                break;
            case 'subtract':
                newStock = Math.max(0, currentStock - adjustQuantity);
                break;
            case 'set':
                newStock = adjustQuantity;
                break;
        }
        
        // 更新庫存
        await database.run(`
            UPDATE materials 
            SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE name = ?
        `, [newStock, name]);
        
        const stockStatus = getStockStatus(newStock, material.min_stock);
        
        console.log(`✅ 庫存調整完成: ${name}, ${currentStock} → ${newStock}`);
        
        res.json({
            success: true,
            message: `材料 "${name}" 庫存調整成功`,
            data: {
                name: name,
                action: action,
                previous_stock: currentStock,
                adjustment_quantity: adjustQuantity,
                new_stock: newStock,
                stock_status: stockStatus,
                reason: reason || '',
                adjusted_at: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('❌ 庫存調整失敗:', error);
        res.status(500).json({
            success: false,
            message: '庫存調整失敗',
            error: error.message
        });
    }
});

// ==========================================
// GET /api/materials/alerts/low-stock - 低庫存警示
// ==========================================
router.get('/alerts/low-stock', async (req, res) => {
    try {
        console.log('⚠️ 查詢低庫存警示');
        
        const lowStockMaterials = await database.query(`
            SELECT 
                name, liquor_type, stock_quantity, min_stock, unit,
                need_pickup, picked_up, notes
            FROM materials 
            WHERE stock_quantity <= min_stock
            ORDER BY 
                CASE 
                    WHEN stock_quantity = 0 THEN 1 
                    ELSE 2 
                END,
                stock_quantity ASC
        `);
        
        const alerts = lowStockMaterials.map(material => {
            const stockStatus = getStockStatus(material.stock_quantity, material.min_stock);
            return {
                ...material,
                stock_quantity: parseInt(material.stock_quantity),
                min_stock: parseInt(material.min_stock),
                need_pickup: Boolean(material.need_pickup),
                picked_up: Boolean(material.picked_up),
                stock_status: stockStatus,
                urgency_level: material.stock_quantity === 0 ? 'critical' : 'warning',
                recommended_action: material.stock_quantity === 0 ? '立即補貨' : '儘快補貨'
            };
        });
        
        const criticalCount = alerts.filter(a => a.urgency_level === 'critical').length;
        const warningCount = alerts.filter(a => a.urgency_level === 'warning').length;
        
        res.json({
            success: true,
            message: '低庫存警示查詢成功',
            alert_summary: {
                total_alerts: alerts.length,
                critical_alerts: criticalCount,
                warning_alerts: warningCount,
                needs_immediate_action: criticalCount > 0
            },
            data: alerts
        });
        
    } catch (error) {
        console.error('❌ 低庫存警示查詢失敗:', error);
        res.status(500).json({
            success: false,
            message: '低庫存警示查詢失敗',
            error: error.message
        });
    }
});

// ==========================================
// DELETE /api/materials/:name - 刪除材料
// ==========================================
router.delete('/:name', async (req, res) => {
    try {
        const { name } = req.params;
        console.log(`🗑️ 刪除材料: ${name}`);
        
        // 檢查材料是否存在
        const existingMaterial = await database.get('SELECT name FROM materials WHERE name = ?', [name]);
        if (!existingMaterial) {
            return res.status(404).json({
                success: false,
                message: `找不到材料: ${name}`
            });
        }
        
        // 檢查是否有品項使用該材料
        const relatedItems = await database.query(`
            SELECT name FROM items WHERE materials LIKE ?
        `, [`%"${name}"%`]);
        
        if (relatedItems.length > 0) {
            return res.status(409).json({
                success: false,
                message: `無法刪除材料 "${name}"`,
                reason: `該材料被 ${relatedItems.length} 個品項使用`,
                related_items: relatedItems.map(item => item.name),
                suggestion: '請先移除相關品項中的該材料，或聯絡管理員協助處理'
            });
        }
        
        // 刪除材料
        const result = await database.run('DELETE FROM materials WHERE name = ?', [name]);
        
        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: '刪除失敗，材料不存在'
            });
        }
        
        console.log(`✅ 成功刪除材料: ${name}`);
        
        res.json({
            success: true,
            message: `材料 "${name}" 刪除成功`,
            deleted_material: name,
            deleted_at: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ 刪除材料失敗:', error);
        res.status(500).json({
            success: false,
            message: '刪除材料失敗',
            error: error.message
        });
    }
});

module.exports = router;