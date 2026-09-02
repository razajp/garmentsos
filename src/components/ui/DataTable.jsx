import React from "react";
import { DataTablePagination } from "./DataTablePagination";
import { ListFilter, Printer } from "lucide-react";
import Button from "./Button";
import { motion, AnimatePresence } from "framer-motion";

export default function DataTable({ title, onFilter, onPrint, children, pagination, onPageChange }) {
  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col bg-white rounded-[2rem] border border-slate-300 overflow-hidden min-h-0"
      >  
        {/* Top Header Section */}
        <div className="flex flex-none items-center justify-between p-5 border-b border-slate-300 bg-white/50 backdrop-blur-md">
          <DataTablePagination 
            pagination={pagination} 
            onPageChange={onPageChange} 
          />

          <div className="flex gap-3">
            <Button
              onClick={onFilter}
              size="md"
              icon={ListFilter}
              variant="outline"
            >
              Filters
            </Button>
            <Button
              onClick={onPrint}
              size="md"
              icon={Printer}
              variant="outline"
            >
              Print
            </Button>
          </div>
        </div>

        {/* Table Container - Isko scrollable banaya gaya hai */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}