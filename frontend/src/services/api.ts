import { Order, Item, Material, CreateOrderDto, CreateItemDto, StockAction, OrderFilters, DashboardStats } from '@/types';

class ApiService {
  private static baseURL = 'http://localhost:3001';

  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Items API
  static async getItems(): Promise<Item[]> {
    return this.request<Item[]>('/api/items');
  }

  static async createItem(item: CreateItemDto): Promise<Item> {
    return this.request<Item>('/api/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  static async updateItem(name: string, item: Partial<CreateItemDto>): Promise<Item> {
    return this.request<Item>(`/api/items/${encodeURIComponent(name)}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    });
  }

  static async deleteItem(name: string): Promise<void> {
    return this.request<void>(`/api/items/${encodeURIComponent(name)}`, {
      method: 'DELETE',
    });
  }

  // Orders API
  static async getOrders(filters?: OrderFilters): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<Order[]>(`/api/orders${query}`);
  }

  static async getFrontOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders/front');
  }

  static async getBarOrders(): Promise<Order[]> {
    return this.request<Order[]>('/api/orders/bar');
  }

  static async createOrder(order: CreateOrderDto): Promise<Order> {
    return this.request<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  static async claimOrder(id: number, bartender: string): Promise<void> {
    return this.request<void>(`/api/orders/${id}/claim`, {
      method: 'PUT',
      body: JSON.stringify({ bartender }),
    });
  }

  static async serveOrder(id: number): Promise<void> {
    return this.request<void>(`/api/orders/${id}/served`, {
      method: 'PUT',
    });
  }

  // Materials API
  static async getMaterials(): Promise<Material[]> {
    return this.request<Material[]>('/api/materials');
  }

  static async updateStock(name: string, action: StockAction): Promise<Material> {
    return this.request<Material>(`/api/materials/${encodeURIComponent(name)}/stock`, {
      method: 'PUT',
      body: JSON.stringify(action),
    });
  }

  static async getLowStockAlerts(): Promise<Material[]> {
    return this.request<Material[]>('/api/materials/alerts/low-stock');
  }

  // Stats API
  static async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/api/stats/dashboard');
  }
}

export default ApiService;