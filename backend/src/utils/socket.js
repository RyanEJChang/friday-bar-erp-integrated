// backend/src/utils/socket.js
// Friday's Bar ERP - Socket.io 管理器 (修復版)

const { Server } = require('socket.io');

class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // 儲存連接的使用者
    }

    // 初始化 Socket.io 伺服器
    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: [
                    "http://localhost:3000",
                    "http://127.0.0.1:3000",
                    process.env.FRONTEND_URL || "http://localhost:3000"
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        this.setupEventHandlers();
        console.log('🔌 Socket.io 伺服器已初始化');
        return this.io;
    }

    // 設定事件處理器
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log('🔗 使用者連接:', socket.id);

            // 使用者加入角色房間
            socket.on('join_room', (data) => {
                const { role, user_name } = data;
                console.log(`👤 ${user_name} (${role}) 加入房間`);
                
                // 加入角色房間
                socket.join(role);
                socket.join('all_users');
                
                // 儲存使用者資訊
                this.connectedUsers.set(socket.id, {
                    user_name,
                    role,
                    connected_at: new Date()
                });

                // 通知該角色房間有新使用者
                socket.to(role).emit('user_joined', {
                    user_name,
                    role,
                    message: `${user_name} 已上線`
                });

                // 傳送當前線上使用者清單
                this.broadcastOnlineUsers();
            });

            // 處理斷線
            socket.on('disconnect', () => {
                console.log('❌ 使用者斷線:', socket.id);
                
                const user = this.connectedUsers.get(socket.id);
                if (user) {
                    // 通知該角色房間使用者離線
                    socket.to(user.role).emit('user_left', {
                        user_name: user.user_name,
                        role: user.role,
                        message: `${user.user_name} 已離線`
                    });
                    
                    this.connectedUsers.delete(socket.id);
                    this.broadcastOnlineUsers();
                }
            });

            // 測試事件
            socket.on('test_message', (data) => {
                console.log('📨 收到測試訊息:', data);
                socket.emit('test_response', { 
                    message: '伺服器收到測試訊息', 
                    timestamp: new Date().toISOString() 
                });
            });
        });
    }

    // 廣播新訂單到內場
    broadcastNewOrder(orderData) {
        if (!this.io) {
            console.warn('⚠️ Socket.io 未初始化');
            return;
        }

        console.log('📢 廣播新訂單到內場:', orderData.item_name);
        
        // 發送到內場和管理員
        this.io.to('bar').emit('new_order', {
            type: 'new_order',
            data: orderData,
            timestamp: new Date().toISOString(),
            message: `新訂單：桌號 ${orderData.table_number} - ${orderData.item_name}`
        });

        this.io.to('admin').emit('new_order', {
            type: 'new_order',
            data: orderData,
            timestamp: new Date().toISOString()
        });

        // 發送通知音效提示
        this.io.to('bar').emit('notification_sound', {
            type: 'new_order',
            sound: 'order_alert'
        });
    }

    // 廣播訂單狀態更新
    broadcastOrderStatusUpdate(orderData, status) {
        if (!this.io) {
            console.warn('⚠️ Socket.io 未初始化');
            return;
        }

        console.log(`📢 廣播訂單狀態更新: ${orderData.item_name} -> ${status}`);

        const updateData = {
            type: 'order_status_update',
            order_id: orderData.id,
            status: status,
            data: orderData,
            timestamp: new Date().toISOString()
        };

        switch (status) {
            case 'claimed':
                // 通知內場：訂單被認領
                this.io.to('bar').emit('order_status_sync', {
                    ...updateData,
                    message: `${orderData.bartender} 認領了訂單`
                });
                break;

            case 'served':
                // 通知外場：訂單已完成
                this.io.to('front').emit('order_status_update', {
                    ...updateData,
                    message: `桌號 ${orderData.table_number} 的 ${orderData.item_name} 已完成`
                });

                // 通知內場同步
                this.io.to('bar').emit('order_status_sync', updateData);

                // 播放完成音效
                this.io.to('front').emit('notification_sound', {
                    type: 'order_completed',
                    sound: 'completion_alert'
                });
                break;
        }

        // 管理員收到所有更新
        this.io.to('admin').emit('order_status_update', updateData);
    }

    // 廣播庫存警示
    broadcastInventoryAlert(materialData) {
        if (!this.io) return;

        console.log('📢 廣播庫存警示:', materialData.name);

        const alertData = {
            type: 'inventory_alert',
            material: materialData,
            timestamp: new Date().toISOString(),
            message: `${materialData.name} 庫存不足 (${materialData.stock_quantity} ${materialData.unit})`
        };

        // 發送給內場和管理員
        this.io.to('bar').emit('inventory_alert', alertData);
        this.io.to('admin').emit('inventory_alert', alertData);
    }

    // 廣播系統通知
    broadcastSystemNotification(message, targetRoles = ['all_users']) {
        if (!this.io) return;

        const notification = {
            type: 'system_notification',
            message: message,
            timestamp: new Date().toISOString()
        };

        targetRoles.forEach(role => {
            this.io.to(role).emit('system_notification', notification);
        });
    }

    // 廣播線上使用者資訊
    broadcastOnlineUsers() {
        if (!this.io) return;

        const onlineUsers = Array.from(this.connectedUsers.values());
        const usersByRole = {
            front: onlineUsers.filter(u => u.role === 'front').length,
            bar: onlineUsers.filter(u => u.role === 'bar').length,
            finance: onlineUsers.filter(u => u.role === 'finance').length,
            admin: onlineUsers.filter(u => u.role === 'admin').length,
            total: onlineUsers.length
        };

        this.io.to('all_users').emit('online_users_update', {
            users: onlineUsers,
            count_by_role: usersByRole,
            timestamp: new Date().toISOString()
        });
    }

    // 取得線上使用者統計
    getOnlineStats() {
        const users = Array.from(this.connectedUsers.values());
        return {
            total: users.length,
            by_role: {
                front: users.filter(u => u.role === 'front').length,
                bar: users.filter(u => u.role === 'bar').length,
                finance: users.filter(u => u.role === 'finance').length,
                admin: users.filter(u => u.role === 'admin').length
            },
            users: users
        };
    }

    // 發送給特定使用者
    sendToUser(socketId, event, data) {
        if (!this.io) return;
        this.io.to(socketId).emit(event, data);
    }

    // 發送給特定角色
    sendToRole(role, event, data) {
        if (!this.io) return;
        this.io.to(role).emit(event, data);
    }
}

// 建立單一實例
const socketManager = new SocketManager();

module.exports = socketManager;