import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Pencil, Plus, ShieldMinus, ShieldPlus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { contractorsAPI } from '../../services/api';
import { useTable } from '../../hooks/useTable';
import { Badge, ConfirmationModal, DataTable, DataTableHeader, EmptyState, FilterDrawer, Input, LoadingRow, PageHeader, Select } from '../../components/ui';

const ContractorList = () => {
  const navigate = useNavigate();
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [statusModal, setStatusModal] = useState({ open: false, contractor: null });
  const { filters, tempFilters, setTempFilters, sort, handleSort, pagination, setPagination, applyFilters, resetFilters, activeFilterCount } = useTable({ search: '', status: '' });

  const loadContractors = async () => {
    setLoading(true);
    try {
      const { data } = await contractorsAPI.getAll({ ...filters, ...sort, page: pagination.page, limit: pagination.limit });
      setContractors(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch {
      toast.error('Failed to load contractors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContractors(); }, [filters, sort, pagination.page]);

  const handleDelete = async () => {
    try {
      await contractorsAPI.delete(deleteId);
      toast.success('Contractor deleted');
      setDeleteId(null);
      loadContractors();
    } catch {
      toast.error('Failed to delete contractor');
    }
  };

  const handleStatusChange = async () => {
    const contractor = statusModal.contractor;
    try {
      await contractorsAPI.setActive(contractor.id, !contractor.isActive);
      toast.success(!contractor.isActive ? 'Contractor activated' : 'Contractor deactivated');
      setStatusModal({ open: false, contractor: null });
      loadContractors();
    } catch {
      toast.error('Failed to update contractor status');
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title="Contractors" subtitle="Manage production contractor profiles" primaryAction={{ label: 'Add Contractor', link: '/contractors/new', icon: Plus }} />
      <DataTable pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onFilter={() => setIsFilterOpen(true)} activeFilterCount={activeFilterCount}>
        <table className="w-full">
          <DataTableHeader columns={[
            { key: 'contractor_name', label: 'Contractor', sortable: true },
            { key: 'person_name', label: 'Person', sortable: true },
            { key: 'type', label: 'Type', sortable: true },
            { key: 'city', label: 'City', sortable: true },
            { key: 'phone', label: 'Phone', sortable: true },
            { key: 'balance', label: 'Balance', sortable: true, align: 'center' },
            { key: 'isActive', label: 'Status', sortable: true, align: 'center' },
            { key: 'actions', label: 'Actions', align: 'center' },
          ]} sort={sort} onSort={handleSort} />
          <tbody>
            {loading ? <LoadingRow colSpan={8} rows={10} /> : contractors.length ? contractors.map((contractor) => (
              <tr key={contractor.id} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer" onClick={() => navigate(`view/${contractor.id}`)}>
                <td className="px-6 py-3.5 font-medium text-slate-700">{contractor.contractor_name}</td>
                <td className="px-6 py-3.5 text-slate-600">{contractor.person_name}</td>
                <td className="px-6 py-3.5"><Badge variant="info">{contractor.type}</Badge></td>
                <td className="px-6 py-3.5 text-slate-600">{contractor.city}</td>
                <td className="px-6 py-3.5 text-slate-600">{contractor.phone || 'Not Set'}</td>
                <td className="px-6 py-3.5 text-center font-bold text-slate-800">Rs. {(contractor.balance || 0).toLocaleString()}</td>
                <td className="px-6 py-3.5 text-center"><Badge variant={contractor.isActive ? 'success' : 'danger'}>{contractor.isActive ? 'Active' : 'Inactive'}</Badge></td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`edit/${contractor.id}`); }} className="p-1.5 text-slate-500 hover:text-slate-900 transition-all duration-300"><Pencil size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setStatusModal({ open: true, contractor }); }} className={`p-1.5 transition-all duration-300 ${contractor.isActive ? 'text-red-500 hover:text-red-600' : 'text-emerald-500 hover:text-emerald-600'}`}>{contractor.isActive ? <ShieldMinus size={18} /> : <ShieldPlus size={18} />}</button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(contractor.id); }} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            )) : <EmptyState colSpan={8} onReset={resetFilters} isFiltering={filters.search !== '' || activeFilterCount > 0} />}
          </tbody>
        </table>
      </DataTable>
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => { applyFilters(); setIsFilterOpen(false); }} onClear={resetFilters}>
        <Input label="Search" value={tempFilters.search} onChange={(e) => setTempFilters((p) => ({ ...p, search: e.target.value }))} />
        <Select label="Status" value={tempFilters.status} onChange={(value) => setTempFilters((p) => ({ ...p, status: value }))} options={[{ value: '', label: 'All Contractors' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
      </FilterDrawer>
      <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Contractor" message="Are you sure? This contractor will be removed from the prototype database." type="danger" />
      <ConfirmationModal isOpen={statusModal.open} onClose={() => setStatusModal({ open: false, contractor: null })} onConfirm={handleStatusChange} title={statusModal.contractor?.isActive ? 'Deactivate Contractor' : 'Activate Contractor'} message={`${statusModal.contractor?.contractor_name || 'This contractor'} will be marked as ${statusModal.contractor?.isActive ? 'inactive' : 'active'}.`} icon={CheckCircle} />
    </div>
  );
};

export default ContractorList;
