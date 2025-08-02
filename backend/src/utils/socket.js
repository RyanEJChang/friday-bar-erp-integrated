// backend/src/utils/socket.js
// Friday's Bar ERP - Socket.io 即時同步系統

const socketIo = require('socket.io');

class SocketManager {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // 儲存連接的使用者資訊
        this.roomStats = {
            front: 0,   // 外場使用者數量
            bar: 0,     // 內場使用者數量
            admin: 0    // 管理員數量
        };
    }

    // 初始化 Socket.io 伺服器
    initialize(server) {
        this.io = socketIo(server, {
            cors: {
                origin: [
                    process.env.FRONTEND_URL || "http://localhost:3000",
                    "file://",        // 支援本地檔案
                    "null"            // 支援 file:// 協議
                ],
                methods: ["GET", "POST"],
                credentials: true
            },
            transports: ['websocket', 'polling']
        });

        console.log('🔌 Socket.io 伺服器已初始化');
        this.setupEventHandlers();
        return this.io;
    }

    // 設定事件處理器
    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`🔗 使用者連接: ${socket.id}`);

            // 使用者加入房間
            socket.on('join_room', (data) => {
                this.handleJoinRoom(socket, data);
            });

            // 使用者離開房間
            socket.on('leave_room', (data) => {
                this.handleLeaveRoom(socket, data);
            });

            // 處理斷線
            socket.on('disconnect', () => {
                this.handleDisconnect(socket);
            });

            // 測試連接
            socket.on('ping', () => {
                socket.emit('pong', {
                    message: 'Socket.io 連接正常',
                    timestamp: new Date().toISOString()
                });
            });

            // 發送歡迎訊息
            socket.emit('welcome', {
                message: '歡迎使用 Friday\'s Bar ERP 系統',
                socketId: socket.id,
                timestamp: new Date().toISOString()
            });
        });
    }

    // 處理使用者加入房間
    handleJoinRoom(socket, data) {
        const { room, user } = data;
        
        if (!room || !['front', 'bar', 'admin'].includes(room)) {
            socket.emit('error', { message: '無效的房間類型' });
            return;
        }

        // 離開之前的房間
        Object.keys(socket.rooms).forEach(roomName => {
            if (roomName !== socket.id) {
                socket.leave(roomName);
                if (this.roomStats[roomName] !== undefined) {
                    this.roomStats[roomName] = Math.max(0, this.roomStats[roomName] - 1);
                }
            }
        });

        // 加入新房間
        socket.join(room);
        this.roomStats[room]++;

        // 儲存使用者資訊
        this.connectedUsers.set(socket.id, {
            room: room,
            user: user || '匿名使用者',
            joinTime: new Date().toISOString()
        });

        console.log(`👥 ${user || '匿名使用者'} 加入 ${room} 房間`);

        // 通知使用者加入成功
        socket.emit('joined_room', {
            room: room,
            user: user,
            message: `已加入 ${this.getRoomDisplayName(room)} 房間`,
            roomStats: this.roomStats
        });

        // 通知房間內其他使用者
        socket.to(room).emit('user_joined', {
            user: user || '匿名使用者',
            room: room,
            timestamp: new Date().toISOString()
        });

        // 廣播房間統計更新
        this.broadcastRoomStats();
    }

    // 處理使用者離開房間
    handleLeaveRoom(socket, data) {
        const { room } = data;
        const userInfo = this.connectedUsers.get(socket.id);

        if (userInfo && userInfo.room === room) {
            socket.leave(room);
            this.roomStats[room] = Math.max(0, this.roomStats[room] - 1);

            console.log(`👋 ${userInfo.user} 離開 ${room} 房間`);

            // 通知房間內其他使用者
            socket.to(room).emit('user_left', {
                user: userInfo.user,
                room: room,
                timestamp: new Date().toISOString()
            });

            this.connectedUsers.delete(socket.id);
            this.broadcastRoomStats();
        }
    }

    // 處理斷線
    handleDisconnect(socket) {
        const userInfo = this.connectedUsers.get(socket.id);
        
        if (userInfo) {
            this.roomStats[userInfo.room] = Math.max(0, this.roomStats[userInfo.room] - 1);
            console.log(`❌ ${userInfo.user} 斷線離開 ${userInfo.room} 房間`);
            
            // 通知房間內其他使用者
            socket.to(userInfo.room).emit('user_disconnected', {
                user: userInfo.user,
                room: userInfo.room,
                timestamp: new Date().toISOString()
            });

            this.connectedUsers.delete(socket.id);
            this.broadcastRoomStats();
        }

        console.log(`🔌 使用者斷線: ${socket.id}`);
    }

    // ==========================================
    // 業務邏輯事件廣播方法
    // ==========================================

    // 新訂單通知（外場下單 → 內場通知）
    broadcastNewOrder(orderData) {
        console.log('📢 廣播新訂單到內場:', orderData.id);
        
        this.io.to('bar').emit('new_order', {
            type: 'new_order',
            data: orderData,
            message: `新訂單：桌號 ${orderData.table_number} - ${orderData.item_name}`,
            timestamp: new Date().toISOString(),
            sound: true  // 提示前端播放提示音
        });

        // 通知管理員
        this.io.to('admin').emit('new_order', {
            type: 'new_order',
            data: orderData,
            message: `新訂單通知`,
            timestamp: new Date().toISOString()
        });
    }

    // 訂單狀態更新（內場操作 → 外場通知）
    broadcastOrderStatusUpdate(orderData, action) {
        console.log(`📢 廣播訂單狀態更新: ${orderData.id} - ${action}`);
        
        let message = '';
        let barMessage = '';  // 專門給內場的訊息

        switch (action) {
            case 'claimed':
                message = `${orderData.item_name} 已被 ${orderData.bartender} 認領`;
                barMessage = `🙋‍♂️ ${orderData.bartender} 認領了桌號 ${orderData.table_number} 的 ${orderData.item_name}`;
                break;
            case 'served':
                message = `桌號 ${orderData.table_number} 的 ${orderData.item_name} 已完成`;
                barMessage = `✅ 桌號 ${orderData.table_number} 的 ${orderData.item_name} 已出酒完成`;
                break;
            default:
                message = `訂單狀態已更新`;
                barMessage = `🔄 訂單 ${orderData.id} 狀態更新`;
        }

        // 通知外場
        this.io.to('front').emit('order_status_update', {
            type: 'order_status_update',
            action: action,
            data: orderData,
            message: message,
            timestamp: new Date().toISOString(),
            sound: action === 'served'  // 出酒完成時播放提示音
        });

        // 通知管理員
        this.io.to('admin').emit('order_status_update', {
            type: 'order_status_update',
            action: action,
            data: orderData,
            message: message,
            timestamp: new Date().toISOString()
        });

        // 同步更新內場其他使用者
        this.io.to('bar').emit('order_status_sync', {
            type: 'order_status_sync',
            action: action,
            data: orderData,
            message: barMessage,  // 使用專門給內場的訊息
            timestamp: new Date().toISOString(),
            details: {
                order_id: orderData.id,
                table_number: orderData.table_number,
                item_name: orderData.item_name,
                bartender: orderData.bartender || null,
                action_text: action === 'claimed' ? '已認領' : action === 'served' ? '已完成' : '已更新'
            }
        });
    }

    // 庫存警示廣播
    broadcastInventoryAlert(materialData, alertType) {
        console.log(`📢 廣播庫存警示: ${materialData.name} - ${alertType}`);
        
        let message = '';
        let priority = 'normal';
        
        switch (alertType) {
            case 'out_of_stock':
                message = `⚠️ ${materialData.name} 已缺貨`;
                priority = 'critical';
                break;
            case 'low_stock':
                message = `⚠️ ${materialData.name} 庫存不足 (剩餘: ${materialData.stock_quantity})`;
                priority = 'warning';
                break;
            case 'restock':
                message = `✅ ${materialData.name} 已補貨 (當前: ${materialData.stock_quantity})`;
                priority = 'info';
                break;
        }

        // 廣播給所有房間
        this.io.emit('inventory_alert', {
            type: 'inventory_alert',
            alertType: alertType,
            priority: priority,
            data: materialData,
            message: message,
            timestamp: new Date().toISOString(),
            sound: priority === 'critical'
        });
    }

    // 系統通知廣播
    broadcastSystemNotification(notification) {
        console.log('📢 廣播系統通知:', notification.message);
        
        this.io.emit('system_notification', {
            type: 'system_notification',
            ...notification,
            timestamp: new Date().toISOString()
        });
    }

    // ==========================================
    // 輔助方法
    // ==========================================

    // 廣播房間統計
    broadcastRoomStats() {
        this.io.emit('room_stats_update', {
            type: 'room_stats_update',
            stats: this.roomStats,
            totalUsers: Object.values(this.roomStats).reduce((a, b) => a + b, 0),
            timestamp: new Date().toISOString()
        });
    }

    // 獲取房間顯示名稱
    getRoomDisplayName(room) {
        const names = {
            front: '外場服務',
            bar: '內場調酒',
            admin: '管理中心'
        };
        return names[room] || room;
    }

    // 獲取連接統計
    getConnectionStats() {
        return {
            totalConnections: this.connectedUsers.size,
            roomStats: this.roomStats,
            connectedUsers: Array.from(this.connectedUsers.values())
        };
    }

    // 強制斷線使用者
    disconnectUser(socketId, reason = '管理員操作') {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
            socket.emit('force_disconnect', {
                reason: reason,
                timestamp: new Date().toISOString()
            });
            socket.disconnect(true);
            console.log(`🔌 強制斷線使用者: ${socketId}, 原因: ${reason}`);
        }
    }

    // 向特定房間發送訊息
    sendToRoom(room, event, data) {
        this.io.to(room).emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }

    // 向所有使用者發送訊息
    broadcast(event, data) {
        this.io.emit(event, {
            ...data,
            timestamp: new Date().toISOString()
        });
    }
}

// 建立單例實例
const socketManager = new SocketManager();

module.exports = socketManager;