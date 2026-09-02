import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'react-toastify';

import { articlesAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import { useTable } from '../../hooks/useTable';

// UI Components
import { PageHeader, Input, FilterDrawer, DataTable, DataTableHeader, LoadingRow, ConfirmationModal, EmptyState, Badge } from '../../components/ui';

const Articles = () => {
  const { options } = useConfig();
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Custom Hook use kar rahe hain
  const {
    filters, tempFilters, setTempFilters,
    sort, handleSort,
    pagination, setPagination,
    applyFilters, resetFilters, activeFilterCount
  } = useTable({ search: '', season: '', category: '', fabric_type: '' });

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data } = await articlesAPI.getAll({ ...filters, ...sort, page: pagination.page, limit: pagination.limit });
      setArticles(data.data);
      setPagination(prev => ({ ...prev, total: data.pagination.total, totalPages: data.pagination.totalPages }));
    } catch (error) {
      toast.error('Failed to load articles');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadArticles(); }, [filters, sort, pagination.page]);

  const handleDelete = async () => {
    try {
      await articlesAPI.delete(deleteId);
      toast.success('Deleted successfully');
      setDeleteId(null);
      loadArticles();
    } catch (error) { toast.error('Error deleting'); }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader 
        title="Articles" 
        subtitle="Manage your production catalog" 
        primaryAction={{
          label: "Add Article",
          link: "/articles/new",
          icon: Plus
        }}
      />

      <DataTable 
        pagination={pagination} 
        onPageChange={(page) => setPagination(p => ({ ...p, page }))}
        onFilter={() => setIsFilterOpen(true)}
        activeFilterCount={activeFilterCount}
      >
        <table className="w-full">
          <DataTableHeader 
            columns={[
              { key: "article_no", label: "Article No", sortable: true },
              { key: "season", label: "Season", sortable: true },
              { key: "size", label: "Size", sortable: true },
              { key: "category", label: "Category", sortable: true },
              { key: "stock_pkt", label: "Stock-Pkt", sortable: true, align: 'center' },
              { key: "unit", label: "Unit", sortable: true, align: 'center' },
              { key: "cost", label: "Cost", sortable: true, align: 'center' },
              { key: "net_rate", label: "Net Rate", sortable: true, align: 'center' },
              { key: "sales_rate", label: "Sale Rate", sortable: true, align: 'center' },
              { key: "actions", label: "Actions", align: 'center' },
            ]}
            sort={sort}
            onSort={handleSort}
          />
          <tbody>
            {loading ? (
              <LoadingRow colSpan={10} rows={10} />
            ) : articles.length > 0 ? (
              articles.map((article) => (
                <tr key={article.id} className="border-b border-slate-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer" onClick={() => navigate(`view/${article.id}`)}>
                  <td className="px-6 py-3.5 font-medium text-slate-700">{article.article_no}</td>
                  <td className="px-6 py-3.5 text-slate-600">{article.season}</td>
                  <td className="px-6 py-3.5 text-slate-600">{article.size}</td>
                  <td className="px-6 py-3.5">
                    <Badge 
                      variant={'info'}
                    >
                      {article.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold text-slate-800">
                    {(article.stock_pkt || article.quantity || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-center text-slate-600">
                    {article.unit || 0} pcs
                  </td>
                  <td className="px-6 py-3.5 text-amber-600 font-medium text-center">
                    Rs. {(article.cost || article.total_cost || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-indigo-600 font-bold text-center">
                    Rs. {(article.net_rate || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-emerald-600 font-bold text-center">
                    Rs. {article.sales_rate?.toLocaleString()}
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <div className="flex justify-center gap-2">
                      <button 
                        onClick={(e) => {e.stopPropagation(); navigate(`edit/${article.id}`)}}
                        className="p-1.5 text-amber-500 hover:text-amber-600 transition-all duration-300"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={(e) => {e.stopPropagation(); setDeleteId(article.id)}}
                        className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              /* Empty State Triggered */
              <EmptyState 
                colSpan={10} 
                onReset={resetFilters}
                // Agar search bar khali hai aur filters bhi nahi hain, toh isFiltering false kar dein
                isFiltering={filters.search !== '' || activeFilterCount > 0} 
              />
            )}
          </tbody>
        </table>
      </DataTable>

      {/* Reusable Filter Drawer */}
      <FilterDrawer 
        isOpen={isFilterOpen} 
        onClose={() => setIsFilterOpen(false)}
        onApply={() => { applyFilters(); setIsFilterOpen(false); }}
        onClear={resetFilters}
      >
        <Input 
          label="Search" 
          value={tempFilters.search} 
          onChange={(e) => setTempFilters(p => ({ ...p, search: e.target.value }))} 
        />
        {/* Baki Select components yahan ayenge */}
      </FilterDrawer>

      {/* Global Confirmation Modal */}
      <ConfirmationModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Article"
        message="Are you sure? This cannot be undone."
      />
    </div>
  );
};

export default Articles;
