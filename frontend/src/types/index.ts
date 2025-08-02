// Friday's Bar ERP Type Definitions

export interface User {
  id: string;
  name: string;
  role: 'front' | 'bar' | 'admin';
  socketId?: string;
}

export interface Order {
  id: number;
  table_number: string;
  orderer_name: string;
  items: OrderItem[];
  total_price: number;
  status: 'pending' | 'claimed' | 'served';
  created_at: string;
  served_at?: string;
  bartender?: string;
  notes?: string;
}

export interface OrderItem {
  item_name: string;
  quantity: number;
  price: number;
  materials: Material[];
}

export interface Item {
  name: string;
  base_spirit: string;
  price: number;
  alcohol_cost: number;
  other_cost: number;
  gross_profit: number;
  gross_profit_margin: number;
  materials: string[];
  notes?: string;
}

export interface Material {
  name: string;
  current_stock: number;
  min_stock: number;
  category: string;
  unit: string;
  cost_per_unit?: number;
  last_updated?: string;
}

export interface StockAlert {
  material: Material;
  shortage_amount: number;
}

export interface CreateOrderDto {
  table_number: string;
  orderer_name: string;
  items: Array<{
    item_name: string;
    quantity: number;
  }>;
  notes?: string;
}

export interface CreateItemDto {
  name: string;
  base_spirit: string;
  price: number;
  alcohol_cost: number;
  other_cost: number;
  materials: string[];
  notes?: string;
}

export interface StockAction {
  action: 'add' | 'use' | 'set';
  amount: number;
  reason?: string;
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export interface OrderFilters {
  status?: Order['status'];
  table_number?: string;
  start_date?: string;
  end_date?: string;
}

export interface DashboardStats {
  todayRevenue: number;
  pendingOrders: number;
  lowStockCount: number;
  onlineUsers: number;
}