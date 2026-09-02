import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { purchasesAPI } from '../../services/api';
import { useTable } from '../../hooks/useTable';
import { ConfirmationModal, DataTable, DataTableHeader, EmptyState, FilterDrawer, Input, LoadingRow, PageHeader } from '../../components/ui';

const PurchaseList = () => {
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { filters, tempFilters, setTempFilters, sort, handleSort, pagination, setPagination, applyFilters, resetFilters, activeFilterCount } = useTable({ search: '' });

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const { data } = await purchasesAPI.getAll({ ...filters, ...sort, page: pagination.page, limit: pagination.limit });
      setPurchases(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch {
      toast.error('Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPurchases(); }, [filters, sort, pagination.page]);

  const handleDelete = async () => {
    try {
      await purchasesAPI.delete(deleteId);
      toast.success('Purchase deleted');
      setDeleteId(null);
      loadPurchases();
    } catch {
      toast.error('Failed to delete purchase');
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title="Purchases" subtitle="Supplier invoices and inventory intake" primaryAction={{ label: 'Add Purchase', link: '/purchases/new', icon: Plus }} />
      <DataTable pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onFilter={() => setIsFilterOpen(true)} activeFilterCount={activeFilterCount}>
        <table className="w-full">
          <DataTableHeader columns={[
            { key: 'purchase_no', label: 'Purchase No', sortable: true },
            { key: 'reference_no', label: 'Reference', sortable: true },
            { key: 'supplier_name', label: 'Supplier', sortable: true },
            { key: 'purchase_date', label: 'Purchase Date', sortable: true },
            { key: 'total_amount', label: 'Total Amount', sortable: true, align: 'center' },
            { key: 'actions', label: 'Actions', align: 'center' },
          ]} sort={sort} onSort={handleSort} />
          <tbody>
            {loading ? <LoadingRow colSpan={6} rows={10} /> : purchases.length ? purchases.map((purchase) => (
              <tr key={purchase.id} onClick={() => navigate(`view/${purchase.id}`)} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                <td className="px-6 py-3.5 font-bold text-slate-800">{purchase.purchase_no}</td>
                <td className="px-6 py-3.5 font-medium text-slate-700">{purchase.reference_no || 'Not Set'}</td>
                <td className="px-6 py-3.5 text-slate-600">{purchase.supplier_name}</td>
                <td className="px-6 py-3.5 text-slate-600">{new Date(purchase.purchase_date).toLocaleDateString('en-PK')}</td>
                <td className="px-6 py-3.5 text-center font-bold text-emerald-600">Rs. {purchase.total_amount.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`edit/${purchase.id}`); }} className="p-1.5 text-slate-500 hover:text-slate-900 transition-all duration-300"><Pencil size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(purchase.id); }} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            )) : <EmptyState colSpan={6} onReset={resetFilters} isFiltering={filters.search !== '' || activeFilterCount > 0} />}
          </tbody>
        </table>
      </DataTable>
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => { applyFilters(); setIsFilterOpen(false); }} onClear={resetFilters}>
        <Input label="Search" value={tempFilters.search} onChange={(e) => setTempFilters((p) => ({ ...p, search: e.target.value }))} />
      </FilterDrawer>
      <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Purchase" message="This will remove the purchase and recalculate inventory/balances." type="danger" />
    </div>
  );
};

export default PurchaseList;
