import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { ChevronDown, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Select = forwardRef(({
  label, error, options = [], placeholder = 'Choose option', 
  searchPlaceholder = 'Search...', className = '', containerClassName = '', 
  required = true, value, onChange, disabled = false, 
  emptyMessage = 'Nothing found', helperText, allowClear = true, 
  searchable = true, maxHeight = 'max-h-72', onSelect, ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const close = (e) => { 
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 10);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        // If already has value, call onSelect to move to next field
        if (value) {
          onSelect?.();
        } else {
          setIsOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 10);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredOptions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        break;
      case 'Enter':
        e.preventDefault();
        const option = filteredOptions[highlightedIndex];
        if (option) {
          onChange?.(option.value);
          setIsOpen(false);
          setSearchQuery('');
          // Call onSelect to move to next field
          setTimeout(() => onSelect?.(), 50);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  // Reset highlight when filtering
  useEffect(() => setHighlightedIndex(0), [searchQuery, isOpen]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) {
      const highlightedElement = document.getElementById(`option-${highlightedIndex}`);
      if (highlightedElement) {
        highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [highlightedIndex, isOpen, filteredOptions.length]);

  return (
    <div className={`relative ${containerClassName} ${disabled && 'opacity-60'}`} ref={containerRef}>
      {label && (
        <label className="block text-[14px] font-semibold text-slate-700 mb-1 ml-1">
          {label} {!required && <span className="text-slate-400 font-normal">(optional)</span>}
        </label>
      )}

      <button
        type="button"
        ref={(node) => {
          buttonRef.current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`
          w-full px-4 py-2 bg-white border-2 rounded-xl
          text-left transition-all duration-200 flex items-center justify-between
          focus:outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600
          disabled:cursor-not-allowed
          ${isOpen ? 'border-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200'}
          ${error ? 'border-red-500' : ''}
          ${className}
        `}
      >
        <span className={`font-medium ${selectedOption ? 'text-slate-900' : 'text-slate-400'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <div className="flex items-center gap-2">
          {selectedOption && !disabled && allowClear && (
            <X 
              size={16} 
              className="text-slate-400 hover:text-red-500" 
              onClick={(e) => { 
                e.stopPropagation(); 
                onChange?.(''); 
              }} 
            />
          )}
          <ChevronDown 
            size={18} 
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} 
          />
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute z-[60] w-full mt-2 bg-white border-2 border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden p-1 pb-0 origin-top"
          >
            {searchable && (
              <div className="p-3 rounded-xl bg-slate-200/40">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    ref={searchInputRef}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                    placeholder={searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
            )}

            <div className={`${maxHeight} overflow-y-auto p-1.5`}>
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-slate-400 font-medium">{emptyMessage}</div>
              ) : (
                filteredOptions.map((opt, idx) => (
                  <button
                    key={opt.value}
                    id={`option-${idx}`}
                    type="button"
                    onClick={() => { 
                      onChange?.(opt.value); 
                      setIsOpen(false); 
                      setSearchQuery('');
                      setTimeout(() => onSelect?.(), 50);
                    }}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`
                      w-full px-4 py-2 mb-1 text-left text-sm font-medium rounded-xl flex items-center justify-between transition-all
                      ${opt.value === value 
                        ? 'bg-indigo-600 text-white' 
                        : highlightedIndex === idx 
                          ? 'bg-indigo-50 text-slate-900' 
                          : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    {opt.label}
                    {opt.value === value && <Check size={16} />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <p className="text-xs text-red-500 font-bold ml-1 mt-1 animate-in fade-in slide-in-from-left-1">{error}</p>
      ) : helperText && (
        <p className="text-xs text-slate-500 ml-1 mt-1">{helperText}</p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
export default Select;