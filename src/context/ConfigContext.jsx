import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { mockConfig, mockOptions } from '../services/mockData';

const ConfigContext = createContext(null);
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) throw new Error('useConfig must be used within ConfigProvider');
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState(null);
  const [options, setOptions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  const loadConfig = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    if (USE_MOCKS) {
      setConfig(mockConfig);
      setOptions(mockOptions);
      setIsExpired(false);
      setLoading(false);
      return;
    }

    try {
      // Pehle config mangwayein status check karne ke liye
      const configRes = await api.get('/config');
      const configData = configRes.data.data;
      setConfig(configData);

      const expiryDate = new Date(configData.subscriptionExpiry);
      if (new Date() > expiryDate) {
        setIsExpired(true);
      } else {
        setIsExpired(false);
        // Agar expired nahi hai, tabhi options load karein
        const optionsRes = await api.get('/options');
        setOptions(optionsRes.data.data);
      }
    } catch (error) {
      if (error.response?.status === 403) {
        setIsExpired(true);
        const expiredData = error.response.data;
        setConfig({
          subscriptionExpiry: expiredData.data?.subscriptionExpiry || expiredData.expiredOn,
          companyName: expiredData.data?.companyName || 'Your System'
        });
      }
      console.warn("Security Alert: Subscription status re-evaluated.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  return (
    <ConfigContext.Provider value={{ config, options, loading, isExpired, loadConfig, refreshOptions: loadConfig }}>
      {children}
    </ConfigContext.Provider>
  );
};
