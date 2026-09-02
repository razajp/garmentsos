import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion'; // Added motion and AnimatePresence
import { LayoutDashboard, Package, Users, Settings, SlidersHorizontal, Shirt, LogOut, ChevronUp, Truck, ShoppingCart, Boxes, HardHat, PackageCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef(null);
  
  const isDeveloper = user?.role === 'developer';

  // Click outside logic
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/articles', icon: Package, label: 'Articles' },
    { path: '/suppliers', icon: Truck, label: 'Suppliers' },
    { path: '/purchases', icon: ShoppingCart, label: 'Purchases' },
    { path: '/inventory', icon: Boxes, label: 'Inventory' },
    { path: '/contractors', icon: HardHat, label: 'Contractors' },
    { path: '/production', icon: PackageCheck, label: 'Production' },
    { path: '/options', icon: SlidersHorizontal, label: 'Options' },
    ...(isDeveloper ? [{ path: '/users', icon: Users, label: 'Users' }] : []),
  ];

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  return (
    <aside className="w-72 h-screen p-4">
      {/* Sidebar Container Animation */}
      <motion.div 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-full bg-white border border-slate-300 flex flex-col p-5 relative h-full rounded-3xl"
      >
        {/* 1. Logo Section */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-100">
            <Shirt size={21} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 text-lg leading-tight tracking-tight">
              GarmentsOS
            </h1>
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest">{config?.developer.powered_by || 'SparkPair'}</p>
          </div>
        </div>

        <hr className='my-3 border-slate-300' />

        {/* 2. Navigation Section */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                relative flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group
                ${isActive ? 'text-indigo-600 bg-indigo-100 hover:bg-indigo-200' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
              `}
            >
              <item.icon size={20} className="transition-colors" />
              <span className="text-[15px] font-semibold">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* 3. User Profile Section */}
        <div className="relative mt-auto" ref={userMenuRef}>
          {/* User Menu Popup Animation */}
          <AnimatePresence>
            {showUserMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-full bg-white border border-slate-200 rounded-2xl p-1.5 z-50"
              >
                <div className="space-y-1">
                  <button 
                    onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all duration-300"
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">System Settings</span>
                  </button>
                  <button 
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-100 rounded-xl transition-all duration-300"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <hr className='my-3 border-slate-300' />
          
          {/* User Toggle Button */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-3 p-3 pr-5 rounded-2xl bg-slate-100 hover:bg-slate-200 transition-all duration-300 shadow-sm"
          >
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md">
              {getInitials(user?.name)}
            </div>
            <div className="flex-1 text-left overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{user?.role}</p>
            </div>
            <motion.div
              animate={{ rotate: showUserMenu ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronUp size={16} className="text-slate-400" />
            </motion.div>
          </motion.button>
        </div>
      </motion.div>
    </aside>
  );
};

export default Sidebar;
