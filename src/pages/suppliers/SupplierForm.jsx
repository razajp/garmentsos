import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Building2,
  Check,
  MapPin,
  Phone,
  User,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { suppliersAPI } from "../../services/api";
import { Button, Input, PageHeader, Textarea } from "../../components/ui";

const SupplierForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplier_name: "",
    person_name: "",
    city: "",
    address: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    suppliersAPI
      .getOne(id)
      .then((res) => setFormData(res.data.data))
      .catch(() => {
        toast.error("Failed to load supplier");
        navigate("/suppliers");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (
      !formData.supplier_name.trim() ||
      !formData.person_name.trim() ||
      !formData.city.trim()
    ) {
      toast.error("Supplier name, person name, and city are required");
      return;
    }

    setLoading(true);
    try {
      const response = isEdit
        ? await suppliersAPI.update(id, formData)
        : await suppliersAPI.create(formData);
      if (response.data.success) {
        toast.success(isEdit ? "Supplier updated" : "Supplier created");
        navigate("/suppliers");
      }
    } catch (error) {
      toast.error("Failed to save supplier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader
        title={isEdit ? "Update Supplier" : "New Supplier"}
        subtitle="Supplier identity and contact profile"
        showBack
        backPath="/suppliers"
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-scroll flex-1"
      >
        <form className="lg:col-span-8 bg-white border border-slate-300 rounded-3xl p-1.5 flex flex-col">
          <div className="flex-1">
            <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input label="Supplier Name" placeholder="Enter supplier name" icon={Building2} value={formData.supplier_name} onChange={(e) => setFormData({ ...formData, supplier_name: e.target.value })} required />
              <Input label="Person Name" placeholder="Enter contact person name" icon={User} value={formData.person_name} onChange={(e) => setFormData({ ...formData, person_name: e.target.value })} required />
              <Input label="Phone" placeholder="Enter phone number" icon={Phone} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <Input label="City" placeholder="Enter city" icon={MapPin} value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required />
              <div className="md:col-span-2">
                <Textarea label="Address" placeholder="Enter address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required={false} />
              </div>
            </div>
          </div>

          <div className="p-5 bg-slate-200/80 border border-slate-200 flex justify-between items-center rounded-2xl">
            <Button 
              disabled={true}
              size='lg' 
              variant='dark' 
              icon={ArrowLeft}
            >
              Back
            </Button>
            
            <div className="flex items-center gap-4">
              <Button
                loading={loading} 
                size='lg'
                type='submit'
                variant='dark' 
                icon={Check} 
                iconPosition="right"
              >
                {isEdit ? 'Save Supplier' : 'Create Supplier'}
              </Button>
            </div>
          </div>
        </form>

        <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-6 text-white">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-5">Supplier Card</p>
            <h3 className="text-2xl font-black tracking-tight">{formData.supplier_name || 'Supplier Name'}</h3>
            <p className="text-sm text-slate-300 mt-1">{formData.person_name || 'Contact Person'}</p>
            <div className="mt-6 space-y-2 text-sm">
              <p>{formData.city || 'City'}</p>
              <p className="text-slate-400">{formData.phone || 'Phone not set'}</p>
            </div>
          </div>
        </aside>
      </motion.div>
    </div>
  );
};

export default SupplierForm;
