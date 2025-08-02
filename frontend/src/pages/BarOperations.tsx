import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle } from 'lucide-react';

interface BarOrder {
  id: number;
  table_number: string;
  orderer_name: string;
  items: string[];
  status: 'pending' | 'claimed' | 'served';
  created_at: string;
  bartender?: string;
  waiting_time: number;
}

export function BarOperations() {
  const [orders, setOrders] = useState<BarOrder[]>([
    {
      id: 1,
      table_number: 'A1',
      orderer_name: '張先生',
      items: ['威士忌可樂', '檸檬汽水'],
      status: 'pending',
      created_at: '14:32',
      waiting_time: 8
    },
    {
      id: 2,
      table_number: 'B3',
      orderer_name: '李小姐',
      items: ['長島冰茶'],
      status: 'claimed',
      created_at: '14:28',
      bartender: '小王',
      waiting_time: 12
    },
    {
      id: 4,
      table_number: 'A2',
      orderer_name: '陳先生',
      items: ['琴通寧'],
      status: 'pending',
      created_at: '14:20',
      waiting_time: 20
    },
  ]);

  const claimOrder = (orderId: number) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'claimed' as const, bartender: '當前調酒師' }
        : order
    ));
  };

  const completeOrder = (orderId: number) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: 'served' as const }
        : order
    ));
  };

  const pendingOrders = orders.filter(order => order.status === 'pending');
  const claimedOrders = orders.filter(order => order.status === 'claimed');

  const getWaitingTimeColor = (minutes: number) => {
    if (minutes < 10) return 'text-success';
    if (minutes < 20) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">內場出酒</h1>
        <p className="text-muted-foreground">管理調酒製作流程</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2 text-warning" />
            待處理訂單 ({pendingOrders.length})
          </h2>
          <div className="space-y-4">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="shadow-card hover:shadow-elegant transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">桌號 {order.table_number}</CardTitle>
                      <CardDescription>點單者: {order.orderer_name}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{order.created_at}</div>
                      <div className={`text-sm font-medium ${getWaitingTimeColor(order.waiting_time)}`}>
                        等待 {order.waiting_time} 分鐘
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">品項清單:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm bg-muted p-2 rounded">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => claimOrder(order.id)}
                      className="w-full"
                      variant="accent"
                    >
                      認領訂單
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {pendingOrders.length === 0 && (
              <Card className="shadow-card">
                <CardContent className="text-center py-8">
                  <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">目前沒有待處理的訂單</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Claimed Orders */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <User className="w-5 h-5 mr-2 text-primary" />
            製作中 ({claimedOrders.length})
          </h2>
          <div className="space-y-4">
            {claimedOrders.map((order) => (
              <Card key={order.id} className="shadow-card border-primary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">桌號 {order.table_number}</CardTitle>
                      <CardDescription>點單者: {order.orderer_name}</CardDescription>
                      <Badge variant="default" className="mt-1">
                        調酒師: {order.bartender}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{order.created_at}</div>
                      <div className={`text-sm font-medium ${getWaitingTimeColor(order.waiting_time)}`}>
                        製作中 {order.waiting_time} 分鐘
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium mb-2">品項清單:</h4>
                      <div className="space-y-1">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-sm bg-primary/10 p-2 rounded border border-primary/20">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => completeOrder(order.id)}
                      className="w-full"
                      variant="success"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      完成出餐
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {claimedOrders.length === 0 && (
              <Card className="shadow-card">
                <CardContent className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">目前沒有製作中的訂單</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}