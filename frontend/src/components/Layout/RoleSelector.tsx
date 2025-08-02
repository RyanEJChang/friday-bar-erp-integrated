import { User, ChefHat, Shield, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User as UserType } from '@/types';

interface RoleSelectorProps {
  onRoleSelect: (role: UserType['role']) => void;
}

const roles = [
  {
    role: 'front' as const,
    title: '外場服務',
    description: '負責點單、客戶服務與桌務管理',
    icon: Users,
    color: 'bg-gradient-primary',
  },
  {
    role: 'bar' as const,
    title: '內場調酒',
    description: '負責調酒製作、出餐與廚房管理',
    icon: ChefHat,
    color: 'bg-gradient-accent',
  },
  {
    role: 'admin' as const,
    title: '管理員',
    description: '系統管理、數據分析與營運決策',
    icon: Shield,
    color: 'bg-gradient-success',
  },
];

export function RoleSelector({ onRoleSelect }: RoleSelectorProps) {
  return (
    <div className="min-h-screen bg-gradient-warm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">Friday's Bar ERP</h1>
          <p className="text-xl text-muted-foreground">請選擇您的工作角色</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map(({ role, title, description, icon: Icon, color }) => (
            <Card 
              key={role}
              className="hover:shadow-elegant transition-all duration-300 cursor-pointer group"
              onClick={() => onRoleSelect(role)}
            >
              <CardHeader className="text-center">
                <div className={`mx-auto w-16 h-16 ${color} rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  選擇角色
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8 text-sm text-muted-foreground">
          選擇角色後可在系統內隨時切換
        </div>
      </div>
    </div>
  );
}