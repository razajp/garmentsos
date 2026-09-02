import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuth } from './context/AuthContext';
import { useConfig } from './context/ConfigContext';

import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { ArticleList, ArticleForm, ArticleView } from './pages/articles';
import { SupplierList, SupplierForm, SupplierView } from './pages/suppliers';
import { PurchaseList, PurchaseForm, PurchaseView } from './pages/purchases';
import { InventoryList } from './pages/inventory';
import { ContractorList, ContractorForm, ContractorView } from './pages/contractors';
import { ProductionList, ProductionForm, ProductionView } from './pages/production';
import Users from './pages/Users';
import Options from './pages/Options';
import Settings from './pages/Settings';
import SubscriptionExpired from './pages/SubscriptionExpired';
import { PageLoader } from './components/ui/Loader';

// Protected Route Wrapper
const ProtectedRoute = ({ children, requireDeveloper = false }) => {
  const { user, loading: authLoading } = useAuth();
  const { isExpired } = useConfig();

  if (authLoading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (isExpired) return null; // Logic useEffect handle karega

  if (requireDeveloper && user.role !== 'developer') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const { isExpired, loading: configLoading, loadConfig } = useConfig();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // 1. RE-CHECK ON ROUTE CHANGE:
  // Har baar jab location.pathname badlega, ye backend se taza status mangwayega
  useEffect(() => {
    if (user && location.pathname !== '/login') {
      loadConfig();
    }
  }, [location.pathname, user, loadConfig]);

  // 2. NAVIGATION LOCK:
  // Expiry status ke hisab se redirection handle karega
  useEffect(() => {
    if (configLoading || authLoading) return;

    const path = location.pathname;

    if (user && isExpired) {
      if (path !== '/subscription-expired') {
        navigate('/subscription-expired', { replace: true });
      }
    } 
    else if (user && !isExpired && path === '/subscription-expired') {
      navigate('/dashboard', { replace: true });
    }
    else if (!user && path === '/subscription-expired') {
      navigate('/login', { replace: true });
    }
  }, [isExpired, user, configLoading, authLoading, location.pathname, navigate]);

  if (configLoading || authLoading) return <PageLoader />;

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/subscription-expired" element={<SubscriptionExpired />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="articles" element={<ArticleList />} />
          <Route path="articles/new" element={<ArticleForm />} />
          <Route path="articles/edit/:id" element={<ArticleForm />} />
          <Route path="articles/view/:id" element={<ArticleView />} />
          <Route path="suppliers" element={<SupplierList />} />
          <Route path="suppliers/new" element={<SupplierForm />} />
          <Route path="suppliers/edit/:id" element={<SupplierForm />} />
          <Route path="suppliers/view/:id" element={<SupplierView />} />
          <Route path="purchases" element={<PurchaseList />} />
          <Route path="purchases/new" element={<PurchaseForm />} />
          <Route path="purchases/edit/:id" element={<PurchaseForm />} />
          <Route path="purchases/view/:id" element={<PurchaseView />} />
          <Route path="inventory" element={<InventoryList />} />
          <Route path="contractors" element={<ContractorList />} />
          <Route path="contractors/new" element={<ContractorForm />} />
          <Route path="contractors/edit/:id" element={<ContractorForm />} />
          <Route path="contractors/view/:id" element={<ContractorView />} />
          <Route path="production" element={<ProductionList />} />
          <Route path="production/:mode" element={<ProductionForm />} />
          <Route path="production/:mode/edit/:id" element={<ProductionForm />} />
          <Route path="production/view/:id" element={<ProductionView />} />
          <Route path="options" element={<Options />} />
          <Route path="users" element={
            <ProtectedRoute requireDeveloper>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ToastContainer
        position="bottom-right" // Modern apps mein bottom-right zyada clean lagta hai
        autoClose={4000}
        hideProgressBar={true} // Progress bar aksar UI ko cluttered banati hai
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        // Custom class for extra styling control
        toastClassName={() => 
          "relative flex px-5 py-3.5 rounded-2xl justify-between overflow-hidden cursor-pointer bg-white border border-slate-300 mb-3"
        }
        bodyClassName={() => "flex text-sm font-medium text-slate-800 uppercase items-center p-0"}
      />
    </>
  );
}

export default App;
