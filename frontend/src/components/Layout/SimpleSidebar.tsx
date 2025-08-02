import { useState } from "react";
import { 
  Home, 
  Coffee, 
  ChefHat, 
  Package, 
  BarChart3, 
  Settings,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "總覽儀表板", url: "/dashboard", icon: Home, roles: ["front", "bar", "admin"] },
  { title: "外場點單", url: "/front-order", icon: Coffee, roles: ["front", "admin"] },
  { title: "內場出酒", url: "/bar-operations", icon: ChefHat, roles: ["bar", "admin"] },
  { title: "品項管理", url: "/items", icon: Package, roles: ["admin"] },
  { title: "庫存管理", url: "/inventory", icon: Package, roles: ["bar", "admin"] },
  { title: "營業統計", url: "/analytics", icon: BarChart3, roles: ["admin"] },
  { title: "系統設定", url: "/settings", icon: Settings, roles: ["admin"] },
];

interface SimpleSidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export function SimpleSidebar({ collapsed, setCollapsed }: SimpleSidebarProps) {
  const { user, logout, switchRole } = useAuth();

  const filteredItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className={cn(
      "bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <div>
                <h2 className="font-bold text-sidebar-foreground">Friday's Bar</h2>
                <p className="text-xs text-sidebar-foreground/60">餐廳管理系統</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-sidebar-primary/20 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-sidebar-primary" />
            </div>
            {!collapsed && (
              <div className="flex-1">
                <p className="text-sm font-medium text-sidebar-foreground">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/60">
                  {user.role === 'front' && '外場服務'}
                  {user.role === 'bar' && '內場調酒'}
                  {user.role === 'admin' && '管理員'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 p-4">
        <div className="mb-4">
          <p className="text-xs text-sidebar-foreground/60 mb-2">
            {!collapsed && '主要功能'}
          </p>
          <nav className="space-y-1">
            {filteredItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={({ isActive }) =>
                  cn(
                    "flex items-center px-3 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )
                }
              >
                <item.icon className="w-4 h-4 mr-3" />
                {!collapsed && <span>{item.title}</span>}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Role Switcher */}
        {!collapsed && user?.role === 'admin' && (
          <div className="mb-4">
            <p className="text-xs text-sidebar-foreground/60 mb-2">角色切換</p>
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => switchRole('front')}
              >
                <Coffee className="mr-2 h-4 w-4" />
                外場模式
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent"
                onClick={() => switchRole('bar')}
              >
                <ChefHat className="mr-2 h-4 w-4" />
                內場模式
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className={cn(
            "w-full text-sidebar-foreground hover:bg-sidebar-accent",
            collapsed ? "px-2" : "justify-start"
          )}
          onClick={logout}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed && "登出"}
        </Button>
      </div>
    </div>
  );
}