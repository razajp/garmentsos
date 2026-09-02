import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Plus, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { suppliersAPI } from '../../services/api';
import { useTable } from '../../hooks/useTable';
import { Badge, ConfirmationModal, DataTable, DataTableHeader, EmptyState, FilterDrawer, Input, LoadingRow, PageHeader, Select } from '../../components/ui';

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [statusModal, setStatusModal] = useState({ open: false, supplier: null });
  const { filters, tempFilters, setTempFilters, sort, handleSort, pagination, setPagination, applyFilters, resetFilters, activeFilterCount } = useTable({ search: '', status: '' });

  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await suppliersAPI.getAll({ ...filters, ...sort, page: pagination.page, limit: pagination.limit });
      setSuppliers(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (error) {
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSuppliers(); }, [filters, sort, pagination.page]);

  const handleDelete = async () => {
    try {
      await suppliersAPI.delete(deleteId);
      toast.success('Supplier deleted');
      setDeleteId(null);
      loadSuppliers();
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const handleStatusChange = async () => {
    const supplier = statusModal.supplier;
    try {
      await suppliersAPI.setActive(supplier.id, !supplier.isActive);
      toast.success(!supplier.isActive ? 'Supplier activated' : 'Supplier deactivated');
      setStatusModal({ open: false, supplier: null });
      loadSuppliers();
    } catch (error) {
      toast.error('Failed to update supplier status');
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader
        title="Suppliers"
        subtitle="Manage vendor profiles and supplier access status"
        primaryAction={{ label: 'Add Supplier', link: '/suppliers/new', icon: Plus }}
      />

      <DataTable
        pagination={pagination}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
        onFilter={() => setIsFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      >
        <table className="w-full">
          <DataTableHeader
            columns={[
              { key: 'supplier_name', label: 'Supplier', sortable: true },
              { key: 'person_name', label: 'Person', sortable: true },
              { key: 'city', label: 'City', sortable: true },
              { key: 'phone', label: 'Phone', sortable: true },
              { key: 'balance', label: 'Balance', sortable: true, align: 'center' },
              { key: 'isActive', label: 'Status', sortable: true, align: 'center' },
              { key: 'actions', label: 'Actions', align: 'center' },
            ]}
            sort={sort}
            onSort={handleSort}
          />
          <tbody>
            {loading ? (
              <LoadingRow colSpan={7} rows={10} />
            ) : suppliers.length > 0 ? (
              suppliers.map((supplier) => (
                <tr key={supplier.id} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer" onClick={() => navigate(`view/${supplier.id}`)}>
                  <td className="px-6 py-3.5 font-medium text-slate-700">{supplier.supplier_name}</td>
                  <td className="px-6 py-3.5 text-slate-600">{supplier.person_name}</td>
                  <td className="px-6 py-3.5 text-slate-600">{supplier.city}</td>
                  <td className="px-6 py-3.5 text-slate-600">{supplier.phone || 'Not Set'}</td>
                  <td className="px-6 py-3.5 text-center font-bold text-slate-800">Rs. {(supplier.balance || 0).toLocaleString()}</td>
                  <td className="px-6 py-3.5 text-center">
                    <Badge variant={supplier.isActive ? 'success' : 'danger'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={(e) => {e.stopPropagation(); navigate(`edit/${supplier.id}`)}} className="p-1.5 text-slate-500 hover:text-slate-900 transition-all duration-300"><Pencil size={18} /></button>
                      <button onClick={(e) => {e.stopPropagation(); setStatusModal({ open: true, supplier })}} className={`p-1.5 transition-all duration-300 ${supplier.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}>
                        {supplier.isActive ? <ShieldMinus size={18} /> : <ShieldPlus size={18} />}
                      </button>
                      <button onClick={(e) => {e.stopPropagation(); setDeleteId(supplier.id)}} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <EmptyState colSpan={7} onReset={resetFilters} isFiltering={filters.search !== '' || activeFilterCount > 0} />
            )}
          </tbody>
        </table>
      </DataTable>

      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => { applyFilters(); setIsFilterOpen(false); }} onClear={resetFilters}>
        <Input label="Search" value={tempFilters.search} onChange={(e) => setTempFilters((p) => ({ ...p, search: e.target.value }))} />
        <Select
          label="Status"
          value={tempFilters.status}
          onChange={(value) => setTempFilters((p) => ({ ...p, status: value }))}
          options={[
            { value: '', label: 'All Suppliers' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
          ]}
        />
      </FilterDrawer>

      <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Supplier" message="Are you sure? This supplier will be removed from the prototype database." type="danger" />
      <ConfirmationModal
        isOpen={statusModal.open}
        onClose={() => setStatusModal({ open: false, supplier: null })}
        onConfirm={handleStatusChange}
        title={statusModal.supplier?.isActive ? 'Deactivate Supplier' : 'Activate Supplier'}
        message={`${statusModal.supplier?.supplier_name || 'This supplier'} will be marked as ${statusModal.supplier?.isActive ? 'inactive' : 'active'}.`}
        icon={CheckCircle}
      />
    </div>
  );
};

export default SupplierList;
