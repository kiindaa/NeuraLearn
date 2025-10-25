import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = React.useState(false);
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main className={`flex-1 p-6 transition-all duration-300 ${collapsed ? 'md:ml-0' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
