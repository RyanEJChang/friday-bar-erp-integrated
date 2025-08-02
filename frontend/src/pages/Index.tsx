import { useState } from 'react';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { RoleSelector } from '@/components/Layout/RoleSelector';
import { AppLayout } from '@/components/Layout/AppLayout';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '@/pages/Dashboard';
import { FrontOrder } from '@/pages/FrontOrder';
import { BarOperations } from '@/pages/BarOperations';

function AppContent() {
  const { user, login } = useAuth();

  if (!user) {
    return <RoleSelector onRoleSelect={(role) => login({ 
      id: '1', 
      name: '測試用戶', 
      role 
    })} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/front-order" element={<FrontOrder />} />
        <Route path="/bar-operations" element={<BarOperations />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
}

const Index = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default Index;
