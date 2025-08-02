import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Package
} from 'lucide-react';

interface DashboardStats {
  todayRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  onlineUsers: number;
}

interface RecentOrder {
  id: number;
  table: string;
  items: string[];
  status: 'pending' | 'claimed' | 'served';
  time: string;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    todayRevenue: 12450,
    pendingOrders: 8,
    lowStockCount: 3,
    onlineUsers: 5
  });

  const [recentOrders] = useState<RecentOrder[]>([
    { id: 1, table: 'A1', items: ['威士忌可樂', '檸檬汽水'], status: 'pending', time: '14:32' },
    { id: 2, table: 'B3', items: ['長島冰茶'], status: 'claimed', time: '14:28' },
    { id: 3, table: 'C2', items: ['莫希托', '瑪格麗特'], status: 'served', time: '14:25' },
    { id: 4, table: 'A2', items: ['琴通寧'], status: 'pending', time: '14:20' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'claimed': return 'bg-primary text-primary-foreground';
      case 'served': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待處理';
      case 'claimed': return '製作中';
      case 'served': return '已完成';
      default: return '未知';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">總覽儀表板</h1>
        <p className="text-muted-foreground">即時營運狀況一覽</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日營收</CardTitle>
            <DollarSign className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">NT$ {stats.todayRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              較昨日 +12.5%
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待處理訂單</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              平均等待時間 8 分鐘
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">庫存警示</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              <Package className="inline h-3 w-3 mr-1" />
              需要補貨
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-elegant transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">線上人員</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.onlineUsers}</div>
            <p className="text-xs text-muted-foreground">
              外場 2 人 • 內場 3 人
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>即時訂單動態</CardTitle>
            <CardDescription>最近 10 筆訂單狀態</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center space-x-3">
                    <div className="font-medium">桌號 {order.table}</div>
                    <div className="text-sm text-muted-foreground">
                      {order.items.join(', ')}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-muted-foreground">{order.time}</span>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>庫存警示</CardTitle>
            <CardDescription>需要注意的低庫存品項</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: '威士忌', current: 2, min: 5, unit: '瓶' },
                { name: '檸檬', current: 8, min: 20, unit: '顆' },
                { name: '蘇打水', current: 3, min: 10, unit: '瓶' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-destructive-light">
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-muted-foreground">
                      最低庫存: {item.min} {item.unit}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-destructive">
                      {item.current} {item.unit}
                    </div>
                    <div className="text-xs text-destructive">
                      短缺 {item.min - item.current} {item.unit}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}