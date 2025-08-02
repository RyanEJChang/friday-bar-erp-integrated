import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Minus, ShoppingCart, Search } from 'lucide-react';

interface MenuItem {
  name: string;
  price: number;
  baseSpirit: string;
  materials: string[];
}

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export function FrontOrder() {
  const [menuItems] = useState<MenuItem[]>([
    {
      name: '威士忌可樂',
      price: 280,
      baseSpirit: '威士忌',
      materials: ['威士忌', '可樂', '冰塊', '檸檬片']
    },
    {
      name: '長島冰茶',
      price: 380,
      baseSpirit: '綜合烈酒',
      materials: ['伏特加', '琴酒', '龍舌蘭', '蘭姆酒', '檸檬汁', '可樂']
    },
    {
      name: '莫希托',
      price: 320,
      baseSpirit: '蘭姆酒',
      materials: ['白蘭姆酒', '薄荷葉', '萊姆', '蘇打水', '糖']
    },
    {
      name: '瑪格麗特',
      price: 350,
      baseSpirit: '龍舌蘭',
      materials: ['龍舌蘭', '橙酒', '萊姆汁', '鹽巴']
    }
  ]);

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [tableNumber, setTableNumber] = useState('');
  const [ordererName, setOrdererName] = useState('');
  const [notes, setNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMenuItems = menuItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.baseSpirit.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToOrder = (menuItem: MenuItem) => {
    const existingItem = orderItems.find(item => item.name === menuItem.name);
    
    if (existingItem) {
      setOrderItems(orderItems.map(item =>
        item.name === menuItem.name
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setOrderItems([...orderItems, {
        name: menuItem.name,
        quantity: 1,
        price: menuItem.price
      }]);
    }
  };

  const updateQuantity = (itemName: string, change: number) => {
    setOrderItems(orderItems.map(item => {
      if (item.name === itemName) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : null;
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const getTotalPrice = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const submitOrder = () => {
    if (!tableNumber || !ordererName || orderItems.length === 0) {
      return;
    }

    // Here would be the API call to submit the order
    console.log('Submitting order:', {
      table_number: tableNumber,
      orderer_name: ordererName,
      items: orderItems.map(item => ({
        item_name: item.name,
        quantity: item.quantity
      })),
      notes
    });

    // Reset form
    setOrderItems([]);
    setTableNumber('');
    setOrdererName('');
    setNotes('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      {/* Menu Items */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>品項選擇</CardTitle>
          <CardDescription>點擊品項加入訂單</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜尋品項或基酒..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <Card 
              key={item.name}
              className="cursor-pointer hover:shadow-elegant transition-shadow"
              onClick={() => addToOrder(item)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-lg">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">基酒: {item.baseSpirit}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">NT$ {item.price}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {item.materials.map((material, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {material}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Order Creation */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            訂單建立
          </CardTitle>
          <CardDescription>填寫訂單資訊並提交</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="table">桌號 *</Label>
              <Input
                id="table"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="例: A1"
              />
            </div>
            <div>
              <Label htmlFor="orderer">點單者 *</Label>
              <Input
                id="orderer"
                value={ordererName}
                onChange={(e) => setOrdererName(e.target.value)}
                placeholder="點單者姓名"
              />
            </div>
          </div>

          {/* Order Items */}
          <div>
            <Label>已點品項</Label>
            <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
              {orderItems.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  尚未選擇任何品項
                </div>
              ) : (
                orderItems.map((item) => (
                  <div key={item.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">NT$ {item.price}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.name, -1)}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => updateQuantity(item.name, 1)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">備註</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="特殊需求或備註..."
              rows={3}
            />
          </div>

          {/* Total & Submit */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-lg font-semibold">總計</span>
              <span className="text-xl font-bold text-primary">NT$ {getTotalPrice()}</span>
            </div>
            <Button
              onClick={submitOrder}
              disabled={!tableNumber || !ordererName || orderItems.length === 0}
              className="w-full"
              variant="hero"
              size="lg"
            >
              提交訂單
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}