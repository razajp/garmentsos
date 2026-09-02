import React, { useEffect, useState } from 'react';
import { Boxes } from 'lucide-react';
import { toast } from 'react-toastify';
import { inventoryAPI } from '../../services/api';
import { Badge, DataTable, DataTableHeader, EmptyState, FilterDrawer, Input, LoadingRow, PageHeader, Select } from '../../components/ui';
import { useTable } from '../../hooks/useTable';

const InventoryList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { filters, tempFilters, setTempFilters, sort, handleSort, pagination, setPagination, applyFilters, resetFilters, activeFilterCount } = useTable({ search: '', item_type: '' });

  const loadInventory = async () => {
    setLoading(true);
    try {
      const { data } = await inventoryAPI.getAll({ ...filters, ...sort });
      setItems(data.data);
      setPagination((prev) => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, [filters, sort]);

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title="Inventory" subtitle="Stock generated from purchase item tags" rightElement={<Badge variant="info" size="md">{items.length} Tags</Badge>} />
      <DataTable pagination={pagination} onPageChange={() => {}} onFilter={() => setIsFilterOpen(true)} activeFilterCount={activeFilterCount}>
        <table className="w-full">
          <DataTableHeader columns={[
            { key: 'tag', label: 'Tag', sortable: true },
            { key: 'item_type', label: 'Type', sortable: true },
            { key: 'description', label: 'Description', sortable: true },
            { key: 'unit', label: 'Unit', sortable: true },
            { key: 'quantity', label: 'Quantity', sortable: true, align: 'center' },
            { key: 'last_purchase_rate', label: 'Last Rate', sortable: true, align: 'center' },
            { key: 'last_purchase_date', label: 'Last Purchase', sortable: true, align: 'center' },
          ]} sort={sort} onSort={handleSort} />
          <tbody>
            {loading ? <LoadingRow colSpan={7} rows={10} /> : items.length ? items.map((item) => (
              <tr key={item.tag} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300">
                <td className="px-6 py-3.5 font-black text-slate-800">{item.tag}</td>
                <td className="px-6 py-3.5"><Badge variant="info">{item.item_type}</Badge></td>
                <td className="px-6 py-3.5 text-slate-600">{item.description}</td>
                <td className="px-6 py-3.5 text-slate-600">{item.unit || 'N/A'}</td>
                <td className="px-6 py-3.5 text-center font-bold text-slate-800">{item.quantity.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-center font-bold text-emerald-600">Rs. {item.last_purchase_rate.toLocaleString()}</td>
                <td className="px-6 py-3.5 text-center text-slate-600">{new Date(item.last_purchase_date).toLocaleDateString('en-PK')}</td>
              </tr>
            )) : <EmptyState colSpan={7} onReset={resetFilters} isFiltering={filters.search !== '' || activeFilterCount > 0} />}
          </tbody>
        </table>
      </DataTable>
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} onApply={() => { applyFilters(); setIsFilterOpen(false); }} onClear={resetFilters}>
        <Input label="Search" value={tempFilters.search} onChange={(e) => setTempFilters((p) => ({ ...p, search: e.target.value }))} />
        <Select label="Item Type" required={false} value={tempFilters.item_type} onChange={(value) => setTempFilters((p) => ({ ...p, item_type: value }))} options={[{ value: '', label: 'All Items' }, { value: 'Fabric', label: 'Fabric' }, { value: 'Thread', label: 'Thread' }]} />
      </FilterDrawer>
    </div>
  );
};

export default InventoryList;
