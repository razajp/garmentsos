import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/articles': 'Articles',
  '/articles/new': 'New Article',
  '/suppliers': 'Suppliers',
  '/suppliers/new': 'New Supplier',
  '/purchases': 'Purchases',
  '/purchases/new': 'New Purchase',
  '/inventory': 'Inventory',
  '/contractors': 'Contractors',
  '/contractors/new': 'New Contractor',
  '/production': 'Production',
  '/production/issue': 'Issue Production',
  '/production/receive': 'Receive Production',
  '/users': 'User Management',
  '/options': 'Manage Options',
  '/settings': 'Settings',
};

const MainLayout = () => {
  const location = useLocation();

  const getTitle = () => {
    if (pageTitles[location.pathname]) {
      return pageTitles[location.pathname];
    }
    if (location.pathname.includes('/articles/edit/')) {
      return 'Edit Article';
    }
    if (location.pathname.includes('/articles/view/')) {
      return 'Article Details';
    }
    if (location.pathname.includes('/suppliers/edit/')) {
      return 'Edit Supplier';
    }
    if (location.pathname.includes('/suppliers/view/')) {
      return 'Supplier Details';
    }
    if (location.pathname.includes('/purchases/edit/')) {
      return 'Edit Purchase';
    }
    if (location.pathname.includes('/purchases/view/')) {
      return 'Purchase Details';
    }
    if (location.pathname.includes('/contractors/edit/')) {
      return 'Edit Contractor';
    }
    if (location.pathname.includes('/contractors/view/')) {
      return 'Contractor Details';
    }
    if (location.pathname.includes('/production/view/')) {
      return 'Production Ticket';
    }
    return 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5">
          <div className="max-w-7xl mx-auto animate-fade-in h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
