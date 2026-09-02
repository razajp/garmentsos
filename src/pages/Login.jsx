import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shirt, ShieldCheck, ChevronRight } from 'lucide-react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { Button, Input } from '../components/ui';

const Login = () => {
  const { user, login } = useAuth();
  const { loadConfig } = useConfig();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.username, formData.password);
      await loadConfig();
      toast.success('Identity Verified. Welcome.');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setFormData({ username: 'demo', password: 'demo123' });
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-6 font-sans">
      
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-slate-200 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md w-full space-y-4 z-10"
      >
        {/* Main Login Card - The Inspiration Frame */}
        <div className="border border-slate-300 rounded-3xl p-1.5 bg-white">
          <div className="p-8 md:p-10 overflow-hidden relative">
            {/* Logo Section */}
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-sm shadow-indigo-100 mb-3">
                <Shirt size={26} className="text-white" />
              </div>
              <h1 className="text-xl font-black text-slate-900 uppercase tracking-tighter">GarmentsOS</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                Workspace Portal
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="mb-6 p-4 bg-red-100/85 border border-red-300 rounded-xl flex items-center gap-3"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-red-600 text-[11px] font-medium uppercase">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Username"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />

              <div className="pt-2">
                <Button 
                  type="submit"
                  variant="dark"
                  size='lg'
                  loading={loading}
                  className="w-full group"
                >
                  Authorize Access <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </form>

            <button
              type="button"
              onClick={fillDemoAccount}
              className="mt-4 w-full text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Use prototype account
            </button>

            {/* Bottom Support Tag */}
            <div className="mt-8 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl">
              <ShieldCheck size={14} className="text-indigo-500" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Secure System</span>
            </div>
          </div>
        </div>

        {/* Minimalist Footer - Match Subscription Style */}
        <div className="flex items-center justify-between px-6 opacity-40">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Powered by SparkPair
          </p>
          <div className="h-[1px] flex-1 mx-4 bg-slate-300" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            v2.4.0
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
