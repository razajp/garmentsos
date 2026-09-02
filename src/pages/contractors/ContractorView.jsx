import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Building2, Edit, MapPin, Phone, Power, PowerOff, Trash2, User, WalletCards } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { contractorsAPI } from '../../services/api';
import { Badge, Button, ConfirmationModal, Loader, PageHeader } from '../../components/ui';

const ContractorView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contractor, setContractor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState(false);
  const [statusModal, setStatusModal] = useState(false);

  const loadContractor = () => {
    setLoading(true);
    contractorsAPI.getOne(id)
      .then((res) => setContractor(res.data.data))
      .catch(() => navigate('/contractors'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadContractor(); }, [id]);

  const handleDelete = async () => {
    try {
      await contractorsAPI.delete(id);
      toast.success('Contractor deleted');
      navigate('/contractors');
    } catch {
      toast.error('Failed to delete contractor');
    }
  };

  const handleStatusChange = async () => {
    try {
      await contractorsAPI.setActive(id, !contractor.isActive);
      toast.success(!contractor.isActive ? 'Contractor activated' : 'Contractor deactivated');
      setStatusModal(false);
      loadContractor();
    } catch {
      toast.error('Failed to update contractor status');
    }
  };

  if (loading) return <Loader size="lg" className="h-full" />;

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader
        title={contractor.contractor_name}
        subtitle={`${contractor.city} contractor profile`}
        badge={contractor.isActive ? 'Active' : 'Inactive'}
        showBack
        backPath="/contractors"
        actions={<><Button variant="ghost" size="sm" icon={Edit} onClick={() => navigate(`/contractors/edit/${id}`)}>Edit</Button><Button variant="ghost" size="sm" icon={contractor.isActive ? PowerOff : Power} onClick={() => setStatusModal(true)}>{contractor.isActive ? 'Deactivate' : 'Activate'}</Button><div className="w-[1px] h-4 bg-slate-200 mx-1" /><Button variant="ghost" size="sm" icon={Trash2} className="text-red-500 hover:bg-red-50" onClick={() => setDeleteModal(true)}>Delete</Button></>}
      />
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-scroll">
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-300 p-1.5">
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <InfoTile icon={Building2} label="Contractor Name" value={contractor.contractor_name} />
            <InfoTile icon={User} label="Person Name" value={contractor.person_name} />
            <InfoTile icon={Building2} label="Type" value={contractor.type} />
            <InfoTile icon={MapPin} label="City" value={contractor.city} />
            <InfoTile icon={Phone} label="Phone" value={contractor.phone || 'Not Set'} />
            <InfoTile icon={WalletCards} label="Balance" value={`Rs. ${(contractor.balance || 0).toLocaleString()}`} />
            <div className="md:col-span-2 p-5 rounded-2xl bg-slate-100 border border-slate-300">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Address</p>
              <p className="text-sm font-medium text-slate-800">{contractor.address || 'Not Configured'}</p>
            </div>
          </div>
        </section>
        <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-7 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5">Status</p>
            <Badge variant={contractor.isActive ? 'success' : 'danger'} size="md">{contractor.isActive ? 'Active Contractor' : 'Inactive Contractor'}</Badge>
            <p className="text-sm text-slate-400 mt-6 leading-relaxed">Balance is ready for the later production flow, and stays zero for now.</p>
          </div>
        </aside>
        <section className="lg:col-span-12 bg-white rounded-3xl border border-slate-300 p-1.5">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Issued Tags</h3>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Currently held by this contractor</p>
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-l-2xl">Type</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Description</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Unit</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Rate</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-r-2xl">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {contractor.issued_tags?.length ? contractor.issued_tags.map((item) => (
                  <tr key={item.tag} className="border-b border-slate-200">
                    <td className="p-3 text-[13px] text-slate-700">{item.item_type}</td>
                    <td className="p-3 text-[13px] text-slate-700">{item.description}</td>
                    <td className="p-3 text-[13px] text-slate-700">{item.unit || 'N/A'}</td>
                    <td className="p-3 text-[13px] text-slate-700">Rs. {Number(item.rate || 0).toLocaleString()}</td>
                    <td className="p-3 text-[13px] font-bold text-slate-900">{item.quantity.toLocaleString()}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="p-3 text-center text-[13px] text-slate-500">No tags issued yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </motion.div>
      <ConfirmationModal isOpen={deleteModal} onClose={() => setDeleteModal(false)} onConfirm={handleDelete} title="Delete Contractor" message={`Are you sure you want to delete ${contractor.contractor_name}?`} type="danger" />
      <ConfirmationModal isOpen={statusModal} onClose={() => setStatusModal(false)} onConfirm={handleStatusChange} title={contractor.isActive ? 'Deactivate Contractor' : 'Activate Contractor'} message={`${contractor.contractor_name} will be marked as ${contractor.isActive ? 'inactive' : 'active'}.`} />
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

export default ContractorView;
