import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { productionAPI } from '../../services/api';
import { Badge, Button, ConfirmationModal, DataTable, DataTableHeader, EmptyState, FilterDrawer, Input, LoadingRow, PageHeader, Select } from '../../components/ui';
import { useTable } from '../../hooks/useTable';

const ProductionList = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { filters, tempFilters, setTempFilters, sort, handleSort, pagination, setPagination, applyFilters, resetFilters, activeFilterCount } = useTable({ search: '', type: '' });

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data } = await productionAPI.getAll({ ...filters, ...sort, page: pagination.page, limit: pagination.limit });
      setTickets(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch {
      toast.error('Failed to load production tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTickets(); }, [filters, sort, pagination.page]);

  const handleDelete = async () => {
    try {
      await productionAPI.delete(deleteId);
      toast.success('Production ticket deleted');
      setDeleteId(null);
      loadTickets();
    } catch {
      toast.error('Failed to delete production ticket');
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader
        title="Production"
        subtitle="Issue and receive contractor production tickets"
        actions={<><Button variant="outline" size="md" icon={Plus} onClick={() => navigate('/production/issue')}>Issue</Button><Button variant="dark" size="md" icon={Plus} onClick={() => navigate('/production/receive')}>Receive</Button></>}
      />
      <DataTable pagination={pagination} onPageChange={(page) => setPagination((p) => ({ ...p, page }))} onFilter={() => setIsFilterOpen(true)} activeFilterCount={activeFilterCount}>
        <table className="w-full">
          <DataTableHeader columns={[
            { key: 'ticket_no', label: 'Ticket No', sortable: true },
            { key: 'type', label: 'Type', sortable: true, align: 'center' },
            { key: 'contractor_name', label: 'Contractor', sortable: true },
            { key: 'production_date', label: 'Date', sortable: true },
            { key: 'total_quantity', label: 'Tag Qty', sortable: true, align: 'center' },
            { key: 'article_quantity', label: 'Pkt Qty', sortable: true, align: 'center' },
            { key: 'actions', label: 'Actions', align: 'center' },
          ]} sort={sort} onSort={handleSort} />
          <tbody>
            {loading ? <LoadingRow colSpan={7} rows={10} /> : tickets.length ? tickets.map((ticket) => (
              <tr key={ticket.id} onClick={() => navigate(`/production/view/${ticket.id}`)} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                <td className="px-6 py-3.5 font-bold text-slate-800">{ticket.ticket_no}</td>
                <td className="px-6 py-3.5 text-center"><Badge variant={ticket.type === 'issue' ? 'info' : 'success'}>{ticket.type === 'issue' ? 'Issue' : 'Receive'}</Badge></td>
                <td className="px-6 py-3.5 text-slate-600">{ticket.contractor_name}</td>
                <td className="px-6 py-3.5 text-slate-600">{new Date(ticket.production_date).toLocaleDateString('en-PK')}</td>
                <td className="px-6 py-3.5 text-center font-bold text-slate-800">{ticket.total_quantity.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-center font-bold text-emerald-600">{ticket.article_quantity ? ticket.article_quantity.toLocaleString() : '-'}</td>
                <td className="px-6 py-3.5 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/production/${ticket.type}/edit/${ticket.id}`); }} className="p-1.5 text-slate-500 hover:text-slate-900 transition-all duration-300"><Pencil size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteId(ticket.id); }} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            )) : <EmptyState colSpan={7} onReset={resetFilters} isFiltering={filters.search !== '' || activeFilterCount > 0} />}
          </tbody>
        </table>
      </DataTable>
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => { applyFilters(); setIsFilterOpen(false); }} onClear={resetFilters}>
        <Input label="Search" value={tempFilters.search} onChange={(e) => setTempFilters((p) => ({ ...p, search: e.target.value }))} />
        <Select label="Ticket Type" required={false} value={tempFilters.type} onChange={(value) => setTempFilters((p) => ({ ...p, type: value }))} options={[{ value: '', label: 'All Tickets' }, { value: 'issue', label: 'Issue' }, { value: 'receive', label: 'Receive' }]} />
      </FilterDrawer>
      <ConfirmationModal isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete} title="Delete Production Ticket" message="This will remove the ticket and recalculate inventory/contractor issued quantities." type="danger" />
    </div>
  );
};

export default ProductionList;
