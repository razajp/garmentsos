import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Check, Shirt } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { articlesAPI } from '../../services/api';
import { useConfig } from '../../context/ConfigContext';
import { Button, Input, PageHeader, Select, Textarea } from '../../components/ui';

const PRODUCTION_DRAFT_KEY = 'productionReceiveDraft';

const ArticleForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = Boolean(id);
  const returnToProduction = location.state?.returnToProduction;
  const { options } = useConfig();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    season: '',
    category: '',
    size: '',
    quantity: '',
    unit: '',
    description: '',
  });

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    articlesAPI.getOne(id)
      .then((res) => {
        const article = res.data.data;
        setFormData({
          season: article.season || '',
          category: article.category || '',
          size: article.size || '',
          quantity: article.stock_pkt || article.quantity || '',
          unit: article.unit || '',
          description: article.description || '',
        });
      })
      .catch(() => toast.error('Failed to load article'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const seasonOptions = useMemo(() => [...new Set(options?.seasons || [])].map((item) => ({ value: item, label: item })), [options]);
  const categoryOptions = useMemo(() => [...new Set(options?.categories || [])].map((item) => ({ value: item, label: item })), [options]);
  const sizeOptions = useMemo(() => [...new Set(options?.sizes || [])].map((item) => ({ value: item, label: item })), [options]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.season || !formData.category || !formData.size || !formData.quantity || !formData.unit) {
      toast.error('Season, category, size, quantity, and unit are required');
      return;
    }

    setLoading(true);
    try {
      const response = isEdit ? await articlesAPI.update(id, formData) : await articlesAPI.create(formData);
      if (response.data.success) {
        toast.success(isEdit ? 'Article updated' : 'Article created');
        if (returnToProduction) {
          const draft = JSON.parse(localStorage.getItem(PRODUCTION_DRAFT_KEY) || '{}');
          localStorage.setItem(PRODUCTION_DRAFT_KEY, JSON.stringify({ ...draft, article_id: String(response.data.data.id), step: 2 }));
          navigate('/production/receive', { replace: true });
          return;
        }
        navigate('/articles');
      }
    } catch {
      toast.error('Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-5">
      <PageHeader title={isEdit ? 'Update Article' : 'New Article'} subtitle="Article profile and packet unit" showBack backPath={returnToProduction ? '/production/receive' : '/articles'} />
      <motion.form initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-scroll flex-1">
        <section className="lg:col-span-8 bg-white border border-slate-300 rounded-3xl p-1.5 flex flex-col">
          <div className="p-7 grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 content-start">
            <Select label="Season" value={formData.season} onChange={(value) => setFormData({ ...formData, season: value })} options={seasonOptions} />
            <Select label="Category" value={formData.category} onChange={(value) => setFormData({ ...formData, category: value })} options={categoryOptions} />
            <Select label="Size" value={formData.size} onChange={(value) => setFormData({ ...formData, size: value })} options={sizeOptions} />
            <Input label="Quantity" type="number" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} />
            <Input label="Unit" type="number" helperText="Number of pieces per packet" value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} />
            <div className="md:col-span-2">
              <Textarea label="Description" required={false} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
            </div>
          </div>
          <div className="p-5 bg-slate-200/80 border border-slate-200 flex justify-between items-center rounded-2xl">
            <Button type="button" size="lg" variant="dark" icon={ArrowLeft} onClick={() => navigate(returnToProduction ? '/production/receive' : '/articles')}>Back</Button>
            <Button loading={loading} size="lg" type="submit" variant="dark" icon={Check} iconPosition="right">{isEdit ? 'Save Article' : 'Create Article'}</Button>
          </div>
        </section>
        <aside className="lg:col-span-4 grid gap-5 content-start">
          <div className="bg-slate-900 rounded-3xl p-6 text-white">
            <Shirt className="text-indigo-400 mb-5" size={28} />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mb-4">Auto Article No</p>
            <p className="text-sm text-slate-300">Article number will be generated when you save.</p>
            <div className="mt-6 text-sm space-y-2">
              <p>{formData.season || 'Season'} / {formData.category || 'Category'}</p>
              <p className="text-slate-400">{formData.quantity || 0} pkt x {formData.unit || 0} pcs</p>
            </div>
          </div>
        </aside>
      </motion.form>
    </div>
  );
};

export default ArticleForm;
