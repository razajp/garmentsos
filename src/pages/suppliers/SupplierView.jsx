import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Edit, MapPin, Phone, Power, PowerOff, Trash2, User, WalletCards } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { suppliersAPI } from '../../services/api';
import { Badge, Button, ConfirmationModal, Loader, PageHeader } from '../../components/ui';

const SupplierView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);

  const loadSupplier = () => {
    setLoading(true);
    suppliersAPI.getOne(id)
      .then((res) => setSupplier(res.data.data))
      .catch(() => navigate('/suppliers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadSupplier(); }, [id]);

  const handleDelete = async () => {
    try {
      await suppliersAPI.delete(id);
      toast.success('Supplier deleted');
      navigate('/suppliers');
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  const handleStatusChange = async () => {
    try {
      await suppliersAPI.setActive(id, !supplier.isActive);
      toast.success(!supplier.isActive ? 'Supplier activated' : 'Supplier deactivated');
      setStatusModal(false);
      loadSupplier();
    } catch (error) {
      toast.error('Failed to update supplier status');
    }
  };

  if (loading) return <Loader size="lg" className="h-full" />;

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader
        title={supplier.supplier_name}
        subtitle={`${supplier.city} supplier profile`}
        badge={supplier.isActive ? 'Active' : 'Inactive'}
        showBack
        backPath="/suppliers"
        actions={
          <>
            <Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/suppliers/edit/${id}`)}>Edit</Button>
            <Button variant="ghost" size="sm" icon={supplier.isActive ? PowerOff : Power} onClick={() => setStatusModal(true)}>
              {supplier.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <div className="w-[1px] h-4 bg-slate-200 mx-1" />
            <Button variant="ghost" size="sm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => setDeleteModal(true)}>Delete</Button>
          </>
        }
      />

      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-scroll">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-300 p-1.5">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoTile icon={Building2} label="Supplier Name" value={supplier.supplier_name} />
            <InfoTile icon={User} label="Person Name" value={supplier.person_name} />
            <InfoTile icon={MapPin} label="City" value={supplier.city} />
            <InfoTile icon={Phone} label="Phone" value={supplier.phone || 'Not Set'} />
            <InfoTile icon={WalletCards} label="Balance" value={`Rs. ${(supplier.balance || 0).toLocaleString()}`} />
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-100 border border-slate-300">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Address</p>
              <p className="text-sm font-medium text-slate-800">{supplier.address || 'Not Configured'}</p>
            </div>
          </div>
        </section>

        <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-7 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5">Status</p>
            <Badge variant={supplier.isActive ? 'success' : 'danger'} size="md">{supplier.isActive ? 'Active Supplier' : 'Inactive Supplier'}</Badge>
            <p className="text-sm text-slate-400 mt-6 leading-relaxed">
              Inactive suppliers remain visible in the prototype, but can be filtered out and reactivated later.
            </p>
          </div>
        </aside>
      </motion.div>

      <ConfirmationModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Delete Supplier" message={`Are you sure you want to delete ${supplier.supplier_name}?`} type="danger" />
      <ConfirmationModal isOpen={statusModal} onClose={() => setStatusModal(false)} onConfirm={handleStatusChange} title={supplier.isActive ? 'Deactivate Supplier' : 'Activate Supplier'} message={`${supplier.supplier_name} will be marked as ${supplier.isActive ? 'inactive' : 'active'}.`} />
    </div>
  );
};

const InfoTile = ({ icon: Icon, label, value }) => (
  <div className="p-5 rounded-2xl bg-slate-100 border border-slate-300 flex items-center gap-4">
    <div className="w-11 h-11 rounded-xl bg-white border border-slate-300 flex items-center justify-center text-indigo-600">
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

export default SupplierView;
