import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { articlesAPI, contractorsAPI, inventoryAPI, productionAPI } from '../../services/api';
import { Button, Input, PageHeader, Select } from '../../components/ui';

const today = () => new Date().toISOString().slice(0, 10);
const PRODUCTION_DRAFT_KEY = 'productionReceiveDraft';

const getItemKey = (item) => item.group_id || `${item.tag}__${item.rate || 0}`;
const getMaxQuantity = (source, item, originalItems) => {
  const key = getItemKey(item);
  const available = Number(source.find((entry) => getItemKey(entry) === key)?.quantity) || 0;
  const originalQuantity = Number(originalItems.find((entry) => getItemKey(entry) === key)?.quantity) || 0;
  return available + originalQuantity;
};
const clampQuantity = (value, max) => {
  const quantity = Number(value) || 0;
  if (max > 0 && quantity > max) return String(max);
  return value;
};

const QuantityInput = ({ value, max, onChange }) => (
  <div className="relative">
    <Input type="number" value={value} onChange={(e) => onChange(clampQuantity(e.target.value, max))} className="pr-24" />
    <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-500">
      Max {max.toLocaleString()}
    </span>
  </div>
);

const ProductionForm = () => {
  const { mode, id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const type = mode === 'receive' ? 'receive' : 'issue';
  const skipNextIssuedReset = useRef(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [contractors, setContractors] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [issuedTags, setIssuedTags] = useState([]);
  const [articles, setArticles] = useState([]);
  const [originalItems, setOriginalItems] = useState([]);
  const [formData, setFormData] = useState({
    contractor_id: '',
    production_date: today(),
    article_id: '',
    article_quantity: '',
    cost_per_piece: '',
    net_rate: '',
    sale_rate_per_piece: '',
    items: [],
  });

  useEffect(() => {
    Promise.all([
      contractorsAPI.getAll({ limit: 1000 }),
      inventoryAPI.getAll({ item_type: 'Fabric' }),
      articlesAPI.getAll({ limit: 1000 }),
    ]).then(([contractorRes, inventoryRes, articleRes]) => {
      setContractors(contractorRes.data.data.filter((contractor) => contractor.isActive));
      setInventory(inventoryRes.data.data);
      setArticles(articleRes.data.data);
    });
  }, []);

  useEffect(() => {
    if (type !== 'receive' || isEdit) return;
    const draft = localStorage.getItem(PRODUCTION_DRAFT_KEY);
    if (!draft) return;
    const parsedDraft = JSON.parse(draft);
    skipNextIssuedReset.current = true;
    setFormData((prev) => ({ ...prev, ...parsedDraft }));
    setStep(parsedDraft.step || 2);
    localStorage.removeItem(PRODUCTION_DRAFT_KEY);
  }, [type, isEdit]);

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    productionAPI.getOne(id)
      .then((res) => {
        const ticket = res.data.data;
        setFormData({
          contractor_id: String(ticket.contractor_id),
          production_date: ticket.production_date,
          article_id: ticket.article_id ? String(ticket.article_id) : '',
          article_quantity: ticket.article_quantity || '',
          cost_per_piece: ticket.cost_per_piece || '',
          net_rate: ticket.net_rate || '',
          sale_rate_per_piece: ticket.sale_rate_per_piece || '',
          items: ticket.items || [],
        });
        setOriginalItems(ticket.items || []);
      })
      .catch(() => {
        toast.error('Failed to load production ticket');
        navigate('/production');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  useEffect(() => {
    if (!formData.contractor_id || type !== 'receive') return;
    productionAPI.getIssuedTags(formData.contractor_id).then((res) => {
      setIssuedTags(res.data.data);
      if (skipNextIssuedReset.current) {
        skipNextIssuedReset.current = false;
        return;
      }
      if (!isEdit) setFormData((prev) => ({ ...prev, items: [] }));
    });
  }, [formData.contractor_id, type, isEdit]);

  const selectedContractor = contractors.find((contractor) => String(contractor.id) === String(formData.contractor_id));
  const issueSource = selectedContractor?.type === 'CMT' ? inventory.filter((item) => item.item_type === 'Fabric' && item.quantity > 0) : [];
  const tagSource = type === 'issue' ? issueSource : issuedTags;
  const tagOptions = tagSource
    .filter((item) => !formData.items.some((selected) => getItemKey(selected) === getItemKey(item)))
    .map((item) => ({ value: getItemKey(item), label: `${item.description} - Rs. ${(item.rate || item.last_purchase_rate || 0).toLocaleString()} (${item.quantity} ${item.unit || 'units'})` }));
  const contractorOptions = contractors.map((contractor) => ({ value: String(contractor.id), label: `${contractor.contractor_name} - ${contractor.type}` }));
  const articleOptions = articles.map((article) => ({ value: String(article.id), label: article.article_no }));
  const selectedArticle = articles.find((article) => String(article.id) === String(formData.article_id));
  const totalQty = useMemo(() => formData.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [formData.items]);
  const totalTagCost = useMemo(() => formData.items.reduce((sum, item) => sum + (Number(item.rate || 0) * Number(item.quantity || 0)), 0), [formData.items]);
  const packetUnit = Number(selectedArticle?.unit) || 0;
  const quantityPcs = (Number(formData.article_quantity) || 0) * packetUnit;
  const tagCostPerPiece = quantityPcs > 0 ? totalTagCost / quantityPcs : 0;
  const totalCostPerPiece = (Number(formData.cost_per_piece) || 0) + tagCostPerPiece;

  const addTag = (groupId) => {
    const sourceItem = tagSource.find((item) => getItemKey(item) === groupId);
    if (!sourceItem) return;
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { id: Date.now() + Math.random(), group_id: getItemKey(sourceItem), tag: sourceItem.tag, item_type: sourceItem.item_type, description: sourceItem.description, unit: sourceItem.unit, rate: sourceItem.rate || sourceItem.last_purchase_rate || 0, quantity: '' }],
    }));
  };

  const updateItemQty = (itemId, quantity) => {
    setFormData((prev) => ({ ...prev, items: prev.items.map((item) => item.id === itemId ? { ...item, quantity } : item) }));
  };

  const removeItem = (itemId) => {
    setFormData((prev) => ({ ...prev, items: prev.items.filter((item) => item.id !== itemId) }));
  };

  const canMoveToStepTwo = () => {
    if (!formData.contractor_id) {
      toast.error('Select contractor first');
      return false;
    }
    if (!formData.items.length || formData.items.some((item) => !item.quantity || Number(item.quantity) <= 0)) {
      toast.error('Add items and enter quantities');
      return false;
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canMoveToStepTwo()) return;
    if (type === 'receive' && (!formData.article_id || !formData.article_quantity || !formData.cost_per_piece || !formData.net_rate || !formData.sale_rate_per_piece)) {
      toast.error('Select article, pkt quantity, cost, net rate, and sale rate');
      return;
    }

    setLoading(true);
    try {
      const response = isEdit
        ? await productionAPI.update(id, { ...formData, type, tag_cost_per_piece: tagCostPerPiece, total_cost_per_piece: totalCostPerPiece })
        : await productionAPI.create({ ...formData, type, tag_cost_per_piece: tagCostPerPiece, total_cost_per_piece: totalCostPerPiece });
      if (response.data.success) {
        toast.success(type === 'issue' ? 'Production issue saved' : 'Production receive saved');
        navigate('/production');
      }
    } catch {
      toast.error('Failed to save production ticket');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={type === 'issue' ? (isEdit ? 'Edit Issue' : 'Issue Production') : (isEdit ? 'Edit Receive' : 'Receive Production')} subtitle={type === 'issue' ? 'Send fabric tags to contractor' : `Step ${step} / 2`} showBack backPath="/production" />
      <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex">
        <section className="bg-white border border-slate-300 rounded-3xl p-1.5 flex flex-col flex-1">
          {(type === 'issue' || step === 1) && (
            <>
              <div className="p-6 pb-5 grid grid-cols-1 md:grid-cols-3 gap-5">
                <Select label="Contractor" value={formData.contractor_id} onChange={(value) => setFormData({ ...formData, contractor_id: value, items: [] })} options={contractorOptions} />
                <Input label="Production Date" type="date" value={formData.production_date} onChange={(e) => setFormData({ ...formData, production_date: e.target.value })} />
                <Select label={type === 'issue' ? 'Add Fabric' : 'Add Issued Item'} required={false} value="" onChange={addTag} options={tagOptions} placeholder={formData.contractor_id ? 'Select item' : 'Select contractor first'} disabled={!formData.contractor_id} />
              </div>
              <div className="px-6 flex-1 min-h-0 overflow-scroll">
                <ProductionItemsTable items={formData.items} source={tagSource} originalItems={originalItems} onQuantityChange={updateItemQty} onRemove={removeItem} />
              </div>
            </>
          )}

          {type === 'receive' && step === 2 && (
            <div className="p-6 flex-1 grid grid-cols-1 md:grid-cols-3 gap-5 content-start">
              <div className="md:col-span-2 grid grid-cols-[1fr_auto] gap-3 items-end">
                <Select label="Article" value={formData.article_id} onChange={(value) => setFormData({ ...formData, article_id: value })} options={articleOptions} />
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  icon={Plus}
                  onClick={() => {
                    localStorage.setItem(PRODUCTION_DRAFT_KEY, JSON.stringify({ ...formData, step: 2 }));
                    navigate('/articles/new', { state: { returnToProduction: true } });
                  }}
                >
                  Quick Add
                </Button>
              </div>
              <Input label="Unit" value={`${packetUnit || '-'} pcs / pkt`} readOnly />
              <Input label="Quantity-Pkt" type="number" value={formData.article_quantity} onChange={(e) => setFormData({ ...formData, article_quantity: e.target.value })} />
              <Input label="Quantity-Pcs" value={quantityPcs.toLocaleString()} readOnly />
              <Input label="Production Cost / Pc" type="number" value={formData.cost_per_piece} onChange={(e) => setFormData({ ...formData, cost_per_piece: e.target.value })} />
              <Input label="Tag Cost / Pc" value={tagCostPerPiece.toFixed(2)} readOnly />
              <Input label="Total Cost / Pc" value={totalCostPerPiece.toFixed(2)} readOnly />
              <Input label="Net Rate" type="number" value={formData.net_rate} onChange={(e) => setFormData({ ...formData, net_rate: e.target.value })} />
              <Input label="Sale Rate" type="number" value={formData.sale_rate_per_piece} onChange={(e) => setFormData({ ...formData, sale_rate_per_piece: e.target.value })} />
            </div>
          )}

          <div className='grid grid-cols-3 items-end gap-5 px-6 py-4'>
            <div className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl flex justify-between items-center text-md">
              <p className=''>Total Tag Cost:</p>
              <p className="font-black text-slate-900">Rs. {totalTagCost.toLocaleString()}</p>
            </div>
            <div className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl flex justify-between items-center text-md">
              <p className=''>Total Item Cost:</p>
              <p className="font-black text-slate-900">Rs. {((Number(formData.cost_per_piece) || 0) * quantityPcs).toLocaleString()}</p>
            </div>
            <div className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl flex justify-between items-center text-md">
              <p className=''>Total Net Amount:</p>
              <p className="font-black text-slate-900">Rs. {(totalTagCost + ((Number(formData.cost_per_piece) || 0) * quantityPcs)).toLocaleString()}</p>
            </div>
          </div>

          <div className="p-5 bg-slate-200/80 border border-slate-200 flex justify-end items-center rounded-2xl">
            {type !== 'receive' ? (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Total tag quantity</p>
                <p className="text-xl font-black text-slate-900">{totalQty.toLocaleString()}</p>
              </div>
            ) : <div></div>}
            {type === 'receive' ? (
              <div className="flex justify-between gap-3 flex-1">
                <Button type="button" size="lg" variant="outline" icon={ChevronLeft} onClick={() => setStep(1)} disabled={step === 1}>Back</Button>
                {step === 1 ? (
                  <Button type="button" size="lg" variant="dark" icon={ChevronRight} iconPosition="right" onClick={(e) => { e.preventDefault(); if (canMoveToStepTwo()) setStep(2); }}>Next</Button>
                ) : (
                  <Button loading={loading} size="lg" type="submit" variant="dark" icon={Check} iconPosition="right">{isEdit ? 'Save Ticket' : 'Create Ticket'}</Button>
                )}
              </div>
            ) : (
              <div className='flex-1 flex justify-end'>
                <Button loading={loading} size="lg" type="submit" variant="dark" icon={Check} iconPosition="right">{isEdit ? 'Save Ticket' : 'Issue Ticket'}</Button>
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  );
};

const ProductionItemsTable = ({ items, source, originalItems, onQuantityChange, onRemove }) => (
  <table className="w-full overflow-hidden">
    <thead className="bg-slate-100">
      <tr>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-l-2xl">Type</th>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Description</th>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Unit</th>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Rate</th>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700">Quantity</th>
        <th className="p-3 text-left text-[13px] font-semibold text-slate-700 rounded-r-2xl">Actions</th>
      </tr>
    </thead>
    <tbody>
      {!items.length && <tr><td colSpan={6} className="p-3 text-center text-[13px] text-slate-500">No items added yet</td></tr>}
      {items.map((item) => {
        const max = getMaxQuantity(source, item, originalItems);
        return (
          <tr key={item.id} className="border-b border-slate-300">
            <td className="p-3 text-[13px] text-slate-700">{item.item_type}</td>
            <td className="p-3 text-[13px] text-slate-700">{item.description}</td>
            <td className="p-3 text-[13px] text-slate-700">{item.unit || 'N/A'}</td>
            <td className="p-3 text-[13px] text-slate-700">Rs. {Number(item.rate || 0).toLocaleString()}</td>
            <td className="p-3"><QuantityInput value={item.quantity} max={max} onChange={(value) => onQuantityChange(item.id, value)} /></td>
            <td className="p-3"><button type="button" onClick={() => onRemove(item.id)} className="p-1.5 text-red-500 hover:text-red-600 transition-all duration-300"><Trash2 size={18} /></button></td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

export default ProductionForm;
