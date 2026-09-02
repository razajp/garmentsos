import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ArrowLeft, Plus, Trash2, Pencil } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { purchasesAPI, suppliersAPI, inventoryAPI } from '../../services/api';
import { Button, Input, Modal, PageHeader, Select } from '../../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const emptyItem = () => ({ id: Date.now() + Math.random(), item_type: 'Fabric', tag: '', description: '', unit: 'meter', quantity: '', rate: '', amount: '' });
const makeItemTag = (item) => {
  const base = `${item.item_type}-${item.description}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${base || 'item'}-${Date.now()}`;
};
const getInventoryGroupKey = (item) => item.group_id || `${item.tag}__${item.rate || item.last_purchase_rate || 0}`;

const PurchaseForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [formData, setFormData] = useState({ supplier_id: '', purchase_date: today(), reference_no: '', items: [] });
  const [itemModal, setItemModal] = useState({ open: false, editId: null });
  const [draftItem, setDraftItem] = useState(emptyItem());

  useEffect(() => {
    Promise.all([suppliersAPI.getAll({ limit: 1000 }), inventoryAPI.getAll({})]).then(([supplierRes, inventoryRes]) => {
      setSuppliers(supplierRes.data.data.filter((supplier) => supplier.isActive));
      setInventory(inventoryRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    purchasesAPI.getOne(id)
      .then((res) => setFormData({ ...res.data.data, supplier_id: String(res.data.data.supplier_id) }))
      .catch(() => {
        toast.error('Failed to load purchase');
        navigate('/purchases');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  const supplierOptions = suppliers.map((supplier) => ({ value: String(supplier.id), label: supplier.supplier_name }));
  const itemTypeOptions = ['Fabric', 'Thread'].map((item) => ({ value: item, label: item }));
  const unitOptions = ['meter', 'yard', 'kg', 'cone', 'piece', 'roll'].map((item) => ({ value: item, label: item }));
  const inventoryOptions = inventory.map((item) => ({ value: getInventoryGroupKey(item), label: `${item.description} - Rs. ${(item.rate || item.last_purchase_rate || 0).toLocaleString()} (${item.item_type})` }));
  const total = useMemo(() => formData.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0), [formData.items]);

  const openItemModal = (item = null) => {
    setDraftItem(item ? { ...item } : emptyItem());
    setItemModal({ open: true, editId: item?.id || null });
  };

  const closeItemModal = () => {
    setItemModal({ open: false, editId: null });
    setDraftItem(emptyItem());
  };

  const updateDraftItem = (patch) => {
    setDraftItem((prev) => ({ ...prev, ...patch }));
  };

  const handleNumberChange = (item, field, value) => {
    const quantity = Number(field === 'quantity' ? value : item.quantity) || 0;
    let rate = Number(field === 'rate' ? value : item.rate) || 0;
    let amount = Number(field === 'amount' ? value : item.amount) || 0;
    if (field === 'rate' || field === 'quantity') amount = quantity * rate;
    if (field === 'amount' && quantity > 0) rate = amount / quantity;
    setDraftItem((prev) => ({ ...prev, [field]: value, rate, amount }));
  };

  const selectTag = (groupId) => {
    const existing = inventory.find((inventoryItem) => getInventoryGroupKey(inventoryItem) === groupId);
    if (!existing) {
      updateDraftItem({ tag: '' });
      return;
    }

    const quantity = Number(draftItem.quantity) || 0;
    updateDraftItem({
      tag: existing.tag,
      group_id: getInventoryGroupKey(existing),
      item_type: existing.item_type,
      description: existing.description,
      unit: existing.unit,
      rate: existing.last_purchase_rate,
      amount: quantity * (Number(existing.last_purchase_rate) || 0),
    });
  };

  const clearExistingTag = () => {
    updateDraftItem({ tag: '', group_id: '', description: '', unit: 'meter', rate: '', amount: '' });
  };

  const saveItem = () => {
    if (!draftItem.item_type || !draftItem.description.trim() || !draftItem.quantity || !draftItem.amount) {
      toast.error('Item type, description, quantity, and amount are required');
      return;
    }

    const itemToSave = {
      ...draftItem,
      tag: draftItem.tag || makeItemTag(draftItem),
    };

    setFormData((prev) => ({
      ...prev,
      items: itemModal.editId
        ? prev.items.map((item) => item.id === itemModal.editId ? itemToSave : item)
        : [...prev.items, { ...itemToSave, id: Date.now() + Math.random() }],
    }));
    closeItemModal();
  };

  const removeItem = (itemId) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));
  };

  const existingDraftItem = inventory.find((item) => getInventoryGroupKey(item) === draftItem.group_id);
  const isExistingTagSelected = Boolean(existingDraftItem);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.supplier_id || !formData.purchase_date) return toast.error('Supplier and purchase date are required');
    if (formData.items.some((item) => !item.item_type || !item.description.trim() || !item.quantity || !item.amount)) {
      return toast.error('Every item needs type, description, quantity, and amount');
    }

    setLoading(true);
    try {
      const response = isEdit ? await purchasesAPI.update(id, formData) : await purchasesAPI.create(formData);
      if (response.data.success) {
        toast.success(isEdit ? 'Purchase updated' : 'Purchase created');
        navigate('/purchases');
      }
    } catch {
      toast.error('Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={isEdit ? 'Update Purchase' : 'Add Purchase'} subtitle="Supplier invoice and inventory items" showBack backPath="/purchases" />
      <motion.form initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="flex-1 min-h-0 flex">
        <section className="bg-white border border-slate-300 rounded-3xl p-1.5 flex flex-col flex-1">
          <div className="p-6 pb-5 grid grid-cols-1 md:grid-cols-3 gap-5">
            <Select label="Supplier" value={formData.supplier_id} onChange={(value) => setFormData({ ...formData, supplier_id: value })} options={supplierOptions} />
            <Input label="Purchase Date" type="date" value={formData.purchase_date} onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })} />
            <Input label="Reference No." required={false} value={formData.reference_no} onChange={(e) => setFormData({ ...formData, reference_no: e.target.value })} />
          </div>

          <div className="px-6 flex-1 min-h-0 overflow-scroll">
            <label className="text-[14px] font-semibold text-slate-700 my-1 ml-1 flex items-center justify-between">
              Items List <Button type="button" icon={Plus} onClick={() => openItemModal()}>Add Item</Button>
            </label>
            <table className="w-full overflow-hidden">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-l-2xl">Type</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Description</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Unit</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Quantity</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Rate</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Amount</th>
                  <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-r-2xl">Actions</th>
                </tr>
              </thead>
              {/* only show details for each item here, not inputs */}
              <tbody>
                {formData.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-[13px] text-slate-500">No items added yet</td>
                  </tr>
                )} {
                formData.items.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-300">
                    <td className="p-3 text-[13px] text-slate-700">{item.item_type}</td>
                    <td className="p-3 text-[13px] text-slate-700">{item.description}</td>
                    <td className="p-3 text-[13px] text-slate-700">{item.unit || 'N/A'}</td>
                    <td className="p-3 text-[13px] text-slate-700">{item.quantity}</td>
                    <td className="p-3 text-[13px] text-slate-700">Rs. {Number(item.rate || 0).toLocaleString()}</td>
                    <td className="p-3 text-[13px] text-slate-700">Rs. {Number(item.amount || 0).toLocaleString()}</td>
                    <td className="p-3">
                      <button type="button" onClick={(e) => {e.stopPropagation(); openItemModal(item)}} className="p-1.5 text-slate-500 hover:text-slate-900 transition-all duration-300"><Pencil size={18} /></button>
                      <button type="button" onClick={(e) => {e.stopPropagation(); removeItem(item.id)}} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                {isEdit ? 'Save Purchase' : 'Create Purchase'}
              </Button>
            </div>
          </div>
        </section>
        {/* <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-7 text-white">
            <p className="text-[11px] uppercase tracking-widest text-slate-400">Purchase Total</p>
            <p className="text-3xl font-black mt-2">Rs. {total.toLocaleString()}</p>
            <p className="text-sm text-slate-400 mt-5">This amount is added to the supplier balance and inventory quantity after save.</p>
          </div>
          <Button type="submit" loading={loading} variant="dark" size="lg" icon={Check} className="w-full">{isEdit ? 'Save Purchase' : 'Create Purchase'}</Button>
        </aside> */}
      </motion.form>

      <Modal
        isOpen={itemModal.open}
        onClose={closeItemModal}
        title={itemModal.editId ? 'Edit Purchase Item' : 'Add Purchase Item'}
        size="xl"
        footer={
          <>
            <Button variant="outline" onClick={closeItemModal}>Cancel</Button>
            <Button variant="dark" onClick={saveItem}>{itemModal.editId ? 'Save Item' : 'Add Item'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Select
              label="Type"
              value={draftItem.item_type}
              onChange={(value) => updateDraftItem({ item_type: value, unit: draftItem.unit || 'meter', tag: '', description: '', rate: '', amount: '' })}
              options={itemTypeOptions}
              searchable={false}
            />
            <Select
              label="Existing Item"
              required={false}
              value={isExistingTagSelected ? draftItem.group_id : ''}
              onChange={(value) => value ? selectTag(value) : clearExistingTag()}
              options={inventoryOptions.filter((item) => inventory.find((inventoryItem) => getInventoryGroupKey(inventoryItem) === item.value)?.item_type === draftItem.item_type)}
              placeholder="Select existing item"
            />
            <Input
              containerClassName="md:col-span-2"
              label="Description"
              value={draftItem.description}
              onChange={(e) => updateDraftItem({ description: e.target.value })}
              disabled={isExistingTagSelected}
            />
            <Select
              label="Unit"
              value={draftItem.unit}
              onChange={(value) => updateDraftItem({ unit: value })}
              options={unitOptions}
              searchable={false}
              disabled={isExistingTagSelected}
            />
            <Input label="Quantity" type="number" value={draftItem.quantity} onChange={(e) => handleNumberChange(draftItem, 'quantity', e.target.value)} />
            <Input label="Rate" type="number" value={draftItem.rate} onChange={(e) => handleNumberChange(draftItem, 'rate', e.target.value)} />
            <Input label="Amount" type="number" value={draftItem.amount} onChange={(e) => handleNumberChange(draftItem, 'amount', e.target.value)} />
          </div>
          <aside className="lg:col-span-4 rounded-3xl bg-slate-900 p-6 text-white">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Item Total</p>
            <p className="mt-2 text-3xl font-black">Rs. {Number(draftItem.amount || 0).toLocaleString()}</p>
            <div className="mt-6 space-y-2 text-sm text-slate-300">
              <p>{draftItem.description || 'No description yet'}</p>
              <p>{draftItem.quantity || 0} {draftItem.unit || 'units'} at Rs. {Number(draftItem.rate || 0).toLocaleString()}</p>
            </div>
            {existingDraftItem?.last_purchase_rate ? (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/10 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Previous Rate</p>
                <p className="mt-1 text-lg font-black">Rs. {existingDraftItem.last_purchase_rate.toLocaleString()}</p>
              </div>
            ) : null}
          </aside>
        </div>
      </Modal>
    </div>
  );
};

export default PurchaseForm;
