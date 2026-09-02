import React, { forwardRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const Input = forwardRef(({
  label, 
  error, 
  type = 'text', 
  className = '', 
  containerClassName = '', 
  required = true, 
  helperText, 
  leftIcon: LeftIcon, 
  rightIcon: RightIcon, 
  onRightIconClick, 
  disabled = false, 
  onEnter,
  variant = 'default', // 'default' | 'calculator' | 'quantity'
  value,
  onChange,
  ...props
}, ref) => {
  
  // Calculator variant state
  const [displayValue, setDisplayValue] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Quantity variant state
  const [piecesInput, setPiecesInput] = useState('');
  const [dozenInput, setDozenInput] = useState('');
  const [lastEdited, setLastEdited] = useState('pieces');

  // Sync calculator display with external value
  useEffect(() => {
    if (variant === 'calculator') {
      setDisplayValue(value || '');
    }
  }, [value, variant]);

  // Sync quantity inputs with external value
  useEffect(() => {
    if (variant === 'quantity') {
      const totalPieces = parseInt(value) || 0;
      if (totalPieces > 0 && lastEdited === 'pieces') {
        setPiecesInput(totalPieces.toString());
        setDozenInput((totalPieces / 12).toFixed(2));
      }
    }
  }, [value, variant, lastEdited]);

  // Calculator handlers
  const handleCalculatorChange = (e) => {
    const val = e.target.value;
    setDisplayValue(val);
    
    if (val.includes('=')) {
      const expression = val.split('=')[0].trim();
      try {
        setIsCalculating(true);
        const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
        const result = Function(`'use strict'; return (${sanitized})`)();
        
        if (!isNaN(result) && isFinite(result)) {
          const rounded = Math.round(result * 100) / 100;
          
          setCalculationHistory(prev => [...prev, {
            expression: expression,
            result: rounded,
            timestamp: new Date().toLocaleTimeString()
          }]);
          
          setDisplayValue(rounded.toString());
          onChange?.(rounded.toString());
        }
      } catch (err) {
        toast.error('Invalid calculation');
      } finally {
        setIsCalculating(false);
      }
    } else {
      onChange?.(val);
    }
  };

  const handleCalculatorKeyDown = (e) => {
    if (e.key === 'F2') {
      e.preventDefault();
      setShowHistory(!showHistory);
      return;
    }
    
    if (e.key === 'Enter') {
      e.preventDefault();
      
      if (displayValue && !displayValue.includes('=')) {
        const expression = displayValue.trim();
        try {
          setIsCalculating(true);
          const sanitized = expression.replace(/[^0-9+\-*/.() ]/g, '');
          
          if (/^\d+\.?\d*$/.test(sanitized)) {
            onEnter?.();
            return;
          }
          
          const result = Function(`'use strict'; return (${sanitized})`)();
          
          if (!isNaN(result) && isFinite(result)) {
            const rounded = Math.round(result * 100) / 100;
            
            setCalculationHistory(prev => [...prev, {
              expression: expression,
              result: rounded,
              timestamp: new Date().toLocaleTimeString()
            }]);
            
            setDisplayValue(rounded.toString());
            onChange?.(rounded.toString());
          }
        } catch (err) {
          onEnter?.();
        } finally {
          setIsCalculating(false);
        }
      } else {
        onEnter?.();
      }
    }
  };

  // Quantity handlers
  const handlePiecesChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setPiecesInput(val);
      setLastEdited('pieces');
      const pieces = parseInt(val) || 0;
      setDozenInput(pieces ? (pieces / 12).toFixed(2) : '');
      onChange?.({ target: { value: val } });
    }
  };

  const handleDozenChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setDozenInput(val);
      setLastEdited('dozen');
      
      if (val && !val.endsWith('.')) {
        const dozen = parseFloat(val);
        if (!isNaN(dozen)) {
          const pieces = Math.round(dozen * 12);
          setPiecesInput(pieces.toString());
          onChange?.({ target: { value: pieces.toString() } });
        }
      } else if (val === '') {
        setPiecesInput('');
        onChange?.({ target: { value: '0' } });
      }
    }
  };

  const handleQuantityKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onEnter?.();
    }
  };

  // Default handlers
  const handleDefaultKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onEnter?.();
    }
  };

  // Quantity variant render
  if (variant === 'quantity') {
    return (
      <div className={containerClassName}>
        {label && (
          <label className="block text-[14px] font-semibold text-slate-700 mb-1 ml-1">
            {label}
          </label>
        )}
        
        <div className="grid grid-cols-2 gap-3">
          <input
            ref={ref}
            type="text"
            value={dozenInput}
            onChange={handleDozenChange}
            onKeyDown={handleQuantityKeyDown}
            placeholder="Dozen"
            className={`
              w-full px-4 py-2 bg-white border-2 border-slate-200 rounded-xl
              text-slate-900 placeholder-slate-400 font-medium
              focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600
              transition-all duration-200
              ${className}
            `}
            disabled={disabled}
          />

          <input
            type="text"
            value={piecesInput}
            onChange={handlePiecesChange}
            onKeyDown={handleQuantityKeyDown}
            placeholder="Pieces"
            className={`
              w-full px-4 py-2 bg-white border-2 border-slate-200 rounded-xl
              text-slate-900 placeholder-slate-400 font-medium
              focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600
              transition-all duration-200
              ${className}
            `}
            disabled={disabled}
          />
        </div>
      </div>
    );
  }

  // Calculator variant render
  if (variant === 'calculator') {
    return (
      <div className={`relative ${containerClassName}`}>
        {label && (
          <label className="block text-[14px] font-semibold text-slate-700 mb-1 ml-1">
            {label}
          </label>
        )}
        
        <input
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleCalculatorChange}
          onKeyDown={handleCalculatorKeyDown}
          placeholder={props.placeholder || "Enter value or calculation (e.g., 59*4/36 then Enter)"}
          className={`
            w-full px-4 py-2 bg-white border-2 rounded-xl
            text-slate-900 placeholder-slate-400 font-medium font-mono
            focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600
            transition-all duration-200
            disabled:cursor-not-allowed
            ${isCalculating ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />

        {/* Calculation History Dropdown */}
        <AnimatePresence>
          {showHistory && calculationHistory.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-slate-300 rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto"
            >
              <div className="p-3 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Calculation History
                  </p>
                  <button
                    type="button"
                    onClick={() => setCalculationHistory([])}
                    className="text-[10px] text-red-600 hover:text-red-800 font-bold uppercase"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-100">
                {calculationHistory.slice().reverse().map((calc, idx) => (
                  <div
                    key={idx}
                    className="p-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setDisplayValue(calc.result.toString());
                      onChange?.(calc.result.toString());
                      setShowHistory(false);
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-600 truncate">
                          {calc.expression}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {calc.timestamp}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">=</span>
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {calc.result.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Default variant render
  return (
    <div className={`${containerClassName} ${disabled && 'opacity-60'}`}>
      {label && (
        <label className="block text-[14px] font-semibold text-slate-700 mb-1 ml-1">
          {label} {!required && <span className="text-slate-400 font-normal">(optional)</span>}
        </label>
      )}
      <div className="relative group">
        {LeftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
            <LeftIcon size={18} />
          </div>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={handleDefaultKeyDown}
          className={`
            w-full px-4 py-2 bg-white border-2 border-slate-200 rounded-xl
            text-slate-900 placeholder-slate-400 font-medium
            focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600
            transition-all duration-200
            disabled:cursor-not-allowed
            ${LeftIcon ? 'pl-11' : ''}
            ${RightIcon ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:ring-red-50 focus:border-red-500' : ''}
            ${className}
          `}
          disabled={disabled}
          {...props}
        />
        {RightIcon && (
          <button
            type="button"
            onClick={onRightIconClick}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RightIcon size={18} />
          </button>
        )}
      </div>
      {error ? (
        <p className="text-xs text-red-500 font-bold ml-1 mt-1 animate-in fade-in slide-in-from-left-1">{error}</p>
      ) : helperText && (
        <p className="text-xs text-slate-500 ml-1 mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;