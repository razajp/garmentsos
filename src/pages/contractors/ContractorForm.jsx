import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Check, MapPin, Phone, User } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { contractorsAPI } from '../../services/api';
import { Button, Input, PageHeader, Select, Textarea } from '../../components/ui';

const ContractorForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contractor_name: '',
    person_name: '',
    type: 'CMT',
    city: '',
    address: '',
    phone: '',
    isActive: true,
    balance: 0,
  });

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    contractorsAPI.getOne(id)
      .then((res) => setFormData(res.data.data))
      .catch(() => {
        toast.error('Failed to load contractor');
        navigate('/contractors');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.contractor_name.trim() || !formData.person_name.trim() || !formData.city.trim()) {
      toast.error('Contractor name, person name, and city are required');
      return;
    }

    setLoading(true);
    try {
      const response = isEdit ? await contractorsAPI.update(id, formData) : await contractorsAPI.create(formData);
      if (response.data.success) {
        toast.success(isEdit ? 'Contractor updated' : 'Contractor created');
        navigate('/contractors');
      }
    } catch {
      toast.error('Failed to save contractor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={isEdit ? 'Update Contractor' : 'New Contractor'} subtitle="Contractor identity and production type" showBack backPath="/contractors" />
      <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-scroll flex-1">
        <form onSubmit={handleSubmit} className="lg:col-span-8 bg-white border border-slate-300 rounded-3xl p-1.5 flex flex-col">
          <div className="flex-1">
            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Contractor Name" placeholder="Enter contractor name" icon={Building2} value={formData.contractor_name} onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })} required />
              <Input label="Person Name" placeholder="Enter contact person name" icon={User} value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} required />
              <Select label="Type" value={formData.type} onChange={(value) => setFormData({ ...formData, type: value })} options={[{ value: 'CMT', label: 'CMT' }]} searchable={false} />
              <Input label="Phone" placeholder="Enter phone number" icon={Phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required={false} />
              <div className="md:col-span-2">
                <Input label="City" placeholder="Enter city" icon={MapPin} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              </div>
              <div className="md:col-span-2">
                <Textarea label="Address" placeholder="Enter address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required={false} />
              </div>
            </div>
          </div>
          <div className="p-5 bg-slate-200/80 border border-slate-200 flex justify-between items-center rounded-2xl">
            <Button disabled={true} size="lg" variant="dark" icon={ArrowLeft}>Back</Button>
            <Button loading={loading} size="lg" type="submit" variant="dark" icon={Check} iconPosition="right">{isEdit ? 'Save Contractor' : 'Create Contractor'}</Button>
          </div>
        </form>
        <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5">Contractor Card</p>
            <h3 className="text-2xl font-black tracking-tight">{formData.contractor_name || 'Contractor Name'}</h3>
            <p className="text-sm text-slate-300 mt-1">{formData.person_name || 'Contact Person'}</p>
            <div className="mt-6 space-y-2 text-sm">
              <p>{formData.type || 'CMT'}</p>
              <p>{formData.city || 'City'}</p>
              <p className="text-slate-400">{formData.phone || 'Phone not set'}</p>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
};

export default ContractorForm;
