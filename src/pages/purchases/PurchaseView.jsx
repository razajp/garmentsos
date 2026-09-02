import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Edit, Package, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { purchasesAPI } from '../../services/api';
import { Badge, Button, ConfirmationModal, Loader, PageHeader } from '../../components/ui';

const PurchaseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);

  useEffect(() => {
    purchasesAPI.getOne(id).then((res) => setPurchase(res.data.data)).catch(() => navigate('/purchases')).finally(() => setLoading(false));
  }, [id, navigate]);

  const handleDelete = async () => {
    await purchasesAPI.delete(id);
    toast.success('Purchase deleted');
    navigate('/purchases');
  };

  if (loading) return <Loader size="lg" className="h-full" />;

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={purchase.reference_no || `Purchase #${purchase.id}`} subtitle={`${purchase.supplier?.supplier_name || 'Supplier'} - ${new Date(purchase.purchase_date).toLocaleDateString('en-PK')}`} showBack backPath="/purchases" actions={<><Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/purchases/edit/${id}`)}>Edit</Button><Button variant="ghost" size="sm" icon={Trash2} className="text-red-500" onClick={() => setDeleteModal(true)}>Delete</Button></>} />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-scroll">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-300 p-1.5">
          <div className="p-6">
            <table className="w-full">
              <thead className="bg-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                <tr><th className="px-4 py-3 text-left">Item</th><th className="px-4 py-3 text-left">Unit</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Rate</th><th className="px-4 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="px-4 py-3"><Badge variant="info">{item.item_type}</Badge><p className="text-sm text-slate-600 mt-1">{item.description}</p></td>
                    <td className="px-4 py-3 text-slate-600">{item.unit || 'N/A'}</td>
                    <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">Rs. {item.rate.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-bold">Rs. {item.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <aside className="lg:col-span-4">
          <div className="bg-slate-900 rounded-3xl p-7 text-white">
            <Package className="text-emerald-400 mb-5" size={28} />
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Invoice Total</p>
            <p className="text-3xl font-black mt-2">Rs. {purchase.total_amount.toLocaleString()}</p>
          </div>
        </aside>
      </div>
      <ConfirmationModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Delete Purchase" message="Inventory and supplier balance will be recalculated." type="danger" />
    </div>
  );
};

export default PurchaseView;
